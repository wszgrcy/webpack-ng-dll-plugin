import * as webpack from 'webpack';

import { mergeRuntimeOwned, getEntryRuntime } from 'webpack/lib/util/runtime';
export function getRuntime(
  compilation: webpack.Compilation
): Parameters<
  ReturnType<webpack.ModuleGraph['getExportsInfo']>['setUsedInUnknownWay']
>[0] {
  let runtime;
  for (const [name, { options }] of compilation.entries) {
    runtime = mergeRuntimeOwned(
      runtime,
      getEntryRuntime(compilation, name, options)
    );
  }
  return runtime;
}
