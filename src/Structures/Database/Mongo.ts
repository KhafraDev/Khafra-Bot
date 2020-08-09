import { MongoClient } from 'mongodb';
import { MongoPool } from '../../Backend/types/Mongo';
 
const url = 'mongodb://localhost:27017';

const pool: MongoPool = Object.assign(
    Object.create(null), {
        pocket: null,
        tags: null,
        insights: null
    }
);

class MongoDB {
    client: MongoClient

    async connect() {
        if(this.client) {
            return Promise.resolve(this.client);
        }

        this.client = await MongoClient.connect(url, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        return this.client;
    }
}

for(const prop in pool) {
    pool[prop] = new MongoDB();
}

export { pool };