#!/usr/bin/env node
'use strict'
const program = require('commander')
const appInfo = require('../package.json')
const _class = require('../lib/class')
program
  .version(appInfo.version)
  .usage(`<command>
       __   __   ______     ______     ______     __         __       
      /\\ \\ / /  /\\  ___\\   /\\  == \\   /\\  ___\\   /\\ \\       /\\ \\     
      \\ \\ \\'/   \\ \\  __\\   \\ \\  __<   \\ \\ \\____  \\ \\ \\____  \\ \\ \\  
       \\ \\__|    \\ \\_____\\  \\ \\_\\ \\_\\  \\ \\_____\\  \\ \\_____\\  \\ \\_\\
        \\/_/      \\/_____/   \\/_/ /_/   \\/_____/   \\/_____/   \\/_/ 
  `)
  .parse(process.argv)

program
  .command('app [cmd]')
  .alias('a')
  .description('app配置')
  .option('-y, --fast', '默认')
  .action((cmd, option) => {
    _class(cmd, option)
  })

if (!process.argv[2]) {
  program.help()
}

program.parse(process.argv)
