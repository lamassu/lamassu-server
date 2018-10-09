const parser = require('./parsing')
const https = require('https')
const url = require('url')
const fs = require('fs')
const path = require('path')
const util = require('util')
const options = require('../options')
const _ = require('lodash/fp')
const logger = require('../logger')

const DOWNLOAD_DIR = path.resolve('/tmp')

function mkdir (path) {
  return new Promise((resolve, reject) => {
    fs.mkdir(path, err => {
      if (!err) return resolve()
      if (err.code === 'EEXIST') return resolve()
      reject(err)
    })
  })
}

const readFile = util.promisify(fs.readFile)
const writeFile = util.promisify(fs.writeFile)
const rename = util.promisify(fs.rename)
const unlink = util.promisify(fs.unlink)

const remove = file => {
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
  const {name, url: sourceUrl} = source
  const dstFile = path.join(dstDir, name + '.xml')
  const file = fs.createWriteStream(dstFile)

  return new Promise((resolve, reject) => {
    const request = https.get(sourceUrl, response => {
      response.pipe(file)
      file.on('finish', () => file.close(() => resolve(dstFile)))
    })

    request.on('error', reject)
  })
})

const parseToJson = srcFile => {
  const dstFile = srcFile.replace(/\.xml$/, '.json')
  const writeStream = fs.createWriteStream(dstFile)

  return new Promise((resolve, reject) => {
    parser.parse(srcFile, (err, profile) => {
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

const moveToSourcesDir = (srcFile, ofacSourcesDir) => {
  const name = path.basename(srcFile)
  const dstFile = path.join(ofacSourcesDir, name)
  return rename(srcFile, dstFile)
}

function update () {
  const OFAC_DATA_DIR = options.ofacDataDir

  if (!OFAC_DATA_DIR) {
    throw new Error('ofacDataDir must be defined in lamassu.json')
  }

  const OFAC_SOURCES_DIR = path.join(OFAC_DATA_DIR, 'sources')
  const OFAC_ETAGS_FILE = path.join(OFAC_DATA_DIR, 'etags.json')

  return mkdir(OFAC_DATA_DIR)
    .then(() => mkdir(OFAC_SOURCES_DIR))
    .then(() => writeFile(OFAC_ETAGS_FILE, '{}', {encoding: 'utf-8', flag: 'wx'}))
    .catch(err => {
      if (err.code === 'EEXIST') return
      throw err
    })
    .then(() => {
      const promiseOldEtags = readFile(OFAC_ETAGS_FILE, {encoding: 'utf-8'})
      .then(json => JSON.parse(json))
      .catch(_ => {
        logger.error('Can\'t parse etags.json, getting new data...')
        return {}
      })

      const promiseNewEtags = Promise.resolve(options.ofacSources || [])
        .then(sources => Promise.all(_.map(promiseGetEtag, sources))
          .then(etags => _.map(
            ([source, etag]) => ({...source, etag}),
            _.zip(sources, etags)
          ))
        )

      return Promise.all([promiseOldEtags, promiseNewEtags])
        .then(([oldEtags, newEtags]) => {
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
              const moves = _.map(src => moveToSourcesDir(src, OFAC_SOURCES_DIR), parsed)
              const deletions = _.map(remove, missing)
              const updateEtags = writeFile(OFAC_ETAGS_FILE, etagsJson)

              return Promise.all([updateEtags, ...moves, ...deletions])
            })
        })
    })
}

module.exports = {update}
