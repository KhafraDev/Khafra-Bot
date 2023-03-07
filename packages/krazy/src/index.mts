import { handleRequest } from './bot.mjs'

addEventListener('fetch', (event) => event.respondWith(handleRequest(event)))
