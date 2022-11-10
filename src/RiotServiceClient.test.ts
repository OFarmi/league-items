import axios from "axios";
import { addChamp, addLoss, addWin, addItem, getWinrates, totalMatches, getMatches } from "./db-manager/dbm";
import RiotServiceClient, { LeagueEntry, Item } from "./RiotServiceClient"

//const MockAdapter = require('axios-mock-adapter')

//import * from jest;

//jest.mock('axios')
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
        const resolved = await apiClient.getSummonerIds(summonerType)
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
        const resolvedIDs = await apiClient.getSummonerIds(summonerType)
        console.log(resolvedIDs[0].summonerId)
        const { summonerId } = resolvedIDs[0]
        const resolvedPUUID = await apiClient.getPUUID(resolvedIDs[0].summonerId)
        console.log(resolvedPUUID)
        expect(resolvedPUUID.length).toEqual(78)
        const resolvedMatches = await apiClient.getPlayerMatches(resolvedPUUID)
        console.log(resolvedMatches)

    });
    it('can get list of champions', async () => {
        const resolvedChamps = await apiClient.getChampionList((await apiClient.getCurrentPatch()).split(".", 2).join("."))
        expect(resolvedChamps).toContain("Aatrox")
    });
    it('can get list of item codes', async () => {
        const resolvedItems = await apiClient.getItemCodeList((await apiClient.getCurrentPatch()).split(".", 2).join("."))
        expect(resolvedItems).toContain("3051")
    });
    it('can get list of item names', async () => {
        const resolvedItems = await apiClient.getItemNameList((await apiClient.getCurrentPatch()).split(".", 2).join("."))
        // checking if it contained the array normally failed for some reason
        expect(JSON.stringify(resolvedItems)).toContain("[\"1001\",\"Boots\"]")
    })
    it('can update DB', async () => {
        //await addChamp('aatrox')
        //await addItem(1)
        //const returned = await addWin("ashe", 5, "b", "bottom", true, false)
        //console.log(returned)
        //await new Promise(r => setTimeout(r, 1000));

        //await addWin("ahri", 1, "a", "middle")
        

        //await addLoss('ahri', 1//, "a", "middle", true, false)
        const total = await totalMatches()
        console.log(total)
        const realtotal = await getMatches("12.21")
        console.log(realtotal.length)
        //await addLoss("aatrox", 1)
        //const result = await getWinrates("aatrox", 1)
        //console.log(result)
    })
    it('can get the correct item data for given item number', async () => {
        const item: Item = await apiClient.getItemData((await apiClient.getCurrentPatch()).split(".", 2).join("."), 1001)
        if (item && item.description) {
            console.log(item.description)
        }
        
    })
    it('can sum total matches', async ()=> {
        //const total = 
    })
});