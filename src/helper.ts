import * as webpack from 'webpack';
import { NgDllPlugin, NgDllPluginOptions } from './NgDllPlugin';

export function setNgDllPlugin(
  config: webpack.Configuration,
  option: {
    ngDllPluginOptions: NgDllPluginOptions;
    output?: webpack.Configuration['output'];
  },
  angularOptions?
) {
  cleanOutputFile(
    config,
    {
      index: true,
      runtimeChunk: true,
      license: true,
    },
    angularOptions
  );
  const entry: any = config.entry;
  config.entry = entry.main;
  config.output = {
    library: option.ngDllPluginOptions.name,
    filename: 'dll.js',
    ...config.output,
    ...(option.output || {}),
  };
  config.plugins.push(new NgDllPlugin(option.ngDllPluginOptions));
}

/**
 * 清理无用的输出文件(当仅输出js时)
 *
 * @author cyia
 * @date 2020-10-12
 * @export
 * @param config webpack配置
 * @param option 清理配置
 * @param [angularOptions] angular.json配置
 */
export function cleanOutputFile(
  config: webpack.Configuration,
  option: {
    license: boolean;
    index: boolean;
    runtimeChunk: boolean;
  },
  angularOptions?
) {
  if (option.runtimeChunk && angularOptions) {
    delete angularOptions.index;
  }
  if (option.runtimeChunk) {
    config.optimization.runtimeChunk = false;
  }
  if (option.license) {
    for (let i = 0; i < config.plugins.length; i++) {
      const plugin = config.plugins[i];
      if (plugin.constructor.name === 'LicenseWebpackPlugin') {
        config.plugins.splice(i, 1);
        break;
      }
    }
  }
}
