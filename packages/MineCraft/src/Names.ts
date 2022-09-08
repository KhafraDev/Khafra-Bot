import { request } from 'undici'
import type { NameHistory } from '..'

const base = 'https://api.mojang.com/user/profiles/' as const

export const getNameHistory = async (uuid: string): Promise<NameHistory> => {
    const { body } = await request(`${base}${uuid}/names`)
    return await body.json() as NameHistory
}