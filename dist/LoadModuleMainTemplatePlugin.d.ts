import webpack from 'webpack';
export declare class RemoteModuleMainTemplatePlugin {
    private exportName?;
    varExpression: string;
    constructor(exportName?: string);
    apply(compiler: webpack.Compiler): void;
    run(compilation: webpack.compilation.Compilation): void;
}
