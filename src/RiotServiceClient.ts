import axios, { AxiosInstance, AxiosResponse } from "axios"
//import { request } from "express";
require("dotenv")


export type MatchDataResponse = {
    participantIds: string[],
    info: MatchInfo
}

// ranked is queueId 420
export type MatchInfo = {
    gameVersion: string,
    participants: MatchParticipant[],
    queueId: number
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

export default class RiotServiceClient {
    private _axios: AxiosInstance;

    constructor() {
        this._axios = axios.create({
            baseURL: "https://na1.api.riotgames.com/lol"
        })
    }

    async getSummonerId(requestData: SummonerIdRequest): Promise<LeagueEntry[]> {
        const response: AxiosResponse<LeagueEntry[]> = await this._axios.get<LeagueEntry[]>(`/league-exp/v4/entries/${requestData.queue}/${requestData.tier}/${requestData.division}?page=1&api_key=${process.env.RIOT_API_KEY}`)
        //response.data[0]
        // CAN CHANGE TO return response.data.map(e => e.summonerId) if want to lower LeagueEntry clutter
        return response.data
    }

    
    async getPUUID(summonerId: string): Promise<string> {
        // leaving as AxiosResponse object lets you access the property names
        const response: AxiosResponse = await this._axios.get(`summoner/v4/summoners/${summonerId}?api_key=${process.env.RIOT_API_KEY}`)
        return response.data.puuid
    }
    
    // put list of matches into a set so there are no copies
    async getPlayerMatches(puuid: string): Promise<string[]> {
        const response: AxiosResponse<string[]> = await this._axios.get<string[]>(`match/v5/matches/by-puuid/${puuid}/ids?start=0&count=20?api_key=${process.env.RIOT_API_KEY}`)
        return response.data
    }
    
    // get each player from the match, and add into a DB(?) whether it was a win or loss for each given item.
    async getMatchData(matchId: string): Promise<MatchDataResponse> {
        const response: AxiosResponse<MatchDataResponse> = await this._axios.get<MatchDataResponse>(`match/v5/matches/${matchId}?api_key=${process.env.RIOT_API_KEY}`)
        return response.data
    }
}
