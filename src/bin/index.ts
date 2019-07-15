#!/usr/bin/env node

var program = require('commander');
var path = require('path');
var chalk = require('chalk');
const { Generator } = require('../lib/Generator');
const pkg = require(path.resolve(__dirname, '../../package.json'));
import template, { gui, IGuiOptions } from '../lib/commands/add';
import blank from '../lib/commands/blank';
import { updater } from '../lib/util/autoUpdater';

program.version(pkg.version, '-v, --version');

import TemplateConfiger from '../lib/models/TemplateConfiger';
import TemplateTransform from '../lib/models/TemplateTransform';
import TemplateBlocks from '../lib/models/TemplateBlocks';

import { IPage } from '../lib/interfaces/template';

/* node v10++ 支持异步回调的shim */
if (!Symbol.asyncIterator) {
  (<any>Symbol).asyncIterator =
    Symbol.asyncIterator || Symbol.for("Symbol.asyncIterator");
}

/*
  add 命令： 添加页面
*/
program
  .command('add')
  .alias('a')
  .option('-t --template <presetName>', '选择模板')
  .description('新增模板,使用大驼峰命名')
  .action(async (name, cmd) => {
    if (process.argv.length > 3) {
      /* 专为GUI使用，兼容使用参数 */
      const options = cleanArgs(cmd) as IGuiOptions;
      gui(name, options);
    } else {
      /* 单独命令使用 */
      template(name);
    }
  });

/* blank 命令：添加空白模板 */
program
  .command('blank')
  .description('新增空白模板')
  .action(async (entry: string) => {
    if (process.argv.length > 3) {
      console.info('八戒你又调皮了，说好的没有参数呢');
      process.exit();
    }
    blank();
  });

/* test 命令：用于本地开发调试 */
program
  .command('test')
  .alias('t')
  .option('-t, --tran', '转换本地模板为ejs模板')
  .option('-l, --local', '配置使用本地模板，选择本地模板路径，执行开发任务')
  .option('-o, --online', '配置使用在线模板，选择模板分支，执行开发任务')
  .option('-m, --mode', '查看当前模板使用模式')
  .description('转换或配置模板信息，用于调试和执行开发任务')
  .action(async option => {
    const {
      tran = false,
      local = false,
      online = false,
      mode = false
    } = option;
    if (tran) {
      new TemplateTransform().tran();
    } else if (local) {
      new TemplateConfiger().enableLocal();
    } else if (online) {
      new TemplateConfiger().enableOnline();
    } else if (mode) {
      new TemplateConfiger().mode();
    } else {
      console.log('请输入正确的命令选项');
    }
  });

/* block 命令：用于组合区块 */
program
  .command('block')
  .alias('b')
  .option('-b, --build', '合并本地区块配置信息，生成配置信息')
  .description('合并或初始化生成模板页面，用于组合区块执行开发任务')
  .action(async (option) => {
    const { build = false } = option;
    if (build) {
      new TemplateBlocks().build();
    } else if (process.argv.length >= 4) {
      const name = process.argv[3];
      let blocks = [];
      try {
        blocks = JSON.parse(process.argv[4]);
      } catch (err) {
        console.log('区块信息错误，请检查参数配置！');
        return false;
      }
      const page: IPage = {
        name,
        blocks,
      };
      new TemplateBlocks().init(page);
    }
  });

// 不支持命令默认回调
program.arguments('<command>').action((cmd: string) => {
  console.log(`  ` + chalk.red(`不支持该命令 ${chalk.yellow(cmd)}.`));
  program.outputHelp();
});

// 输出帮助信息
program.on('--help', () => {
  console.log();
  console.log(`  运行 ${chalk.cyan(`rt <command> --help`)} 查看详细信息.`);
  console.log();
});

//输出单条命令帮助信息
program.commands.forEach(c => c.on('--help', () => console.log()));

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  /**
   * V20190612 取消版本更新提醒
   */
  // updater(pkg.version);
  program.outputHelp();
}

process.on('unhandledRejection', err => {
  console.error(err);
});

// commander passes the Command object itself as options,
// extract only actual options into a fresh object.
function cleanArgs(cmd) {
  const args = {};
  cmd.options.forEach(o => {
    const key = o.long.replace(/^--/, '');
    // if an option is not present and Command has a method with the same name
    // it should not be copied
    if (typeof cmd[key] !== 'function' && typeof cmd[key] !== 'undefined') {
      args[key] = cmd[key];
    }
  });
  return args;
}
