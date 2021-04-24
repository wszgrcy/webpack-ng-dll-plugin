import { BuilderContext, createBuilder } from '@angular-devkit/architect';
import {
  BrowserBuilderOptions,
  executeBrowserBuilder,
  ExecutionTransformer,
} from '@angular-devkit/build-angular';
import * as webpack from 'webpack';

export type CustomWebpackBrowserSchema = BrowserBuilderOptions;

export function buildWebpackBrowserGenerate(
  webpackConfiguration: ExecutionTransformer<webpack.Configuration>
) {
  return (
    options: CustomWebpackBrowserSchema,
    context: BuilderContext
  ): ReturnType<typeof executeBrowserBuilder> => {
    return executeBrowserBuilder(options, context, {
      webpackConfiguration,
    });
  };
}
