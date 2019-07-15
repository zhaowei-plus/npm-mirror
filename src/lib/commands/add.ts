import home from 'user-home';
import * as _ from 'lodash';
import * as inquirer from 'inquirer';
import chalk from 'chalk';
import * as path from 'path';
import * as fs from 'fs-extra';
import detect from 'detect-port';
import fileMaker from '../FileMaker';
import Notifier from '../Notifier';
import { questions, choices as rawChoices } from './constants';
import { IListMeta, IRes } from '../interfaces/list';
import { choosePort, prepareUrls } from 'react-dev-utils/WebpackDevServerUtils';
import clone from '../util/download';
import getUser from '../util/getUser';
import { checkDepsIsUsable } from '../util/checkDeps';
import execa from 'execa';

import TemplateCategory from '../models/TemplateCategory';

import { TEMPLATE_TARGET_DIR } from '../constant';

const ora = require('ora');

const spinner = ora();

const HOME_DEST = home;
const DEFAULT_PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8082;
const HOST = process.env.HOST || '0.0.0.0';
const protocol = process.env.HTTPS === 'true' ? 'https' : 'http';

const Camel = arr => {
  const [small, ...rest] = arr;
  const res = rest.map(item => {
    return `${item[0].toUpperCase()}${item.slice(1)}`;
  });
  return [small, ...res].join('');
};

/* AaaBbb */
export const formatMate = (name: string, label: string) => {
  /* aaaBbb */
  const buffer = name.match(/[A-Z][a-z]*/g) || [];
  const origin = buffer.map(item => {
    return item.toLowerCase();
  });
  const namespace = Camel(origin);
  /* AaaBbb */
  const className = name;
  /* /api/aaa-bbb/list */
  const serviceApi = `${origin.join('-')}`;
  /* /aaa-bbb/list */
  const url = `${origin.join('-')}`;
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

const generateOnePiece = async (urls, res, pieceName: string, index, len) => {
  /*  检测是否存在同名目录，处理冲突 */
  const targetDir = path.resolve(
    process.cwd(),
    TEMPLATE_TARGET_DIR,
    pieceName || '.'
  );

  if (fs.existsSync(targetDir)) {
    const {
      action
    }: {
      action?: string | boolean;
    } = await inquirer.prompt([
      {
        name: 'action',
        type: 'list',
        message: `页面 ${chalk.cyan(pieceName)} 已经存在. 您可以:`,
        choices: [
          { name: '合并', value: 'merge' },
          { name: '覆盖', value: 'overwrite' },
          { name: '我再想想', value: false }
        ]
      }
    ]);
    if (!action) {
      return;
    } else if (action === 'overwrite') {
      console.log();
      console.log(`  \移除 ${chalk.cyan(pieceName)}...`);
      await fs.remove(targetDir);
    }
  }

  const promptData = formatMate(pieceName, res.template.label);
  const tmpTemplateSrc = res.template.remote;
  const preFormat = formatMate(res.template.label, res.template.label);

  // 预处理url
  const preUrl = res.template.url.replace(preFormat.url, promptData.url);

  const afterHandler = async () => {
    console.log();
    console.info(`  页面 ${pieceName} 创建成功，访问地址：`);
    if (urls.lanUrlForTerminal) {
      console.log(
        `  ${chalk.bold('Local:')}            ${
          urls.localUrlForTerminal
        }${preUrl}`
      );
      console.log(
        `  ${chalk.bold('On Your Network:')}  ${
          urls.lanUrlForTerminal
        }${preUrl}`
      );
    } else {
      console.log(`  ${urls.localUrlForTerminal}${preUrl}`);
    }

    console.log();

    if (isLastOne(len, index)) {
      /* 最后一个，询问是否新建页面 */
      const {
        confirm
      }: {
        confirm: boolean;
      } = await inquirer.prompt([
        {
          name: 'confirm',
          type: 'confirm',
          message: `继续新建页面？`,
          default: false
        }
      ]);
      if (!confirm) {
        /* 处理是否启动开发服务器 */
        let port;
        try {
          port =
            require(`${process.cwd()}/config/index.js`).dev.port ||
            DEFAULT_PORT;

          const newPort = await detect(port);
          if (port !== parseInt(newPort, 10)) {
            /* 已启动 */
            console.log('项目已启动');
            return;
          } else {
            const { start }: { start: boolean } = await inquirer.prompt([
              {
                name: 'start',
                type: 'confirm',
                message: '项目未启动，是否启动项目',
                default: true
              }
            ]);
            if (!start) {
              /* 不启动 */
              return;
            } else {
              /* 启动项目 */
              try {
                const stream = execa('npm', ['run', 'dev']).stdout;
                if (stream) {
                  stream.pipe(process.stdout);
                }
              } catch (e) {}
            }
          }
        } catch (error) {
          console.error('请确保项目配置完整');
          process.exit(0);
        }
      } else if (confirm) {
        console.log();
        const { res, meta } = await getPlan();
        const len = meta.name.trim().split(' ').length;
        for await (let [index, pieceName] of meta.name
          .trim()
          .split(' ')
          .entries()) {
          await generateOnePiece(urls, res, pieceName, index, len);
          console.log();
        }
      }
    }
  };

  const maker = new fileMaker({
    context: process.cwd(),
    promptData,
    tmpTemplateSrc,
    afterHandler
  });

  console.log();
  console.log(`  正在生成页面 ${pieceName}..`);

  await maker.make();

  /* notify */
  const { name, email } = await getUser();

  const notifier = new Notifier({
    name,
    email,
    timestamp: new Date().getTime(),
    cmd: 'rt',
    args: 'add',
    type: 'template',
    module: pieceName,
    templateId: res.template.id,
    project: require(`${process.cwd()}/package.json`).name
  });

  await notifier.notify();
};

export interface IGuiOptions {
  template: number | string;
}

export async function gui(name: string, options: IGuiOptions) {
  /* 直接调用函数，生成页面 */
  const { template } = options;
  const labels = rawChoices.filter(item => {
    if (typeof template === 'string') {
      return item.value.id === parseInt(template, 10);
    } else {
      return item.value.id === template;
    }
  });
  const label = labels[0].value.label;
  const promptData = formatMate(name, label);
  const tmpTemplateSrc = `${HOME_DEST}/.mirror/template`;
  /* TODO: 用来和gui通信 */
  const afterHandler = () => {};
  const maker = new fileMaker({
    context: process.cwd(),
    promptData,
    tmpTemplateSrc,
    afterHandler
  });

  await maker.make();
}

export default async function add(options) {
  /* 判断是否在项目目录 */
  // const port = await choosePort(HOST, DEFAULT_PORT);
  const SOURCE_URL =
    'git@git.cai-inc.com:paas-front/zcy-bestPractice-front.git';
  let port;

  try {
    port = require(`${process.cwd()}/config/index.js`).dev.port || DEFAULT_PORT;
  } catch (error) {
    console.error('请确保在项目根目录执行操作，且已安装相关依赖');
    process.exit(0);
  }

  /*
    检测依赖是否安装
  */

  await checkDepsIsUsable();

  const urls = prepareUrls(protocol, HOST, port);
  const { res, meta } = await getPlan();
  const len = meta.name.trim().split(' ').length;

  for await (let [index, pieceName] of meta.name
    .trim()
    .split(' ')
    .entries()) {
    await generateOnePiece(urls, res, pieceName, index, len);
    console.log();
  }
}

const getPlan = async () => {
  const res: IRes = await new TemplateCategory().query();
  const questions: object[] = [
    {
      type: 'input',
      name: 'name',
      message: `请输入空白页面名称(首字母大写，形如：${res.template.label})`,
      validate: name => {
        if (/^[A-Z]+/.test(name)) {
          return true;
        } else {
          return '模块名称必须以大写字母开头';
        }
      }
    }
  ];
  const meta: IListMeta = await inquirer.prompt(questions);
  return { res, meta };
};

const isLastOne = (len, index) => {
  return len === index + 1;
};
