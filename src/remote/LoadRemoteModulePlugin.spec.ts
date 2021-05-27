import { describeBuilder } from '../../test/plugin-describe-builder';
import { LoadRemoteModulePlugin } from './LoadRemoteModulePlugin';
import {
  BROWSER_BUILDER_INFO,
  buildWebpackBrowserGenerate,
  DEFAULT_SUB_ANGULAR_CONFIG,
} from '../../test/test-builder/browser';

let angularConfig = { ...DEFAULT_SUB_ANGULAR_CONFIG };
describeBuilder(
  buildWebpackBrowserGenerate((options, context) => {
    return (config) => {
      config.plugins.push(new LoadRemoteModulePlugin(undefined,['main','polyfills']));
      return config;
    };
  }),
  BROWSER_BUILDER_INFO,
  (harness) => {
    describe('LoadRemoteModulePlugin', () => {
      it('可执行', async () => {
        harness.useTarget('build', angularConfig);
        let result = await harness.executeOnce();
        expect(harness.hasFile('dist/testSubProject/main.js')).toBe(true);
        let content = harness.readFile(`dist/testSubProject/main.js`);
        expect(content).toContain('loadRemoteModuleJsonpCallback');
        content = harness.readFile(`dist/testSubProject/polyfills.js`);
        expect(content).toContain('loadRemoteModuleJsonpCallback');
      });
    });
  }
);
