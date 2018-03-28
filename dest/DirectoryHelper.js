"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var DirectoryHelper = /** @class */ (function () {
    function DirectoryHelper() {
    }
    DirectoryHelper.getDirObjectForPath = function (path, parent) {
        var _this = this;
        var paths = this.getPrependedFilePathsForDirectory(path);
        var dirObject = {
            absPath: path,
            directories: [],
            files: [],
            parent: parent,
            watch: null,
        };
        paths.forEach(function (filePath) {
            var stats = _this.getStatsForPath(filePath);
            if (stats.isDirectory()) {
                var subDirObject = _this.getDirObjectForPath(filePath, dirObject);
                dirObject.directories.push(subDirObject);
            }
            else {
                dirObject.files.push(filePath);
            }
        });
        return dirObject;
    };
    DirectoryHelper.getPrependedFilePathsForDirectory = function (directory) {
        var names = fs.readdirSync(directory, { encoding: "utf8" });
        var absFiles = [];
        names.forEach(function (name) {
            absFiles.push(directory + "/" + name);
        });
        return absFiles;
    };
    DirectoryHelper.getStatsForPath = function (path) {
        if (path in this.cachedStats) {
            return this.cachedStats[path];
        }
        else {
            var stats = fs.statSync(path);
            this.cachedStats[path] = stats;
            return stats;
        }
    };
    DirectoryHelper.cachedStats = {};
    return DirectoryHelper;
}());
exports.DirectoryHelper = DirectoryHelper;
//# sourceMappingURL=DirectoryHelper.js.map