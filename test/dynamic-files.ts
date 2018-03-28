import * as ts from "typescript";
import * as fs from "fs";
import { readdirSync } from "fs";

const compilerOptions: ts.CompilerOptions = {
    outDir: "dest",
};
const sourcesDirectory: string = process.cwd() + "/src";
const sourcesExtension: string = ".ts";

class FileHelper {
    public static getAbsFilesForDirectory(directory: string): string[] {
        const files = fs.readdirSync(directory, { encoding: "utf8" });
        const extFiles = this.getFileNamesThatMatchExtension(files, sourcesExtension);
        const absFiles: string[] = [];
        extFiles.forEach((fileName: string) => {
            absFiles.push(directory + "/" + fileName);
        });
        return absFiles;
    }

    private static getFileNamesThatMatchExtension(fileNames: string[], extension: string): string[] {
        const extLength = extension.length;
        const filesWithExt: string[] = [];
        fileNames.forEach((fileName: string) => {
            const fileExt = fileName.substr(-1 * extLength);
            if (fileExt === extension) {
                filesWithExt.push(fileName);
            }
        });
        return filesWithExt;
    }
}

const files = FileHelper.getAbsFilesForDirectory(sourcesDirectory);
const host = ts.createWatchCompilerHost(files, compilerOptions, ts.sys, null, null, null);
const watchProgram: ts.WatchOfFilesAndCompilerOptions<ts.BuilderProgram>
    = ts.createWatchProgram(host);

fs.watch(sourcesDirectory, { encoding: "utf8" }, (event: string, filename: string) => {
    // const files = FileHelper.getAbsFilesForDirectory(sourcesDirectory);
    const newfiles = files.concat([sourcesDirectory + "/" + filename]);
    watchProgram.updateRootFileNames(newfiles);
    watchProgram.getProgram().emit();
});

// const program: ts.Program = this.watchProgram.getProgram().getProgram();
// const emitResult = program.emit();
// const allDiagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);
// allDiagnostics.forEach(diagnostic => {
//     if (diagnostic.file) {
//         const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start!);
//         const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
//         console.log(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
//     }
//     else {
//         console.log(`${ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')}`);
//     }
// });

class Watcher {
    private watchedDirectoryMap: { [key: string]: WatchedDirectory };
    private filesForCompile: string[];
    private watchProgram: ts.WatchOfFilesAndCompilerOptions<ts.BuilderProgram>;

    public constructor() {
        this.watchedDirectoryMap = {};
        this.filesForCompile = [];
    }

    public addDirectoryWatch(directoryPath: string) {
        const watchedDirectory = new WatchedDirectory(this, directoryPath);
        watchedDirectory.go();
        this.watchedDirectoryMap[directoryPath] = watchedDirectory;
    }

    public addFilesFromDirectory(absFiles: string[]) {
        absFiles.forEach((absFile: string) => {
            this.addFile(absFile);
        });
    }

    public addFile(absFile: string) {
        this.filesForCompile.push(absFile);
    }

    public removeDirectoryWatch(directoryPath: string) {
        this.watchedDirectoryMap[directoryPath].stop();
        delete this.watchedDirectoryMap[directoryPath];
    }

    public removeFilesFromDirectory(absFiles: string[]) {
        absFiles.forEach((absFile: string) => {
            this.removeFile(absFile);
        });
    }

    public removeFile(absFile: string) {
        const idx = this.filesForCompile.indexOf(absFile);
        this.filesForCompile.splice(idx, 1);
    }

    public start(): void {
        const host = ts.createWatchCompilerHost([], compilerOptions, ts.sys, null, null, null);
        this.watchProgram = ts.createWatchProgram(host);
        this.recompileWithNewFiles();
    }

    public recompileWithNewFiles(): void {
        this.watchProgram.updateRootFileNames(this.filesForCompile);
        setTimeout(() => {
            this.compile();
        }, 1000);
    }

    public recompile(): void {
        this.compile();
    }

    private compile(): void {
        const program: ts.Program = this.watchProgram.getProgram().getProgram();
        const emitResult = program.emit();
        const allDiagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);
        allDiagnostics.forEach(diagnostic => {
            if (diagnostic.file) {
                const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start!);
                const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
                console.log(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
            }
            else {
                console.log(`${ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')}`);
            }
        });
    }
}

interface FileInfo {
    fileName: string;
    absPath: string;
    stat: fs.Stats;
}

class WatchedDirectory {
    private previousStateOfFilesMap: { [key: string]: FileInfo };
    private currentStateOfFilesMap: { [key: string]: FileInfo };
    private fsWatch: fs.FSWatcher;

    public constructor(private watcher: Watcher, private directory: string) { }

    public go(): void {
        this.previousStateOfFilesMap = {};
        this.currentStateOfFilesMap = this.resolveFiles();
        this.fsWatch = fs.watch(this.directory, { encoding: "utf8" }, (event: string, filename: string) => {
            console.log(event, filename);
            this.previousStateOfFilesMap = this.currentStateOfFilesMap;
            this.currentStateOfFilesMap = this.resolveFiles();
            if (this.isDirectory(filename)) {
                if (this.wasAdded(filename)) {
                    this.watcher.addDirectoryWatch(this.getResolvedPath(filename));
                    this.watcher.addFilesFromDirectory(
                        FileHelper.getAbsFilesForDirectory(this.getResolvedPath(filename))
                    );
                    this.watcher.recompileWithNewFiles();
                } else if (this.wasDeleted(filename)) {
                    this.watcher.removeDirectoryWatch(this.getResolvedPath(filename));
                    this.watcher.removeFilesFromDirectory(
                        FileHelper.getAbsFilesForDirectory(this.getResolvedPath(filename))
                    );
                    this.watcher.recompileWithNewFiles();
                } else if (this.wasChanged(filename)) {
                    // this.watcher.recompile();
                }
            } else if (this.isFile(filename)) {
                if (this.wasAdded(filename)) {
                    this.watcher.addFile(this.getResolvedPath(filename));
                    this.watcher.recompileWithNewFiles();
                } else if (this.wasDeleted(filename)) {
                    this.watcher.removeFile(this.getResolvedPath(filename));
                    this.watcher.recompileWithNewFiles();
                } else if (this.wasChanged(filename)) {
                    // this.watcher.recompile();
                }
            }
        });
    }

    private resolveFiles(): { [key: string]: FileInfo } {
        const fileInfos = {};
        fs.readdirSync(this.directory, { encoding: "utf8" }).forEach((fileName: string) => {
            const absPath = this.getResolvedPath(fileName);
            fileInfos[fileName] = {
                fileName: fileName,
                absPath: absPath,
                stat: fs.statSync(absPath),
            };
        });
        return fileInfos;
    }

    private isDirectory(pathname: string): boolean {
        if (this.inCurrent(pathname)) {
            return this.getFromCurrent(pathname).stat.isDirectory();
        } else if (this.inPrevious(pathname)) {
            return this.getFromPrevious(pathname).stat.isDirectory();
        } else {
            return false;
        }
    }

    private inCurrent(pathname: string): boolean {
        return (pathname in this.currentStateOfFilesMap);
    }

    private inPrevious(pathname: string): boolean {
        return (pathname in this.previousStateOfFilesMap);
    }

    private getFromCurrent(pathname: string): FileInfo {
        return this.currentStateOfFilesMap[pathname];
    }

    private getFromPrevious(pathname: string): FileInfo {
        return this.previousStateOfFilesMap[pathname];
    }

    private getResolvedPath(pathname: string): string {
        return this.directory + "/" + pathname;
    }

    private wasAdded(pathname: string): boolean {
        if (
            (this.inCurrent(pathname)) &&
            (!this.inPrevious(pathname))
        ) {
            return true;
        }
        return false;
    }

    private wasDeleted(pathname: string): boolean {
        if (
            (!this.inCurrent(pathname)) &&
            (this.inPrevious(pathname))
        ) {
            return true;
        }
        return false;
    }

    private wasChanged(pathname: string): boolean {
        if (
            (this.inCurrent(pathname)) &&
            (this.inPrevious(pathname))
        ) {
            return true;
        }
        return false;
    }

    private isFile(pathname: string): boolean {
        if (this.inCurrent(pathname)) {
            return this.getFromCurrent(pathname).stat.isFile();
        } else if (this.inPrevious(pathname)) {
            return this.getFromPrevious(pathname).stat.isFile();
        } else {
            return false;
        }
    }

    public stop(): void {
        this.fsWatch.close();
    }
}
