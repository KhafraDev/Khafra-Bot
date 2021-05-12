DROP TABLE kbRules;
DROP TABLE kbWarns;
DROP TABLE kbGuild;

CREATE TABLE IF NOT EXISTS kbGuild (
    id SERIAL PRIMARY KEY,
    guild_id TEXT NOT NULL,
    prefix TEXT DEFAULT '!!' NOT NULL,
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
    k_id SMALLINT NOT NULL,
    FOREIGN KEY (k_guild_id) REFERENCES kbGuild(guild_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS kbRules (
    id SERIAL PRIMARY KEY,
    k_guild_id TEXT NOT NULL,
    rule TEXT NOT NULL,
    rule_id SMALLINT NOT NULL,
    FOREIGN KEY (k_guild_id) REFERENCES kbGuild(guild_id) ON DELETE CASCADE
);

INSERT INTO kbGuild (
    guild_id, max_warning_points, rules_channel
) VALUES (
    '503024525076725771', 20, '688943609348882456'
) ON CONFLICT DO NOTHING;

INSERT INTO kbWarns (
    k_guild_id, k_user_id, k_id
) VALUES (
    '503024525076725771', '261575834559709184', 1
) ON CONFLICT DO NOTHING;

INSERT INTO kbWarns (
    k_guild_id, k_user_id, k_points, k_id
) VALUES (
    '503024525076725771', '261575834559709184', 4, 2
) ON CONFLICT DO NOTHING;

INSERT INTO kbRules (
    k_guild_id, rule, rule_id
) VALUES (
    '503024525076725771', 'Do not be rude, please <3', 1
) ON CONFLICT DO NOTHING;

INSERT INTO kbRules (
    k_guild_id, rule, rule_id
) VALUES (
    '503024525076725771', 'Follow all of the Discord T.O.S.!', 2
) ON CONFLICT DO NOTHING;