const path = require('path')

const TARGET = path.join(process.cwd(), '/test', 'config.js')

class Generator {
  private moduleName: string;
  private content: object;

  constructor(moduleName: string) {
    this.moduleName = moduleName;
    this.content = require(TARGET)

  }
  _getMetaData(filePath: string) {
    
  }
  async init() {
  }
}

export {
  Generator
}
