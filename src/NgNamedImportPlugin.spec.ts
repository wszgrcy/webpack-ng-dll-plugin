import { describeBuilder } from '../test/plugin-describe-builder';
import {
  BROWSER_BUILDER_INFO,
  buildWebpackBrowserGenerate,
  DEFAULT_SUB_ANGULAR_CONFIG,
} from '../test/test-builder/browser';
import { NgNamedImportPlugin } from './NgNamedImportPlugin';
import * as path from 'path';
let angularConfig = { ...DEFAULT_SUB_ANGULAR_CONFIG };
describeBuilder(
  buildWebpackBrowserGenerate((options, context) => {
    return (config) => {
      config.plugins.push(
        new NgNamedImportPlugin([path.resolve(context.workspaceRoot, 'src')])
      );
      return config;
    };
  }),
  BROWSER_BUILDER_INFO,
  (harness) => {
    describe('NgNamedImportPlugin', () => {
      it('可执行', async () => {
        harness.useTarget('build', angularConfig);
        let result = await harness.executeOnce();
        expect(harness.hasFile('dist/testSubProject/main.js')).toBe(true);
        let content = harness.readFile(`dist/testSubProject/main.js`);
        expect(content).toContain(`window.importNgNamed('MainService')`);
      });
    });
  }
);
