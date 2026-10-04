import { LogBox } from 'react-native';
LogBox.ignoreAllLogs(true);

import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
