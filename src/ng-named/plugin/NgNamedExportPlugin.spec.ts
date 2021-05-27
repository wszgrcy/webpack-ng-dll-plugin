import { describeBuilder } from '../../../test/plugin-describe-builder';
import {
  BROWSER_BUILDER_INFO,
  buildWebpackBrowserGenerate,
  DEFAULT_ANGULAR_CONFIG,
} from '../../../test/test-builder/browser';
import { NgNamedExportPlugin } from './NgNamedExportPlugin';
import * as path from 'path';

let angularConfig = {
  ...DEFAULT_ANGULAR_CONFIG,
  optimization: true,

  buildOptimizer: true,
};
describeBuilder(
  buildWebpackBrowserGenerate((options, context) => {
    return (config) => {
      let exportFile = path.join(
        path.dirname((config.entry as any).main[0]),
        'export-center.ts'
      );
      (config.entry as any).main.push(exportFile);
      config.plugins.push(
        new NgNamedExportPlugin(exportFile, {
          path: path.resolve(context.workspaceRoot, 'dist', 'manifest.json'),
          name: 'outputMain',
          context:path.join(context.workspaceRoot,'../','remote-main')
        })
      );
      config.output.library = 'outputMain';
      return config;
    };
  }),
  BROWSER_BUILDER_INFO,
  (harness) => {
    describe('NgNamedExportPlugin-context', () => {
      it('可执行', async () => {
        harness.useTarget('build', angularConfig);
        let result = await harness.executeOnce();
        expect(harness.readFile('dist/testProject/main.js')).toContain(
          'ShowInMainComponent'
        );
        if (!(angularConfig.buildOptimizer&&angularConfig.optimization)) {
          expect(harness.readFile('dist/testProject/main.js')).toContain(
            'module.exports = __webpack_require__;'
          );
          
        }
        expect(harness.readFile('dist/testProject/main.js')).toContain(
          'var outputMain'
        );
        expect(harness.readFile('dist/manifest.json')).toContain(
          `"outputMain"`
        );
        expect(harness.readFile('dist/manifest.json')).toContain(
          'ShowInMainComponent'
        );
        expect(harness.readFile('dist/manifest.json')).toContain(
          '/src/app/normal.ts'
        );
        expect(harness.readFile('dist/manifest.json')).toContain(
          '/src/app/main.service.ts'
        );
        expect(harness.readFile('dist/manifest.json')).not.toContain(
          './src/app/normal.ts'
        );
        expect(harness.readFile('dist/manifest.json')).not.toContain(
          './src/app/main.service.ts'
        );
        expect(harness.readFile('dist/manifest.json')).not.toContain(
          'main.ts'
        );
        expect(harness.readFile('dist/manifest.json')).not.toContain(
          'export-center.ts'
        );
      });
    });
  }
);
