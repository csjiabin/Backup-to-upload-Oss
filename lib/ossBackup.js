#!/usr/bin/env node
'use strict'
const log = console.log
const chalk = require('chalk')
const inquirer = require('inquirer')
const path = require('path')
const os = require('os')
const co = require('co')
const fs = require('fs')
const request = require('request')
const moment = require('moment')
const mkdirsSync = require('./mkdirsSync')
const desktop = path.resolve(os.homedir(), 'Desktop')
const isFile = (_path) => !!fs.existsSync(_path)
const ora = require('ora')
module.exports = async (useBucket, fileList = [], client) => {
  let promps = []
  try {
    let txtList = fileList.filter(file => {
      if (file.name.includes('.txt')) {
        return {
          name: file.name,
          value: file.name
        }
      }
    })
    let apkList = fileList.filter(file => {
      if (file.name.includes('.apk')) {
        return {
          name: file.name,
          value: file.name
        }
      }
    })
    if (apkList.length > 0) {
      promps.push({
        type: 'list',
        name: 'ossFileApk',
        message: 'ossFileApk:',
        choices: apkList
      })
    } else {
      promps.push({
        type: 'input',
        name: 'ossFileApk',
        message: 'ossFileApk:',
        default: 'app.apk',
        validate: input => {
          if (!input) {
            log(chalk.red('apk不能为空'))
            return false
          }
          return true
        }
      })
    }
    if (txtList.length > 0) {
      promps.push({
        type: 'list',
        name: 'ossFileVersion',
        message: 'ossFileVersion:',
        choices: txtList
      })
    } else {
      promps.push({
        type: 'input',
        name: 'ossFileVersion',
        message: 'ossFileVersion:',
        default: 'version.txt',
        validate: input => {
          if (!input) {
            log(chalk.red('version不能为空'))
            return false
          }
          return true
        }
      })
    }

    const answers = await inquirer.prompt(promps)
    const {ossFileApk, ossFileVersion} = answers
    let version = {VersionName: '0.0.0'}
    let resultVersion = await new Promise((resolve, reject) => {
      request(`https://${useBucket}.oss-cn-shanghai.aliyuncs.com/${ossFileVersion}`, (err, res, body) => {
        if (err) {
          reject(err)
          return false
        }
        if (res.statusCode === 404) {
          resolve({
            status: res.statusCode, body: null
          })
          return false
        }
        resolve({
          status: res.statusCode, body: JSON.parse(body)
        })
      })
    })
    version = resultVersion.body || { VersionName: '0.0.0', time: moment().format('YYYY-MM-DD')
    }
    version.url = `https://${useBucket}.oss-cn-shanghai.aliyuncs.com/${ossFileApk}`
    let VersionArr = ossFileVersion.split('/')
    let ApkArr = ossFileApk.split('/')
    let appPath = path.resolve(desktop, `apk/${useBucket}/${ApkArr[ApkArr.length - 1]}-v${version.VersionName}-(${version.time})`)
    if (!isFile(appPath)) {
      await mkdirsSync(appPath)
    }
    const spinner = ora(chalk.green('文件备份...'))
    spinner.start()
    if (txtList.length > 0) {
      await co(function * () {
        let txtWs = fs.createWriteStream(path.resolve(appPath, VersionArr[VersionArr.length - 1]))
        let result = yield client.get(answers.ossFileVersion)
        txtWs.write(result.content)
      })
    }
    if (apkList.length > 0) {
      await co(function * () {
        let apkWs = fs.createWriteStream(path.resolve(appPath, ApkArr[ApkArr.length - 1]))
        let result = yield client.get(answers.ossFileApk)
        apkWs.write(result.content)
      })
    }
    spinner.stop()
    spinner.succeed(chalk.green('文件备份结束！\n', path.resolve(appPath)))
    return {version, file: answers}
  } catch (error) {
    throw error
  }
}
