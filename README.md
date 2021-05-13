# webpack-ng-dll-plugin

- 一个 ng 远程加载插件库

## ng-named

- 主要用来在主项目中导出相关命名(组件,模块,服务,指令,管道及政策的 export 等)
- 子项目正常引入主项目的资源,在构建时会自动的替换为引入函数

### 主项目使用

- `NgNamedMainTemplatePlugin` 用于使用暴露导入导出函数
- `webpack-ng-dll-plugin/dist/ng-named/loader/export`(loader),用于将主项目中的引入命名增加导出,供子项目使用

### 子项目使用

- `NgNamedImportPlugin` 用于将子项目引入主项目的资源,转换为引入函数,在运行时通过函数获取到真正的主项目资源
- 未来可能使用`webpack-ng-dll-plugin/dist/ng-named/loader/import`(loader) 代替插件

## remote

- 将子项目链接到主项目,使得主项目能正确的找到相关子项目

### 主项目使用

- `RemoteModuleStartupMainTemplatePlugin` 用于加载远程项目,不过是单文件的加载
- `RemoteModuleManifestStartupMainTemplatePlugin` 用于加载远程项目,支持一个清单,进行多个 js 文件,多个 css 文件的加载

### 子项目使用

- `RemoteModuleManifestStartupMainTemplatePlugin` 使用类似`runtime`的方式加载到主项目中

## dll

- 提取主项的依赖,并且通过`DllReferencePlugin`使主项目,子项目使用相同依赖

## 主项目

- `NgDllPlugin` 参考`webpack`的`DllPlugin`
- `DllReferencePlugin`

## 子项目

- `DllReferencePlugin`
