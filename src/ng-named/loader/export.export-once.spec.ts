import { runLoaders } from 'loader-runner';
import * as path from 'path';
describe('ng-named-export', () => {
  it('export once', async (done) => {
    runLoaders(
      {
        context: {
          resolve: (a, b, cb) => cb(null, './abc'),
        },
        resource: '../test/code.ts',
        loaders: [path.resolve(__dirname, './export.ts')],
        readResource: (file, callback) => {
          callback(
            null,
            new Buffer(`import {a,b} from './abc';import {a,b} from './abc'`)
          );
        },
      },
      (err, result) => {
        expect(result.result[0]).toContain('window.exportNgNamed');
        expect(((result.result[0] as any) as string).match(/window\.exportNgNamed/g).length).toBe(2);
        done();
      }
    );
  });
});
