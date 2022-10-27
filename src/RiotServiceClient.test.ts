import axios from "axios";
import RiotServiceClient, { LeagueEntry } from "./RiotServiceClient"

//const MockAdapter = require('axios-mock-adapter')

//import * from jest;

//jest.mock('axios')
require("dotenv")
describe('RiotServiceClient', () => {
    let apiClient: RiotServiceClient;
    //const mock = new MockAdapter(axios)
    
    beforeAll(async () => {
        apiClient = new RiotServiceClient();
    });
    it('successfully gets Summoners from the given rank', async () => {
        const summonerType = {
            queue:"RANKED_SOLO_5x5",
            tier:"PLATINUM",
            division:"IV"
        }
        const response = {
            status: 200,
            data: {}
        }
        //mock.onGet()
        //const axiosSpy = jest.spyOn(axios, 'get').mockImplementationOnce(() => Promise.resolve(response.data))
        //axios.get.mockImplementationOnce(() => Promise.resolve("test"))
        const resolved = await apiClient.getSummonerId(summonerType)
        //console.log(resolved[0])
        //console.log(resolved[0].summonerId  as Pick<LeagueEntry, >)
        expect(resolved[0]).toHaveProperty('leagueId')
        //expect(axiosSpy).toHaveBeenCalledWith(`https://na1.api.riotgames.com/lol/league-exp/v4/entries/RANKED_SOLO_5x5/DIAMOND/IV?page=1&api_key=${process.env.RIOT_API_KEY}`)
        //console.log(request)
    });
    it('successfully gets a PUUID given a valid summoner id', async () => {
        const summonerType = {
            queue:"RANKED_SOLO_5x5",
            tier:"DIAMOND",
            division:"IV"
        }
        const resolvedIDs = await apiClient.getSummonerId(summonerType)
        //console.log(resolvedIDs[0].summonerId)
        const { summonerId } = resolvedIDs[0]
        const resolvedPUUID = await apiClient.getPUUID(resolvedIDs[0].summonerId)
        console.log(resolvedPUUID)
        expect(resolvedPUUID.length).toEqual(78)

    })
});