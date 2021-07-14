CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DROP TABLE IF EXISTS kbCAH;
DROP TABLE IF EXISTS kbBranco;
DROP TABLE IF EXISTS kbGarrison;
DROP TABLE IF EXISTS kbStonewall;

ALTER TABLE kbGuild ADD COLUMN IF NOT EXISTS complete_log_channel TEXT DEFAULT NULL;

DO
$do$
BEGIN
    IF (SELECT TRUE FROM information_schema.columns WHERE table_name='kbwarns' AND column_name='k_id') THEN
        ALTER TABLE kbWarns DROP COLUMN IF EXISTS k_id;
        ALTER TABLE kbWarns DROP COLUMN id;
        ALTER TABLE kbWarns ADD COLUMN id uuid DEFAULT uuid_generate_v4();
    END IF;
END
$do$