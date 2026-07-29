/**
 * Log severity threshold, ordered from least to most severe. A {@link Logger}
 * drops any message whose level is below its configured threshold.
 */
export enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
}
