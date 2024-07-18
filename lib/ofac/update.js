const parser = require('./parsing')
const https = require('https')
const URL = require('url')
const { createWriteStream } = require('fs')
const fs = require('fs/promises')
const { readFile, writeFile, rename, unlink } = fs
const path = require('path')
const _ = require('lodash/fp')
const logger = require('../logger')

const DOWNLOAD_DIR = path.resolve('/tmp')

const OFAC_DATA_DIR = process.env.OFAC_DATA_DIR
const OFAC_SOURCES_NAMES = process.env.OFAC_SOURCES_NAMES.split(',')
const OFAC_SOURCES_URLS = process.env.OFAC_SOURCES_URLS.split(',')

const ofacSources = _.map(
  ([name, url]) => ({ name, url }),
  _.zip(OFAC_SOURCES_NAMES, OFAC_SOURCES_URLS)
)

const mkdir = path =>
  fs.mkdir(path)
    .catch(err => err.code === 'EEXIST' ? Promise.resolve() : Promise.reject(err))

const promiseGetEtag = ({ url }) =>
  new Promise((resolve, reject) => {
    const parsed = URL.parse(url)
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

const download = (dstDir, { name, url }) => {
  const dstFile = path.join(dstDir, name + '.xml')
  const file = createWriteStream(dstFile)

  return new Promise((resolve, reject) => {
    const request = https.get(url, response => {
      response.pipe(file)
      file.on('finish', () => file.close(() => resolve(dstFile)))
    })

    request.on('error', reject)
  })
}

const parseToJson = srcFile => {
  const dstFile = srcFile.replace(/\.xml$/, '.json')
  const writeStream = createWriteStream(dstFile)

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
  if (!OFAC_DATA_DIR) {
    throw new Error('ofacDataDir must be defined in the environment')
  }

  if (!ofacSources) {
    logger.error('ofacSources must be defined in the environment')
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

      const promiseNewEtags = Promise.resolve(ofacSources || [])
        .then(sources => Promise.all(_.map(promiseGetEtag, sources))
          .then(etags => _.map(
            ([source, etag]) => _.set('etag', etag,  source),
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
              const deletions = _.map(unlink, missing)
              const updateEtags = writeFile(OFAC_ETAGS_FILE, etagsJson)

              return Promise.all([updateEtags, ...moves, ...deletions])
            })
        })
    })
}

module.exports = {update}
