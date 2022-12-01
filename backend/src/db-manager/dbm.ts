import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

export type Winrate = {
    champion: string,
    item_id: number,
    wins: number | null,
    losses: number | null,
    item_name: string
}

// add optional role option
export async function getWinrates(champion: string): Promise<Winrate[]> {
    const winrates: Winrate[] = await prisma.winrates.findMany({
        where: {
            champion: champion,
            // bandaid for no boots
            AND: [ 
                {
                    item_name: {
                        not: {
                            contains: "Boots",
                        }
                    }
                },
                {
                    item_name: {
                        not: {
                            contains: "Greaves",
                        }
                    }
                },
                {
                    item_name: {
                        not: {
                            contains: "Steelcaps",
                        }
                    }
                },
                {
                    item_name: {
                        not: {
                            contains: "Shoes",
                        }
                    }
                },
                {
                    item_name: {
                        not: {
                            contains: "Treads",
                        }
                    }
                }
            ]
        },
        take: 5,
    })
    return winrates
}

// this should have item ID and item name for ease of access for frontend
export async function addWin(champion: string, itemId: number, itemName: string, championPosition: string, itemMythic: boolean, itemLegendary: boolean): Promise<any> {
    try {
        return await prisma.winrates.upsert({
            select: {
                item_id: true,
            },
            where: {
                champion_item_id: {
                    champion: champion,
                    item_id: itemId
                }
            },
            update: {
                wins: {
                    increment: 1
                },
                [championPosition]: {
                    increment: 1
                } 
            },
            create: {
                champion: champion,
                item_id: itemId,
                item_name: itemName
            }
        });
    } catch (e) {
        // this means we're adding a new item or champion
        if (e instanceof Prisma.PrismaClientKnownRequestError) {
            if (e.code === 'P2003') {
                const msg = e.message.split(' ').slice(-2,-1)[0]
                if (msg.includes("champion")) {
                    await addChamp(champion)
                } else {
                    await addItem(itemId, itemName, itemMythic, itemLegendary)
                }
                return await addWin(champion, itemId, itemName, championPosition, itemMythic, itemLegendary)
            }
        }
        else {
            console.log(e)
        }
    }
    
}

export async function addLoss(champion: string, itemId: number, itemName: string, championPosition: string, itemMythic: boolean, itemLegendary: boolean) {
    try {
        await prisma.winrates.upsert({
            where: {
                champion_item_id: {
                    champion: champion,
                    item_id: itemId
                }
            },
            update: {
                losses: {
                    increment: 1
                },
                [championPosition]: {
                    increment: 1
                } 
            },
            create: {
                champion: champion,
                item_id: itemId,
                item_name: itemName
            }
        });
    } catch (e) {
        // this means we're adding a new item or champion
        if (e instanceof Prisma.PrismaClientKnownRequestError) {
            if (e.code === 'P2003') {
                const msg = e.message.split(' ').slice(-2,-1)[0]
                if (msg.includes("champion")) {
                    await addChamp(champion)
                } else {
                    await addItem(itemId, itemName, itemMythic, itemLegendary)
                }
                await addLoss(champion, itemId, itemName, championPosition, itemMythic, itemLegendary)
            }
        }
    }
    
}

export async function addChamp(champion: string) {
    await prisma.champions.create({
        data: {
            name: champion
        }
    })
}

export async function addItem(id: number, name: string, itemMythic: boolean, itemLegendary: boolean) {
    await prisma.items.create({
        data: {
            id: id,
            name: name,
            mythic: itemMythic,
            legendary: itemLegendary
        }
    })
}

// not real total
export async function totalMatches(): Promise<number> {
    const winsAndLosses = await prisma.winrates.aggregate({
        _sum: {
            wins: true,
            losses: true,
        },
    })
    return winsAndLosses._sum.wins! + winsAndLosses._sum.losses!
}

export async function addMatch(id: string, patch: string) {
    await prisma.matches.create({
        data: {
            id: id,
            patch: patch
        }
    })
}

export async function getMatches(patch: string): Promise<string[]> {
    const matches = await prisma.matches.findMany({
        where: {
            patch: patch
        }
    })
    return matches.map(match => match.id)
}

export async function resetWinrates() {
    await prisma.winrates.deleteMany({})
}