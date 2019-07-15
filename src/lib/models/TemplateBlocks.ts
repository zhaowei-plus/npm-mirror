import fse from 'fs-extra';
import { EventEmitter } from 'events';
import path from 'path';
import ejs from 'ejs';
import chalk from "chalk";

import { IRes } from "../interfaces/list";
import { IBlock, IBlockConfig, IPage, IIniConfig } from '../interfaces/template';
import { choosePort, prepareUrls } from "react-dev-utils/WebpackDevServerUtils";

import clone from "../util/download";

import Ini from '../util/Ini';

import { BLOCK_PATH, BLOCK_CONFIG_FILE, TEMPLATE_TARGET_DIR } from '../constant';
import { PROJECT_PATH, TEMPLATE_CATEGORY, TEMPLATE_SOURCE_DIR, TEMPLATE_CONFIG_FILE, BLOCK_CATEGORY_FILE, BLOCK_CATEGORY } from '../constant';

const DEFAULT_PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8082;
const HOST = process.env.HOST || "0.0.0.0";
const protocol = process.env.HTTPS === "true" ? "https" : "http";

const Camel = arr => {
  const [small, ...rest] = arr;
  const res = rest.map(item => {
    return `${item[0].toUpperCase()}${item.slice(1)}`;
  });
  return [small, ...res].join("");
};

/* AaaBbb */
const formatMate = (name: string, label: string) => {
  /* aaaBbb */
  const buffer = name.match(/[A-Z][a-z]*/g) || [];
  const origin = buffer.map(item => {
    return item.toLowerCase();
  });
  const namespace = Camel(origin);
  /* AaaBbb */
  const className = name;
  /* /api/aaa-bbb/list */
  const serviceApi = `${origin.join("-")}`;
  /* /aaa-bbb/list */
  const url = `${origin.join("-")}`;
  /* /api/aaa-bbb/list */
  const mockUrl = serviceApi;
  return {
    name,
    namespace,
    className,
    serviceApi,
    url,
    mockUrl,
    label
  };
};


function resolve(dir) {
  return path.join(process.cwd(), dir);
}
/**
 *
 * 模板库区块管理：
 *  1、合并区块信息
 *  2、根据区块信息，生成组合页面
 *
 * @export
 * @class Blocks
 */
export default class TemplateBlocks extends EventEmitter {
  private iniConfig: Ini;

  constructor() {
    super();

    this.iniConfig = new Ini();
    this.on('build-blocks-success', this.generatorCategory);
  }

  /**
   * 创建分类文件，提供外部使用
   *
   * @memberof TemplateBlocks
   */
  generatorCategory() {
    const blockCategoryFile = resolve(`${BLOCK_PATH}/${BLOCK_CATEGORY_FILE}`);
    fse.writeFileSync(blockCategoryFile, `module.exports = ${JSON.stringify(BLOCK_CATEGORY, null, 2)}`, 'utf-8');
  }

  async getProjectPath() {
    const iniConfig = <IIniConfig>this.iniConfig.getConfig();
    const { local, github } = iniConfig;

    let projectPath = PROJECT_PATH;

    if (local.enable) {
      projectPath = local.path.substr(0, local.path.lastIndexOf('/'));
    } else {
      await clone(`direct:${github.remote}#${github.branch}`, PROJECT_PATH, {
        clone: true
      });
    }

    return projectPath;
  }

  /**
   * 构建合并区块配置信息
   *
   * @memberof TemplateBlocks
   */
  async build() {
    let port;
    try {
      port = require(`${process.cwd()}/config/index.js`).dev.port || DEFAULT_PORT;
    } catch (error) {
      console.error("请确保在项目根目录执行操作，且已安装相关依赖");
      process.exit(0);
    }

    const blocksPath = resolve(BLOCK_PATH);
    const dirs = fse.readdirSync(blocksPath);
    const blocksConfig: IBlock[] = [];

    dirs.forEach((d, i) => {
      const blockDir = `${blocksPath}/${d}`;
      if (fse.statSync(blockDir).isDirectory()) {
        const block: IBlock = require(`${blockDir}/config.js`);
        blocksConfig.push(block);
      }
    });

    blocksConfig.sort((a, b) => (a['id'] - b['id']));

    const blockTarget = resolve(`${BLOCK_PATH}/${BLOCK_CONFIG_FILE}`);
    fse.writeFileSync(blockTarget, `module.exports = ${JSON.stringify(blocksConfig, null, 2)}`, 'utf-8');

    console.log('区块信息合并完毕');

    this.emit('build-blocks-success');
  }

  /**
   * 根据区块配置生成页面
   *
   * @memberof TemplateBlocks
   */
  async init(_configs: IPage) {
    let port;
    try {
      port = require(`${process.cwd()}/config/index.js`).dev.port || DEFAULT_PORT;
    } catch (error) {
      console.error("请确保在项目根目录执行操作，且已安装相关依赖");
      process.exit(0);
    }

    const pageName = _configs.name;
    const blockConfigs: IBlockConfig[] = _configs.blocks;

    // 获取区块源路径
    const path = await this.getProjectPath();

    const blocksPath = `${path}/${BLOCK_PATH}`;

    // 获取所有的区块配置信息
    const blocksConfigsFile = `${blocksPath}/${BLOCK_CONFIG_FILE}`;
    const blocksConfigs = require(blocksConfigsFile);

    // 创建资源目录
    this.generator(pageName);

    let blockImport = '';
    let blockRender = '';

    const targetPagePath = `${TEMPLATE_TARGET_DIR}/${pageName}`;

    // 拷贝区块列表到目录
    blockConfigs.forEach((b) => {
      const block: IBlock = blocksConfigs.find(d => d.id === b.id);
      if (block) {
        const blockPath = `${blocksPath}/${block.name}`;
        fse.copy(`${blockPath}/src`, `${targetPagePath}/components/${block.name}`);
        blockImport += `import ${b.name} from '../components/${block.name}';\n`;
        blockRender += `        <${b.name} />\n`;
      }
    });

    ejs.renderFile(`${blocksPath}/template.js`, {
      blockImport,
      blockRender,
      className: pageName,
    }, function (err, str) {
      if (err) {
        console.log('err:', err);
      }
      const viewsPath = `${targetPagePath}/views`;
      fse.ensureDirSync(viewsPath);
      fse.writeFileSync(`${viewsPath}/index.js`, str, 'utf-8');

      setTimeout(() => {
        fse.writeFile(`${viewsPath}/index.js`, "/* blocks */", {
          flag: "a"
        });
      }, 2000);

      const urls = prepareUrls(protocol, HOST, port);
      const promptData = formatMate(pageName, '');

      console.log();
      console.info(`  页面 ${pageName} 创建成功，访问地址：`);
      if (urls.lanUrlForTerminal) {
        console.log(
          `  ${chalk.bold("Local:")}            ${urls.localUrlForTerminal}#/${promptData.url}`
        );
        console.log(
          `  ${chalk.bold("On Your Network:")}  ${urls.lanUrlForTerminal}#/${promptData.url}`
        );
      } else {
        console.log(
          `  ${urls.localUrlForTerminal}#/${promptData.url}`
        );
      }
    });
  }

  /**
   * 生成目录
   *
   * @param {string} _name
   * @returns {boolean}
   * @memberof TemplateBlocks
   */
  generator(_name: string): boolean {
    if (!_name) {
      return false;
    }

    fse.ensureDir(`${TEMPLATE_TARGET_DIR}/${_name}`);
    const promptData = formatMate(_name, '');
    // 填写路由配置
    const route = `module.exports = [
    { 
        url: '/${promptData.url}' 
    }];`

    fse.ensureDirSync(`${TEMPLATE_TARGET_DIR}/${_name}`);
    fse.writeFileSync(`${TEMPLATE_TARGET_DIR}/${_name}/index.js`, route);
    return true;
  }
}