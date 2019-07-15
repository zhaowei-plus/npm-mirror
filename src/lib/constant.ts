import HOME from 'user-home';

export const REMOTE_HOST = "https://weekly.zoo.team:3030";

// 模板配置目录和文件名
export const PROJECT_PATH = `${HOME}/.mirror`;
export const INI_PATH = HOME;
export const INI_FILE = '.mirror-config.ini';

// github 模板库地址 branch，默认发布分支：master
export const GITHUB_REMOTE = 'git@git.cai-inc.com:paas-front/zcy-bestPractice-front.git';
export const GITHUB_BRANCH = 'release/best';


// 默认将模板下载的 src/routes 目录
export const TEMPLATE_TARGET_DIR = 'src/routes';
export const TEMPLATE_SOURCE_DIR = 'template'; // 模版／mock数据源目录
export const TEMPLATE_TARGET_MOCK_DIR = 'mockData';
export const TEMPLATE_CONFIG_FILE = 'template-config.js';
export const TEMPLATE_CATEGORY_FILE = 'template-category.js';

// github 配置项
export const GITHUB_CONFIG = {
  remote: GITHUB_REMOTE,
  branch: GITHUB_BRANCH,
};

// 本地默认配置项
export const LOCAL_CONFIG = {
  enable: false, // 默认不启用本地配置
  path: `${PROJECT_PATH}/${TEMPLATE_SOURCE_DIR}`,
  file: TEMPLATE_CONFIG_FILE,
};

// 模板分类
export const TEMPLATE_CATEGORY = {
  // 标准模板库中的模板
  'LIST': '列表模板', // 列表：简单列表、复杂列表
  'DETAIL': '详情模板', // 详情：简单详情、复杂详情
  'FORM': '表单模板', // 表单：简单表单、复杂表单
  'COMB': '组合模板', // 组合：简单列表+简单详情+简单表单，复杂列表+复杂详情+复杂表单

  // 其他业务组的模板
  // 'OTHER': '其他', // 其他：其他组开发的模板
};

// 区块配置
export const BLOCK_PATH = 'blocks';
export const BLOCK_CONFIG_FILE = 'blocks-config.js';
export const BLOCK_CATEGORY_FILE = 'blocks-category.js';

// 区块组合页面模板框架
export const TEMPLATE_BLOCK_FILE = 'template.js';

// 区块分类
export const BLOCK_CATEGORY = {
  'LIST': '列表', // 列表区块
  'DETAIL': '详情', // 详情区块
  'FORM': '表单', // 表单区块
  'COMB': '组合', // 组合区块
  'OTHER': '其他', // 其他区块
};