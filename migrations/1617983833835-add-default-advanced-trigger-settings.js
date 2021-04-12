const db = require('./db')


exports.up = function (next) {

    const sql2 = [`insert into user_config (type, data, valid, schema_version) values ('config', '{"config":{
        "triggersConfig_expirationTime": "Forever",
        "triggersConfig_automation": "Automatic"
    } }', true, 2)`]

    db.multi(sql2, next)
}

exports.down = function (next) {
  next()
}