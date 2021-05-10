DROP TABLE kbRules;
DROP TABLE kbWarns;
DROP TABLE kbGuild;

CREATE TABLE IF NOT EXISTS kbGuild (
    id SERIAL PRIMARY KEY,
    guild_id TEXT NOT NULL,
    prefix TEXT DEFAULT '!' NOT NULL,
    max_warning_points SMALLINT DEFAULT 20,
    mod_log_channel TEXT DEFAULT NULL,
    welcome_channel TEXT DEFAULT NULL,
    rules_channel TEXT DEFAULT NULL,
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

CREATE TABLE IF NOT EXISTS kbRules (
    id SERIAL PRIMARY KEY,
    k_guild_id TEXT NOT NULL,
    rule TEXT NOT NULL,
    FOREIGN KEY (k_guild_id) REFERENCES kbGuild(guild_id) ON DELETE CASCADE
);

INSERT INTO kbGuild (
    guild_id, max_warning_points, rules_channel
) VALUES (
    '503024525076725771', 20, '688943609348882456'
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

INSERT INTO kbRules (
    k_guild_id, rule
) VALUES (
    '503024525076725771', 'Dont be a dick sucker'
) ON CONFLICT DO NOTHING;

INSERT INTO kbRules (
    k_guild_id, rule
) VALUES (
    '503024525076725771', 'Dont be a cuck'
) ON CONFLICT DO NOTHING;