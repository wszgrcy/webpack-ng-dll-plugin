import { describeBuilder } from '../../../test/plugin-describe-builder';
import {
  BROWSER_BUILDER_INFO,
  buildWebpackBrowserGenerate,
  DEFAULT_SUB_ANGULAR_CONFIG,
} from '../../../test/test-builder/browser';
import { RemoteModuleStartupMainTemplatePlugin } from './RemoteModuleStartupMainTemplatePlugin';

let angularConfig = { ...DEFAULT_SUB_ANGULAR_CONFIG };
describeBuilder(
  buildWebpackBrowserGenerate((options, context) => {
    return (config) => {
      config.plugins.push(new RemoteModuleStartupMainTemplatePlugin());
      return config;
    };
  }),
  BROWSER_BUILDER_INFO,
  (harness) => {
    describe('RemoteModuleStartupMainTemplatePlugin', () => {
      it('可执行', async () => {
        harness.useTarget('build', angularConfig);
        let result = await harness.executeOnce();
        expect(harness.hasFile('dist/testSubProject/runtime.js')).toBe(true);
        let content = harness.readFile(`dist/testSubProject/runtime.js`);
        expect(content).toContain('// RemoteModuleStartupMainTemplatePlugin');
        expect(content).toContain('loadRemoteModule');
      });
    });
  }
);
describeBuilder(
  buildWebpackBrowserGenerate((options, context) => {
    return (config) => {
      config.plugins.push(new RemoteModuleStartupMainTemplatePlugin());
      config.optimization.runtimeChunk=false
      return config;
    };
  }),
  BROWSER_BUILDER_INFO,
  (harness) => {
    describe('RemoteModuleStartupMainTemplatePlugin-no-runtime', () => {
      it('可执行', async () => {
        harness.useTarget('build', angularConfig);
        let result = await harness.executeOnce();
        expect(harness.hasFile('dist/testSubProject/main.js')).toBe(true);
        let content = harness.readFile(`dist/testSubProject/main.js`);
        expect(content).toContain('// RemoteModuleStartupMainTemplatePlugin');
        expect(content).toContain('loadRemoteModule');
      });
    });
  }
);
