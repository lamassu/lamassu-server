var db = require('./db')

exports.up = function (next) {
  var sql = [
    `ALTER TABLE cash_in_txs ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`,
    `ALTER TABLE cash_out_txs ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`,
    `CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW(); 
            RETURN NEW;
        END;
    $$ language 'plpgsql';`,
    `CREATE TRIGGER update_cash_in BEFORE UPDATE
        ON cash_in_txs FOR EACH ROW EXECUTE PROCEDURE update_updated_at()`,
    `CREATE TRIGGER update_cash_in BEFORE UPDATE
        ON cash_out_txs FOR EACH ROW EXECUTE PROCEDURE update_updated_at()`,
  ]

  db.multi(sql, next)
}

exports.down = function (next) {
  next()
}
