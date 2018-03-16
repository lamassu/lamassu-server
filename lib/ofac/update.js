const parser = require('./parsing')
const https = require('https')
const url = require('url')
const fs = require('fs')
const path = require('path')
const util = require('util')
const options = require('../options')
const _ = require('lodash/fp')

const OFAC_DATA_DIR = options.ofacDataDir
const OFAC_SOURCES_DIR = path.join(OFAC_DATA_DIR, 'sources')
const OFAC_ETAGS_FILE = path.join(OFAC_DATA_DIR, 'etags.json')
const DOWNLOAD_DIR = path.resolve('/tmp')


const mkdir = util.promisify(fs.mkdir)
const readFile = util.promisify(fs.readFile)
const writeFile = util.promisify(fs.writeFile)
const rename = util.promisify(fs.rename)
const unlink = util.promisify(fs.unlink)
const remove = file => {
  console.log("remove", file)
  return unlink(file)
}


const promiseGetEtag = (source) => {
  return new Promise((resolve, reject) => {
    const {url: sourceUrl} = source
    const parsed = url.parse(sourceUrl)
    const requestOptions = {
      hostname: parsed.hostname,
      path: parsed.path,
      method: 'HEAD'
    }

    const request = https.request(requestOptions, _.flow(
      _.get(['headers', 'etag']),
      resolve
    ))

    request.on('error', reject)

    request.end()
  })
}

const download = _.curry((dstDir, source) => {
  console.log("download", source)
  const {name, url: sourceUrl} = source
  const dstFile = path.join(dstDir, name + '.xml')
  const file = fs.createWriteStream(dstFile)

  return new Promise((resolve, reject) => {
    const request = https.get(sourceUrl, response => {
      response.pipe(file);
      file.on('finish', () => file.close(() => resolve(dstFile)))
    })

    request.on('error', reject)
  })
})

const parseToJson = srcFile => {
  console.log("parseToJson", srcFile)

  const dstFile = srcFile.replace(/\.xml$/, '.json')
  const writeStream = fs.createWriteStream(dstFile)

  return new Promise((resolve, reject) => {
    parser.parse(srcFile, (err, profile) => {
      console.log("callback", err, profile)

      if (err) {
        reject(err)
        return
      }

      if (!profile) {
        writeStream.end()
        return
      }

      const json = JSON.stringify(profile)
      writeStream.write(json + '\n', 'utf-8')
    })

    writeStream.on('error', reject)
    writeStream.on('finish', () => resolve(dstFile))
  })
}

const moveToSourcesDir = srcFile => {
  console.log("moveToSourcesDir", srcFile)
  const name = path.basename(srcFile)
  const dstFile = path.join(OFAC_SOURCES_DIR, name)
  return rename(srcFile, dstFile)
}


const update = () => mkdir(OFAC_DATA_DIR).catch(err => null)
  .then(() => mkdir(OFAC_SOURCES_DIR)).catch(err => null)
  .then(() => writeFile(OFAC_ETAGS_FILE, '{}', {encoding: 'utf-8', flag: 'wx'}))
  .catch(err => null)
  .then(() => {
    const promiseOldEtags = readFile(OFAC_ETAGS_FILE, {encoding: 'utf-8'})
      .then(json => JSON.parse(json) || {})

    const promiseNewEtags = Promise.resolve(options.ofacSources || [])
      .then(sources => Promise.all(_.map(promiseGetEtag, sources))
        .then(etags => _.map(
          ([source, etag]) => ({...source, etag}),
          _.zip(sources, etags)
        ))
      )

    return Promise.all([promiseOldEtags, promiseNewEtags])
      .then(([oldEtags, newEtags]) => {
        console.log("OLD", JSON.stringify(oldEtags, null, 4))
        console.log("NEW", JSON.stringify(newEtags, null, 4))

        const hasNotChanged = ({name, etag}) => oldEtags[name] === etag

        const downloads = _.flow(
          _.reject(hasNotChanged),
          _.map(file => download(DOWNLOAD_DIR, file).then(parseToJson))
        )(newEtags)

        const oldFileNames = _.keys(oldEtags)
        const newFileNames = _.map(_.get('name'), newEtags)
        const missingFileNames = _.difference(oldFileNames, newFileNames)
        const resolve = name => path.join(OFAC_SOURCES_DIR, name + '.json')
        const missing = _.map(resolve, missingFileNames)

        const etagsJson = _.flow(
          _.map(source => [source.name, source.etag]),
          _.fromPairs,
          obj => JSON.stringify(obj, null, 4)
        )(newEtags)

        return Promise.all(downloads)
        .then(parsed => {
          console.log("finished", parsed)

          const moves = _.map(moveToSourcesDir, parsed)
          const deletions = _.map(remove, missing)
          const updateEtags = writeFile(OFAC_ETAGS_FILE, etagsJson)

          return Promise.all([updateEtags, ...moves, ...deletions])
        })
      })
  })

module.exports = {update}
