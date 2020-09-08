import { ObjectId } from "mongodb";

export interface MeepMember {
    _id: ObjectId
    username: string
    avatar: string
    id: string
    raw: string
}