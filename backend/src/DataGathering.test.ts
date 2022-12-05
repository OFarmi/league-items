import RiotServiceClient, { Item, LeagueEntry, MatchDataResponse, MatchParticipant, SummonerIdRequest } from "./RiotServiceClient";
import DataGathering, { MAX_MATCHES } from "./DataGathering";
import * as dbm from "./db-manager/dbm";


const clearInstance = (instance: DataGathering) => {
    instance['_checkedSummonerIds'] = []
    instance['_checkedPuuids'] = []
    instance['_puuidQueue'] = []
    instance['_summonerIdQueue'] = []
    instance['_matchesQueue'] = []
    instance['_checkedMatches'] = []
}

describe('DataGathering', () => {

    let instance: DataGathering
    beforeAll(async () => {
        instance = await DataGathering.getInstance(apiClient)
    })
    //using a Partial lets us ignore the constructor
    const apiClient: Partial<RiotServiceClient> = {
        async getCurrentVersion(): Promise<string> {
            return Promise.resolve("1.1")
        },
        async getSummonerIds(): Promise<LeagueEntry[]> {
            //Math.random could be replaced with nanoid package, which returns a random string
            return Promise.resolve([{ leagueId: "test", summonerId: Math.random().toString(36).slice(2) }])
        },
        async getPUUID(summonerId: string): Promise<string> {
            return Promise.resolve(Math.random().toString(36).slice(2))
        },
        async getPlayerMatches(puuid: string): Promise<string[]> {
            return Promise.resolve([Math.random().toString(36).slice(2)])
        },
        async getMatchData(matchId: string): Promise<MatchDataResponse> {
            return Promise.resolve({} as MatchDataResponse)
        },
        async getItemData(version: string, item: number): Promise<Item> {
            return Promise.resolve({} as Item)
        }
    }

    describe('getInstance', () => {

        it('attempting to create a second instance returns the first instance', async () => {
            //const instance = await DataGathering.getInstance(apiClient)
            const secondInstance = await DataGathering.getInstance()
            expect(instance).toEqual(secondInstance)
        })

    })
    describe('getPlayers', () => {

        afterEach(() => {
            instance['_checkedSummonerIds'] = []
        })
        it('should update the summonerIdQueue when given an unchecked summonerId not already in the queue', async () => {
            const initialQueueSize = instance['_summonerIdQueue'].length
            await instance.getPlayers()
            expect(instance['_summonerIdQueue'].length).toEqual(initialQueueSize + 1)
        })
        it('should not update the summonerIdQueue when given an unchecked summonerId that is already in the queue', async () => {
            const initialQueueHead = instance['_summonerIdQueue'][0]
            jest.spyOn(apiClient, 'getSummonerIds').mockImplementationOnce(() => Promise.resolve([{ leagueId: "test", summonerId: instance['_summonerIdQueue'][0] }]))
            await instance.getPlayers()
            expect(instance['_summonerIdQueue'][0]).toEqual(initialQueueHead)
        })
        it('should not update the summonerIdQueue when given a checked summonerId', async () => {
            const summonerIdToBeChecked = instance['_summonerIdQueue'][0]
            await instance.getMatches()
            expect(instance['_checkedSummonerIds'][0]).toEqual(summonerIdToBeChecked)
            jest.spyOn(apiClient, 'getSummonerIds').mockImplementationOnce(() => Promise.resolve([{ leagueId: "test", summonerId: summonerIdToBeChecked }]))
            const initialQueueSize = instance['_summonerIdQueue'].length
            await instance.getPlayers()
            expect(instance['_summonerIdQueue'].length).toEqual(initialQueueSize)
        })
        it('should call getSummonerIds', async () => {
            const defaultRank: SummonerIdRequest = {
                queue: "RANKED_SOLO_5x5",
                tier: "CHALLENGER",
                division: "I"
            }
            const summonerIdsSpy = jest.spyOn(apiClient, 'getSummonerIds')
            instance.getPlayers()
            expect(summonerIdsSpy).toHaveBeenCalledWith(defaultRank)
        })
    })
    describe('getMatches', () => {

        beforeEach(() => {
            clearInstance(instance)
            jest.clearAllMocks()
        })
        it('should prioritize checking the matches of the puuidQueue over the summIdQueue', async () => {
            instance['_summonerIdQueue'].push(Math.random().toString(36).slice(2))
            instance['_puuidQueue'].push(Math.random().toString(36).slice(2))
            await instance.getMatches()
            expect(instance['_checkedSummonerIds'].length).toEqual(0)
            expect(instance['_checkedPuuids'].length).toEqual(1)
        })
        it('calls getPlayers if the puuidQueue and summIdQueue are empty', async () => {
            const getPlayersSpy = jest.spyOn(instance, 'getPlayers')
            await instance.getMatches()
            expect(getPlayersSpy).toHaveBeenCalled()
        })
        it('gets more matches if the queues are empty and getPlayers still returns unchecked summonerIds', async () => {
            instance['_checkedSummonerIds'].push(Math.random().toString(36).slice(2))
            expect(instance['_matchesQueue'].length).toEqual(0)
            await instance.getMatches()
            expect(instance['_matchesQueue'].length).toBeGreaterThan(0)
        })
        it('does not get more matches if the queues are empty but getPlayers only returns checked summonerIds', async () => {
            const checkedSummonerId = Math.random().toString(36).slice(2)
            instance['_checkedSummonerIds'].push(checkedSummonerId)
            jest.spyOn(apiClient, 'getSummonerIds').mockImplementationOnce(() => Promise.resolve([{ leagueId: "test", summonerId: checkedSummonerId }]))
            expect(instance['_matchesQueue'].length).toEqual(0)
            await instance.getMatches()
            expect(instance['_matchesQueue'].length).toEqual(0)
        })
        it('doesnt add a match to the queue if its already in the checkedMatches list', async () => {
            const duplicateMatchId = Math.random().toString(36).slice(2)
            instance['_checkedMatches'].push(duplicateMatchId)
            expect(instance['_matchesQueue'].length).toEqual(0)
            const getPlayerMatchesSpy = jest.spyOn(apiClient, 'getPlayerMatches').mockImplementationOnce(() => Promise.resolve([duplicateMatchId]))
            await instance.getMatches()
            expect(instance['_matchesQueue'].length).toEqual(0)
        })
        it('successfully adds a match to the queue if its not in the checkedMatches list', async () => {
            instance['_checkedMatches'].push(Math.random().toString(36).slice(2))
            expect(instance['_matchesQueue'].length).toEqual(0)
            await instance.getMatches()
            expect(instance['_matchesQueue'].length).toBeGreaterThan(0)
        })
        it('removes summonerIds from the queue if their corresponding puuid is already in the checkedPuuid list', async () => {
            const checkedPuuid = Math.random().toString(36).slice(2)
            instance['_checkedPuuids'].push(checkedPuuid)
            jest.spyOn(apiClient, 'getPUUID').mockImplementationOnce(() => Promise.resolve(checkedPuuid))
            jest.spyOn(apiClient, 'getSummonerIds').mockImplementationOnce(() => Promise.resolve([{ leagueId: "test", summonerId: Math.random().toString(36).slice(2) }, { leagueId: "test", summonerId: Math.random().toString(36).slice(2) }]))
            const getPlayerMatchesSpy = jest.spyOn(apiClient, 'getPlayerMatches')
            await instance.getPlayers()
            expect(instance['_summonerIdQueue'].length).toEqual(2)
            expect(instance['_checkedSummonerIds'].length).toEqual(0)
            await instance.getMatches()
            //getPlayerMatches only gets called on the second summonerId because the first summonerId returns a duplicate PUUID. Also, the first summonerId is removed from the queue and put into the checked list.
            expect(getPlayerMatchesSpy).toHaveBeenCalledTimes(1)
            expect(getPlayerMatchesSpy).not.toHaveBeenCalledWith(checkedPuuid)
            expect(instance['_summonerIdQueue'].length).toEqual(0)
            expect(instance['_checkedSummonerIds'].length).toEqual(2)
        })
        it('gets no matches if we run out of summonerIds due to all of their corresponding puuids being in the checked list', async () => {
            const initialMatchQueueSize = instance['_matchesQueue'].length
            const checkedPuuid = Math.random().toString(36).slice(2)
            instance['_summonerIdQueue'].push(Math.random().toString(36).slice(2), Math.random().toString(36).slice(2))
            instance['_checkedPuuids'].push(checkedPuuid)
            jest.spyOn(apiClient, 'getPUUID').mockImplementation(() => Promise.resolve(checkedPuuid))
            const getPlayerMatchesSpy = jest.spyOn(apiClient, 'getPlayerMatches')
            await instance.getMatches()
            expect(instance['_summonerIdQueue'].length).toEqual(0)
            expect(instance['_matchesQueue'].length).toEqual(initialMatchQueueSize)
            expect(getPlayerMatchesSpy).not.toHaveBeenCalled()
        })
    })
    describe('analyzeMatch', () => {

        //mock updateVersion and updateWinrate to do nothing for these tests, or create a mock db instance through singleton or DI
        afterEach(() => {
            jest.clearAllMocks()
            clearInstance(instance)
        })
        it('should update the winrate of the client if given a more recent version', async () => {
            const matchDataResponseBiggerSecondVersionNumber = {
                metadata: { participants: [] },
                info: {
                    gameVersion: "1.2",
                    queueId: 420,
                    participants: []
                }
            }
            const matchDataResponseBiggerFirstVersionNumber = {
                metadata: { participants: [] },
                info: {
                    gameVersion: "2.1",
                    queueId: 420,
                    participants: []
                }
            }
            jest.spyOn(instance, 'updateWinrate').mockImplementationOnce(() => Promise.resolve())
            const updateVersionSpy = jest.spyOn(instance, 'updateVersion').mockImplementation(() => Promise.resolve())
            jest.spyOn(apiClient, 'getMatchData').mockImplementationOnce(() => Promise.resolve(matchDataResponseBiggerFirstVersionNumber)).mockImplementationOnce(() => Promise.resolve(matchDataResponseBiggerSecondVersionNumber))
            jest.spyOn(dbm, 'addMatch').mockImplementation(() => Promise.resolve())
            await instance.analyzeMatch(Math.random().toString(36).slice(2))
            await instance.analyzeMatch(Math.random().toString(36).slice(2))
            expect(updateVersionSpy).toHaveBeenCalledTimes(2)
        })
        it('should still analyze the match if it is on a more recent version', async () => {
            const matchDataResponseMoreRecentVersion = {
                metadata: { participants: [] },
                info: {
                    gameVersion: "1.2",
                    queueId: 420,
                    participants: [{} as MatchParticipant]
                }
            }
            const updateWinrateSpy = jest.spyOn(instance, 'updateWinrate').mockImplementationOnce(() => Promise.resolve())
            const addMatchSpy = jest.spyOn(dbm, 'addMatch').mockImplementation(() => Promise.resolve())
            jest.spyOn(apiClient, 'getMatchData').mockImplementationOnce(() => Promise.resolve(matchDataResponseMoreRecentVersion))
            await instance.analyzeMatch(Math.random().toString(36).slice(2))
            expect(updateWinrateSpy).toHaveBeenCalled()
            expect(addMatchSpy).toHaveBeenCalled()

        })
        it('should ignore non-ranked matches regardless of game version', async () => {
            const matchDataResponseEarlierVersion = {
                metadata: { participants: [] },
                info: {
                    gameVersion: "0.9",
                    queueId: 440,
                    participants: []
                }
            }
            const matchDataResponseSameVersion = {
                metadata: { participants: [] },
                info: {
                    gameVersion: "1.1",
                    queueId: 440,
                    participants: []
                }
            }
            const matchDataResponseMoreRecentVersion = {
                metadata: { participants: [] },
                info: {
                    gameVersion: "1.2",
                    queueId: 450,
                    participants: []
                }
            }
            jest.spyOn(apiClient, 'getMatchData').mockImplementationOnce(() => Promise.resolve(matchDataResponseSameVersion))
                .mockImplementationOnce(() => Promise.resolve(matchDataResponseMoreRecentVersion))
                .mockImplementationOnce(() => Promise.resolve(matchDataResponseEarlierVersion))
            const updateWinrateSpy = jest.spyOn(instance, 'updateWinrate')
            const updateVersionSpy = jest.spyOn(instance, 'updateVersion')
            await instance.analyzeMatch(Math.random().toString(36).slice(2))
            await instance.analyzeMatch(Math.random().toString(36).slice(2))
            expect(updateWinrateSpy).not.toHaveBeenCalled()
            expect(updateVersionSpy).not.toHaveBeenCalled()
        })
        it('should ignore matches from a previous version', async () => {
            const matchDataResponseSmallerFirstVersionNumber = {
                metadata: { participants: [] },
                info: {
                    gameVersion: "0.9",
                    queueId: 420,
                    participants: []
                }
            }
            const matchDataResponseSmallerSecondVersionNumber = {
                metadata: { participants: [] },
                info: {
                    gameVersion: "1.0",
                    queueId: 420,
                    participants: []
                }
            }

            jest.spyOn(apiClient, 'getMatchData').mockImplementationOnce(() => Promise.resolve(matchDataResponseSmallerFirstVersionNumber))
                .mockImplementationOnce(() => Promise.resolve(matchDataResponseSmallerSecondVersionNumber))
            const updateVersionSpy = jest.spyOn(instance, 'updateVersion')
            const updateWinrateSpy = jest.spyOn(instance, 'updateWinrate')
            await instance.analyzeMatch(Math.random().toString(36).slice(2))
            await instance.analyzeMatch(Math.random().toString(36).slice(2))
            expect(updateVersionSpy).not.toHaveBeenCalled()
            expect(updateWinrateSpy).not.toHaveBeenCalled()
        })
    })
    describe('analyzeMatches', () => {

        let analyzeMatchSpy: jest.SpyInstance
        beforeEach(() => {
            analyzeMatchSpy = jest.spyOn(instance, 'analyzeMatch').mockImplementation((matchId: string) => Promise.resolve())
        })
        afterEach(() => {
            jest.clearAllMocks()
            clearInstance(instance)
        })
        it('tries to get more matches if the queue is empty and the number of checked matches is less than MAX_MATCHES', async () => {
            const getMoreMatchesSpy = jest.spyOn(instance, 'getMatches').mockImplementationOnce(() => Promise.resolve())
            expect(instance['_checkedMatches'].length < MAX_MATCHES).toBeTruthy()
            await instance.analyzeMatches()
            expect(getMoreMatchesSpy).toHaveBeenCalled()
        })
        it('stops trying to get more matches after the first time getMatches is unable to get new matches', async () => {
            const getMoreMatchesSpy = jest.spyOn(instance, 'getMatches').mockImplementationOnce(() => Promise.resolve())
            expect(instance['_checkedMatches'].length < MAX_MATCHES).toBeTruthy()
            await instance.analyzeMatches()
            expect(getMoreMatchesSpy).toHaveBeenCalledTimes(1)
        })
        it('calls itself again if getMatches finds new matches', async () => {
            instance['_puuidQueue'].push(Math.random().toString(36).slice(2))
            jest.spyOn(instance, 'getPlayers').mockImplementationOnce(() => Promise.resolve())
            const analyzeMatchesSpy = jest.spyOn(instance, 'analyzeMatches')
            await instance.analyzeMatches()
            expect(analyzeMatchesSpy).toHaveBeenCalledTimes(2)
        })
        it('stops analyzing matches if the number of checked matches equals MAX_MATCHES', async () => {
            instance['_checkedMatches'] = new Array(MAX_MATCHES).fill("0")
            const getMatchesSpy = jest.spyOn(instance, 'getMatches')
            expect(instance['_matchesQueue'].length).toEqual(0)
            await instance.analyzeMatches()
            expect(analyzeMatchSpy).not.toHaveBeenCalled()
            expect(getMatchesSpy).not.toHaveBeenCalled()
        })
        it('calls analyzeMatch if there are matches to analyze and checked matches is less than MAX_MATCHES', async () => {
            const matchToAnalyze = Math.random().toString(36).slice(2)
            instance['_matchesQueue'].push(matchToAnalyze)
            jest.spyOn(instance, 'getMatches').mockImplementationOnce(() => Promise.resolve())
            await instance.analyzeMatches()
            expect(analyzeMatchSpy).toHaveBeenCalledWith(matchToAnalyze)
        })
    })
    describe('updateWinrate', () => {

        afterEach(() => {
            jest.clearAllMocks()
            clearInstance(instance)
        })

        it('should not add the given participants puuid to the queue if their puuid is already in the queue or checked puuids list', async () => {
            const puuidInQueue = Math.random().toString(36).slice(2)
            const checkedPuuid = Math.random().toString(36).slice(2)
            const matchParticipantInQueue = { puuid: puuidInQueue } as MatchParticipant
            const alreadyCheckedMatchParticipant = { puuid: checkedPuuid } as MatchParticipant
            instance['_puuidQueue'].push(puuidInQueue)
            instance['_checkedPuuids'].push(checkedPuuid)
            const initialQueueSize = instance['_puuidQueue'].length
            await instance.updateWinrate(matchParticipantInQueue, () => Promise.resolve())
            await instance.updateWinrate(alreadyCheckedMatchParticipant, () => Promise.resolve())
            expect(instance['_puuidQueue'].length).toEqual(initialQueueSize)
        })

        it('calls getItemData again when one of the participants items are an ornn upgraded item', async () => {
            const matchParticipant = {
                puuid: Math.random().toString(36).slice(2),
                item0: 1,
                teamPosition: ""
            } as MatchParticipant
            const addWinOrLoss = async () => {
                Promise.resolve()
            }
            const getItemDataSpy = jest.spyOn(apiClient, 'getItemData').mockImplementationOnce(() => Promise.resolve({ description: "mythic", requiredAlly: "Ornn", from: [""] } as Item))
            await instance.updateWinrate(matchParticipant, addWinOrLoss)
            expect(getItemDataSpy).toHaveBeenCalledTimes(2)
        })
        it('only calls the addWinOrLoss function once per item', async () => {
            const matchParticipant = {
                puuid: Math.random().toString(36).slice(2),
                item0: 1,
                item1: 2,
                item2: 3,
                teamPosition: ""
            } as MatchParticipant
            const addWinOrLoss = async () => {
                Promise.resolve()
            }
            const getItemDataSpy = jest.spyOn(apiClient, 'getItemData').mockImplementationOnce(() => Promise.resolve({ description: "mythic", requiredAlly: "Ornn", from: [""] } as Item))
                .mockImplementationOnce(() => Promise.resolve({ description: "mythic" } as Item))
                .mockImplementationOnce(() => Promise.resolve({ description: "", from: [""], tags: [""] } as Item))
            const addWinOrLossSpy = jest.fn(addWinOrLoss)

            await instance.updateWinrate(matchParticipant, addWinOrLossSpy)
            expect(addWinOrLossSpy).toHaveBeenCalledTimes(3)
        })
    })
})

