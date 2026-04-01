const levels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const env = process.env.NODE_ENV === 'production' ? 'production' : 'development';
const defaultLevel = env === 'production' ? 'info' : 'debug';
const configuredLevel = (process.env.LOG_LEVEL || defaultLevel).toLowerCase();
const currentLevel = levels[configuredLevel] ?? levels[defaultLevel];

function formatMeta(meta) {
  if (!meta) return '';
  if (typeof meta === 'string') return meta;
  try {
    return JSON.stringify(meta);
  } catch {
    return String(meta);
  }
}

function log(level, message, meta = null) {
  if (levels[level] > currentLevel) return;

  if (env === 'production') {
    const payload = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(meta && { meta }),
    };
    console.log(JSON.stringify(payload));
    return;
  }

  const emojis = {
    error: '❌',
    warn: '⚠️',
    info: 'ℹ️',
    debug: '🔍',
  };

  const metaText = formatMeta(meta);
  console.log(`${emojis[level]} [${level.toUpperCase()}] ${message}${metaText ? ` ${metaText}` : ''}`);
}

export const logger = {
  error: (message, meta = null) => log('error', message, meta),
  warn: (message, meta = null) => log('warn', message, meta),
  info: (message, meta = null) => log('info', message, meta),
  debug: (message, meta = null) => log('debug', message, meta),
};
