export interface UsernameUUID {
	name: string
	id: string
}

export interface Profile {
	id: string
	name: string
	properties: {
		name: 'textures',
		value: string
	}[]
	legacy?: true
}

export type ProfilePropertiesValue = {
	timestamp: string
	profileId: string
	profileName: string
	signatureRequired?: true
	textures: {
		[Property in 'SKIN' | 'CAPE']?: {
			url: string
		}
	}
}

export type NameHistory = [
	{ name: string },
	...{ name: string, changedToAt: number }[]
];

export const getProfile: (uuid: string) => Promise<Profile>;
export const getProfile: (uuid: string, modifier: 'SKIN' | 'CAPE') => Promise<string[]>
export const getCapes: (uuid: string) => Promise<string[]>;
export const getOptifineCape: (username: string) => Promise<ArrayBuffer | null>;
export const getSkin: (uuid: string) => Promise<string[]>;
export const getNameHistory: (uuid: string) => Promise<NameHistory>;
export const UUID: (username: string) => Promise<UsernameUUID | null>;