import { Logger } from "../../Structures/Logger"

const logger = new Logger('unhandledRejection');

process.on('unhandledRejection', e => {
    logger.log(e);    
    process.exit(1);
});