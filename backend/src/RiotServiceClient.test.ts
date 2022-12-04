import DataGathering from "./DataGathering";
import { addChamp, addLoss, addWin, addItem, getWinrates, totalMatches, getMatches } from "./db-manager/dbm";
import { itemDataHandler } from "./LeagueItemRequestHandler";
import RiotServiceClient, { LeagueEntry, Item, MatchDataResponse, ItemSignatures } from "./RiotServiceClient"


describe('RiotServiceClient', () => {
    describe('RiotServiceClients summoners client', () => {
        let apiClient: RiotServiceClient

        beforeAll(async () => {
            apiClient = new RiotServiceClient()
        })
        it('successfully gets Summoners from the given rank', async () => {
            const summonerType = {
                queue: "RANKED_SOLO_5x5",
                tier: "PLATINUM",
                division: "IV"
            }
            const resolvedIDs = await apiClient.getSummonerIds(summonerType)
            expect(resolvedIDs[0]).toHaveProperty('leagueId')
        })
        it('successfully gets a PUUID given a valid summoner id', async () => {
            const summonerType = {
                queue: "RANKED_SOLO_5x5",
                tier: "DIAMOND",
                division: "IV"
            }
            const resolvedIDs = await apiClient.getSummonerIds(summonerType)
            const { summonerId } = resolvedIDs[0]
            const resolvedPUUID = await apiClient.getPUUID(summonerId)
            expect(resolvedPUUID.length).toEqual(78)
        })
        it('can retry when given too many summoner requests too soon one after the other', async () => {
            const summonerType = {
                queue: "RANKED_SOLO_5x5",
                tier: "DIAMOND",
                division: "IV"
            }
            const logSpy = jest.spyOn(console, 'log')
            const resolvedIDs = await apiClient.getSummonerIds(summonerType)
            const summonerIDs = resolvedIDs.map(entry => entry.summonerId).slice(0, 40)
            const resolvedPUUIDs = await Promise.all(summonerIDs.map(id => apiClient.getPUUID(id)))
            expect(logSpy).toHaveBeenCalledWith("retry attempt: 1")
        }, 40000)
    })

    describe('RiotServiceClients matches client', () => {
        let apiClient: RiotServiceClient
        let resolvedIDs: LeagueEntry[]
        let resolvedPUUID: string
        const summonerType = {
            queue: "RANKED_SOLO_5x5",
            tier: "DIAMOND",
            division: "IV"
        }

        beforeAll(async () => {
            apiClient = new RiotServiceClient()

            resolvedIDs = await apiClient.getSummonerIds(summonerType)
            resolvedPUUID = await apiClient.getPUUID(resolvedIDs[0].summonerId)

        })

        it('successfully gets matches given a valid PUUID', async () => {
            const resolvedMatches: string[] = await apiClient.getPlayerMatches(resolvedPUUID)
            expect(resolvedMatches.length).toBeGreaterThan(0)
        })
        it('successfully gets match data given a valid match ID', async () => {
            const resolvedMatches: string[] = await apiClient.getPlayerMatches(resolvedPUUID)
            const resolvedMatchData: MatchDataResponse = await apiClient.getMatchData(resolvedMatches[0])
            const { metadata } = resolvedMatchData
            expect(metadata.participants.length).toEqual(10)
        })
        it('can retry when given too many match requests too soon one after the other', async () => {
            const summonerIDs = resolvedIDs.map(entry => entry.summonerId)
            const resolvedPUUIDs = await Promise.all((summonerIDs.slice(0, 30)).map(id => apiClient.getPUUID(id)))
            const logSpy = jest.spyOn(console, 'log')
            const resolvedMatches = await Promise.all(resolvedPUUIDs.map(puuid => apiClient.getPlayerMatches(puuid)))
            expect(logSpy).toHaveBeenCalledWith("retry attempt: 1")
        }, 40000)

    })

    describe('RiotServiceClients cdn client', () => {
        let apiClient: RiotServiceClient
        let patch: string

        beforeAll(async () => {
            apiClient = new RiotServiceClient()
            patch = (await apiClient.getCurrentVersion()).split(".", 2).join(".")
        });

        it('can get list of champions', async () => {
            const resolvedChamps = await apiClient.getChampionList(patch)
            expect(resolvedChamps).toContain("Aatrox")
        });
        it('can get list of item codes', async () => {
            const resolvedItems = await apiClient.getItemCodeList(patch)
            expect(resolvedItems).toContain("3051")
        });
        it('can get list of item names', async () => {
            const resolvedItems = await apiClient.getItemNameList(patch)
            expect(JSON.stringify(resolvedItems)).toContain("[\"1001\",\"Boots\"]")
        })
        it('can get data of a given item', async () => {
            const resolvedItem = await apiClient.getItemData(patch, 1004)
            console.log(resolvedItem)
            const fakeBoots: Item = {
                id: 1001,
                name: "Boots",
                description: "<mainText><stats><attention>25</attention> Move Speed</stats></mainText><br>",
                into: [
                    "3158",
                    "3006",
                    "3009",
                    "3020",
                    "3047",
                    "3111",
                    "3117"
                ],
                tags: ["Boots"],
                plaintext: "Slightly increases Move Speed"
            }
            const bootKeys = Object.keys(fakeBoots)
            const responseKeys = Object.keys(resolvedItem)
            expect(bootKeys.every(key => responseKeys.includes(key))).toBeTruthy()

        })
        it('can get all items data', async () => {
            // this is a dictionary of itemID : Item object
            const resolvedItems: ItemSignatures = await apiClient.getItemsData(patch)

            expect(Object.keys(resolvedItems).length).toBeGreaterThan(100)
        })
        /*
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
        /*it('can get the correct item data for given item number', async () => {
            const item: Item = await apiClient.getItemData((await apiClient.getCurrentPatch()).split(".", 2).join("."), 1001)
            if (item && item.description) {
                console.log(item.description)
            }
            
        })
        it('can sum total matches', async ()=> {
            const data: DataGathering = await DataGathering.getInstance()
            const response = data.getItemData()
            //console.log(response)
            const reply = await itemDataHandler()
            console.log(JSON.stringify(reply))
        })*/
    });
})
