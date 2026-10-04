import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';

// Screens
import { OnboardingScreen } from './screens/OnboardingScreen';
import { HomeRequestScreen } from './screens/HomeRequestScreen';
import { SearchingScreen } from './screens/SearchingScreen';
import { GuideResultsScreen } from './screens/GuideResultsScreen';
import { ActiveSessionScreen } from './screens/ActiveSessionScreen';
import { NoGuideFallbackScreen } from './screens/NoGuideFallbackScreen';
import { RatingScreen } from './screens/RatingScreen';
import { GuideDashboardScreen } from './screens/GuideDashboardScreen';

// Root Floating SOS Component
import { SOSButton } from './components/SOSButton';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const handleTriggerSOS = () => {
    Alert.alert(
      '🚨 EMERGENCY SOS BEACON TRIGGERED',
      'Broadcasting live GPS telemetry (9.5747° N, 77.6815° E) to verified campus sentinels and emergency response dispatchers.',
      [{ text: 'Acknowledge & Standby', style: 'destructive' }]
    );
  };

  return (
    <View style={styles.container}>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Onboarding"
          screenOptions={{
            headerStyle: { backgroundColor: '#faf8ff' },
            headerTintColor: '#0037b0',
            headerTitleStyle: { fontWeight: '800' },
            contentStyle: { backgroundColor: '#faf8ff' },
          }}
        >
          <Stack.Screen
            name="Onboarding"
            options={{ headerShown: false }}
          >
            {({ navigation }) => (
              <OnboardingScreen
                onContinue={(role) => {
                  if (role === 'guide') {
                    navigation.navigate('GuideDashboard');
                  } else {
                    navigation.navigate('HomeRequest');
                  }
                }}
              />
            )}
          </Stack.Screen>

          <Stack.Screen
            name="HomeRequest"
            options={{ title: 'RouteMate Explore', headerBackVisible: false }}
          >
            {({ navigation }) => (
              <HomeRequestScreen
                onRequestCompanion={(destination, searchRadiusKm) => {
                  navigation.navigate('Searching', { destination, searchRadiusKm });
                }}
                onOpenGuideDashboard={() => navigation.navigate('GuideDashboard')}
              />
            )}
          </Stack.Screen>

          <Stack.Screen
            name="Searching"
            options={{ title: 'Radar Search' }}
          >
            {({ route, navigation }) => (
              <SearchingScreen
                destination={route.params?.destination || 'Campus Library'}
                searchRadiusKm={route.params?.searchRadiusKm || 2.5}
                onFoundGuides={() => {
                  navigation.navigate('GuideResults', {
                    requestId: 'req-demo-1',
                    destination: route.params?.destination || 'Campus Library',
                  });
                }}
                onFallback={() => {
                  navigation.navigate('NoGuideFallback', {
                    destination: route.params?.destination || 'Campus Library',
                  });
                }}
                onCancel={() => navigation.navigate('HomeRequest')}
              />
            )}
          </Stack.Screen>

          <Stack.Screen
            name="GuideResults"
            options={{ title: 'Matched Guides' }}
          >
            {({ route, navigation }) => (
              <GuideResultsScreen
                requestId={route.params?.requestId || 'req-1'}
                destination={route.params?.destination || 'Campus Library'}
                onSelectGuide={(guideId) => {
                  navigation.navigate('ActiveSession', {
                    sessionId: 'sess-demo-1',
                    guideId,
                  });
                }}
                onCancel={() => navigation.navigate('HomeRequest')}
              />
            )}
          </Stack.Screen>

          <Stack.Screen
            name="ActiveSession"
            options={{ title: 'Live Escort Walk', headerBackVisible: false }}
          >
            {({ route, navigation }) => (
              <ActiveSessionScreen
                sessionId={route.params?.sessionId || 'sess-1'}
                guideId={route.params?.guideId || 'guide-001'}
                onFinishWalk={() => {
                  navigation.navigate('Rating', {
                    sessionId: 'sess-demo-1',
                    guideName: 'Achu',
                  });
                }}
              />
            )}
          </Stack.Screen>

          <Stack.Screen
            name="NoGuideFallback"
            options={{ title: 'Offline Safe Corridor' }}
          >
            {({ route, navigation }) => (
              <NoGuideFallbackScreen
                destination={route.params?.destination || 'Campus Library'}
                onBackHome={() => navigation.navigate('HomeRequest')}
              />
            )}
          </Stack.Screen>

          <Stack.Screen
            name="Rating"
            options={{ title: 'Rate Your Guide', headerBackVisible: false }}
          >
            {({ route, navigation }) => (
              <RatingScreen
                guideName={route.params?.guideName || 'Achu'}
                onSubmitRating={() => navigation.navigate('HomeRequest')}
              />
            )}
          </Stack.Screen>

          <Stack.Screen
            name="GuideDashboard"
            options={{ title: 'Guide Dispatch Portal' }}
          >
            {({ navigation }) => (
              <GuideDashboardScreen
                onSwitchToTraveler={() => navigation.navigate('HomeRequest')}
              />
            )}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>

      {/* Root Elevated Emergency SOS Button */}
      <SOSButton onTriggerSOS={handleTriggerSOS} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf8ff',
    position: 'relative',
  },
});
