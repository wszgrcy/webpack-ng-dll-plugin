import webpack from 'webpack';
import * as ts from 'typescript';
import { createCssSelectorForTs } from 'cyia-code-util';
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
  let sf = ts.createSourceFile(this.resourcePath, data, ts.ScriptTarget.ESNext, true);
  let selector = createCssSelectorForTs(sf);
  let list: ts.ImportDeclaration[] = selector
    .queryAll('ImportDeclaration')
    .filter((item: ts.ImportDeclaration) => ts.isNamedImports(item.importClause.namedBindings)) as any;
  let pathList = [];
  let exportNamedList: string[] = [];
  for (let i = 0; i < list.length; i++) {
    const importDeclaration = list[i];
    pathList.push(
      getAbsolutePath(importDeclaration.moduleSpecifier.getText()).then((item: string) => {
        if (!item.includes('node_modules')) {
          exportNamedList.push(...(importDeclaration.importClause.namedBindings as ts.NamedImports).elements.map((item) => item.name.text));
        }
      })
    );
  }
  Promise.all(pathList).then(() => {
    let exportModule = exportNamedList.map((item) => `window.exportNgNamed('${item}',${item})`).join(';');
    callback(null, `${data};${exportModule};`);
  });
}
