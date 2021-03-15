CREATE TABLE IF NOT EXISTS kbGarrison (
    comic_key SERIAL PRIMARY KEY,
    href TEXT UNIQUE NOT NULL,
    link TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS kbStonewall (
    comic_key SERIAL PRIMARY KEY,
    href TEXT UNIQUE NOT NULL,
    link TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS kbBranco (
    comic_key SERIAL PRIMARY KEY,
    href TEXT UNIQUE NOT NULL,
    link TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL
);