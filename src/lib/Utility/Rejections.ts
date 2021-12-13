import { Logger } from '../../Structures/Logger.js'

const logger = new Logger();

process.on('unhandledRejection', (reason, promise) => {
    const r = typeof reason === 'object' ? { ...reason } : { reason };
    logger.error(reason === promise ? promise : { ...r, ...promise });    
    process.exit(1);
});