import { Logger } from '../../Structures/Logger.js'

const logger = new Logger();

process.on('unhandledRejection', (reason, promise) => {
    logger.error(reason === promise ? promise : { ...reason, ...promise });    
    process.exit(1);
});