const { join } = require('path');

// https://pm2.keymetrics.io/docs/usage/application-declaration/
module.exports = {
  	apps : [{
    	name: 'Khafra-Bot',
    	script: join(process.cwd(), 'build/index.js'),

    	// Options reference: https://pm2.keymetrics.io/docs/usage/application-declaration/
    	// args: 'one two',
    	// instances: 1,
    	autorestart: true,
    	// watch: false,
    	max_memory_restart: '1G',
    	env: {
      		NODE_ENV: 'development'
    	},
    	env_production: {
      		NODE_ENV: 'production'
		},
		ignore_watch: [ 'node_modules', 'src' ], // src changes need to be transpiled still, so ignore them
		// 288 max restarts a day; after 1K Discord auto changes token.  
		// also prevents abuse from people who discover ways of crashing the bot.
		min_uptime: '5m',
		max_restarts: 10,
		namespace: 'Khafra-Bot'
  	}]
};
