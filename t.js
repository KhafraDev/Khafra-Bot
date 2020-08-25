const fetch = require('node-fetch').default;

fetch('https://discord.com/api/v8/applications/detectable', {
    //headers: {
    //}
})
    .then(r => r.json())
    .then(console.log)