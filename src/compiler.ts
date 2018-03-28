import * as ts from "typescript";
import { DirectoryHelper } from "./DirectoryHelper";
import { Watcher } from "./Watcher";

const projectDirectory: string = process.argv[2];

const outDir: string = projectDirectory + "/dest";
const compilerOptions: ts.CompilerOptions = {
    outDir: outDir,
};
const sourcesDirectory: string = projectDirectory + "/src";
const sourcesExtension: string = ".ts";
const commonSourceDirectory: string = sourcesDirectory;

const baseDirectory = DirectoryHelper.getDirObjectForPath(sourcesDirectory, null);
Watcher.setInstance(new Watcher());
Watcher.getInstance().setBaseDirectory(baseDirectory);
Watcher.getInstance().setCompilerOptions(compilerOptions);
Watcher.getInstance().setCommonSourceDirectory(commonSourceDirectory);
Watcher.getInstance().start();
