import React from 'react';
import { LogBox } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';

LogBox.ignoreAllLogs(true);
LogBox.ignoreLogs([
  'Android Push notifications',
  'warnOfExpoGoPushUsage',
  'expo-notifications',
]);

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <RootNavigator />
    </SafeAreaProvider>
  );
}
