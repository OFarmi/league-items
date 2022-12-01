import express, { Express } from 'express'
import io from 'socket.io'
import { Server } from 'http'
import { StatusCodes } from 'http-status-codes'
import { championListHandler, championWinrateHandler, ChampionWinrateResponse, itemDataHandler, updateVersionHandler } from './LeagueItemRequestHandler'
import { ItemSignatures } from './RiotServiceClient'


export default function addWinrateRoutes(http: Server, app: Express): io.Server {
    app.get('/champions/:championName', async (req, res) => {
        const result: ChampionWinrateResponse[] = await championWinrateHandler(req.params.championName)
        res.status(StatusCodes.OK)
            .json(result)
    })

    app.get('/champions', async (_req, res) => {
        const result: string[] = await championListHandler()
        res.status(StatusCodes.OK)
            .json(result)
    })

    app.get('/items', express.json(), async (_req, res) => {
        const result: ItemSignatures = await itemDataHandler()
        res.status(StatusCodes.OK)
            .json(result)
    })

    app.patch('/version', async (req, res) => {
        const result = await updateVersionHandler(req.body.version)
        // notifier that info is still being aggregated?
        res.status(StatusCodes.OK)
            .json(result)
    })

    const socketServer = new io.Server(http, { cors: { origin: '*' } });
    return socketServer
}