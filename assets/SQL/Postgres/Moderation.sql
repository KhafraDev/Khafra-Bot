CREATE TABLE IF NOT EXISTS "kbReport" (
    id SERIAL PRIMARY KEY,
    reason TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "messageId" TEXT DEFAULT NULL,
    "messageChannelId" TEXT DEFAULT NULL,
    "guildId" TEXT NOT NULL,
    "targetAttachments" TEXT[] DEFAULT NULL,
    "contextAttachments" TEXT DEFAULT NULL,
    "status" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "kbCases" (
    "case" SERIAL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "targetAttachments" TEXT[] DEFAULT NULL,
    "contextAttachments" TEXT DEFAULT NULL,
    "reason" TEXT DEFAULT '',
    "staffId" TEXT DEFAULT '',
    "associatedTime" TIMESTAMP DEFAULT NULL
);
