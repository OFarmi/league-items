import Express from 'express'
import * as http from 'http';
import CORS from 'cors'
import { AddressInfo } from 'net'
import addWinrateRoutes from './router';
import DataGathering from './DataGathering';

const app = Express()
app.use(CORS())
const server = http.createServer(app)

const getData = async () => {
    return await DataGathering.create()
}

addWinrateRoutes(server, app)

getData().then(async (data) => {
    await data.analyzeMatches()
    return data
}).then((data: DataGathering) => {
    server.listen(8081, () => {
        const address = server.address() as AddressInfo
    
        console.log(`Listening on ${address.port}`)
        
    })
})
