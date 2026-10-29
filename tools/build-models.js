#!/usr/bin/env node
// Builds data/models.json from the model folders.
//
//   node tools/build-models.js        (run from the repo root)
//
// Scans static/Korean and static/Global for
// folders that contain MOC.<id>.json, and merges in names from data/names.json.
// Rerun it whenever you add or remove model folders.
//
// Output format (compact, one array per model):
//   [id, name, outfit, category, regions]
//   regions: "kg" = Korean + Global, "k" = Korean only, "g" = Global only

const fs = require('fs')
const path = require('path')

const SITE = path.join(__dirname, '..')
// works both when the site is at the repo root and when it's in a subfolder
const MODELS_ROOT = fs.existsSync(path.join(SITE, 'static'))
  ? path.join(SITE, 'static')
  : path.join(SITE, '..', 'static')
const REGIONS = { k: 'Korean', g: 'Global' }

// ID prefix -> category shown in the sidebar filters
const CATEGORIES = [
  ['sc', 'spa'], ['sm', 'spa'],
  ['xc', 'puppet'], ['xm', 'monster'],
  ['ig', 'carta'],
  ['c', 'child'], ['m', 'monster'], ['v', 'cutscene']
]

function categoryOf(id) {
  const hit = CATEGORIES.find(([prefix]) => id.startsWith(prefix) && /\d/.test(id[prefix.length]))
  return hit ? hit[1] : 'other'
}

function scanRegion(dirName) {
  const dir = path.join(MODELS_ROOT, dirName)
  if (!fs.existsSync(dir)) {
    console.warn('Missing folder: ' + dir)
    return new Set()
  }
  const ids = fs.readdirSync(dir, { withFileTypes: true })
    .filter(d => d.isDirectory() && fs.existsSync(path.join(dir, d.name, 'MOC.' + d.name + '.json')))
    .map(d => d.name)
  return new Set(ids)
}

const names = JSON.parse(fs.readFileSync(path.join(SITE, 'data', 'names.json'), 'utf8'))
const found = {}
for (const [key, dirName] of Object.entries(REGIONS)) found[key] = scanRegion(dirName)

const allIds = [...new Set([...found.k, ...found.g])].sort((a, b) => {
  // group by prefix, then number
  const pa = a.match(/^[a-z]+/)[0], pb = b.match(/^[a-z]+/)[0]
  return pa === pb ? a.localeCompare(b) : pa.localeCompare(pb)
})

const models = allIds.map(id => {
  const [base, variant] = id.split('_')
  const entry = names[base]
  const name = entry && entry.name ? entry.name.trim() : ''
  const outfit = entry && entry.variants && entry.variants[variant] ? (entry.variants[variant].title || '').trim() : ''
  const regions = (found.k.has(id) ? 'k' : '') + (found.g.has(id) ? 'g' : '')
  return [id, name === '???' ? '' : name, outfit, categoryOf(id), regions]
})

fs.writeFileSync(path.join(SITE, 'data', 'models.json'), JSON.stringify(models))
const counts = models.reduce((acc, m) => { acc[m[3]] = (acc[m[3]] || 0) + 1; return acc }, {})
console.log('Wrote ' + models.length + ' models to data/models.json', counts)
