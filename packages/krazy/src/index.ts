import { handleRequest } from './bot.js'

addEventListener('fetch', (event) => event.respondWith(handleRequest(event.request)))
