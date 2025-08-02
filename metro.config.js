const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

// 기본 설정 불러오기
const defaultConfig = getDefaultConfig(__dirname);

// svg 관련 설정 추가
const customConfig = {
  transformer: {
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
  },
  resolver: {
    assetExts: defaultConfig.resolver.assetExts.filter(ext => ext !== 'svg'),
    sourceExts: [...defaultConfig.resolver.sourceExts, 'svg'],
  },
};

module.exports = mergeConfig(defaultConfig, customConfig);
