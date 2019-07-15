const fs = require('fs')
const { promisify } = require('util')
const prettier = require("prettier");
const writeFile = promisify(fs.writeFile)



class Base {
  constructor() {

  }

  append(source: string, other: string): string {
    return String.prototype.concat.call(source, other);
  }

  async writeToFile(str: string, file: string) {
    // async write to file
    try {
      const options = {
        semi: false,
        parser: 'babel',
        bracketSpacing: true
      }
      const formated = await this.format(str, options)
      await writeFile(file, formated)
    } catch (e) {
      if (e) {
        // ignore
        console.error(e)
      }
    }
  }
  async format(str: string, options: object) {
    try {
      return prettier.format(str, options)
    } catch (e) {
      console.error(e)
    }
    // format the source file using prettier-eslint
  }
}

export {
  Base
}
