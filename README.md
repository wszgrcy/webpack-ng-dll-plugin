# webpack-ng-dll-plugin

- 一个 ng 远程加载插件库

## Plugin

### RemoteModuleMainTemplatePlugin

- 普通模块转换为远程模块
- 转换为由函数包裹的`JsonPCallback`方式,类似`webpack`的懒加载分包加载方式

### NgNamedPlugin

- `声明命名`
- 将插入一段脚本,用于保存导出的`声明命名`,及提供引入这些`声明命名`的方式

### NgNamedImportPlugin

- 引入`声明命名`
- 将项目中某些引入,转换为导入`声明命名`函数

### NgDllPlugin

- `webpack` `DllPlugin`的修改版本,用于实现 ng 的 dll

### RemoteModuleStartupPlugin

- 远程模块启动
- 插入一段脚本,用于加载`RemoteModuleMainTemplatePlugin`处理过的项目

### RemoteModuleManifestStartupPlugin

- 远程资源清单启动
- 远程模块的加强版
- 可以处理多个 js 及多个 css 的启动
- 插入一段脚本,用于加载`RemoteModuleMainTemplatePlugin`处理过的项目
- 使用此插件时需要先引入`RemoteModuleStartupPlugin`插件

---
## loader

### ng-named-export

- 将项目中已经导入被使用的`声明命名`导出,供远程模块使用


