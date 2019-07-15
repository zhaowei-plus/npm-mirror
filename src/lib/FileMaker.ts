import * as path from "path";
import * as events from "events";
import * as fs from "fs-extra";
import * as ejs from "ejs";
import FileGenerator from "./FileGenerator";
import writeFileTree from "./util/writeFileTree";
import { IPromptData } from "./interfaces/list";
import home from "user-home";
const ora = require("ora");

import { TEMPLATE_TARGET_DIR } from './constant';

class FileMaker extends events.EventEmitter {
  private context!: string;
  private tmpTemplateSrc!: string;
  private files: {};
  private afterHandler!: () => void;
  private promptData!: IPromptData;
  private fileMiddleWares: any[];

  constructor(opts = {}) {
    super();
    for (const opt in opts) {
      this[opt] = opts[opt];
    }
    this.fileMiddleWares = [];
    this.files = {};
    this.on("mock", this.afterHandler);

    try {
      const api = new FileGenerator(this);
      api.render(`${this.tmpTemplateSrc}/${this.promptData.label}`, this.promptData);
    } catch (err) {
      console.error("fileMaker", err);
    }
  }

  async generateMockFile(file: string, content) {
    fs.ensureFileSync(file);
    return new Promise((resolve, reject) => {
      fs.writeFile(
        file,
        content,
        {
          encoding: "utf-8"
        },
        err => {
          if (err) {
            reject(err);
          }
          resolve("mock succeed");
        }
      );
    });
  }

  async make() {
    const dest = path.join(
      this.context,
      TEMPLATE_TARGET_DIR,
      this.promptData.className
    );
    const initialFiles = Object.assign({}, this.files);

    const source = `${this.tmpTemplateSrc}/mockData/${this.promptData.label}.js`
    const target = `${this.context}/mockData/${this.promptData.namespace}.js`;

    const content = ejs.render(fs.readFileSync(source, "utf-8"), {
      mockUrl: this.promptData.mockUrl
    });

    await this.resolveFiles();
    await writeFileTree(dest, this.files, initialFiles);

    await this.hack();

    /* mock staff */

    try {
      await this.generateMockFile(target, content);
    } catch (err) {
      console.error(err);
    }

    return new Promise(resolve => {
      const spinner = ora();
      spinner.text = "正在mock数据...";
      spinner.color = "magenta";
      spinner.start();

      setTimeout(() => {
        fs.writeFile(target, "/* data */", {
          flag: "a"
        });
        spinner.stopAndPersist();
        this.emit("mock");
        resolve();
      }, 5000);
    });
  }

  async hack() {
    const configFilePath = path.resolve(this.context, "src/router-config.js");
    fs.removeSync(configFilePath);
  }

  async resolveFiles() {
    const files = this.files;
    for (const middleware of this.fileMiddleWares) {
      await middleware(files, ejs.render);
    }
  }

  after(handler) {
    this.on("mock", handler);
  }
}

export default FileMaker;
