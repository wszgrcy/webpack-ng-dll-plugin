# webpack-ng-dll-plugin
- ng版本可用的dll插件,路子比较野
# 用途
- 提高打包速度
- 代码复用(微前端依赖共享)
# 使用
- 首先根据个人熟悉程度选择`@angular-devkit/build-webpack`,`@angular-builders/custom-webpack`,`ngx-build-plus`
> 第一个是官方的,后两个是第三方的,但是确认你有练过之前,请不要选择官方的...
> 作者在测试的时候选择的是`@angular-builders/custom-webpack`
- 先构建dll,建议使用空项目来创建dll,因为目前开发中并没考虑到一些复杂逻辑的实现及相关第三方包的依赖关系保存(full模式应该可以实现,理论)
- 然后在构建时`引用`
> 引用就是webpack的正常引用插件就ok了

## 尝鲜
- 下面的函数过滤了`index.html`,`styles`,`polyfills`,`License`的输出,并且禁用了`runtimeChunk`
```ts
  setNgDllPlugin(
    config,
    {
        //webpack 的out相关配置
      output: {
        filename: 'dll.js',
      },
      ngDllPluginOptions: {
          // dll的资源清单导出配置
        path: path.join(__dirname, 'dist', 'manifest.json'),
        name: 'TLIB',
        format: true,
        filter: {
            // 过滤模式,full全量,auto相对于项目,manual 手动指定过滤项(需要设置map)
          mode: 'auto',
        },
      },
    },
    options
  );
```

## 自定义
- 相关配置需要参考(暂时没写文档,需要查看源码)
```ts
  config.plugins.push(new NgDllPlugin(option.ngDllPluginOptions));
```

## 引用
```ts
// 这里的context可以理解为代码(应用代码)相对于哪个文件夹解析(不是打包出来的dll.js,如果正确引用,你会发现把dll.js删掉,也不会影响打包),如果发现打包出来的东西没有使用这个,应该就是这个配置错了
  config.plugins.push(
    new webpack.DllReferencePlugin({
      context: path.resolve(__dirname),
      manifest: require('./dist/manifest.json'),
    })
  );
```
# 演示地址
- [https://github.com/wszgrcy/ng-cli-plugin-demo](https://github.com/wszgrcy/ng-cli-plugin-demo)
# 可能解锁的技术
- 分体式路由加载
> 正常情况下,哪怕是动态加载的路由,也是与项目一同打包,只不过是打包为两个文件
> 主体项目先打包,然后再单独开发懒加载路由模块
- `web-component`的使用率上升
> 虽然ng已经实现了这个,但是由于每次一大包,就相当于打了一个单独项目,非常庞大,使用dll后则会缩小到一个可怕的程度,副作用接近0
# 目前(可能)存在的问题
- 资源清单输出的是全量的引用,但是实际上,只有`mode:'full'`时,才等价
> 没修改之一主要是影响不大,加上调试需要
- 如果生成dll的项目中有动态加载模块,可能有未知影响
> dll在设计的时候根本没考虑过动态模块之类的东西,完全就是只打一个大包
> 尽量使用空项目生成dll
- auto只代表当前生成项目可以达到完全引用,如果你修改了项目,那么必须重新构建项目(额.看起来比较废物的一个模式)
> 其实如果项目代码足够多(各种种类),修改代码是不影响的,但是比如有些引入第一次使用,或者html模板中使用了一些新的东西,都需要重新构建
# 待改进
- 主动排除一部分永远无法使用的导出
# 为什么dll比直接打包大
- 即使dll打包现在使用到了ng的aot,摇树等相关优化技术,但是仍然有个致命问题,就是导出名,默认打包时,所有名字都会被优化(混淆),而dll打包就必须暴露这个名字,当完全暴露时,就会出现体积增长
> 目前用空项目生成出的dll(包括rxjs,router,common,core),全量暴力是440k(也就是说当其他包使用时这些文件都会在dll中查找),选择性导出最小化启动在216k作用,最终估计应该平均在300k左右
- 目前使用的技术,只能1.全量导出,2.选择可用导出,这其实就有一个副作用存在,全量导出时.不仅一些不使用的依赖被导出了,还有些内部引用的(比如`ɵangular_packages_core_core_h`)也被强制导出了,从而增加了包大小
> 后期,其实可以整理一个永不导出的列表,进行排除,从而减小体积
- 传统打包是多个模块打包一个模块,中间很多依赖都是属于内部依赖,所以精简了很多代码,dll的这种打包属于多模块,因此每个模块都有出口,之间的引用也是用的模块之间的引用,所以即使最小化dll也会比打包的多40k左右
