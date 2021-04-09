/// <reference types="node" />
declare const NormalModule: any;
export declare class NgNamedImportModule extends NormalModule {
    private options;
    private globalNamespace;
    constructor(options: any, globalNamespace: string);
    createSource(source: string, resourceBuffer: Buffer, sourceMap: any): any;
}
export {};
