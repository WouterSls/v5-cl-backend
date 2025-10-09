import winston from "winston";

const isProduction = process.env.NODE_ENV === "production";

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  isProduction
    ? winston.format.json()
    : winston.format.printf(({ level, message, timestamp, stack, ...metadata }) => {
        let msg = `${timestamp} [${level.toUpperCase()}]: ${message}`;
        
        // Add metadata if present (excluding stack since we handle it separately)
        const metadataWithoutStack = { ...metadata };
        delete metadataWithoutStack.stack;
        
        const keys = Object.keys(metadataWithoutStack);
        if (keys.length > 0) {
          // Format metadata on separate lines for scannability
          // Handle statusCode and errorCode together
          const displayedKeys = new Set<string>();
          const lines: string[] = [];
          
          // Prioritize order: method, path, status (with errorCode), then others
          const orderedKeys = ['method', 'path', 'statusCode', ...keys.filter(k => !['method', 'path', 'statusCode', 'errorCode'].includes(k))];
          
          orderedKeys.forEach(key => {
            if (displayedKeys.has(key) || !metadataWithoutStack.hasOwnProperty(key)) return;
            
            const value = metadataWithoutStack[key];
            displayedKeys.add(key);
            
            if (key === 'statusCode') {
              const errorCode = metadataWithoutStack.errorCode;
              if (errorCode) {
                lines.push(`Status: ${value} (${errorCode})`);
                displayedKeys.add('errorCode');
              } else {
                lines.push(`Status: ${value}`);
              }
            } else {
              const label = key.charAt(0).toUpperCase() + key.slice(1);
              const displayValue = typeof value === 'object' ? JSON.stringify(value) : value;
              lines.push(`${label}: ${displayValue}`);
            }
          });
          
          // Check if we'll have a stack trace to determine the last line prefix
          const hasStack = stack && typeof stack === 'string' && stack.split('\n').slice(1).join('\n').trim();
          
          // Add lines with proper tree characters
          lines.forEach((line, index) => {
            const isLast = index === lines.length - 1 && !hasStack;
            const prefix = isLast ? '└─' : '├─';
            msg += `\n  ${prefix} ${line}`;
          });
        }
        
        // Add stack trace on new lines for readability (without duplicate error message)
        if (stack && typeof stack === 'string') {
          const stackLines = stack.split('\n');
          // Skip the first line which is the error message (already in main message)
          const stackTrace = stackLines.slice(1).join('\n');
          if (stackTrace.trim()) {
            msg += `\n  └─ Stack:${stackTrace}`;
          }
        }
        
        return msg;
      })
);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isProduction ? "info" : "debug"),
  format: logFormat,
  transports: [
    new winston.transports.Console({
      stderrLevels: ["error"],
    }),
  ],
  exitOnError: false,
});

export default logger;

