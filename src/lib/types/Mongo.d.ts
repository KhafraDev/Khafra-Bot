import { MongoDB } from '../../Structures/Database/Mongo';

export type MongoPool = {
    [key: string]: MongoDB
}