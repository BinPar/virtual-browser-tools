const processLogLevel = parseInt(process.env.LOG, 10) || 3;

export const LOG_OPTIONS = {
  VERBOSE: 1,
  INFO: 2,
  WARNING: 3,
  ERRORS: 4,
};

export default function log(logLevel, ...args) {
  if (logLevel >= processLogLevel) {
    console.log(`===> ${new Date().toLocaleString()}`, ...args);
  }
}
