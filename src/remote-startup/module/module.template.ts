(() => {
  let loadedRemoteModuleMap: { [name: string]: Promise<any> } = {};
  /** 加载时的map */
  let loadingRemoteModuleMap: { [name: string]: (param) => void } = {};
  function getDefaultModuleName(name = ''): string {
    return name.split(/(\/|\\)/g).pop();
  }
  /** 载入远程模块,项目中使用 */
  function loadRemoteModule(
    url: string | HTMLScriptElement,
    moduleName?: string
  ): Promise<any> {
    if (typeof url === 'string') {
      !moduleName && (moduleName = getDefaultModuleName(url));
    }
    if (loadedRemoteModuleMap[moduleName]) {
      return loadedRemoteModuleMap[moduleName];
    }
    let resolve: (param) => void;
    let reject: (param) => void;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    loadedRemoteModuleMap[moduleName] = promise;
    loadingRemoteModuleMap[moduleName] = resolve;
    requireEnsure(url, reject, moduleName);
    return promise;
  }
  /** 远程模块加载后调用 */
  function loadRemoteModuleJsonpCallback(
    name: string,
    module: { [name: string]: any }
  ): void {
    if (loadingRemoteModuleMap[name] && module) {
      loadingRemoteModuleMap[name](module);
      delete loadingRemoteModuleMap[name];
    } else {
      console.error('moduleName:', name, ',moduleExport:', module);
      throw new Error(`no ${name} found`);
    }
  }
  (window as any).loadRemoteModule = loadRemoteModule;
  (window as any).loadRemoteModuleJsonpCallback = loadRemoteModuleJsonpCallback;
  /** 请求资源 */
  function requireEnsure(
    arg: string | HTMLScriptElement,
    rej: Function,
    name: string
  ) {
    let script: HTMLScriptElement;
    if (typeof arg == 'string') {
      let url = arg;
      script = document.createElement('script');
      script.src = url;
    } else {
      script = arg;
    }
    let onScriptComplete;
    script.charset = 'utf-8';
    (script as any).timeout = 120;
    onScriptComplete = (event) => {
      script.onerror = script.onload = null;
      clearTimeout(timeout);
      if (event.type === 'timeout') {
        rej({
          type: event.type,
          message: 'timeout',
        });
      } else if (event.type === 'error') {
        rej({
          type: event.type,
          message: `Loading remote module [${name}]:[${script.src}] failed`,
        });
      }
    };
    // 超时状态
    const timeout = setTimeout(() => {
      onScriptComplete({ type: 'timeout', target: script });
    }, 120000);
    script.onerror = onScriptComplete;
    document.head.appendChild(script);
  }
})();
