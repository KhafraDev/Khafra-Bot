import { Snowflake } from 'discord.js';
import { pool } from '../../Structures/Database/Postgres.js';
import { Ipsum_Account } from '../types/Ipsum.d';

export enum AccountOptions {
    CREATE = 'create',
    DELETE = 'delete'
}

export class IpsumAccount {
    /**
     * Creates an account for the user
     * @param id the user's Discord id
     */
    static async create(
        id: Snowflake
    ): Promise<Pick<Ipsum_Account, 'playerid'> | null> {
        const { rows } = await pool.query<Pick<Ipsum_Account, 'playerid'>>(`
            INSERT INTO kbIpsum (
                userId
            ) VALUES (
                $1::VARCHAR
            ) 
            ON CONFLICT (userId) DO NOTHING
            RETURNING playerId;
        `, [id]);

        return rows[0] ?? null;
    }

    static async delete(
        id: Snowflake
    ): Promise<Pick<Ipsum_Account, 'playerid'> | null> {
        const { rows } = await pool.query<Pick<Ipsum_Account, 'playerid'>>(`
            DELETE FROM kbIpsum
            WHERE userId = $1::VARCHAR
            RETURNING playerId;
        `, [id]);

        return rows[0] ?? null;
    }
}