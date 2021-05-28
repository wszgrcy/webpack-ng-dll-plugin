import { describeBuilder } from '../../test/plugin-describe-builder';
import {
  BROWSER_BUILDER_INFO,
  buildWebpackBrowserGenerate,
  DEFAULT_ANGULAR_CONFIG,
  DEFAULT_SUB_ANGULAR_CONFIG,
} from '../../test/test-builder/browser';
import * as path from 'path';
import { NgNamedImportCheckPlugin } from './NgNamedImportCheckPlugin';
import webpack from 'webpack';
let angularConfig = { ...DEFAULT_SUB_ANGULAR_CONFIG };
let oldWarn = console.warn;
let num = 0;
console.warn = function () {
  num++;
  return oldWarn.call(oldWarn, Array.from(arguments));
};
describeBuilder(
  buildWebpackBrowserGenerate((options, context) => {
    return (config) => {
      config.plugins.push(
        new NgNamedImportCheckPlugin([
          path.resolve(context.workspaceRoot, 'src'),
        ])
      );
      config.plugins.push(
        new webpack.DllReferencePlugin({
          context: context.workspaceRoot,
          manifest: require(path.join(context.workspaceRoot, 'manifest.json')),
        })
      );
      return config;
    };
  }),
  BROWSER_BUILDER_INFO,
  (harness) => {
    describe('NgNamedImportCheckPlugin', () => {
      it('可执行', async () => {
        harness.useTarget('build', angularConfig);
        let result = await harness.executeOnce();
        expect(harness.hasFile('dist/testSubProject/main.js')).toBe(true);
        let content = harness.readFile(`dist/testSubProject/main.js`);
        expect(content).toContain(
          `delegated ./src/app/main.service.ts from dll-reference outputMain`
        );
        expect(num).toBe(1);
      });
      afterAll(() => {
        console.warn = oldWarn;
      });
    });
  }
);
