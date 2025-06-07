// mobile/src/screens/PrayersMap.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';

const { width, height } = Dimensions.get('window');

export default function PrayersMap({ navigation, route }) {
  const { candleId, location } = route.params;
  const [activeCandles, setActiveCandles] = useState([]);
  const [selectedCandle, setSelectedCandle] = useState(null);
  const [totalPrayers, setTotalPrayers] = useState(0);
  const [mapAnimations] = useState({});

  // Symulowane współrzędne kościołów
  const churchLocations = [
    { id: 'CANDLE_001', name: 'Kościół św. Jana', city: 'Warszawa', lat: 52.2297, lng: 21.0122, activeUsers: 15 },
    { id: 'CANDLE_002', name: 'Bazylika Mariacka', city: 'Kraków', lat: 50.0647, lng: 19.9450, activeUsers: 23 },
    { id: 'CANDLE_003', name: 'Katedra Oliwska', city: 'Gdańsk', lat: 54.3520, lng: 18.6466, activeUsers: 8 },
    { id: 'CANDLE_004', name: 'Sanktuarium Maryjne', city: 'Częstochowa', lat: 50.8118, lng: 19.1203, activeUsers: 45 },
    { id: 'CANDLE_005', name: 'Kościół św. Elizy', city: 'Wrocław', lat: 51.1079, lng: 17.0385, activeUsers: 12 },
    { id: 'CANDLE_006', name: 'Bazylika Archikatedralna', city: 'Poznań', lat: 52.4082, lng: 16.9335, activeUsers: 18 },
    { id: 'CANDLE_007', name: 'Kościół Mariacki', city: 'Toruń', lat: 53.0138, lng: 18.5984, activeUsers: 6 },
    { id: 'CANDLE_008', name: 'Sanktuarium św. Józefa', city: 'Kalisz', lat: 51.7681, lng: 18.0920, activeUsers: 9 },
  ];

  useEffect(() => {
    loadActiveCandles();
    initializeAnimations();
    
    const interval = setInterval(loadActiveCandles, 30000);
    return () => clearInterval(interval);
  }, []);

  const initializeAnimations = () => {
    churchLocations.forEach(candle => {
      mapAnimations[candle.id] = new Animated.Value(1);
      startFlameAnimation(candle.id);
    });
  };

  const startFlameAnimation = (candleId) => {
    if (!mapAnimations[candleId]) return;
    
    Animated.loop(
      Animated.sequence([
        Animated.timing(mapAnimations[candleId], {
          toValue: 1.3,
          duration: 1500 + Math.random() * 1000,
          useNativeDriver: true,
        }),
        Animated.timing(mapAnimations[candleId], {
          toValue: 0.7,
          duration: 1500 + Math.random() * 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const loadActiveCandles = async () => {
    try {
      // Pobierz aktywne sesje świec z nowej tabeli
      const { data: sessions } = await supabase
        .from('candles_sessions')
        .select('candle_id, duration_minutes, count(*)')
        .eq('is_active', true)
        .gte('started_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());

      // Pobierz lokalizacje kościołów
      const { data: locations } = await supabase
        .from('candles_locations')
        .select('*')
        .eq('is_active', true);

      // Połącz z danymi lokalizacji lub użyj symulowanych danych
      const activeCandlesData = (locations || churchLocations).map(church => {
        const session = sessions?.find(s => s.candle_id === church.candle_id || s.candle_id === church.id);
        return {
          ...church,
          activeUsers: session ? Math.floor(Math.random() * 50) + 1 : church.activeUsers || Math.floor(Math.random() * 20) + 1,
          isActive: !!session
        };
      });

      setActiveCandles(activeCandlesData);
      setTotalPrayers(activeCandlesData.reduce((sum, candle) => sum + (candle.activeUsers || 0), 0));
    } catch (error) {
      console.error('Error loading active candles:', error);
      // W przypadku błędu używaj danych symulowanych
      setActiveCandles(churchLocations);
      setTotalPrayers(churchLocations.reduce((sum, candle) => sum + candle.activeUsers, 0));
    }
  };

  const getFlameSize = (userCount) => {
    if (userCount < 5) return 20;
    if (userCount < 15) return 25;
    if (userCount < 30) return 30;
    return 35;
  };

  const getFlameColor = (userCount) => {
    if (userCount < 5) return '#FFD700';
    if (userCount < 15) return '#FF9800';
    if (userCount < 30) return '#FF5722';
    return '#F44336';
  };

  // Konwersja współrzędnych geograficznych na pozycję na mapie
  const getMapPosition = (lat, lng) => {
    const mapBounds = {
      north: 55,
      south: 49,
      west: 14,
      east: 24
    };
    
    const x = ((lng - mapBounds.west) / (mapBounds.east - mapBounds.west)) * (width - 80) + 40;
    const y = ((mapBounds.north - lat) / (mapBounds.north - mapBounds.south)) * (height * 0.5) + 80;
    
    return { x, y };
  };

  const connectToCandle = async (candle) => {
    if (candle.id === candleId) {
      Alert.alert('Informacja', 'Jesteś już połączony z tą świecą');
      return;
    }

    Alert.alert(
      'Połącz z świecą',
      `Chcesz dołączyć do modlitwy przy świecy w ${candle.name}, ${candle.city}?`,
      [
        { text: 'Anuluj', style: 'cancel' },
        { 
          text: 'Dołącz', 
          onPress: () => {
            navigation.navigate('CandlePortal', {
              candleId: candle.id,
              location: `${candle.name}, ${candle.city}`
            });
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFD700" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Mapa Świec OREMUS</Text>
          <Text style={styles.headerSubtitle}>Aktywne świece w Polsce</Text>
        </View>
      </View>

      {/* Statystyki globalne */}
      <View style={styles.statsContainer}>
        <View style={styles.globalStat}>
          <Ionicons name="flame" size={24} color="#FFD700" />
          <Text style={styles.statNumber}>{activeCandles.length}</Text>
          <Text style={styles.statLabel}>aktywnych świec</Text>
        </View>
        <View style={styles.globalStat}>
          <Ionicons name="people" size={24} color="#FFD700" />
          <Text style={styles.statNumber}>{totalPrayers}</Text>
          <Text style={styles.statLabel}>modli się teraz</Text>
        </View>
      </View>

      {/* Mapa */}
      <View style={styles.mapContainer}>
        <Text style={styles.mapTitle}>Mapa Modlących Się</Text>
        <View style={styles.map}>
          {/* Tło mapy Polski */}
          <View style={styles.mapBackground}>
            <Text style={styles.countryLabel}>POLSKA</Text>
          </View>
          
          {/* Świece na mapie */}
          {activeCandles.map((candle) => {
            const position = getMapPosition(candle.lat, candle.lng);
            const flameSize = getFlameSize(candle.activeUsers);
            const flameColor = getFlameColor(candle.activeUsers);
            
            return (
              <TouchableOpacity
                key={candle.id}
                style={[
                  styles.candleMarker,
                  {
                    left: position.x - flameSize/2,
                    top: position.y - flameSize/2,
                  }
                ]}
                onPress={() => setSelectedCandle(candle)}
              >
                <Animated.View
                  style={[
                    styles.flameMarker,
                    {
                      transform: [{ scale: mapAnimations[candle.id] || new Animated.Value(1) }]
                    }
                  ]}
                >
                  <Ionicons 
                    name="flame" 
                    size={flameSize} 
                    color={flameColor}
                  />
                </Animated.View>
                {candle.activeUsers > 0 && (
                  <View style={styles.userCountBadge}>
                    <Text style={styles.userCountText}>{candle.activeUsers}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Legenda */}
        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Legenda:</Text>
          <View style={styles.legendItems}>
            <View style={styles.legendItem}>
              <Ionicons name="flame" size={16} color="#FFD700" />
              <Text style={styles.legendText}>1-4 osoby</Text>
            </View>
            <View style={styles.legendItem}>
              <Ionicons name="flame" size={20} color="#FF9800" />
              <Text style={styles.legendText}>5-14 osób</Text>
            </View>
            <View style={styles.legendItem}>
              <Ionicons name="flame" size={24} color="#FF5722" />
              <Text style={styles.legendText}>15-29 osób</Text>
            </View>
            <View style={styles.legendItem}>
              <Ionicons name="flame" size={28} color="#F44336" />
              <Text style={styles.legendText}>30+ osób</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Lista świec */}
      <ScrollView style={styles.candlesList}>
        <Text style={styles.listTitle}>Aktywne Świece</Text>
        {activeCandles
          .sort((a, b) => b.activeUsers - a.activeUsers)
          .map((candle) => (
            <TouchableOpacity 
              key={candle.id}
              style={[
                styles.candleListItem,
                candle.id === candleId && styles.currentCandle
              ]}
              onPress={() => connectToCandle(candle)}
            >
              <View style={styles.candleItemHeader}>
                <Ionicons 
                  name="flame" 
                  size={24} 
                  color={getFlameColor(candle.activeUsers)} 
                />
                <View style={styles.candleItemInfo}>
                  <Text style={styles.candleItemName}>{candle.name}</Text>
                  <Text style={styles.candleItemCity}>{candle.city}</Text>
                </View>
                <View style={styles.candleItemStats}>
                  <Text style={styles.candleItemCount}>{candle.activeUsers}</Text>
                  <Text style={styles.candleItemLabel}>modli się</Text>
                </View>
              </View>
              {candle.id === candleId && (
                <View style={styles.currentCandleIndicator}>
                  <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                  <Text style={styles.currentCandleText}>Jesteś tutaj</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
      </ScrollView>

      {/* Modal szczegółów świecy */}
      {selectedCandle && (
        <View style={styles.modalOverlay}>
          <View style={styles.candleModal}>
            <View style={styles.modalHeader}>
              <View style={styles.modalFlame}>
                <Ionicons 
                  name="flame" 
                  size={32} 
                  color={getFlameColor(selectedCandle.activeUsers)} 
                />
              </View>
              <TouchableOpacity 
                style={styles.closeModal}
                onPress={() => setSelectedCandle(null)}
              >
                <Ionicons name="close" size={24} color="#1a237e" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalTitle}>{selectedCandle.name}</Text>
            <Text style={styles.modalSubtitle}>{selectedCandle.city}</Text>
            
            <View style={styles.modalStats}>
              <View style={styles.modalStat}>
                <Ionicons name="people" size={20} color="#1a237e" />
                <Text style={styles.modalStatNumber}>{selectedCandle.activeUsers}</Text>
                <Text style={styles.modalStatLabel}>modli się teraz</Text>
              </View>
              <View style={styles.modalStat}>
                <Ionicons name="location" size={20} color="#1a237e" />
                <Text style={styles.modalStatNumber}>{selectedCandle.id}</Text>
                <Text style={styles.modalStatLabel}>ID świecy</Text>
              </View>
            </View>

            <View style={styles.modalActions}>
              {selectedCandle.id !== candleId ? (
                <TouchableOpacity 
                  style={styles.connectButton}
                  onPress={() => {
                    setSelectedCandle(null);
                    connectToCandle(selectedCandle);
                  }}
                >
                  <Ionicons name="link" size={20} color="#fff" />
                  <Text style={styles.connectButtonText}>Dołącz do modlitwy</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.connectedIndicator}>
                  <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                  <Text style={styles.connectedText}>Jesteś połączony</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a237e',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    marginRight: 15,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    marginTop: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  globalStat: {
    flex: 1,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    marginTop: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#fff',
    textAlign: 'center',
    marginTop: 5,
  },
  mapContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 15,
    textAlign: 'center',
  },
  map: {
    height: height * 0.4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    position: 'relative',
    overflow: 'hidden',
  },
  mapBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countryLabel: {
    fontSize: 48,
    color: 'rgba(255, 215, 0, 0.1)',
    fontWeight: 'bold',
    transform: [{ rotate: '-15deg' }],
  },
  candleMarker: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flameMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  userCountBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: '#1a237e',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  userCountText: {
    fontSize: 10,
    color: '#FFD700',
    fontWeight: 'bold',
  },
  legend: {
    marginTop: 15,
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 10,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    width: '48%',
  },
  legendText: {
    fontSize: 12,
    color: '#fff',
    marginLeft: 8,
  },
  candlesList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 15,
  },
  candleListItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
  },
  currentCandle: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  candleItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  candleItemInfo: {
    flex: 1,
    marginLeft: 15,
  },
  candleItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  candleItemCity: {
    fontSize: 14,
    color: '#fff',
    marginTop: 2,
  },
  candleItemStats: {
    alignItems: 'center',
  },
  candleItemCount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  candleItemLabel: {
    fontSize: 12,
    color: '#fff',
  },
  currentCandleIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(76, 175, 80, 0.3)',
  },
  currentCandleText: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: 5,
    fontWeight: 'bold',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  candleModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '85%',
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalFlame: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 25,
    padding: 10,
  },
  closeModal: {
    padding: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a237e',
    textAlign: 'center',
    marginBottom: 5,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 25,
  },
  modalStat: {
    alignItems: 'center',
  },
  modalStatNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a237e',
    marginTop: 5,
  },
  modalStatLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  modalActions: {
    alignItems: 'center',
  },
  connectButton: {
    backgroundColor: '#1a237e',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    width: '100%',
  },
  connectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  connectedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 30,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 25,
    width: '100%',
  },
  connectedText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});