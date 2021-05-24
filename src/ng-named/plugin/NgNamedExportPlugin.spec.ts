import { describeBuilder } from '../../../test/plugin-describe-builder';
import {
  BROWSER_BUILDER_INFO,
  buildWebpackBrowserGenerate,
  DEFAULT_ANGULAR_CONFIG,
} from '../../../test/test-builder/browser';
import { NgNamedExportPlugin } from './NgNamedExportPlugin';
import * as path from 'path';

let angularConfig = { ...DEFAULT_ANGULAR_CONFIG };
describeBuilder(
  buildWebpackBrowserGenerate((options, context) => {
    return (config) => {
      let exportFile = path.join(
        path.dirname((config.entry as any).main[0]),
        'export-center.ts'
      );
      (config.entry as any).main.push(exportFile);
      config.plugins.push(
        new NgNamedExportPlugin(
          [path.resolve(context.workspaceRoot, 'src')],
          undefined,
          exportFile
        )
      );
      config.output.library='outputMain'
      return config;
    };
  }),
  BROWSER_BUILDER_INFO,
  (harness) => {
    describe('NgNamedExportPlugin', () => {
      it('可执行', async () => {
        harness.useTarget('build', angularConfig);
        let result = await harness.executeOnce();
        expect(harness.readFile('dist/testProject/main.js')).toContain('ShowInMainComponent');
        expect(harness.readFile('dist/testProject/main.js')).toContain('module.exports = __webpack_require__;');
        expect(harness.readFile('dist/testProject/main.js')).toContain('var outputMain');
      });
    });
  }
);
