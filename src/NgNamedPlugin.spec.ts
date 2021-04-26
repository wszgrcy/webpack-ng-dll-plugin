import { describeBuilder } from "../test/plugin-describe-builder";
import {
  BROWSER_BUILDER_INFO,
  buildWebpackBrowserGenerate,
  DEFAULT_ANGULAR_CONFIG,
} from '../test/test-builder/browser';
import { NgNamedPlugin } from './NgNamedPlugin';

let angularConfig = { ...DEFAULT_ANGULAR_CONFIG, vendorChunk: false };
describeBuilder(
  buildWebpackBrowserGenerate((options, context) => {
    return (config) => {
      config.plugins.push(new NgNamedPlugin());
      return config;
    };
  }),
  BROWSER_BUILDER_INFO,
  (harness) => {
    describe('NgNamedPlugin', () => {
      it('可执行', async () => {
        harness.useTarget('build', angularConfig);

        let result = await harness.executeOnce();
        result;
        expect(harness.hasFile('dist/testProject/runtime.js')).toBe(true);
        let fileContent = harness.readFile('dist/testProject/runtime.js');
        expect(fileContent).toContain('// NgNamedPlugin');
        expect(fileContent).toContain('window.exportNgNamed');
      });
    });
  }
);
