import { describeBuilder } from '../../../test/plugin-describe-builder';
import {
  BROWSER_BUILDER_INFO,
  buildWebpackBrowserGenerate,
  DEFAULT_SUB_ANGULAR_CONFIG,
} from '../../../test/test-builder/browser';
import { RemoteModuleManifestStartupMainTemplatePlugin } from './RemoteModuleManifestStartupMainTemplatePlugin';

let angularConfig = { ...DEFAULT_SUB_ANGULAR_CONFIG };
describeBuilder(
  buildWebpackBrowserGenerate((options, context) => {
    return (config) => {
      config.plugins.push(new RemoteModuleManifestStartupMainTemplatePlugin());
      return config;
    };
  }),
  BROWSER_BUILDER_INFO,
  (harness) => {
    describe('RemoteModuleManifestStartupMainTemplatePlugin', () => {
      it('可执行', async () => {
        harness.useTarget('build', angularConfig);
        let result = await harness.executeOnce();
        expect(harness.hasFile('dist/testSubProject/runtime.js')).toBe(true);
        let content = harness.readFile(`dist/testSubProject/runtime.js`);
        expect(content).toContain('// RemoteModuleManifestStartupMainTemplatePlugin');
        expect(content).toContain('loadRemoteModuleManifest');
      });
    });
  }
);
