import { BuilderContext, createBuilder } from '@angular-devkit/architect';
import {
  BrowserBuilderOptions,
  executeBrowserBuilder,
  ExecutionTransformer,
} from '@angular-devkit/build-angular';
import * as webpack from 'webpack';
import * as path from 'path';
export type CustomWebpackBrowserSchema = BrowserBuilderOptions;

export function buildWebpackBrowserGenerate(
  webpackConfiguration: (
    options: BrowserBuilderOptions,
    context: BuilderContext
  ) => ExecutionTransformer<webpack.Configuration>
) {
  return (
    options: CustomWebpackBrowserSchema,
    context: BuilderContext
  ): ReturnType<typeof executeBrowserBuilder> => {
    return executeBrowserBuilder(options, context, {
      webpackConfiguration: webpackConfiguration(options, context),
    });
  };
}

export const BROWSER_BUILDER_INFO = {
  name: 'test-builder:browser',
  schemaPath: path.resolve(__dirname, 'schema.json'),
};

export const DEFAULT_ANGULAR_CONFIG = {
  outputPath: 'dist/testProject',
  index: 'src/index.html',
  main: 'src/main.ts',
  polyfills: 'src/polyfills.ts',
  tsConfig: 'src/tsconfig.app.json',
  progress: false,
  assets: ['src/favicon.ico', 'src/assets'],
  styles: ['src/styles.css'],
  scripts: [],
};
export const DEFAULT_SUB_ANGULAR_CONFIG = {
  outputPath: 'dist/testSubProject',
  index: '',
  main: 'projects/sub1/src/main.ts',
  polyfills: 'projects/sub1/src/polyfills.ts',
  tsConfig: 'projects/sub1/tsconfig.app.json',
  progress: false,
  assets: [],
  styles: ['projects/sub1/src/styles.scss'],
  scripts: [],
  aot: true,
};
