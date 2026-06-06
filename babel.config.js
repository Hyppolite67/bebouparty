// Configuration Babel de BebouParty.
// IMPORTANT : avec Reanimated 4, le plugin s'appelle "react-native-worklets/plugin"
// (et non plus "react-native-reanimated/plugin"). Il DOIT rester le dernier plugin.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-worklets/plugin'],
  };
};
