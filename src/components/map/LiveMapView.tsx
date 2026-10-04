import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  Dimensions,
  DimensionValue,
} from 'react-native';
import MapView, { Marker, Circle, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Elevation, Radii, Spacing } from '../../theme/tokens';
import { GuideProfile, LocationCoordinate } from '../../types';

interface LiveMapViewProps {
  travelerLocation: LocationCoordinate;
  guides?: GuideProfile[];
  selectedGuide?: GuideProfile | null;
  onSelectGuide?: (guide: GuideProfile) => void;
  searchRadiusKm?: number;
  routePolyline?: LocationCoordinate[];
  height?: DimensionValue;
  showAccuracyBadge?: boolean;
  accuracyMeters?: number;
  interactive?: boolean;
  onRecenterPress?: () => void;
}

export const LiveMapView: React.FC<LiveMapViewProps> = ({
  travelerLocation,
  guides = [],
  selectedGuide = null,
  onSelectGuide,
  searchRadiusKm,
  routePolyline,
  height = 360,
  showAccuracyBadge = true,
  accuracyMeters = 3,
  interactive = true,
  onRecenterPress,
}) => {
  const mapRef = useRef<MapView>(null);
  const [mapError, setMapError] = React.useState(false);
  const [isMapReady, setIsMapReady] = React.useState(false);

  const initialRegion = {
    latitude: travelerLocation.latitude,
    longitude: travelerLocation.longitude,
    latitudeDelta: searchRadiusKm ? (searchRadiusKm * 2) / 111 : 0.012,
    longitudeDelta: searchRadiusKm ? (searchRadiusKm * 2) / 111 : 0.012,
  };

  useEffect(() => {
    if (mapRef.current && travelerLocation && !mapError && isMapReady) {
      try {
        mapRef.current.animateToRegion(
          {
            latitude: travelerLocation.latitude,
            longitude: travelerLocation.longitude,
            latitudeDelta: searchRadiusKm ? (searchRadiusKm * 2.2) / 111 : 0.012,
            longitudeDelta: searchRadiusKm ? (searchRadiusKm * 2.2) / 111 : 0.012,
          },
          600
        );
      } catch {}
    }
  }, [travelerLocation.latitude, travelerLocation.longitude, searchRadiusKm, mapError, isMapReady]);

  const handleRecenter = () => {
    if (mapRef.current && !mapError) {
      try {
        mapRef.current.animateToRegion(
          {
            latitude: travelerLocation.latitude,
            longitude: travelerLocation.longitude,
            latitudeDelta: 0.008,
            longitudeDelta: 0.008,
          },
          500
        );
      } catch {}
    }
    if (onRecenterPress) {
      onRecenterPress();
    }
  };

  return (
    <View style={[styles.container, { height }]}>
      {!mapError ? (
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={initialRegion}
          scrollEnabled={interactive}
          zoomEnabled={interactive}
          rotateEnabled={interactive}
          showsCompass={false}
          showsUserLocation={true}
          onMapReady={() => {
            setMapError(false);
            setIsMapReady(true);
            try {
              mapRef.current?.animateToRegion(
                {
                  latitude: travelerLocation.latitude,
                  longitude: travelerLocation.longitude,
                  latitudeDelta: 0.012,
                  longitudeDelta: 0.012,
                },
                500
              );
            } catch {}
          }}
        >
          {/* Radar Search Circle Overlays */}
          {searchRadiusKm !== undefined && searchRadiusKm > 0 && (
            <>
              <Circle
                center={travelerLocation}
                radius={searchRadiusKm * 1000}
                fillColor={Colors.mapBlueCircle}
                strokeColor={Colors.mapBlueStroke}
                strokeWidth={1.5}
              />
              {searchRadiusKm >= 3 && (
                <Circle
                  center={travelerLocation}
                  radius={1000}
                  fillColor="rgba(0, 55, 176, 0.06)"
                  strokeColor="rgba(0, 55, 176, 0.2)"
                  strokeWidth={1}
                />
              )}
            </>
          )}

          {/* Route Direction Polyline */}
          {routePolyline && routePolyline.length > 0 && (
            <Polyline
              coordinates={routePolyline}
              strokeColor={Colors.primaryContainer}
              strokeWidth={4.5}
              lineDashPattern={[0]}
            />
          )}

          {/* Traveler Location Marker */}
          <Marker
            coordinate={travelerLocation}
            title="You"
            description="GPS Active"
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.travelerMarkerContainer}>
              <View style={styles.travelerPulseRing} />
              <View style={styles.travelerCenterDot}>
                <View style={styles.travelerInnerCore} />
              </View>
            </View>
          </Marker>

          {/* Nearby Guide Pin Markers */}
          {guides.map((guide) => {
            const isSelected = selectedGuide?.id === guide.id;
            return (
              <Marker
                key={guide.id}
                coordinate={guide.location}
                title={guide.name}
                description={`${guide.distance} • ★ ${guide.rating}`}
                onPress={() => onSelectGuide && onSelectGuide(guide)}
                anchor={{ x: 0.5, y: 1 }}
              >
                <View style={styles.guideMarkerContainer}>
                  <View style={[styles.guideTagBubble, isSelected && styles.guideTagBubbleSelected]}>
                    <View style={styles.guideLiveDot} />
                    <Text style={[styles.guideTagText, isSelected && styles.guideTagTextSelected]}>
                      {guide.name.split(' ')[0]} • {guide.eta}
                    </Text>
                  </View>

                  <View style={[styles.guidePinHead, isSelected && styles.guidePinHeadSelected]}>
                    <Image source={{ uri: guide.avatarUrl }} style={styles.guideAvatar} />
                    {guide.isVerified && (
                      <View style={styles.guideVerifiedBadge}>
                        <MaterialIcons name="check" size={10} color={Colors.onSecondary} />
                      </View>
                    )}
                  </View>
                </View>
              </Marker>
            );
          })}
        </MapView>
      ) : (
        /* High-Fidelity Vector Canvas Visual Fallback */
        <View style={StyleSheet.absoluteFill}>
          <Image
            source={{
              uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDBdvr4Lms6OhpFJokM3ugizrYM0Ha3rgv0t5u1bu567aWp5uNGIbMDSlzyB3HKEOIG76RJQkbO82aj48OQGOXGl4P6g_5ZQkgDv1zEQVtGa8qE1D1ijQlsC1JyInow72LdpixYlTrl-GDNO7yKT3bDQ0lPQs-C9tK4y8iXa6zuawuemuAyl2NAWW7Gk-rTd5Df6HCYmehypPpOSKPBCdbbHEdPNoSX1IWDdJDw91miXx124S8YMcLK',
            }}
            style={StyleSheet.absoluteFill}
          />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 55, 176, 0.08)' }]} />

          {/* Traveler Center Dot */}
          <View style={{ position: 'absolute', top: '48%', left: '48%' }}>
            <View style={styles.travelerMarkerContainer}>
              <View style={styles.travelerPulseRing} />
              <View style={styles.travelerCenterDot}>
                <View style={styles.travelerInnerCore} />
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Top Map HUD Controls */}
      <View style={styles.topHudRow} pointerEvents="box-none">
        {showAccuracyBadge && (
          <View style={styles.accuracyBadge}>
            <View style={styles.accuracyDot} />
            <MaterialIcons name="gps-fixed" size={14} color={Colors.secondaryLive} />
            <Text style={styles.accuracyText}>High Accuracy • ±{accuracyMeters}m</Text>
          </View>
        )}

        <TouchableOpacity
          onPress={handleRecenter}
          style={styles.recenterButton}
          accessibilityLabel="Recenter Current Location"
          activeOpacity={0.8}
        >
          <MaterialIcons name="my-location" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: Colors.surfaceContainerLow,
    position: 'relative',
  },
  travelerMarkerContainer: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  travelerPulseRing: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(0, 55, 176, 0.2)',
  },
  travelerCenterDot: {
    width: 24,
    height: 24,
    borderRadius: Radii.full,
    backgroundColor: Colors.surfaceContainerLowest,
    justifyContent: 'center',
    alignItems: 'center',
    ...Elevation.level2,
  },
  travelerInnerCore: {
    width: 14,
    height: 14,
    borderRadius: Radii.full,
    backgroundColor: Colors.primaryContainer,
  },
  guideMarkerContainer: {
    alignItems: 'center',
  },
  guideTagBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.full,
    marginBottom: 4,
    ...Elevation.level2,
  },
  guideTagBubbleSelected: {
    backgroundColor: Colors.inverseSurface,
  },
  guideLiveDot: {
    width: 6,
    height: 6,
    borderRadius: Radii.full,
    backgroundColor: Colors.secondaryLive,
  },
  guideTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  guideTagTextSelected: {
    color: Colors.inverseOnSurface,
  },
  guidePinHead: {
    width: 38,
    height: 38,
    borderRadius: Radii.full,
    backgroundColor: Colors.surfaceContainerLowest,
    padding: 2,
    borderWidth: 2,
    borderColor: Colors.surfaceContainerLowest,
    ...Elevation.level3,
    position: 'relative',
  },
  guidePinHeadSelected: {
    borderColor: Colors.primaryContainer,
    transform: [{ scale: 1.1 }],
  },
  guideAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: Radii.full,
  },
  guideVerifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: Radii.full,
    backgroundColor: Colors.secondaryLive,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.surfaceContainerLowest,
  },
  topHudRow: {
    position: 'absolute',
    top: 12,
    left: Spacing.gutter,
    right: Spacing.gutter,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 20,
  },
  accuracyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.full,
    ...Elevation.level2,
  },
  accuracyDot: {
    width: 7,
    height: 7,
    borderRadius: Radii.full,
    backgroundColor: Colors.secondaryLive,
  },
  accuracyText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  recenterButton: {
    width: 40,
    height: 40,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    ...Elevation.level2,
  },
});
