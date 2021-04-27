(() => {
  interface AttrGroup {
    nomodule?: string;
    integrity?: string;
    crossOrigin?: string;
    defer?: string;
    type?: string;
    src?: string;
    href?: string;
    name?: string;
    fileName?: string;
  }
  function loadScript(config: AttrGroup) {
    let script = document.createElement('script');
    script.charset = 'utf-8';
    script.src = config.src;
    script.defer = config.defer === '';
    script.noModule = config.nomodule === '';
    if (config.integrity) {
      script.integrity = config.integrity;
    }
    if (config.crossOrigin !== 'none') {
      script.crossOrigin = config.crossOrigin;
    }
    if (config.type) {
      script.type = config.type;
    }
    document.head.appendChild(script);
    return script;
  }
  /** 载入远程模块,项目中使用 */
  function loadRemoteModuleManifest(config: {
    scripts: AttrGroup[];
    stylesheets: AttrGroup[];
  }): Promise<any> {
    let mainScripts: AttrGroup[] = [];
    let preLoading: Promise<boolean>[] = [];
    config.scripts.forEach((item) => {
      if (item.name === 'main') {
        mainScripts.push(item);
      } else {
        let script = loadScript(item);
        preLoading.push(
          new Promise((res, rej) => {
            script.onload = () => {
              res(true);
            };
            script.onerror = () => {
              rej(script.src);
            };
          })
        );
      }
    });
    preLoading.push(
      ...config.stylesheets.map((item) => {
        let style = document.createElement('link');
        style.rel = 'stylesheet';
        style.href = item.href;
        document.head.appendChild(style);
        return new Promise<boolean>((res, rej) => {
          style.onload = () => {
            res(true);
          };
          style.onerror = () => {
            rej(item.href);
          };
        });
      })
    );

    return Promise.all(preLoading)
      .then(() =>
        Promise.race(
          mainScripts.map((item) =>
            (window as any).loadRemoteModule(loadScript(item), item.fileName)
          )
        )
      )
      .catch((error) => {
        throw error;
      });
  }

  (window as any).loadRemoteModuleManifest = loadRemoteModuleManifest;
})();
