import fs from 'fs';
import ini from 'ini';

import File from './File';

import { IIniConfig } from '../interfaces/template';

import { INI_PATH, INI_FILE, GITHUB_CONFIG, LOCAL_CONFIG } from '../constant';

export default class Ini {
  private file: string;
  private path: string;

  constructor(_path = INI_PATH, _file = INI_FILE) {
    this.file = _file;
    this.path = _path;

    this.init();
  }

  //初始化配置
  init() {
    if (!File.fileExist(`${this.path}/${this.file}`)) {
      this.setConfig({
        local: LOCAL_CONFIG,
        github: GITHUB_CONFIG,
      });
    }
  }

  // 保存配置信息
  setConfig(_config: object) {
    const filePath = `${this.path}/${this.file}`;
    try {
      fs.writeFileSync(filePath, ini.stringify(_config));
    } catch (err) {
      console.error(`write ${filePath} info err:`, err);
    }
  }

  // 获取配置文件
  getConfig(): IIniConfig {
    const filePath = `${this.path}/${this.file}`;
    let iniConfig = <IIniConfig>{};
    try {
      iniConfig = ini.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (err) {
      console.error(`write ${filePath} info err:`, err);
    } finally {
      return iniConfig;
    }
  }
}