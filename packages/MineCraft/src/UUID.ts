import { request } from 'undici'
import type { UsernameUUID } from '..'

const base = 'https://api.mojang.com/users/profiles/minecraft/' as const

export const UUID = async (username: string): Promise<UsernameUUID | null> => {
    const { body, statusCode } = await request(`${base}${username}`)

    // Username does not exist
    if (statusCode === 204) {
        return null
    }

    return await body.json() as UsernameUUID
}