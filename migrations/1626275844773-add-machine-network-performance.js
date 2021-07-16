const db = require('./db')

exports.up = function (next) {
  var sql = [
    'drop table if exists machine_network_heartbeat',
    'drop table if exists machine_network_performance',
    `create table machine_network_performance (
        device_id text PRIMARY KEY,
        download_speed numeric NOT NULL,
        created timestamptz NOT NULL default now()
      )`,
    `create table machine_network_heartbeat (
        id uuid PRIMARY KEY,
        device_id text not null,
        average_response_time numeric NOT NULL,
        average_packet_loss numeric NOT NULL,
        created timestamptz NOT NULL default now()
      )`
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
