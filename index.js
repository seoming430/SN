// index.js
import { AppRegistry } from 'react-native';
import App from './App'; // 원래 완성된 앱
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
