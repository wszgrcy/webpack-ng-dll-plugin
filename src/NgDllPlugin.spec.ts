import { describeBuilder } from '@angular-devkit/build-angular/src/testing';
import { buildWebpackBrowserGenerate } from '../test/test-builder/browser';
import * as path from 'path';

describeBuilder(
  buildWebpackBrowserGenerate((config) => {
    return config;
  }),
  {
    name: 'test-builder:browser',
    schemaPath: path.resolve(
      process.cwd(),
      'test',
      'test-builder',
      'browser',
      'schema.json'
    ),
  },
  (harness) => {
    describe('NgDllPlugin', () => {
      it('可执行', async () => {
        harness.useTarget('build', {
          outputPath: 'dist',
          index: 'src/index.html',
          main: 'src/main.ts',
          polyfills: 'src/polyfills.ts',
          tsConfig: 'src/tsconfig.app.json',
          progress: false,
          assets: ['src/favicon.ico', 'src/assets'],
          styles: ['src/styles.css'],
          scripts: [],
        });

        let result = await harness.executeOnce();
        result;
        expect(harness.hasFile('dist/runtime-es5.js')).toBe(true);
      });
    });
  }
);
