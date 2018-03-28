import { DirectoryWatch } from "./DirectoryWatch";

export interface Directory {
    absPath: string;
    files: string[];
    directories: Directory[];
    parent: Directory | null;
    watch: DirectoryWatch | null;
}
