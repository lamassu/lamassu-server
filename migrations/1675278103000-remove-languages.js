const _ = require('lodash/fp')
const { migrationSaveConfig, loadLatest } = require('../lib/new-settings-loader')

const removedLanguages = [
    "ca-ES",
    "cs-CZ",
    "cy-GB",
    "de-AT",
    "da-DK",
    "el-GR",
    "et-EE",
    "fr-FR",
    "fr-CH",
    "ga-IE",
    "gd-GB",
    "hr-HR",
    "hu-HU",
    "hy-AM",
    "id-ID",
    "ja-JP",
    "ko-KR",
    "ky-KG",
    "lt-LT",
    "nb-NO",
    "ru-RU",
    "sco-GB",
    "sh-HR",
    "sv-SE",
    "th-TH",
    "uk-UA",
    "vi-VN"
]

const changeLanguage = lang =>
    removedLanguages.includes(lang) ? "en-US" : lang

exports.up = next => {
    loadLatest()
    .then(({ config }) => {
        locale_languages = _.uniq(config.locale_languages.map(changeLanguage))
        locale_overrides = config.locale_overrides.map(o => {
            o.languages = _.uniq(o.languages.map(changeLanguage))
            return o
        })

        return migrationSaveConfig({
            locale_languages,
            locale_overrides
        })
    })
    .then(next)
    .catch(err => {
      return next(err)
    })
}

module.exports.down = next => {
  next()
}
