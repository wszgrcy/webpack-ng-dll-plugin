import { runLoaders } from 'loader-runner';
import * as path from 'path';
describe('export-ng-module', () => {
  it('run', async (done) => {
    runLoaders(
      {
        context: {
          resolve: (a, b, cb) => cb(null, './abc'),
        },
        resource: '../test/code.ts',
        loaders: [path.resolve(__dirname, './export-ng-module.loader.ts')],
        readResource: (file, callback) => {
          callback(null, new Buffer(`import {a,b} from './abc'`));
        },
      },
      (err, result) => {
        console.log(result);
        expect(result).toContain('window.exportNgModule');
        done();
      }
    );
  });
});
