"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var DirectoryHelper_1 = require("./DirectoryHelper");
var Watcher_1 = require("./Watcher");
var projectDirectory = process.argv[2];
var outDir = projectDirectory + "/dest";
var compilerOptions = {
    outDir: outDir,
};
var sourcesDirectory = projectDirectory + "/src";
var sourcesExtension = ".ts";
var commonSourceDirectory = sourcesDirectory;
var baseDirectory = DirectoryHelper_1.DirectoryHelper.getDirObjectForPath(sourcesDirectory, null);
Watcher_1.Watcher.setInstance(new Watcher_1.Watcher());
Watcher_1.Watcher.getInstance().setBaseDirectory(baseDirectory);
Watcher_1.Watcher.getInstance().setCompilerOptions(compilerOptions);
Watcher_1.Watcher.getInstance().setCommonSourceDirectory(commonSourceDirectory);
Watcher_1.Watcher.getInstance().start();
//# sourceMappingURL=compiler.js.map