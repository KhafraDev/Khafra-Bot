import { MongoClient } from "mongodb";
import { join } from "path";
import { readFile } from "fs/promises";
import { MeepMember } from "./types/Meep";

let updated = false;
let pool: MongoClient = null;

/**
 * Check Meep database and insert documents if needed
 */
export const checkDB = async () => {
    if(updated) {
        return true;
    }

    const client = await MongoClient.connect('mongodb://localhost:27017/', {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });

    if(!pool) {
        pool = client;
    }

    const collection = client.db('khafrabot').collection('meepcraft');
    await collection.createIndex(
        { username: 1 },
        { 
            collation: {
                locale: 'en',
                strength: 2
            }
        }
    );

    if(!await collection.findOne({})) {
        // not great practice but only needs to be done once, ever
        const file = (await readFile(join(process.cwd(), 'src/lib/Backend/MeepCraft/meep.json'), { 
            encoding: 'utf-8'
        })).split('\n');
        const docs = file
            .map(f => JSON.parse(f))
            .map(q => {
                // mongo prevents sql injection by preventing $ and . from being used in keys.
                // so we gotta remove them even though mongo exports it as such.
                q.id = +q.id['$numberInt'];
                return q;
            });

        await collection.insertMany(docs);
    }

    return updated = true;
}

export const getMember = async (idOrName: string | number) => {
    if(!updated) {
        await checkDB();
    }

    const collection = pool.db('khafrabot').collection('meepcraft');
    return await collection.find<MeepMember>(
        { $or: [
            { username: idOrName },
            { id: idOrName }
        ] }
    ).collation({ locale: 'en', strength: 2 }).toArray();
}