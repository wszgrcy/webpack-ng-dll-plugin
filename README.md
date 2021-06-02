# webpack-ng-dll-plugin

- 一个 ng 远程加载插件库

## ng-named

- 主要用来在主项目中导出相关命名(组件,模块,服务,指令,管道及正常的 export 等)
- 子项目正常引入主项目的资源,在构建时会自动的替换为引入函数
- 远程子项目使用需要建立虚拟子项目当做桩,相关路径符合定义的`context+导出的资源文件`即可

### 主项目使用

- `NgNamedExportPlugin` 类似 dll,但是实际上是跑在主项目上的 dll,也就是两种的合体,可以在主项目内部被正常使用的同时,暴露给子项目使用
- 如果模块上有组件/指令/管道等可能被摇树掉的东西,那么就需要同样在出口声明导出

### 子项目使用

- `NgNamedImportCheckPlugin` 用于子项目应用的依赖检查,比如正常引入一个模块,实际上要使用这个模块内的一个组件,那么可能这个组件就忘记被导出,需要在出口文件导出
  > 如果检查到依赖未导出,默认情况下,会警告提示,不会中断项目

## remote

- 将子项目链接到主项目,使得主项目能正确的找到相关子项目

### 主项目使用

- `RemoteModuleStartupMainTemplatePlugin` 用于加载远程项目,不过是单文件的加载
- `RemoteModuleManifestStartupMainTemplatePlugin` 用于加载远程项目,支持一个清单,进行多个 js 文件,多个 css 文件的加载

### 子项目使用

- `RemoteModuleManifestStartupMainTemplatePlugin` 使用类似`runtime`的`Jsonp`方式加载到主项目中

## dll

- 提取主项的依赖,并且通过`DllReferencePlugin`使主项目,子项目使用相同依赖

## 主项目

- `NgDllPlugin` 参考`webpack`的`DllPlugin` 生成 dll
- `DllReferencePlugin` 引用 dll

## 子项目

- `DllReferencePlugin` 引用 dll
