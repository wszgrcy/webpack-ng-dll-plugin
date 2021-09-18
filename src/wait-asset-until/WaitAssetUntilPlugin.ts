import * as webpack from 'webpack';
export interface WaitAssetUtilFileOptions {
  filePath: string;
  isDir?: boolean;
  listen?: boolean;
}
export class WaitAssetUtilPlugin {
  constructor(
    private options: {
      files: WaitAssetUtilFileOptions[];
      intervalTime?: number;
      timeout?: number | undefined;
    }
  ) {
    this.options.intervalTime =
      typeof this.options.intervalTime === 'number'
        ? this.options.intervalTime
        : 5000;
  }
  apply(compiler: webpack.Compiler) {
    compiler.hooks.thisCompilation.tap('WaitAssetUtilPlugin', (compilation) => {
      this.options.files.forEach((item) => {
        compilation.fileDependencies.add(item.filePath);
      });
    });
    compiler.hooks.beforeCompile.tapAsync(
      'WaitAssetUtilPlugin',
      (params, cb) => {
        this.fileAllExist(this.options.files, compiler).then((result) => {
          if (result.status) {
            cb();
          } else {
            console.warn('file not all exist!');
            cb();
          }
        });
      }
    );
  }

  fileAllExist(files: WaitAssetUtilFileOptions[], compiler: webpack.Compiler) {
    return this._fileAllExist(files, compiler, Date.now());
  }
  private async _fileAllExist(
    files: WaitAssetUtilFileOptions[],
    compiler: webpack.Compiler,
    startTime: number
  ): Promise<{ status: boolean }> {
    let promiseList: WaitAssetUtilFileOptions[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      let promise = new Promise<
        Parameters<
          Parameters<webpack.Compilation['inputFileSystem']['stat']>[1]
        >[1]
      >((res, rej) => {
        compiler.inputFileSystem.stat(file.filePath, (err, result) => {
          if (result) {
            res(result);
          } else if (err) {
            rej(err);
          } else {
            throw new Error('unknown');
          }
        });
      })
        .then((result) => {
          if (file.isDir && result.isDirectory()) {
          } else if (!file.isDir && result.isFile()) {
          } else {
            throw new Error('not match');
          }
        })
        .catch(() => {
          promiseList.push(file);
        })
        .then(() => {
          compiler.inputFileSystem.purge(file.filePath);
        });
      await promise;
    }
    if (!promiseList.length) {
      return {
        status: true,
      };
    }
    if (
      !this.options.timeout ||
      Date.now() - startTime < this.options.timeout
    ) {
      let res: (
        value:
          | {
              status: boolean;
            }
          | PromiseLike<{
              status: boolean;
            }>
      ) => void;
      let resultPromise = new Promise<{ status: boolean }>((result) => {
        res = result;
      });
      setTimeout(() => {
        res(this._fileAllExist(promiseList, compiler, startTime));
      }, this.options.intervalTime);
      return resultPromise;
    } else {
      return {
        status: false,
      };
    }
  }
}
