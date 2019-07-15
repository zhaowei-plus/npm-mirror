import * as execa from "execa";
import * as inquirer from "inquirer";

export const updater = async (ver: string) => {
  let versions!: string;
  try {
    versions = await execa.stdout("npm", [
      "view",
      "@zoo/rt",
      "versions",
      "--json"
    ]);
  } catch (e) {}
  const raw = versions.trim();

  const LSV = (
    raw
      .slice(1, raw.length - 1)
      .split(",")
      .pop() || ""
  )
    .replace(/\"/g, "")
    .trim();

  if (ver === LSV) {
    return false;
  } else {
    console.log("您使用的并不是最新版本，一些新特性可能无法使用");
    const {
      action
    }: {
      action?: string | boolean;
    } = await inquirer.prompt([
      {
        name: "action",
        type: "list",
        message: `您希望`,
        choices: [
          { name: "马上更新", value: true },
          { name: "爱咋咋地", value: false }
        ]
      }
    ]);
    if (!action) {
      return;
    } else {
      /* 开始更新 */
      try {
        console.log("重新执行 npm install -g @zoo/rt 安装");
        /* TODO: */
        // await execa.stdout("npm", ["install", "-g", "@zoo/rt"]);
      } catch (error) {
        process.exit(1);
      }

      // console.info("更新完毕，可以开始使用");
    }
  }
};
