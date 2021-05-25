import * as webpack from 'webpack';

export interface Module extends webpack.compilation.Module {
  request: string;
  userRequest: string;
  rawRequest: string | null;
  context: string | null;
  dependencies: Dependency[];
  libIdent(...args): any;
  /** ConcatenatedModule */
  rootModule?: Module;
  identifier(): any;
  name: string;
  sourceRequest:string
}
export interface Dependency {
  request?: string;
  userRequest?: string;
  getReference(): any;
  getResourceIdentifier(): any;
  module?: Module;
}
