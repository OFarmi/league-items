import { Express } from 'express'
import io from 'socket.io'
import { Server } from 'http'
import  { StatusCodes } from 'http-status-codes'
import { championWinrateHandler, ChampionWinrateResponse, itemDataHandler, updateVersionHandler } from './LeagueItemRequestHandler'
import { Item } from './RiotServiceClient'


export default function addWinrateRoutes(http: Server, app: Express): io.Server {
    app.get('/:championName', async (req, res) => {
        const result: ChampionWinrateResponse[] = await championWinrateHandler(req.params.championName)
        res.status(StatusCodes.OK)
            .json(result)
    })

    app.get('/items', async (_req, res) => {
        const result: Item = await itemDataHandler()
        res.status(StatusCodes.OK)
            .json(result)
    })

    app.patch('/version', async (req, res) => {
        const result = await updateVersionHandler(req.body.version)
        res.status(StatusCodes.OK)
            .json(result)
    })

    const socketServer = new io.Server(http, { cors: { origin: '*' } });
    return socketServer
}