const db = require('./db')

exports.up = function(next) {
  var sql = [
    'TRUNCATE TABLE machine_pings',
    'ALTER TABLE machine_pings DROP id',
    'ALTER TABLE machine_pings DROP serial_number',
    'ALTER TABLE machine_pings ADD CONSTRAINT PK_device_id PRIMARY KEY (device_id)',
    'ALTER TABLE machine_pings ADD CONSTRAINT U_device_id UNIQUE(device_id)'
  ]

  db.multi(sql, next)
};

exports.down = function(next) {
  next();
};
