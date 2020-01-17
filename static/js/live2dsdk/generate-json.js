#!/usr/bin/env node

const fs = require('fs')

const data = fs.readdirSync('assets').reduce((acc, dir) => {
  const data = {id: dir}
  if(fs.existsSync(`./static/json/${dir}/asset.json`)) {
    var asset = require(`./static/json/${dir}/asset.json`)
    Object.assign(data, asset)
  }
  acc.push(data)
  return acc
}, [])

fs.writeFileSync('./assets.json', JSON.stringify(data))
