import RiotServiceClient, { LeagueEntry, MatchDataResponse, MatchParticipant, SummonerIdRequest, Item } from "./RiotServiceClient"
import { addLoss, addMatch, addWin, getMatches } from "./db-manager/dbm";

export default class DataGathering {
    // could make matches/summids/puuids objects that have a "checked" property
    private _matches: string[] = []

    private _checkedMatches: string[] = []

    private _checkedSummonerIds: string[] = []

    private _summonerIdQueue: string[] = []

    private _puuidQueue: string[] = []
    // used to add the 

    private _checkedPuuids: string[] = []

    private _apiClient: RiotServiceClient

    private _currentPatch: string
    
    constructor(apiClient: RiotServiceClient, currentPatch: string, matches: string[]) {
        this._apiClient = apiClient
        this._currentPatch = currentPatch
        this._checkedMatches = matches
    }

    static async create() {
        const apiClient: RiotServiceClient = new RiotServiceClient()
        const currentPatch: string = (await apiClient.getCurrentPatch()).split(".", 2).join(".")
        const checkedMatches = await getMatches(currentPatch) // 
        // turns patch into only the first 2 numbers because match API returns extra numbers
        return new DataGathering(apiClient, currentPatch, checkedMatches)
    }

    // essentially must be the first function run for each new patch
    // if not a new patch, we should constantly have a new batch of player PUUIDs to go through that are added from each subsequent match that is analyzed.
    // 
    async getPlayers() {
        // TODO: add some functionality for choosing new ranks or just loop through ranks
        // would mean labeling wins/losses with rank?
        const defaultRank: SummonerIdRequest = {
            queue: "RANKED_SOLO_5x5",
            tier: "CHALLENGER",
            division: "I"
        }

        const summonerIds: LeagueEntry[] = await this._apiClient.getSummonerIds(defaultRank)
        summonerIds.forEach(summoner => {
            // should add PUUIDs, not summoner IDs. this is because new PUUIDs can be found from each match, and using PUUID skips one step vs summoner IDS
            if (!this._summonerIdQueue.includes(summoner.summonerId) && !this._checkedSummonerIds.includes(summoner.summonerId)) {
                this._summonerIdQueue.push(summoner.summonerId)
            }
        })
    }

    async getMatches() {
        let matches: string[] = []
        if (this._puuidQueue.length > 0) {
            const puuidToAnalyze = this._puuidQueue.shift()
            matches = await this._apiClient.getPlayerMatches(puuidToAnalyze!)
            console.log("new matches from puuid")
            this._checkedPuuids.push(puuidToAnalyze!)
        } else if (this._summonerIdQueue.length > 0) {
            // instead of awaiting the puuid, could create a player object that holds summID AND puuid
            // can do this by making the getPUUID function return an object with those params instead of just the puuid.
            while (this._summonerIdQueue.length > 0 && this._checkedPuuids.includes(await this._apiClient.getPUUID(this._summonerIdQueue[0]))) {
                this._checkedSummonerIds.push(this._summonerIdQueue.shift()!)
                console.log("checked summoners:" + this._checkedSummonerIds)
            }
            if (this._summonerIdQueue.length === 0) {
                //get new batch of summIds from a new tier/division
            } else {
                const summonerToAnalyze = this._summonerIdQueue.shift()
                matches = await this._apiClient.getPlayerMatches(await this._apiClient.getPUUID(summonerToAnalyze!))
                console.log(matches)
                this._checkedSummonerIds.push(summonerToAnalyze!)
            }
            
        } else { // possibility of infinite loop if we can't get any new summids/puuids
            await this.getPlayers()
            // if no new
            await this.getMatches()
            return
        }
        matches.forEach(match => {
            if (!this._matches.includes(match) && !this._checkedMatches.includes(match)) {
                console.log("pushing match" + match)
                this._matches.push(match)
            }
        })
    }

    async analyzeMatches() {
        while (this._matches.length > 0 && (this._checkedMatches.length < 200)) {
            console.log(`are currently on ${this._matches.length}`)
            const matchToCheck = this._matches.shift()
            await this.analyzeMatch(matchToCheck!)
            //this._checkedMatches.push(matchToCheck!)
        }

        if (this._checkedMatches.length < 200) {
            await this.getMatches()
            await this.analyzeMatches()
            return
        }
        console.log("checked enough matches")
    }

    // adds match wins/losses for each participant's champion and their items into db
    async analyzeMatch(matchId: string) {
        const matchResponse: MatchDataResponse = await this._apiClient.getMatchData(matchId)

        const { info } = matchResponse
        const patch = info.gameVersion.split(".", 2).join(".")
        // TODO: add functionality that updates patch if gameVersion > currentPatch
        if (patch !== this._currentPatch || info.queueId != 420) {
            return
        }

        matchResponse.metadata.participants.forEach(participantId => {
            if (!this._puuidQueue.includes(participantId)) {
                this._puuidQueue.push(participantId)
            }
        })

        const { participants }: {participants: MatchParticipant[]} = info

        const winners: MatchParticipant[] = participants.slice(0,5)
        const losers: MatchParticipant[] = participants.slice(5)

        for (const winner of winners) {
            if (!this._puuidQueue.includes(winner.puuid)) {
                console.log("should never be hit")
                this._puuidQueue.push(winner.puuid)
            }

            const itemNumbers = [winner.item0, winner.item1, winner.item2, winner.item3, winner.item4, winner.item5, winner.item6].filter(item => item)
            const items: Item[] = await Promise.all(itemNumbers.map(itemNumber => this._apiClient.getItemData(this._currentPatch, itemNumber)))
            for (const item of items) {
                const isMythic: boolean = item.description.toLowerCase().includes("mythic")
                const isLegendary: boolean = (!isMythic) && (!item.tags.includes("Consumable")) && (!item.into && !!item.from)
                if (isMythic) {
                    if (item.requiredAlly) {
                        const mythic = await this._apiClient.getItemData(this._currentPatch, parseInt(item.from[0]))
                        await addWin(winner.championName, mythic.id, mythic.name, winner.teamPosition.toLowerCase(), isMythic, isLegendary)
                    } else {
                        await addWin(winner.championName, item.id, item.name, winner.teamPosition.toLowerCase(), isMythic, isLegendary)
                    }
                }
                else if (isLegendary) {
                    await addWin(winner.championName, item.id, item.name, winner.teamPosition.toLowerCase(), isMythic, isLegendary)
                }
            }
        }

        for (const loser of losers) {
            if (!this._puuidQueue.includes(loser.puuid)) {
                this._puuidQueue.push(loser.puuid)
            }

            const itemNumbers = [loser.item0, loser.item1, loser.item2, loser.item3, loser.item4, loser.item5, loser.item6].filter(item => item)
            const items: Item[] = await Promise.all(itemNumbers.map(itemNumber => this._apiClient.getItemData(this._currentPatch, itemNumber)))
            for (const item of items) {
                const isMythic: boolean = item.description.toLowerCase().includes("mythic")
                const isLegendary: boolean = !isMythic && !item.tags.includes("Consumable") && (!item.into && !!item.from)
                if (isMythic) {
                    if (item.requiredAlly) {
                        const mythic = await this._apiClient.getItemData(this._currentPatch, parseInt(item.from[0]))
                        await addLoss(loser.championName, mythic.id, mythic.name, loser.teamPosition.toLowerCase(), isMythic, isLegendary)
                    } else {
                        await addLoss(loser.championName, item.id, item.name, loser.teamPosition.toLowerCase(), isMythic, isLegendary)
                    }
                }
                else if (isLegendary) {
                    await addLoss(loser.championName, item.id, item.name, loser.teamPosition.toLowerCase(), isMythic, isLegendary)
                }
            }
        }
        this._checkedMatches.push(matchId)
        addMatch(matchId, patch)

    }

    get getCheckedMatches(): string[] {
        return [...this._checkedMatches]
    }

    get getCheckedSummonerIds(): string[] {
        return [...this._checkedSummonerIds]
    }

    get getCheckedPuuids(): string[] {
        return [...this._checkedPuuids]
    }
}