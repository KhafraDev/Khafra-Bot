import { MongoClient } from 'mongodb';

type MongoPool = {
    [key: string]: MongoDB
}

const anonymousURL = 'mongodb://localhost:27017/';
const authURL = `mongodb://${process.env.DB_USER}:${process.env.DB_PASSWORD}@localhost:27017/`;

const pool: MongoPool = Object.assign(
    Object.create(null), {
        pocket: null,
        tags: null,
        insights: null,
        moderation: null,
        settings: null,
        commands: null
    }
);

class MongoDB {
    client: MongoClient

    async connect() {
        if(this.client) {
            return Promise.resolve(this.client);
        }

        const anonymousClient = await MongoClient.connect(anonymousURL, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        // https://stackoverflow.com/a/61921955
        const users = await anonymousClient.db('admin').command({ usersInfo: 1 });
        const admin = users.users.filter(
            (entry: { user: string; db: string; }) => entry.user === process.env.DB_USER && entry.db === 'admin'
        );

        if(admin.length > 0) {
            if(!process.env.DB_USER || !process.env.DB_PASSWORD) {
                throw new Error('No db auth given but admin user exists!');
            }

            this.client = await MongoClient.connect(authURL, {
                useNewUrlParser: true,
                useUnifiedTopology: true
            });
        } else if(admin.length === 0 && process.env.DB_USER && process.env.DB_PASSWORD) {
            const test: { ok: 0 | 1 } = await anonymousClient.db('admin').addUser(process.env.DB_USER, process.env.DB_PASSWORD, {
                roles: [ {
                    role: 'dbAdmin', db: 'admin'
                } ]
            });

            if(test.ok === 1) {
                this.client = await MongoClient.connect(authURL, {
                    useNewUrlParser: true,
                    useUnifiedTopology: true
                });
                console.log('Created new admin user and logged in!');
            } else {
                throw new Error('Couldn\'t make admin user!');
            }
        } else {
            console.log('Anonymous logins aren\'t as secure. See about making a user!');
            this.client = anonymousClient;
        }
        
        return this.client
    }
}

for(const prop in pool) {
    pool[prop] = new MongoDB();
}

export { pool, MongoDB };