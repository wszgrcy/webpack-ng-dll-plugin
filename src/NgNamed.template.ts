(function () {
  let object = {};
  function setProjectExport(key: string, instance: any) {
    object[key] = instance;
  }
  (window as any).setProjectExport = setProjectExport;
  function getProjectExport(key: string) {
    return object[key];
  }
  (window as any).getProjectExport = getProjectExport;
})();
