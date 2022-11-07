const pgp = require('pg-promise')()
const cn = 'postgres://sheda56:pw@localhost:5432/leagueitemwinrates'
const db = pgp(cn)
const { Pool } = require('pg')
require('dotenv')

const pool = new Pool({
    user: process.env.DB_USER,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PW,
    port: 5432,
    host: 'localhost'
})

//module.exports = { pool };
module.exports = db;