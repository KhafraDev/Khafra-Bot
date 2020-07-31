import { MongoClient } from 'mongodb';
 
const url = 'mongodb://localhost:27017';
 
// Use connect method to connect to the server
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

const mongo = new MongoDB();

export {
    mongo as Mongo
}