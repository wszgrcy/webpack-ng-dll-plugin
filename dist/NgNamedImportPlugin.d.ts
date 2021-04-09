import * as webpack from 'webpack';
export declare class NgNamedImportPlugin {
    private folderList;
    private globalNamespace;
    constructor(folderList: string[], globalNamespace?: string);
    isInFolder(filePath: string): boolean;
    apply(compiler: webpack.Compiler): void;
}
