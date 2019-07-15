import fs from 'fs';
import home from "user-home";
import path from 'path';
import read_pkg from 'read-pkg';

export default class File {
  /**
   * 检测路径／文件是否存在
   *
   * @param {string} path 绝对路径
   * @returns {boolean}
   */
  static fileExist(path: string): boolean {
    try {
      fs.accessSync(path, fs.constants.F_OK);
    } catch (e) {
      return false;
    }
    return true;
  }


  /**
   * 返回组合的全路径
   *
   * @param {string} dir
   * @returns {string} 
   * 
   */
  static resolve(dir: string): string {
    return path.join(process.cwd(), dir);
  }



  /**
   * 检测是否在项目根目录
   *
   * @returns {Promise}
   */
  static async isRoot<Promise>(): Promise {
    try {
      await read_pkg({ cwd: `${process.cwd()}` });
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * 获取当前路径
   *
   * @returns {Promise}
   */
  static currentPath(): string {
    return process.cwd();
  }
}