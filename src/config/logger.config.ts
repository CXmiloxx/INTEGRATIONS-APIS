import { LogLevel } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export const loggerConfig = (config: ConfigService) => {
  const nodeEnv = config.get<string>('app.nodeEnv') || 'development';
  return {
    levels:
      nodeEnv === 'production'
        ? (['error', 'warn', 'log'] as LogLevel[])
        : (['error', 'warn', 'log', 'debug', 'verbose'] as LogLevel[]),
  };
};
