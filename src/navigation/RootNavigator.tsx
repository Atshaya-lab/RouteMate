import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Elevation, Radii, Spacing } from '../theme/tokens';
import { User, UserRole, LocationCoordinate, TripRequest, ActiveSession, SOSAlert, GuideProfile } from '../types';
import { Header } from '../components/common/Header';
import { SOSButton } from '../components/common/SOSButton';
import { SOSAlertModal } from '../components/modals/SOSAlertModal';
import { OnboardingVerificationScreen } from '../screens/OnboardingVerificationScreen';
import { HomeRequestMapScreen } from '../screens/HomeRequestMapScreen';
import { LiveRadarSearchScreen } from '../screens/LiveRadarSearchScreen';
import { GuideMatchesScreen } from '../screens/GuideMatchesScreen';
import { ActiveSessionScreen } from '../screens/ActiveSessionScreen';
import { NoGuideFallbackScreen } from '../screens/NoGuideFallbackScreen';
import { GuideDashboardScreen } from '../screens/GuideDashboardScreen';
import { SafetyHubScreen } from '../screens/SafetyHubScreen';
import { SessionsHistoryScreen } from '../screens/SessionsHistoryScreen';
import { ProfileSettingsScreen } from '../screens/ProfileSettingsScreen';
import { createTripRequest, triggerSOSBeacon } from '../services/api';
import { getCurrentDeviceLocation, DEFAULT_FALLBACK_LOCATION } from '../services/location';
import { getStoredUser, saveUser, signOut, DEFAULT_TRAVELER, DEFAULT_GUIDE } from '../services/auth';
import { registerForPushNotificationsAsync } from '../services/notifications';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

export const RootNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [currentUser, setCurrentUser] = useState<User | null>(DEFAULT_TRAVELER);
  const [currentLocation, setCurrentLocation] = useState<LocationCoordinate>(DEFAULT_FALLBACK_LOCATION);

  // Active Flow States
  const [activeRequest, setActiveRequest] = useState<TripRequest | null>(null);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [showGuideMatches, setShowGuideMatches] = useState(false);
  const [showNoGuideFallback, setShowNoGuideFallback] = useState(false);
  const [fallbackDestination, setFallbackDestination] = useState('Campus Main Gate');

  // SOS Emergency State
  const [activeSOSAlert, setActiveSOSAlert] = useState<SOSAlert | null>(null);
  const [showSOSModal, setShowSOSModal] = useState(false);

  useEffect(() => {
    initApp();
  }, []);

  const initApp = async () => {
    registerForPushNotificationsAsync();
    const stored = await getStoredUser();
    if (stored) {
      setCurrentUser(stored);
    }
    const loc = await getCurrentDeviceLocation();
    setCurrentLocation(loc);
  };

  const handleSelectUser = async (u: User) => {
    setCurrentUser(u);
    await saveUser(u);
  };

  const handleToggleRole = async () => {
    if (!currentUser) return;
    const newRole: UserRole = currentUser.role === 'guide' ? 'traveler' : 'guide';
    const defaultForRole = newRole === 'guide' ? DEFAULT_GUIDE : DEFAULT_TRAVELER;
    const updated: User = {
      ...currentUser,
      role: newRole,
      name: currentUser.role !== newRole ? defaultForRole.name : currentUser.name,
      id: currentUser.role !== newRole ? defaultForRole.id : currentUser.id,
      avatarUrl: currentUser.role !== newRole ? defaultForRole.avatarUrl : currentUser.avatarUrl,
    };
    setCurrentUser(updated);
    await saveUser(updated);
  };

  const handleTriggerSOS = async () => {
    const loc = await getCurrentDeviceLocation();
    setCurrentLocation(loc);

    const alert = await triggerSOSBeacon({
      userId: currentUser?.id || 'traveler-001',
      userName: currentUser?.name || 'Alex Morgan',
      userPhone: currentUser?.phoneNumber || '+1 (555) 019-2834',
      location: loc,
    });

    setActiveSOSAlert(alert);
    setShowSOSModal(true);
  };

  const handleRequestGuide = async (dest: string, loc: LocationCoordinate) => {
    setFallbackDestination(dest);
    const req = await createTripRequest({
      destination: dest,
      pickupLocation: loc,
      travelerName: currentUser?.name || 'Alex Morgan',
      travelerPhone: currentUser?.phoneNumber || '+1 (555) 019-2834',
      mode: 'call',
    });
    setActiveRequest(req);
  };

  const handleSelectSpecificGuide = async (guide: GuideProfile) => {
    const req = await createTripRequest({
      destination: fallbackDestination,
      pickupLocation: currentLocation,
      travelerName: currentUser?.name || 'Alex Morgan',
      travelerPhone: currentUser?.phoneNumber || '+1 (555) 019-2834',
      mode: 'call',
    });
    req.selectedGuideId = guide.id;
    setActiveRequest(req);
    setShowGuideMatches(true);
  };

  if (!currentUser) {
    return (
      <OnboardingVerificationScreen
        onAuthenticated={async (role) => {
          const u = role === 'guide' ? DEFAULT_GUIDE : DEFAULT_TRAVELER;
          setCurrentUser(u);
          await saveUser(u);
        }}
      />
    );
  }

  // Active Guidance Session View
  if (activeSession) {
    return (
      <View style={styles.root}>
        <Header
          title="Active Guidance Walk"
          subtitle="RouteMate Live"
          avatarUrl={currentUser.avatarUrl}
          showBack={false}
        />
        <ActiveSessionScreen
          session={activeSession}
          currentTravelerLocation={currentLocation}
          onFinishSession={() => {
            setActiveSession(null);
            setActiveRequest(null);
            setShowGuideMatches(false);
          }}
        />
        <SOSButton onTriggerSOS={handleTriggerSOS} />
        <SOSAlertModal
          visible={showSOSModal}
          alert={activeSOSAlert}
          onDismiss={() => setShowSOSModal(false)}
        />
      </View>
    );
  }

  // Guide Selection Screen
  if (showGuideMatches && activeRequest) {
    return (
      <View style={styles.root}>
        <Header
          title="Guide Detail"
          subtitle="RouteMate"
          showBack={true}
          onBack={() => setShowGuideMatches(false)}
          avatarUrl={currentUser.avatarUrl}
        />
        <GuideMatchesScreen
          travelerLocation={currentLocation}
          guides={activeRequest.respondingGuides}
          requestId={activeRequest.id}
          onConnectGuide={(sess) => {
            setShowGuideMatches(false);
            setActiveSession(sess);
          }}
        />
        <SOSButton onTriggerSOS={handleTriggerSOS} />
        <SOSAlertModal
          visible={showSOSModal}
          alert={activeSOSAlert}
          onDismiss={() => setShowSOSModal(false)}
        />
      </View>
    );
  }

  // Live Radar Searching Screen
  if (activeRequest) {
    return (
      <View style={styles.root}>
        <Header
          title="Explore Map"
          subtitle="RouteMate"
          showBack={true}
          onBack={() => setActiveRequest(null)}
          avatarUrl={currentUser.avatarUrl}
        />
        <LiveRadarSearchScreen
          request={activeRequest}
          travelerLocation={currentLocation}
          onGuideAccepted={(sess) => {
            setActiveSession(sess);
          }}
          onCancelSearch={() => setActiveRequest(null)}
          onNavigateToOfflineFallback={() => {
            setActiveRequest(null);
            setShowNoGuideFallback(true);
          }}
        />
        <SOSButton onTriggerSOS={handleTriggerSOS} />
        <SOSAlertModal
          visible={showSOSModal}
          alert={activeSOSAlert}
          onDismiss={() => setShowSOSModal(false)}
        />
      </View>
    );
  }

  // No Guide Fallback Offline Directions Screen
  if (showNoGuideFallback) {
    return (
      <View style={styles.root}>
        <Header
          title="Offline Route Guide"
          subtitle="RouteMate Safety"
          showBack={true}
          onBack={() => setShowNoGuideFallback(false)}
          avatarUrl={currentUser.avatarUrl}
        />
        <NoGuideFallbackScreen
          destination={fallbackDestination}
          travelerLocation={currentLocation}
          onBackToExplore={() => setShowNoGuideFallback(false)}
        />
        <SOSButton onTriggerSOS={handleTriggerSOS} />
        <SOSAlertModal
          visible={showSOSModal}
          alert={activeSOSAlert}
          onDismiss={() => setShowSOSModal(false)}
        />
      </View>
    );
  }

  // Guide Mode View
  if (currentUser.role === 'guide') {
    return (
      <View style={styles.root}>
        <Header
          title="Guide Dashboard"
          subtitle="RouteMate Escort"
          userRole="guide"
          onToggleRole={handleToggleRole}
          avatarUrl={currentUser.avatarUrl}
          onProfilePress={handleToggleRole}
        />
        <GuideDashboardScreen
          currentUser={currentUser}
          onAcceptEscort={(sess) => {
            setActiveSession(sess);
          }}
          onSwitchProfile={handleToggleRole}
        />
        <SOSButton onTriggerSOS={handleTriggerSOS} />
        <SOSAlertModal
          visible={showSOSModal}
          alert={activeSOSAlert}
          onDismiss={() => setShowSOSModal(false)}
        />
      </View>
    );
  }

  // Main Traveler Tab Navigator
  return (
    <View style={styles.root}>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: 'rgba(250, 248, 255, 0.95)',
              borderTopWidth: 1,
              borderTopColor: 'rgba(0,0,0,0.05)',
              height: 64 + (Platform.OS === 'ios' ? insets.bottom : 8),
              paddingBottom: Platform.OS === 'ios' ? insets.bottom : 8,
              paddingTop: 8,
              position: 'absolute',
              elevation: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.05,
              shadowRadius: 10,
            },
            tabBarActiveTintColor: Colors.primary,
            tabBarInactiveTintColor: Colors.onSurfaceVariant,
            tabBarLabelStyle: {
              fontSize: 11,
              fontWeight: '600',
            },
          }}
        >
          <Tab.Screen
            name="Explore"
            options={{
              tabBarIcon: ({ color, size }) => (
                <MaterialIcons name="explore" size={size || 24} color={color} />
              ),
            }}
          >
            {() => (
              <View style={styles.tabContent}>
                <Header
                  title="Explore Map"
                  subtitle="RouteMate"
                  userRole="traveler"
                  onToggleRole={handleToggleRole}
                  avatarUrl={currentUser.avatarUrl}
                />
                <HomeRequestMapScreen
                  onRequestGuide={handleRequestGuide}
                  onSelectSpecificGuide={handleSelectSpecificGuide}
                />
              </View>
            )}
          </Tab.Screen>

          <Tab.Screen
            name="Sessions"
            options={{
              tabBarIcon: ({ color, size }) => (
                <MaterialIcons name="history-toggle-off" size={size || 24} color={color} />
              ),
            }}
          >
            {() => (
              <View style={styles.tabContent}>
                <Header
                  title="Past Sessions"
                  subtitle="RouteMate Memories"
                  avatarUrl={currentUser.avatarUrl}
                />
                <SessionsHistoryScreen />
              </View>
            )}
          </Tab.Screen>

          <Tab.Screen
            name="Safety"
            options={{
              tabBarIcon: ({ color, size }) => (
                <MaterialIcons name="shield" size={size || 24} color={color} />
              ),
            }}
          >
            {() => (
              <View style={styles.tabContent}>
                <Header
                  title="Safety Hub"
                  subtitle="RouteMate Sentinel"
                  avatarUrl={currentUser.avatarUrl}
                />
                <SafetyHubScreen
                  travelerLocation={currentLocation}
                  onTriggerSOS={handleTriggerSOS}
                />
              </View>
            )}
          </Tab.Screen>

          <Tab.Screen
            name="Profile"
            options={{
              tabBarIcon: ({ color, size }) => (
                <MaterialIcons name="account-circle" size={size || 24} color={color} />
              ),
            }}
          >
            {() => (
              <View style={styles.tabContent}>
                <Header
                  title="Profile & Settings"
                  subtitle="RouteMate Account"
                  avatarUrl={currentUser.avatarUrl}
                />
                <ProfileSettingsScreen
                  user={currentUser}
                  onToggleRole={handleToggleRole}
                  onSelectUser={handleSelectUser}
                  onSignOut={async () => {
                    await signOut();
                    setCurrentUser(null);
                  }}
                />
              </View>
            )}
          </Tab.Screen>
        </Tab.Navigator>
      </NavigationContainer>

      {/* Persistent Emergency SOS Floating Trigger */}
      <SOSButton onTriggerSOS={handleTriggerSOS} />

      {/* Emergency SOS Modal Takeover */}
      <SOSAlertModal
        visible={showSOSModal}
        alert={activeSOSAlert}
        onDismiss={() => setShowSOSModal(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface,
    position: 'relative',
  },
  tabContent: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
});
