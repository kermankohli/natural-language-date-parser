import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
const { combine, timestamp, printf, colorize } = winston.format;

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Track the current operation ID
let currentOperationId: string | null = null;

// Color scheme for different log levels
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  debug: 'blue'
};

// Add colors to Winston
winston.addColors(colors);

// Format context object for better readability
const formatContext = (context: any): string => {
  if (!context || Object.keys(context).length === 0) return '';
  
  const formatted = Object.entries(context)
    .map(([key, value]) => {
      const valueStr = typeof value === 'object' 
        ? JSON.stringify(value, null, 2)
        : String(value);
      return `\n    ${key}: ${valueStr}`;
    })
    .join('');
  
  return formatted;
};

// Custom format for console output
const consoleFormat = printf(({ level, message, timestamp, operationId, context, ...metadata }) => {
  const ts = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const timeStr = ts instanceof Date ? ts.toLocaleTimeString() : String(ts);
  const op = operationId || currentOperationId || 'no-op-id';
  const ctx = formatContext(context);
  const meta = Object.keys(metadata).length > 0 ? `\n  metadata: ${JSON.stringify(metadata, null, 2)}` : '';
  
  return `[${timeStr}] ${level.padEnd(5)} [${op}] ${message}${ctx}${meta}`;
});

// JSON format for file logging
const fileFormat = printf(({ level, message, timestamp, operationId, context, ...metadata }) => {
  return JSON.stringify({
    timestamp,
    level,
    message,
    operationId: operationId || currentOperationId || 'no-op-id',
    context: context || {},
    ...metadata
  });
});

// Create the logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp(),
    fileFormat
  ),
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize({ all: true }),
        consoleFormat
      )
    }),
    new winston.transports.File({ 
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({ 
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  ],
  exitOnError: false
});

// Export a simplified interface with better typing
export interface LogContext {
  [key: string]: any;
}

export const Logger = {
  startOperation: () => {
    currentOperationId = uuidv4();
    return currentOperationId;
  },

  endOperation: () => {
    currentOperationId = null;
  },

  error: (message: string, context: LogContext = {}, meta: Record<string, any> = {}) => 
    logger.error(message, { context, ...meta }),

  warn: (message: string, context: LogContext = {}, meta: Record<string, any> = {}) => 
    logger.warn(message, { context, ...meta }),

  info: (message: string, context: LogContext = {}, meta: Record<string, any> = {}) => 
    Logger.debug(message, { context, ...meta }),

  debug: (message: string, context: LogContext = {}, meta: Record<string, any> = {}) => 
    logger.debug(message, { context, ...meta }),
};

export default Logger; 