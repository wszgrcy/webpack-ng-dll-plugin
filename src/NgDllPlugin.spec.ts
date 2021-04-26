import { describeBuilder } from '../test/plugin-describe-builder';
import {
  BROWSER_BUILDER_INFO,
  buildWebpackBrowserGenerate,
  DEFAULT_ANGULAR_CONFIG,
} from '../test/test-builder/browser';
import * as path from 'path';
import { setNgDllPlugin } from './helper';
let angularConfig = { ...DEFAULT_ANGULAR_CONFIG, vendorChunk: false };
describeBuilder(
  buildWebpackBrowserGenerate((options, context) => {
    return (config) => {
      options;
      context;
      setNgDllPlugin(
        config,
        {
          output: {
            filename: 'dll.js',
          },
          ngDllPluginOptions: {
            path: path.resolve(context.workspaceRoot, 'dist', 'manifest.json'),
            name: 'Dll',
            format: true,
            filter: {
              mode: 'full',
            },
          },
        },
        options
      );
      return config;
    };
  }),
  BROWSER_BUILDER_INFO,
  (harness) => {
    describe('NgDllPlugin', () => {
      it('可执行', async () => {
        harness.useTarget('build', angularConfig);

        let result = await harness.executeOnce();
        result;

        expect(harness.hasFile('dist/testProject/dll.js')).toBe(true);
        let content = harness.readFile('dist/testProject/dll.js');
        expect(content).toContain('var Dll =');
        expect(harness.hasFile('dist/manifest.json'));

        let manifest = harness.readFile('dist/manifest.json');
        let manifestJson = JSON.parse(manifest);
        expect(manifestJson.name).toBe('Dll');

        expect(
          Object.keys(manifestJson.content).some(
            (name) =>
              ['@angular/core', 'rxjs'].some((item) => name.includes(item)) &&
              !name.includes('$$_lazy_route_resource')
          )
        ).toBe(true);
      });
    });
  }
);
describeBuilder(
  buildWebpackBrowserGenerate((options, context) => {
    return (config) => {
      options;
      context;
      setNgDllPlugin(
        config,
        {
          output: {
            filename: 'dll.js',
          },
          ngDllPluginOptions: {
            path: path.resolve(context.workspaceRoot, 'dist', 'manifest.json'),
            name: 'Dll',
            format: true,
            filter: {
              mode: 'auto',
            },
          },
        },
        options
      );
      return config;
    };
  }),
  BROWSER_BUILDER_INFO,
  (harness) => {
    describe('NgDllPlugin', () => {
      it('可执行', async () => {
        harness.useTarget('build', angularConfig);

        let result = await harness.executeOnce();

        expect(harness.hasFile('dist/testProject/dll.js')).toBe(true);
        let content = harness.readFile('dist/testProject/dll.js');
        expect(content).toContain('var Dll =');
        expect(harness.hasFile('dist/manifest.json'));

        let manifest = harness.readFile('dist/manifest.json');
        let manifestJson = JSON.parse(manifest);
        expect(manifestJson.name).toBe('Dll');

        expect(
          Object.keys(manifestJson.content).some(
            (name) =>
              ['@angular/core', 'rxjs'].some((item) => name.includes(item)) &&
              !name.includes('$$_lazy_route_resource')
          )
        ).toBe(true);
      });
    });
  }
);
describeBuilder(
  buildWebpackBrowserGenerate((options, context) => {
    return (config) => {
      setNgDllPlugin(
        config,
        {
          output: {
            filename: 'dll.js',
          },
          ngDllPluginOptions: {
            path: path.resolve(context.workspaceRoot, 'dist', 'manifest.json'),
            name: 'Dll',
            format: true,
            filter: {
              mode: 'filter',
              filter: (module) => {
                if (module.context.includes('rxjs')) return true;
              },
            },
          },
        },
        options
      );
      return config;
    };
  }),
  BROWSER_BUILDER_INFO,
  (harness) => {
    describe('NgDllPlugin', () => {
      it('可执行', async () => {
        harness.useTarget('build', angularConfig);

        let result = await harness.executeOnce();

        expect(harness.hasFile('dist/testProject/dll.js')).toBe(true);
        let content = harness.readFile('dist/testProject/dll.js');
        expect(content).toContain('var Dll =');
        expect(harness.hasFile('dist/manifest.json'));

        let manifest = harness.readFile('dist/manifest.json');
        let manifestJson = JSON.parse(manifest);
        expect(manifestJson.name).toBe('Dll');

        expect(
          Object.keys(manifestJson.content).some(
            (name) =>
              ['rxjs'].some((item) => name.includes(item)) &&
              !name.includes('$$_lazy_route_resource')
          )
        ).toBe(true);
      });
    });
  }
);
