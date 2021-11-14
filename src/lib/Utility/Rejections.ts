import { Logger } from '../../Structures/Logger.js'

const logger = new Logger('ERROR');

process.on('unhandledRejection', (reason, promise) => {
    logger.log(reason === promise ? promise : { ...reason, ...promise });    
    process.exit(1);
});