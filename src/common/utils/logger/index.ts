import pino from 'pino';

export type Logger = pino.Logger;

/**
 * App-wide logger for all logging needs
 */
export const logger: pino.Logger = pino({
  level: process.env.NODE_ENV === 'test' ? 'silent' : process.env.LOG_LEVEL || 'info',
  name: process.env.APP_NAME,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  },
});

export const getLogTimestamp = (): string => new Date().toISOString();
