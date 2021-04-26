import { readFileSync } from 'fs';
import * as webpack from 'webpack';
import * as path from 'path';
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
