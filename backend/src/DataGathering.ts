import RiotServiceClient, { LeagueEntry, MatchDataResponse, MatchParticipant, SummonerIdRequest, Item, ItemSignatures } from "./RiotServiceClient"
import { addLoss, addMatch, addWin, getMatches, resetWinrates } from "./db-manager/dbm";

const MAX_MATCHES = 400

export default class DataGathering {
    // could make matches/summids/puuids objects that have a "checked" property
    private _matches: string[] = []

    private _checkedMatches: string[] = []

    private _checkedSummonerIds: string[] = []

    private _summonerIdQueue: string[] = []

    private _puuidQueue: string[] = []

    private _checkedPuuids: string[] = []

    private _apiClient: RiotServiceClient

    private _currentVersion: string
    
    private static _instance: DataGathering;

    private constructor(apiClient: RiotServiceClient, currentVersion: string, matches: string[]) {
        this._apiClient = apiClient
        this._currentVersion = currentVersion
        this._checkedMatches = matches
    }

    private static async create() {
        const apiClient: RiotServiceClient = new RiotServiceClient()
        const currentVersion: string = (await apiClient.getCurrentVersion()).split(".", 2).join(".")
        const checkedMatches: string[] = await getMatches(currentVersion) // 
        // turns patch into only the first 2 numbers because match API returns extra numbers
        this._instance = new DataGathering(apiClient, currentVersion, checkedMatches)
    }

    static async getInstance(): Promise<DataGathering> {
        if (!this._instance) {
            await this.create()
        }
        return this._instance
    }

    /**
     * Gets the initial batch of players from Challenger and adds them into the queue if they haven't already been checked
     */
    async getPlayers() {
        // TODO: add some functionality for choosing new ranks or just loop through ranks
        // would mean labeling wins/losses with rank?
        const defaultRank: SummonerIdRequest = {
            queue: "RANKED_SOLO_5x5",
            tier: "CHALLENGER",
            division: "I"
        }
        //-> next rank if none left

        const summonerIds: LeagueEntry[] = await this._apiClient.getSummonerIds(defaultRank)
        summonerIds.forEach(summoner => {
            if (!this._summonerIdQueue.includes(summoner.summonerId) && !this._checkedSummonerIds.includes(summoner.summonerId)) {
                this._summonerIdQueue.push(summoner.summonerId)
            }
        })

        if (this._summonerIdQueue.length == 0) {

        }
    }

    /**
     * Gets matches from the PUUID queue if not empty, if empty then from the summonerIdQueue if not empty, if empty then get new summonerIds and try again.
     */
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

    /**
     * Analyzes matches until MAX_MATCHES have been checked
     */
    async analyzeMatches() {
        while (this._matches.length > 0 && (this._checkedMatches.length < MAX_MATCHES)) {
            console.log(`are currently on ${this._matches.length}`)
            const matchToCheck = this._matches.shift()
            await this.analyzeMatch(matchToCheck!)
        }

        if (this._checkedMatches.length < MAX_MATCHES) {
            await this.getMatches()
            await this.analyzeMatches()
        } else {
            console.log("checked enough matches")
        }
    }

    // adds match wins/losses for each participant's champion and their items into db
    /**
     * If this match is on the most recent game version, analyze each participant's champion and items and add data to db.
     * If any of the other 9 participants haven't yet been added to the queue or checked, add them to the puuidQueue.
     * @param matchId 
     */
    async analyzeMatch(matchId: string) {
        const matchResponse: MatchDataResponse = await this._apiClient.getMatchData(matchId)

        const { info } = matchResponse
        const patch = info.gameVersion.split(".", 2).join(".")
        if (patch !== this._currentVersion || info.queueId != 420) {
            if (patch > this._currentVersion) {
                this.updateVersion(patch)
            } else {
                return
            }
            
        }

        matchResponse.metadata.participants.forEach(participantId => {
            if (!this._puuidQueue.includes(participantId) && !this._checkedPuuids.includes(participantId)) {
                this._puuidQueue.push(participantId)
            }
        })

        const { participants }: {participants: MatchParticipant[]} = info

        // first 5 participants in the list are always the winners
        const winners: MatchParticipant[] = participants.slice(0,5)
        const losers: MatchParticipant[] = participants.slice(5)

        for (const winner of winners) {
            // dont await these, analyzeMatch gets awaited so there won't be a same champ/item combo between winners and losers
            this.updateWinrate(winner, addWin)
        }
        
        for (const loser of losers) {
            this.updateWinrate(loser, addLoss)
        }
        this._checkedMatches.push(matchId)
        addMatch(matchId, patch)
    }

    /**
     * Updates the client to a more recent version. 
     * The matches checked thus far and winrates aggregated will be cleared because they were on a past version.
     * @param version new version
     */
    async updateVersion(version: string) {
        this._currentVersion = version
        this._checkedMatches = []
        await resetWinrates()
    }

    /**
     * Used to determine if this._currentVersion should be updated
     * @returns the latest version according to 3rd party RG API
     */
    async getLatestVersion(): Promise<string> {
        return await this._apiClient.getCurrentVersion()
    }

    /**
     * Checks a single player's champion and items and adds wins or losses in the db.
     * @param player to have their champion and items analyzed
     * @param fn either addWin or addLoss
     */
    async updateWinrate(player: MatchParticipant, addWinOrLoss: (...args: any[]) => Promise<void>) {
        if (!this._puuidQueue.includes(player.puuid)) {
            this._puuidQueue.push(player.puuid)
        }

        const itemNumbers = [player.item0, player.item1, player.item2, player.item3, player.item4, player.item5, player.item6].filter(item => item)
        const items: Item[] = await Promise.all(itemNumbers.map(itemNumber => this._apiClient.getItemData(this._currentVersion, itemNumber)))
        for (const item of items) {
            const isMythic: boolean = item.description.toLowerCase().includes("mythic")
            const isLegendary: boolean = !isMythic && !item.tags.includes("Consumable") && (!item.into && !!item.from)
            if (isMythic) {
                if (item.requiredAlly) {
                    const mythic = await this._apiClient.getItemData(this._currentVersion, parseInt(item.from![0]))
                    await addWinOrLoss(player.championName, mythic.id, mythic.name, player.teamPosition.toLowerCase(), isMythic, isLegendary)
                } else {
                    await addWinOrLoss(player.championName, item.id, item.name, player.teamPosition.toLowerCase(), isMythic, isLegendary)
                }
            }
            else if (isLegendary) {
                await addWinOrLoss(player.championName, item.id, item.name, player.teamPosition.toLowerCase(), isMythic, isLegendary)
            }
        }
    }

    /**
     * 
     * @returns An index signature of each item id pointing to its item's data
     */
    async getItemData(): Promise<ItemSignatures> {
        return await this._apiClient.getItemsData(this._currentVersion)
    }

    /**
     * 
     * @returns A list of champion names
     */
    async getChampionNames(): Promise<string[]> {
        return await this._apiClient.getChampionList(this._currentVersion)
    }

    /**
     * A list of all match IDs that have been checked
     */
    get getCheckedMatches(): string[] {
        return [...this._checkedMatches]
    }

    /**
     * A list of summoner IDs that have been checked
     */
    get getCheckedSummonerIds(): string[] {
        return [...this._checkedSummonerIds]
    }

    /**
     * A list of puuids that have been checked
     */
    get getCheckedPuuids(): string[] {
        return [...this._checkedPuuids]
    }

}