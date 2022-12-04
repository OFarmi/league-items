import RiotServiceClient, { LeagueEntry, SummonerIdRequest } from "./RiotServiceClient";
import DataGathering, {MAX_MATCHES} from "./DataGathering";


const clearInstance = (instance: DataGathering) => {
    instance['_checkedSummonerIds'] = []
    instance['_checkedPuuids'] = []
    instance['_puuidQueue'] = []
    instance['_summonerIdQueue'] = []
    instance['_matchesQueue'] = []
}

describe('DataGathering', () => {

    let instance: DataGathering
    beforeAll(async () => {
        instance = await DataGathering.getInstance(apiClient)
    })
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
    describe('analyzeMatches', () => {

        let analyzeMatchSpy: jest.SpyInstance
        beforeAll(() => {
            analyzeMatchSpy = jest.spyOn(instance, 'analyzeMatch').mockImplementation(() => Promise.resolve())
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
            
        })
    })
})

