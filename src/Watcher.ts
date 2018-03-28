import * as ts from "typescript";
import { Directory } from "./Directory";
import { DirectoryHelper } from "./DirectoryHelper";
import { DirectoryWatch } from "./DirectoryWatch";
import { FillInHost } from "./FillInHost";
import { ReconsileChanges } from "./ReconsileChanges";

export class Watcher {
    private static instance: Watcher;

    public static setInstance(instance: Watcher) {
        this.instance = instance;
    }

    public static getInstance(): Watcher {
        return this.instance;
    }

    private filesForCompile: string[];
    private watchProgram: ts.WatchOfFilesAndCompilerOptions<ts.BuilderProgram>;
    private baseDirectory: Directory;
    private host: FillInHost;
    private compilerOptions: ts.CompilerOptions;
    private commonSourceDirectory: string;

    public constructor() {
        this.filesForCompile = [];
    }

    public setBaseDirectory(directory: Directory) {
        this.baseDirectory = directory;
        this.baseDirectory.watch = new DirectoryWatch(directory);
    }

    public setCompilerOptions(compilerOptions: ts.CompilerOptions) {
        this.compilerOptions = compilerOptions;
    }

    public setCommonSourceDirectory(commonSourceDirectory: string) {
        this.commonSourceDirectory = commonSourceDirectory;
    }

    public changesForDirectoryWatch(directoryWatch: DirectoryWatch) {
        const updatedDirectory = DirectoryHelper.getDirObjectForPath(directoryWatch.getDirectory().absPath, directoryWatch.getDirectory().parent);
        const removedDirectories = ReconsileChanges.getRemovedDirectories(directoryWatch.getDirectory(), updatedDirectory);
        ReconsileChanges.removeDirectoriesFromSet(directoryWatch.getDirectory(), removedDirectories);
        ReconsileChanges.shutdownWatchesForRemovedDirectories(removedDirectories);
        const addedDirectories = ReconsileChanges.getAddedDirectories(directoryWatch.getDirectory(), updatedDirectory);
        ReconsileChanges.addDirectoriesToSet(directoryWatch.getDirectory(), addedDirectories);
        ReconsileChanges.addWatchesForAddedDirectories(addedDirectories);
        const addedFiles = ReconsileChanges.getAddedFiles(directoryWatch.getDirectory(), updatedDirectory);
        ReconsileChanges.addFilesToSet(directoryWatch.getDirectory(), addedFiles);
        const removedFiles = ReconsileChanges.getRemovedFiles(directoryWatch.getDirectory(), updatedDirectory);
        ReconsileChanges.removeFilesFromSet(directoryWatch.getDirectory(), removedFiles);

        this.filesForCompile = ReconsileChanges.getFilesToWatch(this.baseDirectory);
        this.watchProgram.updateRootFileNames(this.filesForCompile);
        this.compile();
        this.cleanupOutDir();
    }

    private cleanupOutDir() {
        const sourceFiles = this.filesForCompile;
        const expectedOutFiles: string[] = [];
        sourceFiles.forEach((file: string) => {
            expectedOutFiles.push(this.getOutputFilePath(file));
        });
        const allOutFiles = ReconsileChanges.getAllOutFiles(this.compilerOptions.outDir);
        const extraOutFiles = ReconsileChanges.getExtraOutPaths(expectedOutFiles, allOutFiles);
        ReconsileChanges.removeExtraOutFiles(extraOutFiles);
        const sourceDirectories = ReconsileChanges.getSubDirectoryPathsByLowestLevelFirst(this.baseDirectory);
        const expectedOutDirectories: string[] = [];
        sourceDirectories.forEach((dirPath: string) => {
            expectedOutDirectories.push(this.getOutputDirectoryPath(dirPath));
        });
        const allOutDirectories = ReconsileChanges.getAllOutDirectories(this.compilerOptions.outDir);
        const extraOutDirectories = ReconsileChanges.getExtraOutPaths(expectedOutDirectories, allOutDirectories);
        ReconsileChanges.removeExtraOutDirectories(extraOutDirectories);
    }

    public start(): void {
        this.filesForCompile = ReconsileChanges.getFilesToWatch(this.baseDirectory);
        const host = (ts.createWatchCompilerHost(this.filesForCompile, this.compilerOptions, ts.sys, null, null, null) as FillInHost);
        host.getCompilerOptions = () => {
            return this.compilerOptions;
        };
        host.getCommonSourceDirectory = () => {
            return this.commonSourceDirectory;
        };
        host.getCanonicalFileName = ts.createGetCanonicalFileName(host.useCaseSensitiveFileNames());
        this.host = host;
        this.watchProgram = ts.createWatchProgram(host);
        this.baseDirectory.watch.startWatchingWithChildren();
        this.cleanupOutDir();
    }

    public getOutputFilePath(inFilePath: string): string {
        const file: {
            fileName: string
        } = { fileName: inFilePath, };
        const newFilePath = ts.getOwnEmitOutputFilePath(file, this.host, ".js");
        return this.compilerOptions.outDir + newFilePath;
    }

    public getOutputDirectoryPath(inDirectoryPath: string): string {
        const file: {
            fileName: string
        } = { fileName: inDirectoryPath, };
        const newDirectoryPath = ts.getOwnEmitOutputFilePath(file, this.host, "");
        return this.compilerOptions.outDir + newDirectoryPath;
    }

    private compile(): void {
        const program: ts.Program = this.watchProgram.getProgram().getProgram();
        const emitResult = program.emit();
    }
}
