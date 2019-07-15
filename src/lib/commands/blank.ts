import home from "user-home";
import * as _ from "lodash";
import * as inquirer from "inquirer";
import chalk from "chalk";
import * as path from "path";
import * as fs from "fs-extra";
import detect from "detect-port";
import fileMaker from "../FileMaker";
import Notifier from "../Notifier";
import { choices, questions } from "./constants";
import { IListMeta, IRes } from "../interfaces/list";
import { choosePort, prepareUrls } from "react-dev-utils/WebpackDevServerUtils";
import clone from "../util/download";
import getUser from "../util/getUser";
import { checkDepsIsUsable } from "../util/checkDeps";
import execa from "execa";
const ora = require("ora");

import { PROJECT_PATH, GITHUB_REMOTE, GITHUB_BRANCH, TEMPLATE_SOURCE_DIR } from '../constant';

const spinner = ora();

const HOME_DEST = home;
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

const generateOnePiece = async (urls, res, pieceName: string, index, len) => {
  /*  检测是否存在同名目录，处理冲突 */

  const targetDir = path.resolve(process.cwd(), "src/routes", pieceName || ".");

  if (fs.existsSync(targetDir)) {
    const {
      action
    }: {
      action?: string | boolean;
    } = await inquirer.prompt([
      {
        name: "action",
        type: "list",
        message: `页面 ${chalk.cyan(pieceName)} 已经存在. 您可以:`,
        choices: [
          { name: "合并", value: "merge" },
          { name: "覆盖", value: "overwrite" },
          { name: "我再想想", value: false }
        ]
      }
    ]);
    if (!action) {
      return;
    } else if (action === "overwrite") {
      console.log();
      console.log(`  \移除 ${chalk.cyan(pieceName)}...`);
      await fs.remove(targetDir);
    }
  }

  const promptData = formatMate(pieceName, res.template.label);

  const tmpTemplateSrc = path.resolve(
    PROJECT_PATH,
    TEMPLATE_SOURCE_DIR,
  );

  const afterHandler = async () => {
    console.log();
    console.info(`  页面 ${pieceName} 创建成功，访问地址：`);
    if (urls.lanUrlForTerminal) {
      console.log(
        `  ${chalk.bold("Local:")}            ${urls.localUrlForTerminal}#/${promptData.url}`
      );
      console.log(
        `  ${chalk.bold("On Your Network:")}  ${urls.localUrlForTerminal}#/${promptData.url}`
      );
    } else {
      console.log(`  ${urls.localUrlForTerminal}#/${promptData.url}`);
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
          name: "confirm",
          type: "confirm",
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
            console.log("项目已启动");
            return;
          } else {
            const { start }: { start: boolean } = await inquirer.prompt([
              {
                name: "start",
                type: "confirm",
                message: "项目未启动，是否启动项目",
                default: true
              }
            ]);
            if (!start) {
              /* 不启动 */
              return;
            } else {
              /* 启动项目 */
              try {
                const stream = execa("npm", ["run", "dev"]).stdout;
                if (stream) {
                  stream.pipe(process.stdout);
                }
              } catch (e) { }
            }
          }
        } catch (error) {
          console.error("请确保项目配置完整");
          process.exit(0);
        }
      } else if (confirm) {
        console.log();
        const { res, meta } = await getPlan(choices, questions);
        const len = meta.name.trim().split(" ").length;
        for await (let [index, pieceName] of meta.name
          .trim()
          .split(" ")
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
    cmd: "rt",
    args: "add",
    type: "template",
    module: pieceName,
    templateId: res.template.id,
    project: require(`${process.cwd()}/package.json`).name
  });

  await notifier.notify();
};

export default async function blank() {
  /* 判断是否在项目目录 */
  // const port = await choosePort(HOST, DEFAULT_PORT);
  let port;

  try {
    port = require(`${process.cwd()}/config/index.js`).dev.port || DEFAULT_PORT;
  } catch (error) {
    console.error("请确保在项目根目录执行操作，且已安装相关依赖");
    process.exit(0);
  }

  /*
    检测依赖是否安装
  */
  await checkDepsIsUsable();

  await clone(`direct:${GITHUB_REMOTE}#${GITHUB_BRANCH}`, PROJECT_PATH, {
    clone: true
  });

  const urls = prepareUrls(protocol, HOST, port);
  const { res, meta } = await getPlan(choices, questions);
  const len = meta.name.trim().split(" ").length;
  for await (let [index, pieceName] of meta.name
    .trim()
    .split(" ")
    .entries()) {
    await generateOnePiece(urls, res, pieceName, index, len);
    console.log();
  }
}

const getPlan = async (choices, questions) => {
  const res = {
    template: { id: 5, label: "BasicTemplate", type: "basic-template" }
  };
  const meta: IListMeta = await inquirer.prompt(questions);
  return { res, meta };
};

const isLastOne = (len, index) => {
  return len === index + 1;
};
