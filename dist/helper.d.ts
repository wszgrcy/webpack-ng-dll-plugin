import * as webpack from 'webpack';
import { NgDllPluginOptions } from './NgDllPlugin';
export declare function setNgDllPlugin(config: webpack.Configuration, option: {
    ngDllPluginOptions: NgDllPluginOptions;
    output?: webpack.Configuration['output'];
}, angularOptions?: any): void;
export declare function cleanOutputFile(config: webpack.Configuration, option: {
    license: boolean;
    index: boolean;
    runtimeChunk: boolean;
}, angularOptions?: any): void;
//# sourceMappingURL=helper.d.ts.map