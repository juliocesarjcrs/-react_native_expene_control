module.exports = function (api) {
  const isTest = api.env('test');
  api.cache(!isTest);

  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'babel-plugin-root-import',
        {
          rootPathPrefix: '~',
          rootPathSuffix: 'src'
        }
      ],
      [
        'module:react-native-dotenv',
        {
          envName: 'APP_ENV_NAME',
          moduleName: '@env',
          path: '.env',
          blocklist: null,
          allowlist: null,
          safe: false,
          allowUndefined: true
        }
      ],
      'react-native-reanimated/plugin',
      // Sentry no es compatible con el entorno de Jest
      // ...(!isTest ? ['@sentry/react-native/expo'] : [])
    ]
  };
};
