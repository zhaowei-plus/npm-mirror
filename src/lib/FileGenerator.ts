import * as fs from "fs";
import * as path from "path";
import * as ejs from "ejs";
import * as isBinary from "isbinaryfile";
import globby from "globby";
class FileGenerator {
  private generator: any;
  constructor(generator: any) {
    this.generator = generator;
  }

  _injectFileMiddleware(middleware: (files: any) => void) {
    this.generator.fileMiddleWares.push(middleware);
  }

  async renderFile(name: string, data: {}) {
    if (isBinary.isBinaryFileSync(name)) {
      return fs.readFileSync(name); // return buffer
    }

    const template = fs.readFileSync(name, "utf-8");
    return ejs.render(template, data);
  }

  render(source: string, data: any) {
    try {
      this._injectFileMiddleware(async (files: any) => {
        const _files = await globby(["**/*"], {
          cwd: source,
          dot: true
        });

        for (const rawPath of _files) {
          const sourcePath = path.resolve(source, rawPath);
          const content = await this.renderFile(sourcePath, data);
          // only set file if it's not all whitespace, or is a Buffer (binary files)
          if (Buffer.isBuffer(content) || /[^\s]/.test(content)) {
            files[rawPath] = content;
          }
        }
      });
    } catch (error) {
      console.error("err", error);
    }
  }
}

export default FileGenerator;
