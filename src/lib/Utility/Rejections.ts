import { Logger } from "../../Structures/Logger"
import { inspect } from 'util';

const logger = new Logger('unhandledRejection');

process.on('unhandledRejection', e => {
    logger.log(inspect(e));    
    process.exit(1);
});