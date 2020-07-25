export type reacts = {
    id: string;
    emoji:  string;
    chance: string;      
};

export type react_messages = {
    id: string;
    content: string;
    emoji: string;
    role: string;
};

export interface dbGuild {
    id: string;
    owner_id: string; 
    custom_commands: any, // not yet implemented 
    reacts: reacts[];
    react_messages: react_messages[];
    prefix: string;
}