import Express from 'express'
import * as http from 'http';
import CORS from 'cors'
import { AddressInfo } from 'net'
import addWinrateRoutes from './src/router';
import DataGathering from './src/DataGathering';
require('dotenv').config()

const app = Express()
app.use(CORS())
const server = http.createServer(app)

const getData = async () => {
    await (await DataGathering.getInstance()).analyzeMatches()
}

addWinrateRoutes(server, app)

//calling async function without await means server immediately starts accepting calls before the backend fully gathers all data
getData()

server.listen(process.env.PORT || 8081, () => {
    const address = server.address() as AddressInfo

    console.log(`Listening on ${address.port}`)
})
