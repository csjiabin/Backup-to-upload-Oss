#!/usr/bin/env node
'use strict'
const log = console.log
// const program = require('commander')
const inquirer = require('inquirer')
const chalk = require('chalk')
const path = require('path')
const fs = require('fs')
const co = require('co')
const OSS = require('ali-oss')
const moment = require('moment')
const ossPromps = require('./ossPromps')
const ossDownload = require('./ossBackup')
const ossUpload = require('./ossUpload')

// 配置OSS参数
const client = new OSS({
  accessKeyId: '*************',
  accessKeySecret: '************',
  region: '********'
})

module.exports = async (cmd, option) => {
  let ossAnswers = await ossPromps()
  let { useBucket } = ossAnswers

  co(function * () {
    client.useBucket(useBucket)
    let list = yield client.list({marker: ''})
    return list.objects
  }).then(async fileList => {
    const {version, file} = await ossDownload(useBucket, fileList, client)
    if (version) {
      await editFile(useBucket, version, file)
    }
  })
}
async function editFile (useBucket, version, backupFile) {
  try {
    let params = Object.assign({}, version)
    let promps = [
      {
        type: 'input',
        name: 'VersionName',
        message: 'VersionName:',
        default: params.VersionName
      }, {
        type: 'confirm',
        name: 'mandatory',
        message: 'mandatory',
        default: false
      }
    ]

    let answers = await inquirer.prompt(promps)
    params.VersionName = answers.VersionName
    params.mandatory = answers.mandatory
    params.time = moment().format('YYYY-MM-DD')
    let ws = fs.createWriteStream(path.resolve(__dirname, 'version.txt'))
    // eslint-disable-next-line
  let buffer = new Buffer(JSON.stringify(params))
    ws.write(buffer, 'utf8', async function (err, buffer) {
      if (!err) log(chalk.green('version写入成功 ', path.resolve(__dirname, 'version.txt')))
      await ossUpload(useBucket, client, backupFile)
    })
  } catch (error) {
    throw error
  }
}
