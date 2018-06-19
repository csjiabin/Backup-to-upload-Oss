const path = require('path')
const fs = require('fs')
// 递归创建目录
async function mkdirsSync (dirname) {
  // console.log(dirname);
  if (fs.existsSync(dirname)) {
    return true
  } else {
    if (mkdirsSync(path.dirname(dirname))) {
      await fs.mkdirSync(dirname)
      return true
    }
  }
}
module.exports = mkdirsSync
