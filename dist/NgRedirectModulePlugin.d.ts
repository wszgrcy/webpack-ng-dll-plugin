import * as webpack from 'webpack';
export declare class NgRedirectModulePlugin {
    private folderList;
    private globalNamespace;
    constructor(folderList: string[], globalNamespace?: string);
    isInFolder(filePath: string): boolean;
    apply(compiler: webpack.Compiler): void;
}
//# sourceMappingURL=NgRedirectModulePlugin.d.ts.map