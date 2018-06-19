const inquirer = require('inquirer')
const path = require('path')
const fs = require('fs')
const chalk = require('chalk')
const log = console.log
const co = require('co')
const ora = require('ora')
module.exports = async (useBucket, client, backupFile) => {
  const apkFiles = fs.readdirSync(process.cwd()).filter(file => {
    if (path.extname(file) === '.apk') {
      return {
        name: file,
        value: file
      }
    }
  })
  // const txtFiles = fs.readdirSync(process.cwd()).filter(file => {
  //   if (path.extname(file) === '.txt') {
  //     return {
  //       name: file,
  //       value: file
  //     }
  //   }
  // })

  let promps = [
    {
      type: 'input',
      name: 'uploadPath',
      message: 'uploadPath:',
      default: '/',
      validate: input => {
        if (!input) {
          log(chalk.red('上传指定文件夹不能为空'))
          return false
        }
        return true
      }
    }
  ]
  if (apkFiles.length > 0) {
    promps.push({
      type: 'list',
      name: 'localApkFile',
      message: 'localApkFile:',
      choices: apkFiles
    })
  } else {
    promps.push({
      type: 'input',
      name: 'localApkFile',
      message: 'localApkFile:',
      validate: input => {
        if (!input) {
          log(chalk.red('apk不能为空'))
          return false
        }
        return true
      }
    })
  }
  promps.push({
    type: 'confirm',
    name: 'isUpload',
    message: '是否上传:',
    default: true
  })
  let answers = await inquirer.prompt(promps)
  let {isUpload, localApkFile, uploadPath} = answers
  if (!isUpload) return log(chalk.yellow('取消上传！'))
  if (apkFiles.length > 0) {
    let apkFile = path.resolve(process.cwd(), localApkFile)
    await uploadApk(apkFile)
  } else {
    uploadApk(localApkFile)
  }
  await uploadVersion()
  process.on('exit', () => {
    console.log()
  })
  async function uploadApk (file) {
    await co(function * () {
      let checkpoint
      const resolvepath = path.basename(file, '.apk')
      let multPath = `/${resolvepath}.apk`
      if (uploadPath.length !== 1) {
        multPath = uploadPath + multPath
      }
      const spinnerApk = ora(chalk.green(multPath, '正在上传...\n'))
      spinnerApk.start()
      // 断点上传
      for (let i = 0; i < 50; i++) {
        yield client.multipartUpload(multPath, file, {
          checkpoint: checkpoint,
          progress: function * (percentage, cpt) { checkpoint = cpt }
        })
        spinnerApk.stop()
        spinnerApk.succeed(chalk.green(multPath, '上传成功\n'))
        break // break if success
      }
    })
  }
  async function uploadVersion () {
    await co(function * () {
      let checkpoint
      let VersionArr = backupFile.ossFileVersion.split('/')
      let multPath = `/${VersionArr[VersionArr.length - 1]}`
      if (uploadPath.length !== 1) {
        multPath = uploadPath + multPath
      }
      const spinnerVersion = ora(chalk.green(multPath, '正在上传...\n'))
      spinnerVersion.start()
      // 断点上传
      for (let i = 0; i < 50; i++) {
        yield client.multipartUpload(multPath, path.resolve(__dirname, 'version.txt'), {
          checkpoint: checkpoint,
          progress: function * (percentage, cpt) { checkpoint = cpt }
        })
        spinnerVersion.stop()
        spinnerVersion.succeed(chalk.green(multPath, '上传成功'))
        break // break if success
      }
    })
  }
}
