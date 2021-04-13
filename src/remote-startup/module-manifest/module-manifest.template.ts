(() => {
  /** 载入远程模块,项目中使用 */
  function loadRemoteModuleManifest(config: {
    main: string;
    mainName: string;
    scripts: any[];
    stylesheets: any[];
  }): Promise<any> {
    config.scripts.forEach((item) => {
      let script = document.createElement('script');
      script.charset = 'utf-8';
      script.src = item.src;
      script.defer = item.defer;
      script.noModule = item.nomodule === '';
      if (item.integrity) {
        script.integrity = item.integrity;
      }
      if (item.crossOrigin !== 'none') {
        script.crossOrigin = item.crossOrigin;
      }
      if (item.type) {
        script.type = item.type;
      }
      document.head.appendChild(script);
    });
    let styleLoading = Promise.all(
      config.stylesheets.map((item) => {
        let style = document.createElement('link');
        style.rel = 'stylesheet';
        style.href = item.href;
        document.head.appendChild(style);
        return new Promise((res, rej) => {
          style.onload = () => {
            res(true);
          };
          style.onerror = () => {
            rej(item.href);
          };
        });
      })
    );

    return styleLoading
      .then((list) => {
        return window.loadRemoteModule(config.main, config.mainName);
      })
      .catch((error) => {
        throw error;
      });
  }

  (window as any).loadRemoteModuleManifest = loadRemoteModuleManifest;
})();
