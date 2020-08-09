import { MongoClient } from "mongodb";

export type MongoPool = {
    pocket?: MongoClient,
    tags?: MongoClient,
    insights?: MongoClient
}