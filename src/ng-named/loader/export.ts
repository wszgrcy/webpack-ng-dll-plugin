import webpack from 'webpack';
import * as ts from 'typescript';
const exportNamedObject = {};
function generateExportFn(
  absolutePath: string,
  options: NgNamedExportLoaderOptions
) {
  return (named: string) => {
    if (options.excludeNamed && options.excludeNamed.includes(named)) {
      return;
    }
    if (
      options.excludeRelation &&
      options.excludeRelation[absolutePath] === named
    ) {
      return;
    }
    if (options.filter && options.filter(absolutePath, named)) {
      return;
    }
    if (exportNamedObject[named] === absolutePath) {
      console.warn(
        `repeat namedExport in [${exportNamedObject[named]}] and [${absolutePath}]`
      );
    }
    return `window.exportNgNamed('${named}',${named});`;
  };
}
export interface NgNamedExportLoaderOptions {
  excludeNamed?: string[];
  excludeRelation?: Record<string, string>;
  filter?: (filePath: string, named: string) => boolean;
}

export default function (this: webpack.loader.LoaderContext, data: string) {
  let options: NgNamedExportLoaderOptions = this.query || {};
  let generateExport = generateExportFn(this.resourcePath, options);

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
  let importList = sf.statements
    .filter(
      (item) =>
        (item.modifiers &&
          item.modifiers.some(
            (item) => ts.SyntaxKind.ExportKeyword === item.kind
          ) &&
          item.modifiers.every(
            (item) => ts.SyntaxKind.DefaultKeyword !== item.kind
          )) ||
        ts.isExportDeclaration(item)
    )
    .map((item) => {
      if (ts.isExportDeclaration(item)) {
        // export {xxx,yyy}
        if (item.exportClause && !item.moduleSpecifier) {
          if (ts.isNamespaceExport(item.exportClause)) {
            return generateExport(item.exportClause.name.text);
          } else if (ts.isNamedExports(item.exportClause)) {
            return item.exportClause.elements
              .map((item) => item.name.text)
              .map((str) => generateExport(str))
              .join('\n');
          }
        }
      }
      // export const a='',b=''
      else if (ts.isVariableStatement(item)) {
        return item.declarationList.declarations
          .map((node) => (node.name as ts.Identifier).text)
          .map((str) => generateExport(str))
          .join('\n');
      }
      // export function/class/interface
      else {
        return generateExport(((item as any).name as ts.Identifier).text);
      }
    });
  callback(null, `${data};${importList.join('\n')};`);
}
