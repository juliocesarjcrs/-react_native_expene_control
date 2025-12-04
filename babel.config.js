module.exports = function (api) {
  api.cache(true);
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
          envName: 'APP_ENV',
          moduleName: '@env',
          path: '.env'
        }
      ],
      'react-native-reanimated/plugin'
    ]
  };
};
