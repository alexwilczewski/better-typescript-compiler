import * as fs from "fs";
import { Directory } from "./Directory";
import { Watcher } from "./Watcher";

export class DirectoryWatch {
    private fsWatch: fs.FSWatcher;
    private subWatches: DirectoryWatch[];

    public constructor(private directory: Directory) {
        this.subWatches = [];
    }

    public startWatchingWithChildren() {
        this.startAndAssignWatch();
        this.directory.directories.forEach((directory: Directory) => {
            const subWatch = new DirectoryWatch(directory);
            directory.watch = subWatch;
            subWatch.startWatchingWithChildren();
            this.addSubWatch(subWatch);
        });
    }

    private startAndAssignWatch() {
        this.fsWatch = fs.watch(this.directory.absPath, { encoding: "utf8" }, (event: string, filename: string) => {
            Watcher.getInstance().changesForDirectoryWatch(this);
        });
    }

    public addSubWatch(subWatch: DirectoryWatch) {
        this.subWatches.push(subWatch);
    }

    public removeSubWatch(subWatch: DirectoryWatch) {
        const idx = this.subWatches.indexOf(subWatch);
        this.subWatches.splice(idx, 1);
    }

    public shutdownChildrenAndSelf() {
        this.subWatches.forEach((subWatch: DirectoryWatch) => {
            subWatch.shutdownChildrenAndSelf();
        });
        this.fsWatch.close();
        this.directory.watch = null;
        this.removeSelfFromParentsWatchWhileLeaf();
    }

    private removeSelfFromParentsWatchWhileLeaf() {
        if (this.isLeaf()) {
            this.directory.parent.watch.removeSubWatch(this);
        }
    }

    private isLeaf(): boolean {
        return (this.directory.parent !== null);
    }

    public getDirectory(): Directory {
        return this.directory;
    }
}
