import * as fs from "fs";
import { Directory } from "./Directory";

export class DirectoryHelper {
    private static cachedStats: { [key: string]: fs.Stats } = {};

    public static getDirObjectForPath(path: string, parent: Directory | null): Directory {
        const paths = this.getPrependedFilePathsForDirectory(path);
        const dirObject: Directory = {
            absPath: path,
            directories: [],
            files: [],
            parent: parent,
            watch: null,
        };
        paths.forEach((filePath: string) => {
            const stats = this.getStatsForPath(filePath);
            if (stats.isDirectory()) {
                const subDirObject = this.getDirObjectForPath(filePath, dirObject);
                dirObject.directories.push(subDirObject);
            } else {
                dirObject.files.push(filePath);
            }
        });
        return dirObject;
    }

    private static getPrependedFilePathsForDirectory(directory: string): string[] {
        const names = fs.readdirSync(directory, { encoding: "utf8" });
        const absFiles: string[] = [];
        names.forEach((name: string) => {
            absFiles.push(directory + "/" + name);
        });
        return absFiles;
    }

    private static getStatsForPath(path: string): fs.Stats {
        if (path in this.cachedStats) {
            return this.cachedStats[path];
        } else {
            const stats = fs.statSync(path);
            this.cachedStats[path] = stats;
            return stats;
        }
    }
}
