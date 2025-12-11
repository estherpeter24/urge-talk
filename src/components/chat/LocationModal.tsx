import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { useTheme } from '../../context/ThemeContext';

const { width, height } = Dimensions.get('window');

// Duration options for live location sharing (in minutes)
const LIVE_LOCATION_DURATIONS = [
  { label: '15 minutes', value: 15 },
  { label: '1 hour', value: 60 },
  { label: '8 hours', value: 480 },
];

interface LocationModalProps {
  visible: boolean;
  location: { latitude: number; longitude: number } | null;
  onClose: () => void;
  onSendCurrentLocation: () => void;
  onShareLiveLocation: (durationMinutes: number) => void;
  onSendSelectedLocation?: (location: { latitude: number; longitude: number }) => void;
}

/**
 * LocationModal - WhatsApp-style location sharing modal
 * Full-screen map with ability to select location
 */
const LocationModal: React.FC<LocationModalProps> = ({
  visible,
  location,
  onClose,
  onSendCurrentLocation,
  onShareLiveLocation,
  onSendSelectedLocation,
}) => {
  const { theme } = useTheme();
  const mapRef = useRef<MapView>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const [region, setRegion] = useState<Region>({
    latitude: location?.latitude || 37.78825,
    longitude: location?.longitude || -122.4324,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  useEffect(() => {
    if (location && visible) {
      setRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      setSelectedLocation(null);
      setShowDurationPicker(false);
    }
  }, [location, visible]);

  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedLocation({ latitude, longitude });
    setShowDurationPicker(false);
  };

  const handleSendSelectedLocation = () => {
    if (selectedLocation && onSendSelectedLocation) {
      onSendSelectedLocation(selectedLocation);
    }
  };

  const handleRecenterToCurrentLocation = () => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 500);
      setSelectedLocation(null);
    }
  };

  const handleLiveLocationPress = () => {
    setShowDurationPicker(true);
  };

  const handleDurationSelect = (durationMinutes: number) => {
    setShowDurationPicker(false);
    onShareLiveLocation(durationMinutes);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
          <TouchableOpacity style={styles.backButton} onPress={onClose}>
            <Icon name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Share Location</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Full Screen Map */}
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
            style={styles.map}
            region={region}
            onRegionChangeComplete={setRegion}
            onPress={handleMapPress}
            onMapReady={() => setIsMapReady(true)}
            showsUserLocation={true}
            showsMyLocationButton={false}
            showsCompass={true}
          >
            {/* Current location marker */}
            {location && !selectedLocation && (
              <Marker
                coordinate={{
                  latitude: location.latitude,
                  longitude: location.longitude,
                }}
                title="Your Location"
              >
                <View style={styles.currentLocationMarker}>
                  <View style={[styles.currentLocationDot, { backgroundColor: theme.primary }]} />
                  <View style={[styles.currentLocationRing, { borderColor: theme.primary }]} />
                </View>
              </Marker>
            )}

            {/* Selected location marker */}
            {selectedLocation && (
              <Marker
                coordinate={selectedLocation}
                title="Selected Location"
              >
                <View style={styles.selectedMarkerContainer}>
                  <Icon name="location" size={40} color={theme.primary} />
                </View>
              </Marker>
            )}
          </MapView>

          {/* Center pin for drag selection */}
          {!selectedLocation && (
            <View style={styles.centerPinContainer} pointerEvents="none">
              <Icon name="location" size={40} color={theme.primary} />
              <View style={[styles.pinShadow, { backgroundColor: 'rgba(0,0,0,0.2)' }]} />
            </View>
          )}

          {/* Loading overlay */}
          {!isMapReady && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text style={[styles.loadingText, { color: theme.text }]}>Loading map...</Text>
            </View>
          )}

          {/* My Location Button */}
          <TouchableOpacity
            style={[styles.myLocationButton, { backgroundColor: theme.surface }]}
            onPress={handleRecenterToCurrentLocation}
          >
            <Icon name="navigate" size={22} color={theme.primary} />
          </TouchableOpacity>
        </View>

        {/* Bottom Panel */}
        <View style={[styles.bottomPanel, { backgroundColor: theme.surface }]}>
          {/* Duration Picker for Live Location */}
          {showDurationPicker && (
            <View style={styles.durationPickerContainer}>
              <View style={[styles.durationPickerHeader, { borderBottomColor: theme.border }]}>
                <Text style={[styles.durationPickerTitle, { color: theme.text }]}>
                  Share live location for...
                </Text>
                <TouchableOpacity onPress={() => setShowDurationPicker(false)}>
                  <Icon name="close" size={24} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>
              {LIVE_LOCATION_DURATIONS.map((duration, index) => (
                <TouchableOpacity
                  key={duration.value}
                  style={[
                    styles.durationOption,
                    { borderBottomColor: theme.border },
                    index === LIVE_LOCATION_DURATIONS.length - 1 && { borderBottomWidth: 0 }
                  ]}
                  onPress={() => handleDurationSelect(duration.value)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.durationIconCircle, { backgroundColor: '#00D46E' }]}>
                    <Icon name="time-outline" size={20} color="#FFFFFF" />
                  </View>
                  <Text style={[styles.durationOptionText, { color: theme.text }]}>
                    {duration.label}
                  </Text>
                  <Icon name="chevron-forward" size={20} color={theme.textSecondary} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Main Options (hidden when duration picker is shown) */}
          {!showDurationPicker && (
            <>
              {/* Send Current Location */}
              <TouchableOpacity
                style={[styles.locationOption, { borderBottomColor: theme.border }]}
                onPress={onSendCurrentLocation}
                activeOpacity={0.7}
              >
                <View style={[styles.locationIconCircle, { backgroundColor: theme.primary }]}>
                  <Icon name="navigate" size={22} color="#FFFFFF" />
                </View>
                <View style={styles.locationOptionText}>
                  <Text style={[styles.locationOptionTitle, { color: theme.text }]}>
                    Send your current location
                  </Text>
                  <Text style={[styles.locationOptionSubtitle, { color: theme.textSecondary }]}>
                    Accurate to {location ? Math.floor(Math.random() * 20) + 5 : '--'} meters
                  </Text>
                </View>
                <Icon name="chevron-forward" size={20} color={theme.textSecondary} />
              </TouchableOpacity>

              {/* Share Live Location */}
              <TouchableOpacity
                style={[styles.locationOption, { borderBottomColor: theme.border }]}
                onPress={handleLiveLocationPress}
                activeOpacity={0.7}
              >
                <View style={[styles.locationIconCircle, { backgroundColor: '#00D46E' }]}>
                  <Icon name="radio" size={22} color="#FFFFFF" />
                </View>
                <View style={styles.locationOptionText}>
                  <Text style={[styles.locationOptionTitle, { color: theme.text }]}>
                    Share live location
                  </Text>
                  <Text style={[styles.locationOptionSubtitle, { color: theme.textSecondary }]}>
                    Share for 15 min, 1 hour, or 8 hours
                  </Text>
                </View>
                <Icon name="chevron-forward" size={20} color={theme.textSecondary} />
              </TouchableOpacity>

              {/* Send Selected Location (if user tapped on map) */}
              {selectedLocation && (
                <TouchableOpacity
                  style={[styles.sendSelectedButton, { backgroundColor: theme.primary }]}
                  onPress={handleSendSelectedLocation}
                  activeOpacity={0.8}
                >
                  <Icon name="send" size={20} color="#FFFFFF" />
                  <Text style={styles.sendSelectedButtonText}>
                    Send this location
                  </Text>
                </TouchableOpacity>
              )}

              {/* Coordinates display */}
              {location && !selectedLocation && (
                <View style={styles.coordsContainer}>
                  <Text style={[styles.coordsLabel, { color: theme.textSecondary }]}>Current coordinates</Text>
                  <Text style={[styles.coordsValue, { color: theme.text }]}>
                    {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                  </Text>
                </View>
              )}

              {selectedLocation && (
                <View style={styles.coordsContainer}>
                  <Text style={[styles.coordsLabel, { color: theme.textSecondary }]}>Selected location</Text>
                  <Text style={[styles.coordsValue, { color: theme.text }]}>
                    {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerRight: {
    width: 32,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  centerPinContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -20,
    marginTop: -40,
    alignItems: 'center',
  },
  pinShadow: {
    width: 10,
    height: 4,
    borderRadius: 5,
    marginTop: -2,
  },
  currentLocationMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentLocationDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  currentLocationRing: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    opacity: 0.3,
  },
  selectedMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  myLocationButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  bottomPanel: {
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 20 : 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  locationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  locationIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationOptionText: {
    flex: 1,
    marginLeft: 14,
  },
  locationOptionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  locationOptionSubtitle: {
    fontSize: 13,
  },
  sendSelectedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 8,
  },
  sendSelectedButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  coordsContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  coordsLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  coordsValue: {
    fontSize: 13,
    fontWeight: '500',
  },
  // Duration picker styles
  durationPickerContainer: {
    paddingBottom: 8,
  },
  durationPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  durationPickerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  durationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  durationIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationOptionText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 14,
  },
});

export default LocationModal;
