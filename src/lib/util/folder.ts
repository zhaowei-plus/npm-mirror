var fs = require('fs'); 
var path = require('path');
var exec = require('child_process').exec;
var chalk = require('chalk') 

function deleteAll(path) {
  var files = [];
  if (fs.existsSync(path)) {
    files = fs.readdirSync(path);
    files.forEach(function (file, index) {
      var curPath = path + "/" + file;
      if (fs.statSync(curPath).isDirectory()) { 
        deleteAll(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
}

 function mkdir(dirPath, dirname?) {
   if (typeof dirname === "undefined") {
     if (fs.existsSync(dirPath)) {
       return;
     } else {
       mkdir(dirPath, path.dirname(dirPath));
     }
   } else {
     if (dirname !== path.dirname(dirPath)) {
       mkdir(dirPath);
       return;
     }
     if (fs.existsSync(dirname)) {
       fs.mkdirSync(dirPath)
     } else {
       mkdir(dirname, path.dirname(dirname));
       fs.mkdirSync(dirPath);
     }
   }
 }


function copyDir(template, page, dist) {
  const modelName = path.resolve(template, 'models/index.js')
  const indexName = path.resolve(template, 'index.js')
  const urls = require(indexName)
  const fd = fs.readFileSync(modelName)
  const target = path.resolve(dist, page)
  const splitedPageNameArr = page.match(/[A-Z][a-z]*/g).map((item) => item.toLowerCase())

  urls.push({
    url: `/${splitedPageNameArr.join('-')}`
  })

  const bufferedContent = fd.
    toString().
    replace(
    "namespace: ''",
    `namespace: "${page.toLowerCase()}"`
    )

  exec(
    `cp -r ${template} ${target}`,
    (err, stdout, stderr) => {
      if (err) {
        console.log(chalk.red(err))
      }
      fs.writeFileSync(`${target}/models/index.js`, bufferedContent, 'utf-8')
      fs.writeFileSync(`${target}/index.js`, `module.exports=${JSON.stringify(urls, null, 2)}`, 'utf-8')
      console.log(chalk.green('the file structure is prepared.'))
    }
  );
}

module.exports = {
  deleteAll,
  mkdir,
  copyDir
}