var db = require('./db')

exports.up = function (next) {
  var sql = [
    `create table machine_pings (
    id uuid PRIMARY KEY,
    device_id text not null,
    serial_number integer not null,
    device_time timestamptz not null,
    created timestamptz not null default now())`,
    `create table aggregated_machine_pings (
    id uuid PRIMARY KEY,
    device_id text not null,
    dropped_pings integer not null,
    total_pings integer not null,
    lag_sd_ms integer not null,
    lag_min_ms integer not null,
    lag_max_ms integer not null,
    lag_median_ms integer not null,
    day date not null)`,
    'alter table machine_events drop column device_time',
    'alter table machine_events add column device_time timestamptz'
  ]
  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
