import webpack from 'webpack';
import * as ts from 'typescript';
import { createCssSelectorForTs } from 'cyia-code-util';
const exportNamedObject = {};
/**
 * todo 增加 排除路径,排除模块,排除路径对应的模块...
 */
export default function (this: webpack.loader.LoaderContext, data: string) {
  let getAbsolutePath = (moduleSpecifier: string) => {
    return new Promise<string>((res, rej) => {
      this.resolve(this.context, moduleSpecifier, (err, resource) => {
        if (err) {
          rej(err);
        }
        res(resource);
      });
    });
  };
  const callback = this.async();
  if (!callback) {
    throw new Error('Invalid webpack version');
  }
  let sf = ts.createSourceFile(
    this.resourcePath,
    data,
    ts.ScriptTarget.ESNext,
    true
  );
  let selector = createCssSelectorForTs(sf);
  let list = ((selector.queryAll(
    'ImportDeclaration'
  ) as any) as ts.ImportDeclaration[]).filter(
    (item) =>
      item.importClause && ts.isNamedImports(item.importClause.namedBindings)
  );
  let pathList = [];
  let exportNamedList: string[] = [];
  for (let i = 0; i < list.length; i++) {
    const importDeclaration = list[i];
    pathList.push(
      getAbsolutePath(
        (importDeclaration.moduleSpecifier as ts.StringLiteral).text
      ).then((item: string) => {
        if (!item.includes('node_modules')) {
          let namedList = (importDeclaration.importClause
            .namedBindings as ts.NamedImports).elements;
          namedList.forEach((namedItem) => {
            if (exportNamedObject[namedItem.name.text]) {
              if (exportNamedObject[namedItem.name.text] !== item) {
                throw new Error(
                  `repeat namedExport in [${
                    exportNamedObject[namedItem.name.text]
                  }] and [${item}]`
                );
              } else {
                return;
              }
            }
            exportNamedObject[namedItem.name.text] = item;
            exportNamedList.push(namedItem.name.text);
          });
        }
      })
    );
  }
  Promise.all(pathList).then(() => {
    let exportModule = exportNamedList
      .map((item) => `window.exportNgNamed('${item}',${item})`)
      .join(';');
    callback(null, `${data};${exportModule};`);
  });
}
