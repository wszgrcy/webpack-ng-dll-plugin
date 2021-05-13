import { runLoaders } from 'loader-runner';
import * as path from 'path';
describe('ng-named-export', () => {
  it('run', async (done) => {
    runLoaders(
      {
        context: {
          resolve: (a, b, cb) => cb(null, b),
        },
        resource: '../test/code.ts',
        loaders: [
          {
            loader: path.resolve(__dirname, './export.ts'),
            options: {
              excludeNamed: ['excludeNamed'],
              excludeRelation:{
                b:`/exclude`
              },
              filter:(filePath:string,named:string)=>{
                if (filePath==='/exclude'&&named==='a') {
                  return true
                }
                return false
              }
            },
          },
        ],
        readResource: (file, callback) => {
          callback(
            null,
            new Buffer(
              `import {a,b} from './abc';import {excludeNamed,b,a} from '/exclude';`
            )
          );
        },
      },
      (err, result) => {
        expect(result.result[0]).toContain('window.exportNgNamed');
        expect(result.result[0]).not.toContain(
          `window.exportNgNamed('excludeNamed',excludeNamed)`
        );
        done();
      }
    );
  });
});
