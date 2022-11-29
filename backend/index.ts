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

getData()

server.listen(8081, () => {
    const address = server.address() as AddressInfo

    console.log(`Listening on ${address.port}`)
})

/*
getData().then(async (data) => {
    await data.analyzeMatches()
    return data
}).then((data: DataGathering) => {
    
})
*/