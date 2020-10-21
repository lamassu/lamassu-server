const db = require('./db')

function getTokenList() {
    const sql = `select * from user_tokens`
    return db.any(sql);
}

module.exports = { getTokenList }