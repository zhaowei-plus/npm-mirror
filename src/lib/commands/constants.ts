export const choices = [
  {
    name: "简单列表(覆盖中台40%列表页面)",
    value: {
      id: 0,
      label: "BasicList",
      type: "list"
    }
  },
  {
    name: "复杂列表(覆盖中台60%列表页面)",
    value: {
      id: 1,
      label: "ComplexList",
      type: "list"
    }
  },
  {
    name: "详情",
    value: {
      id: 2,
      label: "BasicDetail",
      type: "detail/1"
    }
  },
  {
    name: "简单列表+详情",
    value: {
      id: 3,
      label: "BasicComb",
      type: "list"
    }
  },

  {
    name: "复杂列表+详情",
    value: {
      id: 4,
      label: "ComplexComb",
      type: "list"
    }
  }
];

export const questions = [
  {
    type: "input",
    name: "name",
    message: "请输入空白页面名称(首字母大写，形如：BasicList)",
    validate: name => {
      if (/^[A-Z]+/.test(name)) {
        return true;
      } else {
        return "模块名称必须以大写字母开头";
      }
    }
  }
];
