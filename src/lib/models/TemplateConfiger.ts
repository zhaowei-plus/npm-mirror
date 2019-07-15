import HOME_DEST from "user-home";
import inquirer from 'inquirer';

import { ILocalConfig, IGithubConfig, IIniConfig } from '../interfaces/template';

import File from '../util/File';
import Ini from '../util/Ini';

import {
  GITHUB_REMOTE,
  GITHUB_BRANCH,
  TEMPLATE_TARGET_DIR,
  PROJECT_PATH,
  TEMPLATE_SOURCE_DIR,
  TEMPLATE_CONFIG_FILE,
} from '../constant';

/**
 * 配置信息类
 *
 * @export
 * @class TemplateConfiger
 */
export default class TemplateConfiger extends File {
  private iniConfige: Ini;

  constructor() {
    super();

    this.iniConfige = new Ini();
  }

  /**
   * 启用本地模板
   *
   * @memberof Configer
   */
  async enableLocal() {
    const iniConfig = <IIniConfig>this.iniConfige.getConfig();
    const { local, github } = iniConfig;

    let templatePath = `${process.cwd()}/${TEMPLATE_SOURCE_DIR}`;
    let templateConfigFile = TEMPLATE_CONFIG_FILE;

    // if (local.enable) {
    //   templatePath = local.path;
    //   templateConfigFile = local.file;
    // }

    const localConfig: ILocalConfig = await inquirer.prompt([{
      type: "input",
      name: "path",
      message: "请输入本地模板路径",
      default: templatePath,
    }, {
      type: "input",
      name: "file",
      message: "请输入本地模板配置文件",
      default: templateConfigFile,
    }]);

    const { path, file } = localConfig;

    // 检测模板配置目录
    if (!File.fileExist(path)) {
      console.error(`读取本地模板失败，当前目录下无 ${path} 文件夹`);
      return false;
    }
    // 检测模板配置文件
    if (!File.fileExist(`${path}/${file}`)) {
      console.error(`读取本地模板失败，当前目录 ${path} 下无 ${file} 文件`);
      return false;
    }

    this.iniConfige.setConfig({
      local: {
        ...local,
        enable: true,
        path,
        file,
      },
      github,
    });

    console.info('配置成功，请选择本地模板执行开发任务');
  }

  // 启用线上模板
  async enableOnline() {
    const { online = false } = await inquirer.prompt([{
      type: "confirm",
      name: "online",
      message: "确认启用线上模板吗？",
      default: true,
    }]);

    if (online) {
      const iniConfig = <IIniConfig>this.iniConfige.getConfig();
      const { local, github } = iniConfig;

      const githubConfig: IGithubConfig = await inquirer.prompt([{
        type: "input",
        name: "remote",
        message: "请输入线上模板路径",
        default: github.remote,
      }, {
        type: "input",
        name: "branch",
        message: "请输入线上模板分支",
        default: github.branch,
      }]);

      this.iniConfige.setConfig({
        local: {
          ...local,
          enable: false,
        },
        github: {
          ...github,
          ...githubConfig,
        },
      });
    }

    console.log('配置成功，请选择线上模板执行开发任务');
  }

  mode(): void {
    const iniConfig = <IIniConfig>this.iniConfige.getConfig();
    const { local, github } = iniConfig;

    if (local.enable) {
      console.log(`已启用本地模板，模板路径：${local.path} 配置文件：${local.file}`);
    } else {
      console.log(`已启用线上模板，模板路径：${github.remote} 分支：${github.branch}`);
    }
  }

  default(): void {
    const iniConfig = <IIniConfig>this.iniConfige.getConfig();
    const { local, github } = iniConfig;

    this.iniConfige.setConfig({
      local: {
        ...local,
        enable: false,
      },
      github: {
        ...github,
        remote: GITHUB_REMOTE,
        branch: GITHUB_BRANCH,
      },
    });

    console.log('配置成功，请选择线上已发布模板执行开发任务');
  }

  getConfig() {
    const iniConfig = <IIniConfig>this.iniConfige.getConfig();
    return iniConfig;
  }
}
