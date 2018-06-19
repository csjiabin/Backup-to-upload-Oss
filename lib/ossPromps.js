#!/usr/bin/env node
'use strict'
const inquirer = require('inquirer')
module.exports = async () => {
  let promps = [
    {
      type: 'list',
      name: 'useBucket',
      message: 'useBucket:',
      choices: [
        {
          name: 'name0',
          value: 'value0'
        },
        {
          name: 'name1',
          value: 'value1'
        }
      ]
    }
  ]
  let answers = await inquirer.prompt(promps)
  return answers
}
