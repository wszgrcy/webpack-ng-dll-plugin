(function () {
  let object = {};
  /** 导出ng命名 */
  function exportNgNamed(key: string, instance: any) {
    object[key] = instance;
  }
  (window as any).exportNgNamed = exportNgNamed;
   /** 导入ng命名 */
  function importNgNamed(key: string) {
    return object[key];
  }
  (window as any).importNgNamed = importNgNamed;
})();
