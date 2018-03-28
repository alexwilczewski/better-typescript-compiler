import * as ts from "typescript";

export interface FillInHost extends ts.WatchCompilerHostOfFilesAndCompilerOptions<ts.BuilderProgram> {
    getCompilerOptions: () => ts.CompilerOptions;
    getCommonSourceDirectory: () => string;
    getCanonicalFileName: (fileName: string) => string;
}
