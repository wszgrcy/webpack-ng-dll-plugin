import { runLoaders } from 'loader-runner';
import * as path from 'path';
describe('ng-named-export', () => {
  it('run', async (done) => {
    runLoaders(
      {
        context: {
          resolve: (a, b, cb) => cb(null, './abc'),
        },
        resource: '../test/code.ts',
        loaders: [path.resolve(__dirname, './ng-named-export.ts')],
        readResource: (file, callback) => {
          callback(null, new Buffer(`import {a,b} from './abc'`));
        },
      },
      (err, result) => {
        expect(result.result[0]).toContain('window.exportNgNamed');
        done();
      }
    );
  });
});
