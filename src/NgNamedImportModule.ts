const NormalModule = require('webpack/lib/NormalModule');
const {
  LineToLineMappedSource,
  OriginalSource,
  RawSource,
} = require('webpack-sources');
const asString = (buf) => {
  if (Buffer.isBuffer(buf)) {
    return buf.toString('utf-8');
  }
  return buf;
};

export class NgNamedImportModule extends NormalModule {
  /**
   *
   * @param options
   * @param globalNamespace todo 未来可能考虑多层级时使用
   *
   */
  constructor(private options, private globalNamespace: string) {
    super(options);
  }

  createSource(source: string, resourceBuffer: Buffer, sourceMap) {
    source = this.options.dependencies
      .map((item) => item.id)
      .filter((item: string) => item)
      .map((item: string) => `window.importNgNamed('${item}');`)
      .join('\n');
    // if there is no identifier return raw source
    if (!this.identifier) {
      return new RawSource(source);
    }

    // from here on we assume we have an identifier
    const identifier = this.identifier();

    if (this.lineToLine && resourceBuffer) {
      return new LineToLineMappedSource(
        source,
        identifier,
        asString(resourceBuffer)
      );
    }

    if (this.useSourceMap) {
      return new OriginalSource(source, identifier);
    }

    if (Buffer.isBuffer(source)) {
      // @ts-ignore
      // TODO We need to fix @types/webpack-sources to allow RawSource to take a Buffer | string
      return new RawSource(source);
    }

    return new OriginalSource(source, identifier);
  }
}
