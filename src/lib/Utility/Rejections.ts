import { Logger } from '../../Structures/Logger.js'

const logger = new Logger('unhandledRejection');

process.on('unhandledRejection', (reason, promise) => {
    logger.log(`reason: ${reason} | promise: ${promise}`);    
    console.log(reason, promise);
    process.exit(1);
});