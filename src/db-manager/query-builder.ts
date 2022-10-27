
const dbConnect = require('pool')

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
const database = {
    retrieve: (tableName: DatabaseTables, options?: RetrieveOptions) => {
        const db = dbConnect
        const statement = `SELECT ${options?.columns || '*'} FROM ${tableName} ${options?.where ? `WHERE ${options?.where}` : ''}` + 
                           `${options?.groupBy ? `GROUP BY ${options.groupBy}` : ''}` + 
                           `${options?.having ? `HAVING ${options.having}` : ''}` + 
                           `${options?.orderBy ? `ORDER BY ${options.orderBy}` : ''}` +
                           `${options?.limit ? `LIMIT ${options.limit}` : ''}` + 
                           `${options?.offset ? `OFFSET ${options.offset}` : ''}`

        return db.query(statement, options?.params || []);
    },
    update: (tableName: DatabaseTables, values: string[], options?: RetrieveOptions ) => {
        const db = dbConnect
        const statement = `UPDATE ${tableName} SET ${values} ${options?.where ? `WHERE ${options?.where}` : ''}`
        
        return db.update(statement, options?.params)
    },
    insert: (tableName: DatabaseTables, options: RetrieveOptions) => {
        const db = dbConnect
        const statement = `INSERT INTO ${tableName} (${options.columns}) VALUES ${options.params}`

        return db.insert(statement)
    },
    delete: (tableName: DatabaseTables, options: RetrieveOptions) => {
        const db = dbConnect
        const statement = `DELETE ${tableName} ${options?.where ? `WHERE ${options.where}` : ''}`

        return db.delete(statement, options.params)
    }
}

// should show top 3 winrate items for given champ
const getWinrates = async (champ: string) => database.retrieve('winrate', {
    columns: ["item", "wins", "losses"], // could include fourth column with calculated win/loss percentage
    where: ["champion = $1"],
    params: [champ],
    orderBy: ["wins * 1.0/losses"],
    limit: 3
})

