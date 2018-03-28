"use strict";
exports.__esModule = true;
var ts = require("typescript");
var fs = require("fs");
var compilerOptions = {
    outDir: "dest"
};
var sourcesDirectory = process.cwd() + "/src";
var sourcesExtension = ".ts";
var FileHelper = /** @class */ (function () {
    function FileHelper() {
    }
    FileHelper.getAbsFilesForDirectory = function (directory) {
        var files = fs.readdirSync(directory, { encoding: "utf8" });
        var extFiles = this.getFileNamesThatMatchExtension(files, sourcesExtension);
        var absFiles = [];
        extFiles.forEach(function (fileName) {
            absFiles.push(directory + "/" + fileName);
        });
        return absFiles;
    };
    FileHelper.getFileNamesThatMatchExtension = function (fileNames, extension) {
        var extLength = extension.length;
        var filesWithExt = [];
        fileNames.forEach(function (fileName) {
            var fileExt = fileName.substr(-1 * extLength);
            if (fileExt === extension) {
                filesWithExt.push(fileName);
            }
        });
        return filesWithExt;
    };
    return FileHelper;
}());
var files = FileHelper.getAbsFilesForDirectory(sourcesDirectory);
var host = ts.createWatchCompilerHost(files, compilerOptions, ts.sys, null, null, null);
var watchProgram = ts.createWatchProgram(host);
fs.watch(sourcesDirectory, { encoding: "utf8" }, function (event, filename) {
    // const files = FileHelper.getAbsFilesForDirectory(sourcesDirectory);
    var newfiles = files.concat([sourcesDirectory + "/" + filename]);
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
var Watcher = /** @class */ (function () {
    function Watcher() {
        this.watchedDirectoryMap = {};
        this.filesForCompile = [];
    }
    Watcher.prototype.addDirectoryWatch = function (directoryPath) {
        var watchedDirectory = new WatchedDirectory(this, directoryPath);
        watchedDirectory.go();
        this.watchedDirectoryMap[directoryPath] = watchedDirectory;
    };
    Watcher.prototype.addFilesFromDirectory = function (absFiles) {
        var _this = this;
        absFiles.forEach(function (absFile) {
            _this.addFile(absFile);
        });
    };
    Watcher.prototype.addFile = function (absFile) {
        this.filesForCompile.push(absFile);
    };
    Watcher.prototype.removeDirectoryWatch = function (directoryPath) {
        this.watchedDirectoryMap[directoryPath].stop();
        delete this.watchedDirectoryMap[directoryPath];
    };
    Watcher.prototype.removeFilesFromDirectory = function (absFiles) {
        var _this = this;
        absFiles.forEach(function (absFile) {
            _this.removeFile(absFile);
        });
    };
    Watcher.prototype.removeFile = function (absFile) {
        var idx = this.filesForCompile.indexOf(absFile);
        this.filesForCompile.splice(idx, 1);
    };
    Watcher.prototype.start = function () {
        var host = ts.createWatchCompilerHost([], compilerOptions, ts.sys, null, null, null);
        this.watchProgram = ts.createWatchProgram(host);
        this.recompileWithNewFiles();
    };
    Watcher.prototype.recompileWithNewFiles = function () {
        var _this = this;
        this.watchProgram.updateRootFileNames(this.filesForCompile);
        setTimeout(function () {
            _this.compile();
        }, 1000);
    };
    Watcher.prototype.recompile = function () {
        this.compile();
    };
    Watcher.prototype.compile = function () {
        var program = this.watchProgram.getProgram().getProgram();
        var emitResult = program.emit();
        var allDiagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);
        allDiagnostics.forEach(function (diagnostic) {
            if (diagnostic.file) {
                var _a = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start), line = _a.line, character = _a.character;
                var message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
                console.log(diagnostic.file.fileName + " (" + (line + 1) + "," + (character + 1) + "): " + message);
            }
            else {
                console.log("" + ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));
            }
        });
    };
    return Watcher;
}());
var WatchedDirectory = /** @class */ (function () {
    function WatchedDirectory(watcher, directory) {
        this.watcher = watcher;
        this.directory = directory;
    }
    WatchedDirectory.prototype.go = function () {
        var _this = this;
        this.previousStateOfFilesMap = {};
        this.currentStateOfFilesMap = this.resolveFiles();
        this.fsWatch = fs.watch(this.directory, { encoding: "utf8" }, function (event, filename) {
            console.log(event, filename);
            _this.previousStateOfFilesMap = _this.currentStateOfFilesMap;
            _this.currentStateOfFilesMap = _this.resolveFiles();
            if (_this.isDirectory(filename)) {
                if (_this.wasAdded(filename)) {
                    _this.watcher.addDirectoryWatch(_this.getResolvedPath(filename));
                    _this.watcher.addFilesFromDirectory(FileHelper.getAbsFilesForDirectory(_this.getResolvedPath(filename)));
                    _this.watcher.recompileWithNewFiles();
                }
                else if (_this.wasDeleted(filename)) {
                    _this.watcher.removeDirectoryWatch(_this.getResolvedPath(filename));
                    _this.watcher.removeFilesFromDirectory(FileHelper.getAbsFilesForDirectory(_this.getResolvedPath(filename)));
                    _this.watcher.recompileWithNewFiles();
                }
                else if (_this.wasChanged(filename)) {
                    // this.watcher.recompile();
                }
            }
            else if (_this.isFile(filename)) {
                if (_this.wasAdded(filename)) {
                    _this.watcher.addFile(_this.getResolvedPath(filename));
                    _this.watcher.recompileWithNewFiles();
                }
                else if (_this.wasDeleted(filename)) {
                    _this.watcher.removeFile(_this.getResolvedPath(filename));
                    _this.watcher.recompileWithNewFiles();
                }
                else if (_this.wasChanged(filename)) {
                    // this.watcher.recompile();
                }
            }
        });
    };
    WatchedDirectory.prototype.resolveFiles = function () {
        var _this = this;
        var fileInfos = {};
        fs.readdirSync(this.directory, { encoding: "utf8" }).forEach(function (fileName) {
            var absPath = _this.getResolvedPath(fileName);
            fileInfos[fileName] = {
                fileName: fileName,
                absPath: absPath,
                stat: fs.statSync(absPath)
            };
        });
        return fileInfos;
    };
    WatchedDirectory.prototype.isDirectory = function (pathname) {
        if (this.inCurrent(pathname)) {
            return this.getFromCurrent(pathname).stat.isDirectory();
        }
        else if (this.inPrevious(pathname)) {
            return this.getFromPrevious(pathname).stat.isDirectory();
        }
        else {
            return false;
        }
    };
    WatchedDirectory.prototype.inCurrent = function (pathname) {
        return (pathname in this.currentStateOfFilesMap);
    };
    WatchedDirectory.prototype.inPrevious = function (pathname) {
        return (pathname in this.previousStateOfFilesMap);
    };
    WatchedDirectory.prototype.getFromCurrent = function (pathname) {
        return this.currentStateOfFilesMap[pathname];
    };
    WatchedDirectory.prototype.getFromPrevious = function (pathname) {
        return this.previousStateOfFilesMap[pathname];
    };
    WatchedDirectory.prototype.getResolvedPath = function (pathname) {
        return this.directory + "/" + pathname;
    };
    WatchedDirectory.prototype.wasAdded = function (pathname) {
        if ((this.inCurrent(pathname)) &&
            (!this.inPrevious(pathname))) {
            return true;
        }
        return false;
    };
    WatchedDirectory.prototype.wasDeleted = function (pathname) {
        if ((!this.inCurrent(pathname)) &&
            (this.inPrevious(pathname))) {
            return true;
        }
        return false;
    };
    WatchedDirectory.prototype.wasChanged = function (pathname) {
        if ((this.inCurrent(pathname)) &&
            (this.inPrevious(pathname))) {
            return true;
        }
        return false;
    };
    WatchedDirectory.prototype.isFile = function (pathname) {
        if (this.inCurrent(pathname)) {
            return this.getFromCurrent(pathname).stat.isFile();
        }
        else if (this.inPrevious(pathname)) {
            return this.getFromPrevious(pathname).stat.isFile();
        }
        else {
            return false;
        }
    };
    WatchedDirectory.prototype.stop = function () {
        this.fsWatch.close();
    };
    return WatchedDirectory;
}());
//# sourceMappingURL=dynamic-files.js.map