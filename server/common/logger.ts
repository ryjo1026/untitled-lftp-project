import * as logger from 'winston';

logger.configure({
  level: 'info',
  format: logger.format.combine(
    logger.format.colorize(),
    logger.format.printf((info) => `[${info.level}] ${info.message}`),
  ),
  levels: {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  },
  transports: [new logger.transports.Console()],
});
logger.addColors({
  debug: 'green',
  info: 'cyan',
  warn: 'yellow',
  error: 'red',
});

export default logger;
