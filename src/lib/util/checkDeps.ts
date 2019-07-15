import ReadPkg from "read-pkg";
const ora = require("ora");
const spinner = ora();
import * as cp from "child_process";
import * as inquirer from "inquirer";

export const deps = ["@zcy/util-store"];

export const installDeps = async name => {};

export const checkDepsIsUsable = async () => {
  console.log("正在检查安装依赖...");
  const pkg = await ReadPkg();
  const dependencies = pkg.dependencies || {};
  const buffer = Object.keys(dependencies);
  const res = deps.map(item => {
    if (!buffer.includes(item)) {
      return item;
    }
  });

  console.log();

  if (res.toString().length) {
    const {
      action
    }: {
      action?: string | boolean;
    } = await inquirer.prompt([
      {
        name: "action",
        type: "list",
        message: `所需依赖 ${res.toString().replace(",", " ")} 未安装. 您可以:`,
        choices: [
          { name: "现在安装", value: "now" },
          { name: "稍后手动安装", value: "later" }
        ]
      }
    ]);
    if (!action) {
      return;
    } else if (action === "now") {
      console.log("正在安装..");
      console.log();

      const installStatus = cp.execSync(
        `npm install ${res.toString().replace(",", " ")}`
      );
      console.log(installStatus.toString());
    }
  }

  console.log("检查安装依赖结束");
  console.log();

  // spinner.text = "检查安装依赖结束";
  // spinner.color = "red";
  // spinner.stopAndPersist();
};
