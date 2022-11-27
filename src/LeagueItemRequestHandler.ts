import { getWinrates } from "./db-manager/dbm";
import { Item } from "./RiotServiceClient";
import DataGathering from "./DataGathering";

export type ChampionWinrateResponse = {
    item_name: string,
    item_id: number,
    champion: string,
    winrate: number,
}



export async function championWinrateHandler(championName: string): Promise<ChampionWinrateResponse[]> {
    return (await getWinrates(championName)).filter(winrate => winrate.wins! + winrate.losses! > 0).map(winrate => ({
        item_name: winrate.item_name,
        item_id: winrate.item_id,
        champion: winrate.champion,
        winrate: +((winrate.wins!)/(winrate.wins! + winrate.losses!) * 100).toFixed(2)
    })).sort((a,b) => a.winrate - b.winrate).reverse()
}

export async function itemDataHandler(): Promise<Item> {
    const dataClient: DataGathering = await DataGathering.getInstance()
    return await dataClient.getItemData()
}

export async function updateVersionHandler(version: string) {
    const dataClient: DataGathering = await DataGathering.getInstance()
    dataClient.updateVersion(version)
    await dataClient.analyzeMatches()
}