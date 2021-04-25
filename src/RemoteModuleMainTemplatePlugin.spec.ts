import { describeBuilder } from '@angular-devkit/build-angular/src/testing';
import { RemoteModuleMainTemplatePlugin } from './RemoteModuleMainTemplatePlugin';
import {
  BROWSER_BUILDER_INFO,
  buildWebpackBrowserGenerate,
  DEFAULT_SUB_ANGULAR_CONFIG,
} from '../test/test-builder/browser';

let angularConfig = { ...DEFAULT_SUB_ANGULAR_CONFIG };
describeBuilder(
  buildWebpackBrowserGenerate((options, context) => {
    return (config) => {
      config.plugins.push(new RemoteModuleMainTemplatePlugin());
      return config;
    };
  }),
  BROWSER_BUILDER_INFO,
  (harness) => {
    describe('LoadModuleMainTemplatePlugin', () => {
      it('可执行', async () => {
        harness.useTarget('build', angularConfig);
        let result = await harness.executeOnce();
        expect(harness.hasFile('dist/testSubProject/main-es2015.js')).toBe(
          true
        );
        let content = harness.readFile(`dist/testSubProject/main-es2015.js`);
        expect(content).toContain('loadRemoteModuleJsonpCallback');
      });
    });
  }
);
