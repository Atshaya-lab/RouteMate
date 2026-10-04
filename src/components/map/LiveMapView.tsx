import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  DimensionValue,
} from 'react-native';
import Mapbox, {
  MapView as MapboxMapView,
  Camera,
  PointAnnotation,
  ShapeSource,
  LineLayer,
  CircleLayer,
} from '@rnmapbox/maps';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Elevation, Radii, Spacing } from '../../theme/tokens';
import { GuideProfile, LocationCoordinate } from '../../types';
import { MAPBOX_STYLES } from '../../services/mapbox';

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
  const cameraRef = useRef<Camera>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (cameraRef.current && travelerLocation) {
      const zoom = searchRadiusKm
        ? Math.max(12, 16 - Math.log2(searchRadiusKm * 1.5))
        : 15;

      cameraRef.current.setCamera({
        centerCoordinate: [travelerLocation.longitude, travelerLocation.latitude],
        zoomLevel: zoom,
        animationDuration: 600,
      });
    }
  }, [travelerLocation.latitude, travelerLocation.longitude, searchRadiusKm]);

  const handleRecenter = () => {
    if (cameraRef.current && travelerLocation) {
      cameraRef.current.setCamera({
        centerCoordinate: [travelerLocation.longitude, travelerLocation.latitude],
        zoomLevel: 15.5,
        animationDuration: 500,
      });
    }
    if (onRecenterPress) {
      onRecenterPress();
    }
  };

  // Convert route polyline to GeoJSON LineString
  const routeGeoJSON = routePolyline && routePolyline.length > 1 ? {
    type: 'Feature' as const,
    geometry: {
      type: 'LineString' as const,
      coordinates: routePolyline.map((p) => [p.longitude, p.latitude]),
    },
    properties: {},
  } : null;

  // Search Radius GeoJSON Point for circle layer
  const radiusGeoJSON = searchRadiusKm ? {
    type: 'Feature' as const,
    geometry: {
      type: 'Point' as const,
      coordinates: [travelerLocation.longitude, travelerLocation.latitude],
    },
    properties: {},
  } : null;

  return (
    <View style={[styles.container, { height }]}>
      <MapboxMapView
        style={StyleSheet.absoluteFill}
        styleURL={MAPBOX_STYLES.STREETS}
        scrollEnabled={interactive}
        zoomEnabled={interactive}
        rotateEnabled={interactive}
        pitchEnabled={false}
        attributionEnabled={false}
        logoEnabled={false}
        scaleBarEnabled={false}
        onDidFinishLoadingMap={() => setMapLoaded(true)}
      >
        <Camera
          ref={cameraRef}
          centerCoordinate={[travelerLocation.longitude, travelerLocation.latitude]}
          zoomLevel={15}
        />

        {/* Radar Search Circle Overlay */}
        {radiusGeoJSON && (
          <ShapeSource id="radiusSource" shape={radiusGeoJSON}>
            <CircleLayer
              id="radiusCircleLayer"
              style={{
                circleRadius: (searchRadiusKm || 1) * 75,
                circleColor: 'rgba(0, 55, 176, 0.12)',
                circleStrokeWidth: 1.5,
                circleStrokeColor: 'rgba(0, 55, 176, 0.45)',
              }}
            />
          </ShapeSource>
        )}

        {/* Walking Directions Route Line */}
        {routeGeoJSON && (
          <ShapeSource id="routeSource" shape={routeGeoJSON}>
            <LineLayer
              id="routeLineLayer"
              style={{
                lineColor: Colors.primaryContainer,
                lineWidth: 5.0,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          </ShapeSource>
        )}

        {/* Traveler Location Point Annotation */}
        <PointAnnotation
          id="travelerMarker"
          coordinate={[travelerLocation.longitude, travelerLocation.latitude]}
        >
          <View style={styles.travelerMarkerContainer}>
            <View style={styles.travelerPulseRing} />
            <View style={styles.travelerCenterDot}>
              <View style={styles.travelerInnerCore} />
            </View>
          </View>
        </PointAnnotation>

        {/* Nearby Guide Point Annotations */}
        {guides.map((guide) => {
          const isSelected = selectedGuide?.id === guide.id;
          return (
            <PointAnnotation
              key={guide.id}
              id={`guide-${guide.id}`}
              coordinate={[guide.location.longitude, guide.location.latitude]}
              onSelected={() => onSelectGuide && onSelectGuide(guide)}
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
            </PointAnnotation>
          );
        })}
      </MapboxMapView>

      {/* Top Map HUD Controls */}
      <View style={styles.topHudRow} pointerEvents="box-none">
        {showAccuracyBadge && (
          <View style={styles.accuracyBadge}>
            <View style={styles.accuracyDot} />
            <MaterialIcons name="gps-fixed" size={14} color={Colors.secondaryLive} />
            <Text style={styles.accuracyText}>Mapbox High Accuracy • ±{accuracyMeters}m</Text>
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
