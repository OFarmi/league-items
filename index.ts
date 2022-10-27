import { Express, Request, Response } from 'express'
import axios from 'axios'
require("dotenv").config()
const express = require("express")

//const request = require("request")
//express should be used when returning my backend data to the frontend, not when getting information from riotgames API.
//const app: Express = express()
const port = 3000

//app.get("https://127.0.0.1:2999/liveclientdata/allgamedata", (req: Request, res: Response) => {
  
//  res.send()
//  res.on('finish', () => console.log(res))
//})

//app.listen(port, () => {
//  console.log(`Example app listening on port ${port}!`)
//})

//axios used for querying riotgames API.
//axios.get(`https://americas.api.riotgames.com/lol/match/v5/matches/by-puuid/Yiyc38j71bjcKjDMOzYV8nYE8a587umrfGusIrbi7P1nUW3WaXdf5-_7km6VBP9JmNfeOSNnY4EVIQ/ids?start=0&count=20&api_key=${process.env.RIOT_API_KEY}`)
//.then(data=>console.log(data)).catch(err=>console.log(err))