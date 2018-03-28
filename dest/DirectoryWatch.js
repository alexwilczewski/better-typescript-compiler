"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var Watcher_1 = require("./Watcher");
var DirectoryWatch = /** @class */ (function () {
    function DirectoryWatch(directory) {
        this.directory = directory;
        this.subWatches = [];
    }
    DirectoryWatch.prototype.startWatchingWithChildren = function () {
        var _this = this;
        this.startAndAssignWatch();
        this.directory.directories.forEach(function (directory) {
            var subWatch = new DirectoryWatch(directory);
            directory.watch = subWatch;
            subWatch.startWatchingWithChildren();
            _this.addSubWatch(subWatch);
        });
    };
    DirectoryWatch.prototype.startAndAssignWatch = function () {
        var _this = this;
        this.fsWatch = fs.watch(this.directory.absPath, { encoding: "utf8" }, function (event, filename) {
            Watcher_1.Watcher.getInstance().changesForDirectoryWatch(_this);
        });
    };
    DirectoryWatch.prototype.addSubWatch = function (subWatch) {
        this.subWatches.push(subWatch);
    };
    DirectoryWatch.prototype.removeSubWatch = function (subWatch) {
        var idx = this.subWatches.indexOf(subWatch);
        this.subWatches.splice(idx, 1);
    };
    DirectoryWatch.prototype.shutdownChildrenAndSelf = function () {
        this.subWatches.forEach(function (subWatch) {
            subWatch.shutdownChildrenAndSelf();
        });
        this.fsWatch.close();
        this.directory.watch = null;
        this.removeSelfFromParentsWatchWhileLeaf();
    };
    DirectoryWatch.prototype.removeSelfFromParentsWatchWhileLeaf = function () {
        if (this.isLeaf()) {
            this.directory.parent.watch.removeSubWatch(this);
        }
    };
    DirectoryWatch.prototype.isLeaf = function () {
        return (this.directory.parent !== null);
    };
    DirectoryWatch.prototype.getDirectory = function () {
        return this.directory;
    };
    return DirectoryWatch;
}());
exports.DirectoryWatch = DirectoryWatch;
//# sourceMappingURL=DirectoryWatch.js.map