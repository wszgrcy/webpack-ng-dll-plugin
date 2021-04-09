export interface NgDllPluginOptions {
    filter?: NgFilterPluginOptions;
    path: string;
    name: string;
    format?: boolean;
}
export declare class NgDllPlugin {
    private options;
    constructor(options: NgDllPluginOptions);
    apply(compiler: any): void;
}
interface NgFilterPluginOptions {
    mode: 'full' | 'auto' | 'manual';
    map?: {
        [name: string]: string[];
    };
}
export {};
