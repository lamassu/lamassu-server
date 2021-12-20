import { intervalToDuration } from 'date-fns'
import { getTimezoneOffset } from 'date-fns-tz'
import * as R from 'ramda'

const timezones = {
  'Pacific/Midway': { short: 'SST', long: 'Midway Island, Samoa' },
  'Pacific/Honolulu': { short: 'HAST', long: 'Hawaii' },
  'America/Juneau': { short: 'AKST', long: 'Alaska' },
  'America/Boise': { long: 'Mountain Time' },
  'America/Dawson': { long: 'Dawson, Yukon' },
  'America/Chihuahua': { long: 'Chihuahua, La Paz, Mazatlan' },
  'America/Phoenix': { long: 'Arizona' },
  'America/Chicago': { long: 'Central Time' },
  'America/Regina': { long: 'Saskatchewan' },
  'America/Mexico_City': { long: 'Guadalajara, Mexico City, Monterrey' },
  'America/Belize': { long: 'Central America' },
  'America/Detroit': { long: 'Eastern Time' },
  'America/Bogota': { long: 'Bogota, Lima, Quito' },
  'America/Caracas': { long: 'Caracas, La Paz' },
  'America/Santiago': { long: 'Santiago' },
  'America/St_Johns': { long: 'Newfoundland and Labrador' },
  'America/Sao_Paulo': { long: 'Brasilia' },
  'America/Tijuana': { long: 'Tijuana' },
  'America/Montevideo': { long: 'Montevideo' },
  'America/Argentina/Buenos_Aires': { long: 'Buenos Aires, Georgetown' },
  'America/Godthab': { long: 'Greenland' },
  'America/Los_Angeles': { long: 'Pacific Time' },
  'Atlantic/Azores': { long: 'Azores' },
  'Atlantic/Cape_Verde': { long: 'Cape Verde Islands' },
  GMT: { long: 'UTC' },
  'Europe/London': { long: 'Edinburgh, London' },
  'Europe/Dublin': { long: 'Dublin' },
  'Europe/Lisbon': { long: 'Lisbon' },
  'Africa/Casablanca': { long: 'Casablanca, Monrovia' },
  'Atlantic/Canary': { long: 'Canary Islands' },
  'Europe/Belgrade': {
    long: 'Belgrade, Bratislava, Budapest, Ljubljana, Prague'
  },
  'Europe/Sarajevo': { long: 'Sarajevo, Skopje, Warsaw, Zagreb' },
  'Europe/Brussels': { long: 'Brussels, Copenhagen, Madrid, Paris' },
  'Europe/Amsterdam': {
    long: 'Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna'
  },
  'Africa/Algiers': { long: 'West Central Africa' },
  'Europe/Bucharest': { long: 'Bucharest' },
  'Africa/Cairo': { long: 'Cairo' },
  'Europe/Helsinki': { long: 'Helsinki, Kiev, Riga, Sofia, Tallinn, Vilnius' },
  'Europe/Athens': { long: 'Athens, Istanbul, Minsk' },
  'Asia/Jerusalem': { long: 'Jerusalem' },
  'Africa/Harare': { long: 'Harare, Pretoria' },
  'Europe/Moscow': { long: 'Moscow, St. Petersburg, Volgograd' },
  'Asia/Kuwait': { long: 'Kuwait, Riyadh' },
  'Africa/Nairobi': { long: 'Nairobi' },
  'Asia/Baghdad': { long: 'Baghdad' },
  'Asia/Tehran': { long: 'Tehran' },
  'Asia/Dubai': { long: 'Abu Dhabi, Muscat' },
  'Asia/Baku': { long: 'Baku, Tbilisi, Yerevan' },
  'Asia/Kabul': { long: 'Kabul' },
  'Asia/Yekaterinburg': { long: 'Ekaterinburg' },
  'Asia/Karachi': { long: 'Islamabad, Karachi, Tashkent' },
  'Asia/Kolkata': { long: 'Chennai, Kolkata, Mumbai, New Delhi' },
  'Asia/Kathmandu': { long: 'Kathmandu' },
  'Asia/Dhaka': { long: 'Astana, Dhaka' },
  'Asia/Colombo': { long: 'Sri Jayawardenepura' },
  'Asia/Almaty': { long: 'Almaty, Novosibirsk' },
  'Asia/Rangoon': { long: 'Yangon Rangoon' },
  'Asia/Bangkok': { long: 'Bangkok, Hanoi, Jakarta' },
  'Asia/Krasnoyarsk': { long: 'Krasnoyarsk' },
  'Asia/Shanghai': { long: 'Beijing, Chongqing, Hong Kong SAR, Urumqi' },
  'Asia/Kuala_Lumpur': { long: 'Kuala Lumpur, Singapore' },
  'Asia/Taipei': { long: 'Taipei' },
  'Australia/Perth': { long: 'Perth' },
  'Asia/Irkutsk': { long: 'Irkutsk, Ulaanbaatar' },
  'Asia/Seoul': { long: 'Seoul' },
  'Asia/Tokyo': { long: 'Osaka, Sapporo, Tokyo' },
  'Asia/Yakutsk': { long: 'Yakutsk' },
  'Australia/Darwin': { long: 'Darwin' },
  'Australia/Adelaide': { long: 'Adelaide' },
  'Australia/Sydney': { long: 'Canberra, Melbourne, Sydney' },
  'Australia/Brisbane': { long: 'Brisbane' },
  'Australia/Hobart': { long: 'Hobart' },
  'Asia/Vladivostok': { long: 'Vladivostok' },
  'Pacific/Guam': { long: 'Guam, Port Moresby' },
  'Asia/Magadan': { long: 'Magadan, Solomon Islands, New Caledonia' },
  'Asia/Kamchatka': { long: 'Kamchatka, Marshall Islands' },
  'Pacific/Fiji': { long: 'Fiji Islands' },
  'Pacific/Auckland': { long: 'Auckland, Wellington' },
  'Pacific/Tongatapu': { long: "Nuku'alofa" }
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

export { labels, timezones }
