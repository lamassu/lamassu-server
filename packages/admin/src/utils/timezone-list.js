import { intervalToDuration } from 'date-fns'
import { getTimezoneOffset } from 'date-fns-tz'
import * as R from 'ramda'

const timezones = {
  'Pacific/Midway': { short: 'SST', long: 'Midway Island, Samoa' },
  'Pacific/Honolulu': { short: 'HAST', long: 'Hawaii' },
  'America/Juneau': { short: 'AKST', long: 'Alaska' },
  'America/Boise': { short: 'MST', long: 'Mountain Time' },
  'America/Dawson': { short: 'MST', long: 'Dawson, Yukon' },
  'America/Chihuahua': { short: null, long: 'Chihuahua, La Paz, Mazatlan' },
  'America/Phoenix': { short: 'MST', long: 'Arizona' },
  'America/Chicago': { short: 'CST', long: 'Central Time' },
  'America/Regina': { short: 'CST', long: 'Saskatchewan' },
  'America/Mexico_City': {
    short: 'CST',
    long: 'Guadalajara, Mexico City, Monterrey'
  },
  'America/Belize': { short: 'CST', long: 'Central America' },
  'America/Detroit': { short: 'EST', long: 'Eastern Time' },
  'America/Bogota': { short: 'COT', long: 'Bogota, Lima, Quito' },
  'America/Caracas': { short: 'VET', long: 'Caracas, La Paz' },
  'America/Santiago': { short: 'CLST', long: 'Santiago' },
  'America/St_Johns': { short: 'HNTN', long: 'Newfoundland and Labrador' },
  'America/Sao_Paulo': { short: 'BRT', long: 'Brasilia' },
  'America/Tijuana': { short: 'PST', long: 'Tijuana' },
  'America/Montevideo': { short: 'UYT', long: 'Montevideo' },
  'America/Argentina/Buenos_Aires': {
    short: null,
    long: 'Buenos Aires, Georgetown'
  },
  'America/Godthab': { short: null, long: 'Greenland' },
  'America/Los_Angeles': { short: 'PST', long: 'Pacific Time' },
  'Atlantic/Azores': { short: 'AZOT', long: 'Azores' },
  'Atlantic/Cape_Verde': { short: 'CVT', long: 'Cape Verde Islands' },
  GMT: { short: 'GMT', long: 'UTC' },
  'Europe/London': { short: 'GMT', long: 'Edinburgh, London' },
  'Europe/Dublin': { short: 'GMT', long: 'Dublin' },
  'Europe/Lisbon': { short: 'WET', long: 'Lisbon' },
  'Africa/Casablanca': { short: 'WET', long: 'Casablanca, Monrovia' },
  'Atlantic/Canary': { short: 'WET', long: 'Canary Islands' },
  'Europe/Belgrade': {
    short: 'CET',
    long: 'Belgrade, Bratislava, Budapest, Ljubljana, Prague'
  },
  'Europe/Sarajevo': { short: 'CET', long: 'Sarajevo, Skopje, Warsaw, Zagreb' },
  'Europe/Brussels': {
    short: 'CET',
    long: 'Brussels, Copenhagen, Madrid, Paris'
  },
  'Europe/Amsterdam': {
    short: 'CET',
    long: 'Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna'
  },
  'Africa/Algiers': { short: 'CET', long: 'West Central Africa' },
  'Europe/Bucharest': { short: 'EET', long: 'Bucharest' },
  'Africa/Cairo': { short: 'EET', long: 'Cairo' },
  'Europe/Helsinki': {
    short: 'EET',
    long: 'Helsinki, Kiev, Riga, Sofia, Tallinn, Vilnius'
  },
  'Europe/Athens': { short: 'EET', long: 'Athens, Istanbul, Minsk' },
  'Asia/Jerusalem': { short: 'IST', long: 'Jerusalem' },
  'Africa/Harare': { short: 'CAT', long: 'Harare, Pretoria' },
  'Europe/Moscow': { short: 'MSK', long: 'Moscow, St. Petersburg, Volgograd' },
  'Asia/Kuwait': { short: 'AST', long: 'Kuwait, Riyadh' },
  'Africa/Nairobi': { short: 'EAT', long: 'Nairobi' },
  'Asia/Baghdad': { short: 'AST', long: 'Baghdad' },
  'Asia/Tehran': { short: 'IRST', long: 'Tehran' },
  'Asia/Dubai': { short: 'GST', long: 'Abu Dhabi, Muscat' },
  'Asia/Baku': { short: 'AZT', long: 'Baku, Tbilisi, Yerevan' },
  'Asia/Kabul': { short: 'AFT', long: 'Kabul' },
  'Asia/Yekaterinburg': { short: 'YEKT', long: 'Ekaterinburg' },
  'Asia/Karachi': { short: 'PKT', long: 'Islamabad, Karachi, Tashkent' },
  'Asia/Kolkata': { short: 'IST', long: 'Chennai, Kolkata, Mumbai, New Delhi' },
  'Asia/Kathmandu': { short: null, long: 'Kathmandu' },
  'Asia/Dhaka': { short: 'BST', long: 'Astana, Dhaka' },
  'Asia/Colombo': { short: 'IST', long: 'Sri Jayawardenepura' },
  'Asia/Almaty': { short: 'ALMT', long: 'Almaty, Novosibirsk' },
  'Asia/Rangoon': { short: null, long: 'Yangon Rangoon' },
  'Asia/Bangkok': { short: 'ICT', long: 'Bangkok, Hanoi, Jakarta' },
  'Asia/Krasnoyarsk': { short: 'KRAT', long: 'Krasnoyarsk' },
  'Asia/Shanghai': {
    short: 'CST',
    long: 'Beijing, Chongqing, Hong Kong SAR, Urumqi'
  },
  'Asia/Kuala_Lumpur': { short: 'MYT', long: 'Kuala Lumpur, Singapore' },
  'Asia/Taipei': { short: 'CST', long: 'Taipei' },
  'Australia/Perth': { short: 'AWST', long: 'Perth' },
  'Asia/Irkutsk': { short: 'IRKT', long: 'Irkutsk, Ulaanbaatar' },
  'Asia/Seoul': { short: 'KST', long: 'Seoul' },
  'Asia/Tokyo': { short: 'JST', long: 'Osaka, Sapporo, Tokyo' },
  'Asia/Yakutsk': { short: 'YAKT', long: 'Yakutsk' },
  'Australia/Darwin': { short: 'ACST', long: 'Darwin' },
  'Australia/Adelaide': { short: 'ACDT', long: 'Adelaide' },
  'Australia/Sydney': { short: 'AEDT', long: 'Canberra, Melbourne, Sydney' },
  'Australia/Brisbane': { short: 'AEST', long: 'Brisbane' },
  'Australia/Hobart': { short: 'AEDT', long: 'Hobart' },
  'Asia/Vladivostok': { short: 'VLAT', long: 'Vladivostok' },
  'Pacific/Guam': { short: 'ChST', long: 'Guam, Port Moresby' },
  'Asia/Magadan': {
    short: 'MAGT',
    long: 'Magadan, Solomon Islands, New Caledonia'
  },
  'Asia/Kamchatka': { short: 'PETT', long: 'Kamchatka, Marshall Islands' },
  'Pacific/Fiji': { short: 'FJT', long: 'Fiji Islands' },
  'Pacific/Auckland': { short: 'NZDT', long: 'Auckland, Wellington' },
  'Pacific/Tongatapu': { short: null, long: "Nuku'alofa" }
}

const buildTzLabels = timezoneList => {
  const pairs = R.toPairs(timezoneList)
  return R.reduce(
    (acc, value) => {
      const isNegative = getTimezoneOffset(value[0]) < 0
      const duration = intervalToDuration({
        start: 0,
        end: Math.abs(getTimezoneOffset(value[0]))
      })

      const hours = duration.hours.toLocaleString('en-US', {
        minimumIntegerDigits: 2,
        useGrouping: false
      })
      const minutes = duration.minutes.toLocaleString('en-US', {
        minimumIntegerDigits: 2,
        useGrouping: false
      })

      const prefix = `(GMT${isNegative ? `-` : `+`}${hours}:${minutes})`

      acc.push({
        label: `${prefix} - ${value[1].long}`,
        code: value[0]
      })

      return acc
    },
    [],
    pairs
  )
}

const labels = buildTzLabels(timezones)

const DEFAULT_TIMEZONE = 'GMT'

export { labels, timezones, DEFAULT_TIMEZONE }
