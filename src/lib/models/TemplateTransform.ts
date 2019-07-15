// ts 引入库
import path from 'path';
import fs from 'fs';
import { EventEmitter } from 'events';
import uuid from 'uuid';
import readPkg from 'read-pkg';

import { translateFile } from '../common/templateFile';

import { TEMPLATE_CONFIG_FILE, TEMPLATE_TARGET_MOCK_DIR, TEMPLATE_SOURCE_DIR, TEMPLATE_CATEGORY_FILE, TEMPLATE_CATEGORY } from '../constant';

/**
 * 返回组合的前路径
 *
 * @param {string} dir
 * @returns {string}
 */
function resolve(dir: string): string {
  return path.join(process.cwd(), dir);
}

/**
 * 检测路径是否存在
 *
 * @param {string} path
 * @returns {boolean}
 */
function fsExistsSync(path: string): boolean {
  try {
    fs.accessSync(path, fs.constants.F_OK);
  } catch (e) {
    return false;
  }
  return true;
}

/**
 * 检测是否在项目根目录
 *
 * @returns {boolean}
 */
async function checkInProjectRoot() {
  try {
    await readPkg({ cwd: `${process.cwd()}` });
    return true;
  } catch (e) {
    return false;
  }
}

export default class TemplateTransform extends EventEmitter {
  // 保存模板配置信息
  private templates: Array<Object> = [];
  private blankTemplate: any = null;
  /**
   * 查询模板列表
   *
   * @memberof TemplateMaker
   */
  list(islocal?: boolean): boolean {
    const result = checkInProjectRoot();

    if (!result) {
      console.error("请确保在项目根目录执行此操作");
      return false;
    }

    if (islocal) {
      console.log('查看本地模板列表');
    }

    console.log('模板列表信息：');
    return true;
  }

  /**
   * 转换模板为ejs模板
   *
   * @memberof TemplateMaker
   */
  tran(): boolean {
    const result = checkInProjectRoot();
    if (!result) {
      console.error("请确保在项目根目录执行此操作");
      return false;
    }

    this.start();
    return true;
  }

  /**
   * 获取模板默认转换规则配置
   *
   * @param {string} modelName 模块名
   * @param {string} type 规则类型，index表示模块下 index 文件的转换规则
   * */
  getDefaultEjsRules(modelName: string, type = 'index'): object {
    const splitStrs = modelName.split(/(?=[A-Z])/);
    const [first, ...rest] = splitStrs;
    const namespace = [first.toLowerCase(), ...rest].join("");
    const url = splitStrs.map(d => d.toLowerCase()).join("-");

    // 默认模板转换规则
    const defaultRule = {
      index: [
        { reg: url, target: '<%= url %>' },
      ],
      mock: [
        { reg: namespace, target: '<%= mockUrl %>' },
      ],
      modal: [
        { reg: namespace, target: '<%= namespace %>' },
      ],
      services: [
        { reg: namespace, target: '<%= serviceApi %>' },
      ],
      models: [
        { reg: namespace, target: '<%= namespace %>' },
      ],
      views: [
        { reg: namespace, target: '<%= namespace %>' },
        { reg: modelName, target: '<%= className %>' },
      ],
    };
    return defaultRule[type];
  }

  /**
   * 将模板和mock文件转换成 ejs 引擎模版
   *
   * @param {string} modelName 模块名
   * */
  translateTemplate(modelName: string): boolean {
    // 获取模块路径
    const modelPath = resolve(`src/routes/${modelName}`);
    // 获取配置文件信息
    const configPath = `${modelPath}/configure.js`;

    // 存在配置文件，说明是模板
    if (fs.existsSync(configPath)) {
      const configInfo = require(configPath);
      if (configInfo) {
        const { isBlank = false, ejsRules, template } = configInfo;

        if (isBlank) {
          this.blankTemplate = template;
        } else {
          this.templates.push(template);
        }

        // 如果是开发模板的模板，则跳过转换
        // if (isTamplete) {
        //   return false;
        // }

        // 转换模块信息
        this.translateModel(modelName, modelPath, ejsRules);

        // 获取 mock 文件转换规则
        let mockRules = ejsRules.mockRules;
        if (!mockRules) {
          mockRules = this.getDefaultEjsRules(modelName, 'mock');
        }
        // 转换 mock 文件
        this.translateMock(modelName, mockRules);
      }
    }

    return true;
  }
  /**
   * 转换模版对应的mock文件为 ejs 引擎模版
   *
   * @param {string} modelName 模块名
   * @param {array} rules 转换规则数组
   * */
  translateMock(modelName: string, rules = []) {
    // 源 mock 数据存放的目录
    const mockPath = resolve(TEMPLATE_TARGET_MOCK_DIR);
    // 转换后的文件目录
    const templatePath = resolve(`${TEMPLATE_SOURCE_DIR}/${TEMPLATE_TARGET_MOCK_DIR}`);
    return translateFile(modelName, mockPath, templatePath, `${modelName}.js`, rules);
  }

  /**
   * 转换模版对应的文件为 ejs 引擎模版
   *
   * @param {string} modelName 模块名
   * @param {string} modelPath 模块路径
   * @param {object} ejsRules 转换规则配置
   * */
  translateModel(modelName: string, modelPath: string, ejsRules: object) {
    let source: Array<string> = [];
    try {
      // 获取模块子目录和自文件 - 暂不支持多级目录
      source = fs.readdirSync(modelPath);
    } catch (e) {
      return console.error(`加载模块 ${modelName} 失败：`, e);
    }

    source.forEach((file) => {
      if (file === 'index.js') {
        let fileConfig = ejsRules["index"];
        if (!fileConfig) {
          fileConfig = this.getDefaultEjsRules(modelName);
        }
        const targetPath = modelPath.replace('src/routes', 'template');
        translateFile(modelName, modelPath, targetPath, file, fileConfig);

      } else if (file !== 'config.js') {
        const stat = fs.statSync(`${modelPath}/${file}`);
        if (stat.isDirectory()) {
          let fileConfig = ejsRules[`${file}`];
          if (!fileConfig) {
            fileConfig = this.getDefaultEjsRules(modelName, file);
          }
          this.translateModelFile(modelName, `${modelPath}/${file}`, fileConfig);
        }
      }
    });
  }

  /**
   * 转换模版对应的子目录文件为 ejs 引擎模版
   *
   * @param {string} modelName 模块名
   * @param {string} modelPath 模块路径
   * @param {array} rules 转换规则
   * */
  translateModelFile(modelName: string, modelPath: string, rules = []) {
    let source: Array<string> = [];
    try {
      source = fs.readdirSync(modelPath);
    } catch (e) {
      return console.error(`加载模块 ${modelName} 文件失败：`, e);
    }

    source.forEach((file) => {
      const targetPath = modelPath.replace('src/routes', 'template');
      translateFile(modelName, modelPath, targetPath, file, rules);
    });
  }

  /**
   * 创建分类文件，提供外部使用
   *
   * @memberof TemplateBlocks
   */
  generatorCategory() {
    const blockCategoryFile = resolve(`${TEMPLATE_SOURCE_DIR}/${TEMPLATE_CATEGORY_FILE}`);
    fs.writeFileSync(blockCategoryFile, `module.exports = ${JSON.stringify(TEMPLATE_CATEGORY, null, 2)}`, 'utf-8');
  }

  /**
   * 写入模板信息
   * */
  saveTemplateInfo() {
    const templateInfoFile = resolve(`${TEMPLATE_SOURCE_DIR}/${TEMPLATE_CONFIG_FILE}`);
    // const writerStream = fs.createWriteStream(templateInfoFile);
    // writerStream.write(`module.exports = ${JSON.stringify(this.templates, null, 2)}`, 'UTF8');
    // writerStream.end();

    this.templates.sort((a, b) => (a['id'] - b['id']));
    this.templates.unshift(this.blankTemplate);

    // 写入模板文件文件夹
    const templateStream = fs.createWriteStream(templateInfoFile.replace('src', 'template'));
    templateStream.write(`module.exports = ${JSON.stringify(this.templates, null, 2)}`, 'UTF8');
    templateStream.end();

    // 生成模板分类信息
    this.generatorCategory();
  }


  start(): boolean {
    this.on('tran-template-success', this.saveTemplateInfo);

    let models: Array<string> = [];
    try {
      const sourcePath = resolve('src/routes');
      if (fsExistsSync(sourcePath)) {
        models = fs.readdirSync(sourcePath);
      } else {
        console.error('转换模板失败，请确认是否是模板项目！');
        return false;
      }
    } catch (error) {
      console.error('加载模板列表失败', error);
      return false;
    }

    const promises = models.map(model =>
      this.translateTemplate(model)
    );

    Promise
      .all(promises)
      .then(res => {
        this.emit('tran-template-success');
        console.log('模板文件转换完成...');
        return true;
      }, err => {
        console.error('模板文件转换失败，err：', err);
        return true;
        return false;
      });

    return true;
  };
}
