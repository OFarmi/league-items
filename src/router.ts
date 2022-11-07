import { Express } from 'express'
import io from 'socket.io'
import { Server } from 'http'
import  { StatusCodes } from 'http-status-codes'
import { championWinrateHandler, ChampionWinrateResponse } from './LeagueItemRequestHandler'


export default function addWinrateRoutes(http: Server, app: Express): io.Server {
    app.get('/:championName', async (req, res) => {
        const result: ChampionWinrateResponse[] = await championWinrateHandler(req.params.championName)
        res.status(StatusCodes.OK)
            .json(result)
    })





    const socketServer = new io.Server(http, { cors: { origin: '*' } });
    return socketServer
}