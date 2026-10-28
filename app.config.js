/**
 * Dynamic Expo configuration (app.config.js)
 * Reads sensitive/account-specific identifiers (EAS_PROJECT_ID, EXPO_OWNER)
 * from environment variables (.env) so they are never hardcoded in git.
 */
module.exports = ({ config }) => {
  const projectId = process.env.EAS_PROJECT_ID || process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
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

