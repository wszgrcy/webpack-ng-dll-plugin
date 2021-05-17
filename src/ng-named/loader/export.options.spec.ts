import { runLoaders } from 'loader-runner';
import * as path from 'path';
describe('ng-named-export', () => {
  it('run', async (done) => {
    runLoaders(
      {
        context: {
          // resolve: (a, b, cb) => cb(null, './abc'),
          // _compilation: {
          //   resolverFactory: {
          //     get: () => {
          //       return { resolve: (a1, a2, a3, a4, cb) => cb(null, './abc') };
          //     },
          //   },
          // },
        },
        resource: '../test/code.ts',
        loaders: [
          {
            loader: path.resolve(__dirname, './export.ts'),
            options: {
              excludeNamed: ['excludeNamed'],
              filter:(filePath:string,named:string)=>{
                if (named==='filterFn') {
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
              `export const a='';export const excludeNamed='';export const filterFn=''`
            )
          );
        },
      },
      (err, result) => {
        console.log(result.result[0])
        expect(result.result[0]).toContain('window.exportNgNamed');
        expect(result.result[0]).not.toContain(
          `window.exportNgNamed('excludeNamed',excludeNamed)`
        );
        expect(result.result[0]).not.toContain(
          `window.exportNgNamed('filterFn',filterFn)`
        );
        done();
      }
    );
  });
});
