import inquirer from "inquirer";
import Ini from '../util/Ini';

import { IRes } from "../interfaces/list";
import { ITemplate, IIniConfig } from '../interfaces/template';
import clone from "../util/download";

import { PROJECT_PATH, TEMPLATE_CATEGORY, TEMPLATE_SOURCE_DIR, TEMPLATE_CONFIG_FILE } from '../constant';

export default class TemplateCategory {
  private iniConfig: Ini;

  constructor() {
    this.iniConfig = new Ini();
  }

  /**
   * 获取模板源目录：
   *  模板源路径，模板配置文件路径
   * * */
  async getTemplatePath() {
    const iniConfig = <IIniConfig>this.iniConfig.getConfig();
    const { local, github } = iniConfig;

    let templatePath = `${PROJECT_PATH}/${TEMPLATE_SOURCE_DIR}`;

    if (local.enable) {
      templatePath = local.path;
    } else {
      await clone(`direct:${github.remote}#${github.branch}`, PROJECT_PATH, {
        clone: true
      });
    }

    return templatePath;
  }

  /**
   * 对模板进行分类，返回分类之后的数组
   * * */
  async getCategory() {
    // 获取模板源路径
    const path = await this.getTemplatePath();

    // 获取模板配置信息
    let config: ITemplate[] = require(`${path}/${TEMPLATE_CONFIG_FILE}`);

    const keys = Object.keys(TEMPLATE_CATEGORY);
    const templates = {};

    // 模板分类
    config.forEach(({
      title,
      name,
      categories = [],
      homePage,
      id,
    }) => {
      categories.forEach(k => {
        if (!templates[`${k}`]) {
          templates[`${k}`] = [];
        }
        templates[`${k}`].push({
          name: title,
          value: {
            label: name,
            remote: path,
            id,
            url: homePage,
          },
        });
      });
    });

    const choices = keys.map(k => {
      let count = 0;
      if (templates[k]) {
        count = templates[k].length;
      }

      return {
        name: `${TEMPLATE_CATEGORY[`${k}`]}(共${count}种)`,
        value: templates[`${k}`] || [],
        type: "list",
      };
    });


    return choices;
  }

  async query() {
    let isBack = false;
    let res: IRes;

    const back: object = {
      name: "返回",
      value: {
        back: true,
      },
    };

    const choices = await this.getCategory();
    do {
      const templateCategory: object = await inquirer.prompt([
        {
          type: "list",
          message: "请选择分类",
          name: "category",
          choices,
        }
      ]);
      const category = templateCategory['category'];
      res = await inquirer.prompt([
        {
          type: "list",
          message: "请选择模板",
          name: "template",
          choices: [
            ...category,
            back,
          ],
        }
      ]);
      isBack = res.template['back'] || false;
    } while (isBack);
    return res;
  }
}