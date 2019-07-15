// Ini配置文件结点数据
export interface IIniConfigNode {
  section: string,
  info: object,
};

// Github 配置信息
export interface IGithubConfig {
  remote: string,
  branch: string,
};

// 本地配置信息
export interface ILocalConfig {
  enable: boolean,
  path: string,
  file: string,
};

// Ini 配置文件信息
export interface IIniConfig {
  github: IGithubConfig,
  local: ILocalConfig,
}
/************************************* 模板 ********************************************/
// 本地模板默认配置
export interface IConfig {
  path: string;
  file: string;
};

// 模板信息接口
export interface ITemplate {
  name: string, // 模板名称
  id: string,  // 模板ID
  remote: string, // 模板地址
}

// 模板选择接口
export interface IChoice {
  template: ITemplate,
}

export interface IModel {
  name: string,
}

// 模板描述项
export interface ITemplate {
  name: string, // 模块名
  title: string, // 模板名称
  path: string, // 模板存储目录
  description: string,// 模板描述 
  homePage: string, // 页面url
  categories: string[], // 模板分类配置
  screenshots: string[], // 模板截图地址
};

/************************************* 区块 ********************************************/
// 区块信息描述
export interface IBlock {
  id: number,
  name: string,
  title: string,
  description: string,
  screenshots: string,
};

// 区块配置
export interface IBlockConfig {
  id: number, // 区块id
  name: string, // 区块重命名
};

// 生成页面信息
export interface IPage {
  name: string, // 生成页面名称
  blocks: IBlockConfig[]; // 区块组合列表
}