import webpack from 'webpack';
import * as ts from 'typescript';
import { createCssSelectorForTs } from 'cyia-code-util';
export interface NgNamedExportLoaderOptions {
  excludeNamed?: string[];
  excludeRelation?: Record<string, string>;
  filter?: (filePath: string, named: string) => boolean;
}
const exportNamedObject = {};

export default function (this: webpack.loader.LoaderContext, data: string) {
  let options: NgNamedExportLoaderOptions = this.query || {};
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
  let importDeclarationList = ((selector.queryAll(
    'ImportDeclaration'
  ) as any) as ts.ImportDeclaration[]).filter(
    (item) =>
      item.importClause && ts.isNamedImports(item.importClause.namedBindings)
  );
  let pathList = [];
  let exportNamedList: string[] = [];
  for (let i = 0; i < importDeclarationList.length; i++) {
    const importDeclaration = importDeclarationList[i];
    pathList.push(
      getAbsolutePath(
        (importDeclaration.moduleSpecifier as ts.StringLiteral).text
      ).then((absolutePath: string) => {
        if (absolutePath.includes('node_modules')) {
          return;
        }

        let namedList = (importDeclaration.importClause
          .namedBindings as ts.NamedImports).elements;
        namedList
          .map((item) => item.name.text)
          .forEach((named) => {
            if (options.excludeNamed && options.excludeNamed.includes(named)) {
              return;
            }
            if (options.excludeRelation) {
              if (options.excludeRelation[named] === absolutePath) {
                return;
              }
            }
            if (options.filter && options.filter(absolutePath, named)) {
              return;
            }
            if (exportNamedObject[named]) {
              if (exportNamedObject[named] !== absolutePath) {
                throw new Error(
                  `repeat namedExport in [${exportNamedObject[named]}] and [${absolutePath}]`
                );
              } else {
                return;
              }
            }
            exportNamedObject[named] = absolutePath;
            exportNamedList.push(named);
          });
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
