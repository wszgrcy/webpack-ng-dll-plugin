import webpack from 'webpack';
import * as ts from 'typescript';
function generateImport(str: string) {
  return `export const ${str} = window.importNgNamed('${str}');`;
}
export default function (this: webpack.loader.LoaderContext, data: string) {
  let printer = ts.createPrinter();
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
            return generateImport(item.exportClause.name.text);
          } else if (ts.isNamedExports(item.exportClause)) {
            return item.exportClause.elements
              .map((item) => item.name.text)
              .map((str) => generateImport(str))
              .join('\n');
          }
        }
        // 导出于其他模块的会原样输出 export */{xxx}/xxx from 'yyy'
        else if (item.moduleSpecifier) {
          return printer.printNode(ts.EmitHint.Unspecified, item, sf);
        }
      }
      // export const a='',b=''
      else if (ts.isVariableStatement(item)) {
        return item.declarationList.declarations
          .map((node) => (node.name as ts.Identifier).text)
          .map((str) => generateImport(str))
          .join('\n');
      }
      // export function/class/interface
      else {
        return generateImport(((item as any).name as ts.Identifier).text);
      }
    });
  callback(null, `${importList.join('\n')};`);
}
