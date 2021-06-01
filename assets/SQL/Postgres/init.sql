CREATE TABLE IF NOT EXISTS kbCAH (
    comic_key SERIAL PRIMARY KEY,
    href TEXT UNIQUE NOT NULL,
    link TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS kbBible (
    idx SERIAL PRIMARY KEY,
    book TEXT NOT NULL,
    chapter INT NOT NULL,
    verse INT NOT NULL,
    content TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS kbAPOD (
    apod_key SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    link TEXT NOT NULL,
    copyright TEXT DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS kbPocket (
    id SERIAL PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    access_token TEXT NOT NULL,
    request_token TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,

    CONSTRAINT user_id_name UNIQUE (user_id, username)
);