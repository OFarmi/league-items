
//const {pool} = require('./db-manager.ts')
const db = require('./db-manager.ts')

interface IChampions {
    name: string;
    top: number;
    jungle: number;
    middle: number;
    bottom: number;
    utility: number;
}

interface IItems {
    name: number;
    mythic: boolean;
    legendary: boolean;
}

interface IWinrates {
    champion: string;
    item: number;
    wins: number;
    losses: number;
}


type DatabaseTables = "champion" | "item" | "winrate"

type RetrieveOptions = {
    columns?: (keyof IChampions | keyof IItems | keyof IWinrates)[];
    where?: string[];
    params?: (string|number)[];
    groupBy?: RetrieveOptions["columns"];
    having?: string[];
    orderBy?: string[];
    limit?: number;
    offset?: number;
}

/**
 * 
 */
//const database = {
    //retrieve: async (tableName: DatabaseTables, options?: RetrieveOptions) => {
    async function retrieve(tableName: DatabaseTables, options?: RetrieveOptions) {
        //const db = dbConnect
        const statement = `SELECT ${options?.columns?.join(", ") || '*'} FROM ${tableName} ${options?.where ? `WHERE ${options?.where.join(" AND ")} ` : ''}` + 
                           `${options?.groupBy ? `GROUP BY ${options.groupBy} ` : ''}` + 
                           `${options?.having ? `HAVING ${options.having} ` : ''}` + 
                           `${options?.orderBy ? `ORDER BY ${options.orderBy.join(", ")} ` : ''}` +
                           `${options?.limit ? `LIMIT ${options.limit} ` : ''}` + 
                           `${options?.offset ? `OFFSET ${options.offset} ` : ''};`
        console.log(statement)
        return db.query(statement, options?.params || []);
    }//,
    //update: async (tableName: DatabaseTables, values: string[], options?: RetrieveOptions ) => {
    async function update(tableName: DatabaseTables, values: string[], options?: RetrieveOptions ){
        //const db = dbConnect
        const statement = `UPDATE ${tableName} SET ${values.join(", ")} ${options?.where ? `WHERE ${options?.where.join(" AND ")}` : ''};`
        console.log(statement)
        try {
            const ret = db.query(statement, options?.params || [])
            return ret
        } catch (error) {

        }
    }//,
    //insert: async (tableName: DatabaseTables, options: RetrieveOptions) => {
    async function insert(tableName: DatabaseTables, options: RetrieveOptions){
        //const db = dbConnect
        const statement = `INSERT INTO ${tableName} (${options.columns}) VALUES ${options.where};`

        console.log(statement)
        return db.query(statement, options.params)
    }//,
    //insertIfNotExists: async (tableName: DatabaseTables, options: RetrieveOptions) => {
    async function insertIfNotExists(tableName: DatabaseTables, options: RetrieveOptions){
        //const db = dbConnect
        const statement = `INSERT INTO ${tableName} (${options.columns?.join(", ")}) SELECT ${options.params?.join()}` + 
                            ` WHERE NOT EXISTS (SELECT 1 FROM ${tableName} WHERE ${options.where?.join(" AND ")});`
        console.log(statement)
        return db.query(statement, options.params)
    }//,
    async function upsert(tableName: DatabaseTables, values: string[], options:RetrieveOptions) {
        const statement = `INSERT INTO ${tableName} (${options.columns?.join(', ')}) VALUES (${options.params?.join(', ')}) ON CONFLICT (${options.columns?.slice(0,2).join()}) DO UPDATE SET ${values.join(', ')};`

        console.log(statement)
        return db.query(statement)
    }
    //delete: async (tableName: DatabaseTables, options: RetrieveOptions) => {
    async function dlt(tableName: DatabaseTables, options: RetrieveOptions){
        //const db = dbConnect
        const statement = `DELETE ${tableName} ${options?.where ? `WHERE ${options.where.join(", ")}` : ''};`

        try {
            return db.query(statement, options.params)
        } catch (error) {

        }
        
    }
    
//}

// should show top 3 winrate items for given champ
export const getWinrates = async (champ: string) => retrieve('winrate', {
    columns: ["item", "wins", "losses"], // could include fourth column with calculated win/loss percentage
    where: ["champion = $1"],
    params: [champ],
    orderBy: ["wins * 1.0/losses"],
    limit: 3
})

export const addWin = async(champ: string, item: number) => {
    upsert('winrate', ["wins = winrate.wins + 1"], {
        columns: ["champion", "item", "wins", "losses"],
        where: ["champion = $1", "item = $2"],
        params: ["\'" + champ + "\'", "\'"+ item + "\'", 1, 0]
    })
}

export const addLoss = async(champ: string, item: number) => {
    update('winrate', ["losses = losses + 1"], {
        where: ["champion = $1", "item = $2"],
        params: [champ, item]
    })
    insertIfNotExists('winrate', {
        columns: ["champion", "item", "wins", "losses"],
        where: ["champion = $1", "item = $2"],
        params: [champ, item, 0, 1]
    })
}

export const addChamp = async(champ: string) => {
    insert('champion', {
        columns: ["name"],
        where: ["$1:name"],
        params: [champ]
    })
}

export const addItem = async(item: number) => {
    insert('item', {
        columns: ["name"],
        params: [item]
    })
}