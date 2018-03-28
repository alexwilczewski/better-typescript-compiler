"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var DirectoryHelper_1 = require("./DirectoryHelper");
var DirectoryWatch_1 = require("./DirectoryWatch");
var ReconsileChanges = /** @class */ (function () {
    function ReconsileChanges() {
    }
    ReconsileChanges.shutdownWatchesForRemovedDirectories = function (directories) {
        directories.forEach(function (directory) {
            directory.watch.shutdownChildrenAndSelf();
        });
    };
    ReconsileChanges.addWatchesForAddedDirectories = function (directories) {
        directories.forEach(function (directory) {
            var directoryWatch = new DirectoryWatch_1.DirectoryWatch(directory);
            directory.watch = directoryWatch;
            directoryWatch.startWatchingWithChildren();
            directory.parent.watch.addSubWatch(directoryWatch);
        });
    };
    ReconsileChanges.getFilesToWatch = function (directory) {
        var _this = this;
        var files = directory.files;
        directory.directories.forEach(function (child) {
            files = files.concat(_this.getFilesToWatch(child));
        });
        return files;
    };
    ReconsileChanges.getRemovedDirectories = function (oldDirectory, newDirectory) {
        var removed = [];
        oldDirectory.directories.forEach(function (oldDir) {
            var exists = false;
            newDirectory.directories.forEach(function (newDir) {
                if (oldDir.absPath === newDir.absPath) {
                    exists = true;
                }
            });
            if (exists === false) {
                removed.push(oldDir);
            }
        });
        return removed;
    };
    ReconsileChanges.getAddedDirectories = function (oldDirectory, newDirectory) {
        var added = [];
        newDirectory.directories.forEach(function (newDir) {
            var exists = false;
            oldDirectory.directories.forEach(function (oldDir) {
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
    };
    ReconsileChanges.removeDirectoriesFromSet = function (directory, removed) {
        removed.forEach(function (dir) {
            var idx = directory.directories.indexOf(dir);
            directory.directories.splice(idx, 1);
        });
    };
    ReconsileChanges.addDirectoriesToSet = function (directory, added) {
        added.forEach(function (dir) {
            directory.directories.push(dir);
        });
    };
    ReconsileChanges.getAddedFiles = function (oldDirectory, newDirectory) {
        var added = [];
        newDirectory.files.forEach(function (newFile) {
            var exists = false;
            oldDirectory.files.forEach(function (oldFile) {
                if (oldFile === newFile) {
                    exists = true;
                }
            });
            if (exists === false) {
                added.push(newFile);
            }
        });
        return added;
    };
    ReconsileChanges.addFilesToSet = function (directory, files) {
        files.forEach(function (file) {
            directory.files.push(file);
        });
    };
    ReconsileChanges.getRemovedFiles = function (oldDirectory, newDirectory) {
        var removed = [];
        oldDirectory.files.forEach(function (oldFile) {
            var exists = false;
            newDirectory.files.forEach(function (newFile) {
                if (oldFile === newFile) {
                    exists = true;
                }
            });
            if (exists === false) {
                removed.push(oldFile);
            }
        });
        return removed;
    };
    ReconsileChanges.removeFilesFromSet = function (directory, files) {
        files.forEach(function (file) {
            var idx = directory.files.indexOf(file);
            directory.files.splice(idx, 1);
        });
    };
    ReconsileChanges.getAllOutFiles = function (outDir) {
        var outDirectory = DirectoryHelper_1.DirectoryHelper.getDirObjectForPath(outDir, null);
        return this.getFilesAndSubFilesOf(outDirectory);
    };
    ReconsileChanges.getFilesAndSubFilesOf = function (directory) {
        var _this = this;
        var files = directory.files.concat([]);
        directory.directories.forEach(function (subDirectory) {
            files = files.concat(_this.getFilesAndSubFilesOf(subDirectory));
        });
        return files;
    };
    ReconsileChanges.getExtraOutPaths = function (expectedOutPaths, allOutPaths) {
        var extras = [];
        allOutPaths.forEach(function (file) {
            if (expectedOutPaths.indexOf(file) < 0) {
                extras.push(file);
            }
        });
        return extras;
    };
    ReconsileChanges.removeExtraOutFiles = function (extraOutFiles) {
        extraOutFiles.forEach(function (file) {
            fs.unlinkSync(file);
        });
    };
    ReconsileChanges.getSubDirectoryPathsByLowestLevelFirst = function (directory) {
        var _this = this;
        var paths = [];
        directory.directories.forEach(function (subDirectory) {
            paths = paths.concat(_this.getSubDirectoryPathsByLowestLevelFirst(subDirectory));
            paths.push(subDirectory.absPath);
        });
        return paths;
    };
    ReconsileChanges.getAllOutDirectories = function (outDir) {
        var outDirectory = DirectoryHelper_1.DirectoryHelper.getDirObjectForPath(outDir, null);
        return this.getSubDirectoryPathsByLowestLevelFirst(outDirectory);
    };
    ReconsileChanges.removeExtraOutDirectories = function (extraOutDirectories) {
        extraOutDirectories.forEach(function (dirPath) {
            fs.rmdirSync(dirPath);
        });
    };
    return ReconsileChanges;
}());
exports.ReconsileChanges = ReconsileChanges;
//# sourceMappingURL=ReconsileChanges.js.map