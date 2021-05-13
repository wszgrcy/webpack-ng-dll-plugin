import { runLoaders } from 'loader-runner';
import * as path from 'path';
fdescribe('ng-named-import', () => {
  it('run', async (done) => {
    runLoaders(
      {
        context: {
          resolve: (a, b, cb) => cb(null, './abc'),
        },
        resource: '../test/code.ts',
        loaders: [path.resolve(__dirname, './import.ts')],
        readResource: (file, callback) => {
          callback(
            null,
            new Buffer(`
          export const a=1,g='';
          export function b{};
          export class c{};
          const d='';
          let g=''
          export {d,g};
          export interface e{}
          export enum f{}
          // 不会导出
          export default function(){}
          export * from 'sdf'
          `)
          );
        },
      },
      (err, result) => {
        let str = result.result[0] as any as string;
        expect(str).toContain('window.importNgNamed');
        expect(str.match(/window\.importNgNamed/g).length).toBe(8);
        expect(str.includes(`window.importNgNamed('default')`)).toBe(false);
        done();
      }
    );
  });
});
