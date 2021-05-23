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
      console.log('入口', config.entry);
      config.plugins.push(
        new NgNamedExportPlugin(
          [path.resolve(context.workspaceRoot, 'src')],
          undefined,
          exportFile
        )
      );
      return config;
    };
  }),
  BROWSER_BUILDER_INFO,
  (harness) => {
    describe('NgNamedExportPlugin', () => {
      it('可执行', async () => {
        harness.useTarget('build', angularConfig);
        let result = await harness.executeOnce();
      });
    });
  }
);
