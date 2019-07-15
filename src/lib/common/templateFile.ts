import fs from 'fs';
import through2 from 'through2';
/**
 * 转换模版文件为 ejs 引擎模版
 *
 * @param {string} modelName 模块名
 * @param {string} originPath 待转换文件源目录
 * @param {string} targetPath 目标目录
 * @param {string} file 文件名
 * @param {array} regConfig 转换规则
 * */
export function translateFile(modelName, originPath, targetPath, file, regConfig = []) {
  // 获取文件后缀
  const suffix = file.substr(file.lastIndexOf(".") + 1);
  return new Promise(function (resolve, reject) {
    if (!fs.existsSync(targetPath)) {
      fs.mkdirSync(targetPath, {
        recursive: true,
      });
    }

    const readStream = fs.createReadStream(`${originPath}/${file}`, {
      flags: 'r',
      encoding: 'utf8',
    });

    readStream.on('error', function (err) {
      console.error(`模块 ${modelName} 文件 ${file} 读取错误，路径：${originPath}/${file}, error:`, err);
      reject(modelName);
    });

    let writeStream = fs.createWriteStream(`${targetPath}/${file}`);
    writeStream.on('error', function (err) {
      console.error(`模块 ${modelName} 文件 ${file} 写入错误，路径：${targetPath}/${file}, error:`, err);
      reject(modelName);
    });

    readStream
      .on('end', function (err) {
        writeStream.end();
      })
      .pipe(through2(function (chunk) {
        let data = chunk.toString('utf8');
        // 只转换 js 文件
        if (suffix === 'js' || suffix === 'jsx') {
          regConfig.forEach(({ reg, target }) => {
            data = data.replace(new RegExp(reg, 'g'), target);
          });
        }
        this.push(data);
      }))
      .pipe(writeStream)
      .on('finish', () => {
        resolve('success');
      });
  });
}

export function test() {
  console.log('test');
}