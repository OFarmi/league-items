const { Pool } = require('pq')
require('dotenv')

const pool = new Pool({
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    password: process.env.DB_PW,
    port: 5432,
    host: 'localhost'
})

module.exports = { pool };