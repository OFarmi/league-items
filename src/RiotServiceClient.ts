import axios, { AxiosInstance, AxiosResponse } from "axios"
import axiosRetry from 'axios-retry'
//import { request } from "express";
require("dotenv")


export type MatchDataResponse = {
    metadata: Metadata,
    info: MatchInfo
}

type Metadata = {
    participants: string[]
}

// ranked is queueId 420
export type MatchInfo = {
    gameVersion: string, //patch
    participants: MatchParticipant[],
    queueId: number //420
}

export type ItemResponse = {
    data: Item[]
}

export type Item = {
    id: number,
    name: string,
    description: string,
    into: string[],
    requiredAlly: string,
    from: string[],
    tags: string[]
}

export type MatchParticipant = {
    assists: number,
    baronKills: number,
    basicPings: number,
    bountyLevel: number,
    challenges: string,
    champExperience: number,
    champLevel: number,
    championId: number,
    championName: string,
    championTransform: number,
    consumablesPurchased: number,
    damageDealtToBuildings: number,
    damageDealtToObjectives: number,
    damageDealtToTurrets: number,
    damageSelfMitigated: number,
    deaths: number,
    detectorWardsPlaced: number,
    doubleKills: number,
    dragonKills: number,
    eligibleForProgression: boolean,
    firstBloodAssist: boolean,
    firstBloodKill: boolean,
    firstTowerAssist: boolean,
    firstTowerKill: boolean,
    gameEndedInEarlySurrender: boolean,
    gameEndedInSurrender: boolean,
    goldEarned: number,
    goldSpent: number,
    individualPosition: string,
    inhibitorKills: number,
    inhibitorTakedowns: number,
    inhibitorsLost: number,
    item0: number,
    item1: number,
    item2: number,
    item3: number,
    item4: number,
    item5: number,
    item6: number,
    itemsPurchased: number,
    killingSprees: number,
    kills: number,
    lane: string,
    largestCriticalStrike: number,
    largestKillingSpree: number,
    largestMultiKill: number,
    longestTimeSpentLiving: number,
    magicDamageDealt: number,
    magicDamageDealtToChampions: number,
    magicDamageTaken: number,
    neutralMinionsKilled: number,
    nexusKills: number,
    nexusLost: number,
    nexusTakedowns: number,
    objectivesStolen: number,
    objectivesStolenAssists: number,
    participantId: number,
    pentaKills: number,
    perks: string,
    physicalDamageDealt: number,
    physicalDamageDealtToChampions: number,
    physicalDamageTaken: number,
    profileIcon: number,
    puuid: string,
    quadraKills: number,
    riotIdName: string,
    riotIdTagline: string,
    role: string,
    sightWardsBoughtInGame: number,
    spell1Casts: number,
    spell2Casts: number,
    spell3Casts: number,
    spell4Casts: number,
    summoner1Casts: number,
    summoner1Id: number,
    summoner2Casts: number,
    summoner2Id: number,
    summonerId: string,
    summonerLevel: number,
    summonerName: string,
    teamEarlySurrendered: boolean,
    teamId: number,
    teamPosition: string,
    timeCCingOthers: number,
    timePlayed: number,
    totalDamageDealt: number,
    totalDamageDealtToChampions: number,
    totalDamageShieldedOnTeammates: number,
    totalDamageTaken: number,
    totalHeal: number,
    totalHealsOnTeammates: number,
    totalMinionsKilled: number,
    totalTimeCCDealt: number,
    totalTimeSpentDead: number,
    totalUnitsHealed: number,
    tripleKills: number,
    trueDamageDealt: number,
    trueDamageDealtToChampions: number,
    trueDamageTaken: number,
    turretKills: number,
    turretTakedowns: number,
    turretsLost: number,
    unrealKills: number,
    visionScore: number,
    visionWardsBoughtInGame: number,
    wardsKilled: number,
    wardsPlaced: number,
    win: boolean
}

export type SummonerIdRequest = {
    queue: string,
    tier: string,
    division: string
}

export type SummonerIdResponse = {
    entries: LeagueEntry[]
}

export type LeagueEntry = {
    leagueId: string,
    /*queueType: string,
    tier: string,
    rank: string,
    */summonerId: string/*,
    summonerName: string,
    leaguePoints: number,
    wins: number,
    losses: number,
    veteran: boolean,
    inactive: boolean,
    freshBlood: boolean,
    hotStreak: boolean*/
}

const head = {
    "User-Agent": "axios/1.1.3",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Charset": "application/x-www-form-urlencoded; charset=UTF-8",
    "Origin": "https://developer.riotgames.com"
}
export default class RiotServiceClient {
    private _axios_api: AxiosInstance;
    private _axios_cdn: AxiosInstance;
    private _axios_api_matches: AxiosInstance

    constructor() {
        // can put X-Riot-Token: API_KEY in header instead of appending it to each link
        this._axios_api = axios.create({
            baseURL: "https://na1.api.riotgames.com/lol",
            headers: {
                "X-Riot-Token": process.env.RIOT_API_KEY!
            }
        })

        this._axios_api_matches = axios.create({
            baseURL: "https://americas.api.riotgames.com/lol",
            headers: {
                "X-Riot-Token": process.env.RIOT_API_KEY!
            }
        })

        axiosRetry(this._axios_api, {
            retries: 3,
            retryDelay: (retryCount) => {
                console.log(`retry attempt: ${retryCount}`)
                return retryCount * 1000;
            },
            retryCondition: (error) => {
                return [429, 500, 503].includes(error.response?.status as number)
            }
        })

        axiosRetry(this._axios_api_matches, {
            retries: 3,
            retryDelay: (retryCount) => {
                console.log(`retry attempt: ${retryCount}`)
                return retryCount * 1000;
            },
            retryCondition: (error) => {
                return [429, 500, 503].includes(error.response?.status as number)
            }
        })

        this._axios_cdn = axios.create({
            baseURL: "https://ddragon.leagueoflegends.com/cdn"
        })
    }


    async getCurrentPatch(): Promise<string> {
        let patchCall: AxiosResponse<string[]> = await axios.get<string[]>("https://ddragon.leagueoflegends.com/api/versions.json")
        return patchCall.data[0]
    }

    async getSummonerIds(requestData: SummonerIdRequest): Promise<LeagueEntry[]> {
        const response: AxiosResponse<LeagueEntry[]> = await this._axios_api.get<LeagueEntry[]>(`/league-exp/v4/entries/${requestData.queue}/${requestData.tier}/${requestData.division}?page=1`)
        //console.log(response.data)
        //response.data[0]
        // CAN CHANGE TO return response.data.map(e => e.summonerId) if want to lower LeagueEntry clutter
        return response.data
    }

    
    async getPUUID(summonerId: string): Promise<string> {
        // leaving as AxiosResponse object lets you access the property names
        const response: AxiosResponse = await this._axios_api.get(`summoner/v4/summoners/${summonerId}`)
        return response.data.puuid
    }
    
    // put list of matches into a set so there are no copies
    async getPlayerMatches(puuid: string): Promise<string[]> {
        const response: AxiosResponse<string[]> = await this._axios_api_matches.get<string[]>(`match/v5/matches/by-puuid/${puuid}/ids?start=0&count=20`)
        return response.data
    }
    
    // get each player from the match, and add into a DB(?) whether it was a win or loss for each given item.
    async getMatchData(matchId: string): Promise<MatchDataResponse> {
        const response: AxiosResponse<MatchDataResponse> = await this._axios_api_matches.get<MatchDataResponse>(`match/v5/matches/${matchId}`)
        return response.data
    }

    async getChampionList(patch: string): Promise<string[]> {
        const response: AxiosResponse = await this._axios_cdn.get(`/${patch + ".1"}/data/en_US/champion.json`)
        return Object.getOwnPropertyNames(response.data.data)
    }

    async getItemCodeList(patch: string): Promise<string[]> {
        const response: AxiosResponse = await this._axios_cdn.get(`/${patch + ".1"}/data/en_US/item.json`)
        return Object.getOwnPropertyNames(response.data.data)
    }

    async getItemNameList(patch: string): Promise<string[][]> {
        const response: AxiosResponse<ItemResponse> = await this._axios_cdn.get<ItemResponse>(`/${patch + ".1"}/data/en_US/item.json`)
        return Object.entries(response.data.data).map(([k, v]) => [k, v.name])
    }

    async getItemData(patch: string, item: number): Promise<Item> {
        const response: AxiosResponse<ItemResponse> = await this._axios_cdn.get<ItemResponse>(`/${patch + ".1"}/data/en_US/item.json`)
        const reply = Object.entries(response.data.data).find(([k,v]) => parseInt(k) === item)
        //console.log(item + " " + reply![1].name)
        reply![1].id = item

        return reply![1]
    }

    //unsure if necessary in backend
    //async getChampionImage(champion: string)
}
