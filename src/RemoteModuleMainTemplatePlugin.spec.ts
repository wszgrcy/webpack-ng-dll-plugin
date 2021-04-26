import { describeBuilder } from "../test/plugin-describe-builder";
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
    describe('RemoteModuleMainTemplatePlugin', () => {
      it('可执行', async () => {
        harness.useTarget('build', angularConfig);
        let result = await harness.executeOnce();
        expect(harness.hasFile('dist/testSubProject/main.js')).toBe(
          true
        );
        let content = harness.readFile(`dist/testSubProject/main.js`);
        expect(content).toContain('loadRemoteModuleJsonpCallback');
      });
    });
  }
);
