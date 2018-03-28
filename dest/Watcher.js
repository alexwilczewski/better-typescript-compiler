"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ts = require("typescript");
var DirectoryHelper_1 = require("./DirectoryHelper");
var DirectoryWatch_1 = require("./DirectoryWatch");
var ReconsileChanges_1 = require("./ReconsileChanges");
var Watcher = /** @class */ (function () {
    function Watcher() {
        this.filesForCompile = [];
    }
    Watcher.setInstance = function (instance) {
        this.instance = instance;
    };
    Watcher.getInstance = function () {
        return this.instance;
    };
    Watcher.prototype.setBaseDirectory = function (directory) {
        this.baseDirectory = directory;
        this.baseDirectory.watch = new DirectoryWatch_1.DirectoryWatch(directory);
    };
    Watcher.prototype.setCompilerOptions = function (compilerOptions) {
        this.compilerOptions = compilerOptions;
    };
    Watcher.prototype.setCommonSourceDirectory = function (commonSourceDirectory) {
        this.commonSourceDirectory = commonSourceDirectory;
    };
    Watcher.prototype.changesForDirectoryWatch = function (directoryWatch) {
        var updatedDirectory = DirectoryHelper_1.DirectoryHelper.getDirObjectForPath(directoryWatch.getDirectory().absPath, directoryWatch.getDirectory().parent);
        var removedDirectories = ReconsileChanges_1.ReconsileChanges.getRemovedDirectories(directoryWatch.getDirectory(), updatedDirectory);
        ReconsileChanges_1.ReconsileChanges.removeDirectoriesFromSet(directoryWatch.getDirectory(), removedDirectories);
        ReconsileChanges_1.ReconsileChanges.shutdownWatchesForRemovedDirectories(removedDirectories);
        var addedDirectories = ReconsileChanges_1.ReconsileChanges.getAddedDirectories(directoryWatch.getDirectory(), updatedDirectory);
        ReconsileChanges_1.ReconsileChanges.addDirectoriesToSet(directoryWatch.getDirectory(), addedDirectories);
        ReconsileChanges_1.ReconsileChanges.addWatchesForAddedDirectories(addedDirectories);
        var addedFiles = ReconsileChanges_1.ReconsileChanges.getAddedFiles(directoryWatch.getDirectory(), updatedDirectory);
        ReconsileChanges_1.ReconsileChanges.addFilesToSet(directoryWatch.getDirectory(), addedFiles);
        var removedFiles = ReconsileChanges_1.ReconsileChanges.getRemovedFiles(directoryWatch.getDirectory(), updatedDirectory);
        ReconsileChanges_1.ReconsileChanges.removeFilesFromSet(directoryWatch.getDirectory(), removedFiles);
        this.filesForCompile = ReconsileChanges_1.ReconsileChanges.getFilesToWatch(this.baseDirectory);
        this.watchProgram.updateRootFileNames(this.filesForCompile);
        this.compile();
        this.cleanupOutDir();
    };
    Watcher.prototype.cleanupOutDir = function () {
        var _this = this;
        var sourceFiles = this.filesForCompile;
        var expectedOutFiles = [];
        sourceFiles.forEach(function (file) {
            expectedOutFiles.push(_this.getOutputFilePath(file));
        });
        var allOutFiles = ReconsileChanges_1.ReconsileChanges.getAllOutFiles(this.compilerOptions.outDir);
        var extraOutFiles = ReconsileChanges_1.ReconsileChanges.getExtraOutPaths(expectedOutFiles, allOutFiles);
        ReconsileChanges_1.ReconsileChanges.removeExtraOutFiles(extraOutFiles);
        var sourceDirectories = ReconsileChanges_1.ReconsileChanges.getSubDirectoryPathsByLowestLevelFirst(this.baseDirectory);
        var expectedOutDirectories = [];
        sourceDirectories.forEach(function (dirPath) {
            expectedOutDirectories.push(_this.getOutputDirectoryPath(dirPath));
        });
        var allOutDirectories = ReconsileChanges_1.ReconsileChanges.getAllOutDirectories(this.compilerOptions.outDir);
        var extraOutDirectories = ReconsileChanges_1.ReconsileChanges.getExtraOutPaths(expectedOutDirectories, allOutDirectories);
        ReconsileChanges_1.ReconsileChanges.removeExtraOutDirectories(extraOutDirectories);
    };
    Watcher.prototype.start = function () {
        var _this = this;
        this.filesForCompile = ReconsileChanges_1.ReconsileChanges.getFilesToWatch(this.baseDirectory);
        var host = ts.createWatchCompilerHost(this.filesForCompile, this.compilerOptions, ts.sys, null, null, null);
        host.getCompilerOptions = function () {
            return _this.compilerOptions;
        };
        host.getCommonSourceDirectory = function () {
            return _this.commonSourceDirectory;
        };
        host.getCanonicalFileName = ts.createGetCanonicalFileName(host.useCaseSensitiveFileNames());
        this.host = host;
        this.watchProgram = ts.createWatchProgram(host);
        this.baseDirectory.watch.startWatchingWithChildren();
        this.cleanupOutDir();
    };
    Watcher.prototype.getOutputFilePath = function (inFilePath) {
        var file = { fileName: inFilePath, };
        var newFilePath = ts.getOwnEmitOutputFilePath(file, this.host, ".js");
        return this.compilerOptions.outDir + newFilePath;
    };
    Watcher.prototype.getOutputDirectoryPath = function (inDirectoryPath) {
        var file = { fileName: inDirectoryPath, };
        var newDirectoryPath = ts.getOwnEmitOutputFilePath(file, this.host, "");
        return this.compilerOptions.outDir + newDirectoryPath;
    };
    Watcher.prototype.compile = function () {
        var program = this.watchProgram.getProgram().getProgram();
        var emitResult = program.emit();
    };
    return Watcher;
}());
exports.Watcher = Watcher;
//# sourceMappingURL=Watcher.js.map