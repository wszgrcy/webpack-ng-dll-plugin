import { readFileSync } from 'fs';
import * as webpack from 'webpack';
import * as path from 'path';
/** 
 * ng声明命名插件
 * 将插入一段脚本,用于保存导出的`声明命名`,及提供引入这些`声明命名`的方式
 */
export class NgNamedPlugin {
  constructor() {}
  apply(compiler: webpack.Compiler) {
    compiler.hooks.thisCompilation.tap('NgNamedPlugin', (compilation) => {
      ((compilation.mainTemplate.hooks as any).bootstrap as any).tap(
        'NgNamedPlugin',
        (source) => {
          return webpack.Template.asString([
            '// NgNamedPlugin',
            readFileSync(
              path.resolve(__dirname, './NgNamed.template.js')
            ).toString(),
            source,
          ]);
        }
      );
    });
  }
}
