import express, { Express } from 'express'
import io from 'socket.io'
import { Server } from 'http'
import { StatusCodes } from 'http-status-codes'
import { championListHandler, championWinrateHandler, ChampionWinrateResponse, itemDataHandler, latestVersionHandler, updateVersionHandler } from './LeagueItemRequestHandler'
import { ItemSignatures } from './RiotServiceClient'


export default function addWinrateRoutes(http: Server, app: Express): io.Server {
    
    /**
     * Gets the top 5 winrate items of the given championName
     */
    app.get('/champions/:championName', async (req, res) => {
        const result: ChampionWinrateResponse[] = await championWinrateHandler(req.params.championName)
        res.status(StatusCodes.OK)
            .json(result)
    })

    /**
     * Gets a list of all champion names
     */
    app.get('/champions', async (_req, res) => {
        const result: string[] = await championListHandler()
        res.status(StatusCodes.OK)
            .json(result)
    })

    app.get('/items', async (_req, res) => {
        const result: ItemSignatures = await itemDataHandler()
        res.status(StatusCodes.OK)
            .json(result)
    })

    /**
     * Checks what the most recent version is in the 3rd party RG API
     * Called periodically by frontend to determine if current version should be updated
     */
    app.get('/version', async (_req, res) => {
        const result = await latestVersionHandler()
        res.status(StatusCodes.OK)
            .json(result)
    })

    /**
     * Updates the current DataGathering client's version to a more recent version received from 3rd party RG API
     */
    app.patch('/version', express.json(), async (req, res) => {
        const result = await updateVersionHandler(req.body.version)
        // notifier that info is still being aggregated?
        res.status(StatusCodes.OK)
            .json(result)
    })

    const socketServer = new io.Server(http, { cors: { origin: '*' } });
    return socketServer
}