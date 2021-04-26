DROP TABLE kbWarns;
DROP TABLE kbGuild;

CREATE TABLE IF NOT EXISTS kbGuild (
    id SERIAL PRIMARY KEY,
    guild_id TEXT NOT NULL,
    max_warning_points SMALLINT,
    mod_log_channel TEXT DEFAULT NULL,
    UNIQUE (guild_id)
);

CREATE TABLE IF NOT EXISTS kbWarns (
    id SERIAL PRIMARY KEY,
    k_guild_id TEXT NOT NULL,
    k_user_id TEXT NOT NULL,
    k_points SMALLINT DEFAULT 1 NOT NULL,
    k_ts TIMESTAMP DEFAULT now(),
    FOREIGN KEY (k_guild_id) REFERENCES kbGuild(guild_id) ON DELETE CASCADE
);

INSERT INTO kbGuild (
    guild_id, max_warning_points
) VALUES (
    '503024525076725771', 20
) ON CONFLICT DO NOTHING;

INSERT INTO kbWarns (
    k_guild_id, k_user_id
) VALUES (
    '503024525076725771', '267774648622645249'
) ON CONFLICT DO NOTHING;

INSERT INTO kbWarns (
    k_guild_id, k_user_id, k_points
) VALUES (
    '503024525076725771', '267774648622645249', 4
) ON CONFLICT DO NOTHING;