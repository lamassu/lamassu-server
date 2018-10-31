var db = require('./db')

exports.up = function (next) {
  var sql = [
    `create table if not exists machine_pings (
      id uuid PRIMARY KEY,
      device_id text not null,
      serial_number integer not null,
      device_time timestamptz not null,
      created timestamptz not null default now())`,
    `create table if not exists aggregated_machine_pings (
      id uuid PRIMARY KEY,
      device_id text not null,
      dropped_pings integer not null,
      total_pings integer not null,
      lag_sd_ms integer not null,
      lag_min_ms integer not null,
      lag_max_ms integer not null,
      lag_median_ms integer not null,
      day date not null)`,
    db.dropColumn('machine_events', 'device_time'),
    db.addColumn('machine_events', 'device_time', 'timestamptz')
  ]
  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
