import * as fs from "fs";
import { Directory } from "./Directory";
import { DirectoryHelper } from "./DirectoryHelper";
import { DirectoryWatch } from "./DirectoryWatch";

export class ReconsileChanges {
    public static shutdownWatchesForRemovedDirectories(directories: Directory[]) {
        directories.forEach((directory: Directory) => {
            directory.watch.shutdownChildrenAndSelf();
        });
    }

    public static addWatchesForAddedDirectories(directories: Directory[]) {
        directories.forEach((directory: Directory) => {
            const directoryWatch = new DirectoryWatch(directory);
            directory.watch = directoryWatch;
            directoryWatch.startWatchingWithChildren();
            directory.parent.watch.addSubWatch(directoryWatch);
        });
    }

    public static getFilesToWatch(directory: Directory): string[] {
        let files: string[] = directory.files;
        directory.directories.forEach((child: Directory) => {
            files = files.concat(this.getFilesToWatch(child));
        });
        return files;
    }

    public static getRemovedDirectories(oldDirectory: Directory, newDirectory: Directory): Directory[] {
        const removed: Directory[] = [];
        oldDirectory.directories.forEach((oldDir: Directory) => {
            let exists = false;
            newDirectory.directories.forEach((newDir: Directory) => {
                if (oldDir.absPath === newDir.absPath) {
                    exists = true;
                }
            });
            if (exists === false) {
                removed.push(oldDir);
            }
        });
        return removed;
    }

    public static getAddedDirectories(oldDirectory: Directory, newDirectory: Directory): Directory[] {
        const added: Directory[] = [];
        newDirectory.directories.forEach((newDir: Directory) => {
            let exists = false;
            oldDirectory.directories.forEach((oldDir: Directory) => {
                if (newDir.absPath === oldDir.absPath) {
                    exists = true;
                }
            });
            if (exists === false) {
                newDir.parent = oldDirectory;
                added.push(newDir);
            }
        });
        return added;
    }

    public static removeDirectoriesFromSet(directory: Directory, removed: Directory[]) {
        removed.forEach((dir: Directory) => {
            const idx = directory.directories.indexOf(dir);
            directory.directories.splice(idx, 1);
        });
    }

    public static addDirectoriesToSet(directory: Directory, added: Directory[]) {
        added.forEach((dir: Directory) => {
            directory.directories.push(dir);
        });
    }

    public static getAddedFiles(oldDirectory: Directory, newDirectory: Directory): string[] {
        const added: string[] = [];
        newDirectory.files.forEach((newFile: string) => {
            let exists = false;
            oldDirectory.files.forEach((oldFile: string) => {
                if (oldFile === newFile) {
                    exists = true;
                }
            });
            if (exists === false) {
                added.push(newFile);
            }
        });
        return added;
    }

    public static addFilesToSet(directory: Directory, files: string[]) {
        files.forEach((file: string) => {
            directory.files.push(file);
        });
    }

    public static getRemovedFiles(oldDirectory: Directory, newDirectory: Directory): string[] {
        const removed: string[] = [];
        oldDirectory.files.forEach((oldFile: string) => {
            let exists = false;
            newDirectory.files.forEach((newFile: string) => {
                if (oldFile === newFile) {
                    exists = true;
                }
            });
            if (exists === false) {
                removed.push(oldFile);
            }
        });
        return removed;
    }

    public static removeFilesFromSet(directory: Directory, files: string[]) {
        files.forEach((file: string) => {
            const idx = directory.files.indexOf(file);
            directory.files.splice(idx, 1);
        });
    }

    public static getAllOutFiles(outDir: string): string[] {
        const outDirectory = DirectoryHelper.getDirObjectForPath(outDir, null);
        return this.getFilesAndSubFilesOf(outDirectory);
    }

    private static getFilesAndSubFilesOf(directory: Directory): string[] {
        let files: string[] = directory.files.concat([]);
        directory.directories.forEach((subDirectory: Directory) => {
            files = files.concat(this.getFilesAndSubFilesOf(subDirectory));
        });
        return files;
    }

    public static getExtraOutPaths(expectedOutPaths: string[], allOutPaths: string[]): string[] {
        const extras: string[] = [];
        allOutPaths.forEach((file: string) => {
            if (expectedOutPaths.indexOf(file) < 0) {
                extras.push(file);
            }
        });
        return extras;
    }

    public static removeExtraOutFiles(extraOutFiles: string[]) {
        extraOutFiles.forEach((file: string) => {
            fs.unlinkSync(file);
        });
    }

    public static getSubDirectoryPathsByLowestLevelFirst(directory: Directory): string[] {
        let paths: string[] = [];
        directory.directories.forEach((subDirectory: Directory) => {
            paths = paths.concat(this.getSubDirectoryPathsByLowestLevelFirst(subDirectory));
            paths.push(subDirectory.absPath);
        });
        return paths;
    }

    public static getAllOutDirectories(outDir: string): string[] {
        const outDirectory = DirectoryHelper.getDirObjectForPath(outDir, null);
        return this.getSubDirectoryPathsByLowestLevelFirst(outDirectory);
    }

    public static removeExtraOutDirectories(extraOutDirectories: string[]) {
        extraOutDirectories.forEach((dirPath: string) => {
            fs.rmdirSync(dirPath);
        });
    }
}
