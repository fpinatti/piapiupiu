const fs = require('node:fs');
const path = require('node:path');

/**
 * Load key=value pairs from local .env if not already present in process.env
 * so both `expo` and `eas-cli` always resolve EAS_PROJECT_ID and EXPO_OWNER.
 */
function loadDotEnv() {
  const envPath = path.resolve(__dirname, '.env');
  if (!fs.existsSync(envPath)) return;
  try {
    const content = fs.readFileSync(envPath, 'utf-8');
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const eqIdx = line.indexOf('=');
      if (eqIdx <= 0) continue;
      const key = line.slice(0, eqIdx).trim();
      const val = line.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
      if (key && !process.env[key]) {
        process.env[key] = val;
      }
    }
  } catch {
    // Ignore .env read errors
  }
}

loadDotEnv();

module.exports = ({ config }) => {
  const projectId =
    process.env.EAS_PROJECT_ID || process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
  const owner = process.env.EXPO_OWNER;

  return {
    ...config,
    ...(owner ? { owner } : {}),
    extra: {
      ...config.extra,
      ...(projectId
        ? {
          eas: {
            ...(config.extra?.eas || {}),
            projectId,
          },
        }
        : {}),
    },
    ...(projectId
      ? {
        updates: {
          ...config.updates,
          url: `https://u.expo.dev/${projectId}`,
        },
      }
      : {}),
  };
};
