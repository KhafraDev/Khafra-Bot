CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DROP TABLE IF EXISTS kbCAH;
DROP TABLE IF EXISTS kbAPOD;
DROP TABLE IF EXISTS kbRules;
DROP TABLE IF EXISTS kbBranco;
DROP TABLE IF EXISTS kbGarrison;
DROP TABLE IF EXISTS kbStonewall;

ALTER TABLE kbGuild DROP COLUMN IF EXISTS complete_log_channel;
ALTER TABLE kbGuild DROP COLUMN IF EXISTS reactrolechannel;
ALTER TABLE kbGuild DROP COLUMN IF EXISTS rules_channel;
ALTER TABLE kbGuild DROP COLUMN IF EXISTS modRole;
ALTER TABLE kbGuild DROP COLUMN IF EXISTS prefix;
ALTER TABLE kbGuild ADD COLUMN IF NOT EXISTS ticketChannel TEXT DEFAULT NULL;
ALTER TABLE kbGuild ADD COLUMN IF NOT EXISTS "staffChannel" TEXT DEFAULT NULL;

ALTER TABLE kbGiveaways ADD COLUMN IF NOT EXISTS "didEnd" BOOLEAN DEFAULT FALSE;

DO
$do$
BEGIN
    IF (SELECT TRUE FROM information_schema.columns WHERE table_name='kbwarns' AND column_name='k_id') THEN
        ALTER TABLE kbWarns DROP COLUMN IF EXISTS k_id;
        ALTER TABLE kbWarns DROP COLUMN id;
        ALTER TABLE kbWarns ADD COLUMN id uuid DEFAULT uuid_generate_v4();
    END IF;
END
$do$;

DO
$do$
BEGIN
    IF (SELECT (CASE WHEN (pg_typeof("id") = 'uuid'::regtype) THEN FALSE ELSE TRUE END) FROM kbGuild LIMIT 1) THEN
        ALTER TABLE kbGuild DROP COLUMN IF EXISTS id;
        ALTER TABLE kbGuild ADD COLUMN id uuid DEFAULT uuid_generate_v4();
        ALTER TABLE kbGuild ADD PRIMARY KEY (id);
    END IF;
END
$do$