import * as webpack from 'webpack';
/** webpack的module模块声明拓展,混合了多种类型,仅作为开发时的参考 */
export interface Module extends webpack.Module {
  request: string;
  userRequest: string;
  rawRequest: string | null;
  context: string | null;
  // dependencies: Dependency[];
  libIdent(...args): any;
  /** ConcatenatedModule */
  rootModule?: Module;
  identifier(): any;
  name: string;
  sourceRequest: string;
}
/** webpack的dependency模块声明拓展,混合了多种类型,仅作为开发时的参考 */

export interface Dependency {
  request?: string;
  userRequest?: string;
  getReference(): any;
  getResourceIdentifier(): any;
  module?: Module;
}
