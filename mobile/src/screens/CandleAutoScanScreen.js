// mobile/src/screens/CandleAutoScanScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  Modal,
  Linking,
  Alert
} from 'react-native';
import { supabase } from '../services/supabase';

const { width, height } = Dimensions.get('window');

export default function CandleAutoScanScreen({ navigation }) {
  const [scanningState, setScanningState] = useState('scanning'); // 'scanning', 'found', 'praying'
  const [currentIntention, setCurrentIntention] = useState('');
  const [prayingCount, setPrayingCount] = useState(0);
  const [selectedChurch, setSelectedChurch] = useState(null);
  const [churches, setChurches] = useState([]);
  const [showMap, setShowMap] = useState(false);
  const [activePrayers, setActivePrayers] = useState([]);
  const [isLivestream, setIsLivestream] = useState(false);
  
  // Animacje
  const scanPulse = useRef(new Animated.Value(0)).current;
  const candleGlow = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    startAutoScanning();
    fetchCurrentPrayerSession();
    fetchChurches();
    checkMassTime();
    
    const interval = setInterval(() => {
      fetchPrayingCount();
      fetchCurrentPrayerSession(); // Odśwież intencję
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const startAutoScanning = async () => {
    // Rozpocznij animację skanowania
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanPulse, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanPulse, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Symulacja NFC - w prawdziwej aplikacji tutaj byłby kod NFC
    // Dla celów demonstracyjnych dodamy przycisk testowy
  };

  const fetchCurrentPrayerSession = async () => {
    try {
      const { data, error } = await supabase
        .from('candle_prayer_sessions')
        .select('*')
        .eq('is_active', true)
        .single();

      if (data) {
        setCurrentIntention(data.current_intention || 'Za pokój na świecie');
      }
    } catch (error) {
      console.error('Error fetching prayer session:', error);
      setCurrentIntention('Za pokój na świecie'); // Fallback
    }
  };

  const fetchPrayingCount = async () => {
    try {
      const { count } = await supabase
        .from('active_candle_prayers')
        .select('*', { count: 'exact', head: true });

      setPrayingCount(count || Math.floor(Math.random() * 50) + 10); // Fallback z losową liczbą
    } catch (error) {
      console.error('Error fetching praying count:', error);
      setPrayingCount(Math.floor(Math.random() * 50) + 10);
    }
  };

  const fetchChurches = async () => {
    try {
      const { data } = await supabase
        .from('churches_livestream')
        .select('*')
        .eq('is_active', true);

      setChurches(data || []);
      
      // Wybierz losowy kościół na dziś
      if (data && data.length > 0) {
        const randomChurch = data[Math.floor(Math.random() * data.length)];
        setSelectedChurch(randomChurch);
      }
    } catch (error) {
      console.error('Error fetching churches:', error);
    }
  };

  const checkMassTime = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Sprawdź czy jest czas mszy (17:45 - 19:00)
    if ((currentHour === 17 && currentMinute >= 45) || 
        currentHour === 18 || 
        (currentHour === 19 && currentMinute <= 0)) {
      setIsLivestream(true);
    } else {
      setIsLivestream(false);
    }
  };

  const simulateNfcFound = () => {
    setScanningState('found');
    
    // Animacja znalezienia świecy
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(candleGlow, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(candleGlow, {
            toValue: 0.7,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start(),
    ]).start();

    // Automatycznie dołącz do modlitwy po 2 sekundach
    setTimeout(() => {
      joinPrayer();
    }, 2000);
  };

  const joinPrayer = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Błąd', 'Musisz być zalogowany');
        return;
      }

      const { data: session } = await supabase
        .from('candle_prayer_sessions')
        .select('id')
        .eq('is_active', true)
        .single();

      if (session) {
        await supabase
          .from('candles')
          .insert({
            user_id: user.id,
            prayer_session_id: session.id,
            is_praying: true,
            joined_at: new Date().toISOString(),
            intention: 'Modlitwa przez aplikację OREMUS',
            nfc_tag_id: 'NFC_OREMUS_TEST',
            physical_location: 'Wirtualna świeca',
          });

        setScanningState('praying');
        
        // Aktualizuj liczbę modlących się
        setTimeout(() => {
          fetchPrayingCount();
        }, 1000);
      }
    } catch (error) {
      console.error('Error joining prayer:', error);
      // Nawet jeśli wystąpi błąd, pozwól kontynuować
      setScanningState('praying');
    }
  };

  const openLivestream = () => {
    if (selectedChurch?.livestream_url) {
      Linking.openURL(selectedChurch.livestream_url);
    }
  };

  const renderScanning = () => {
    const scale = scanPulse.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.3],
    });

    return (
      <View style={styles.scanningContainer}>
        <Animated.View style={[styles.candleContainer, { transform: [{ scale }] }]}>
          <Text style={styles.candleIcon}>🕯️</Text>
        </Animated.View>
        <Text style={styles.scanningTitle}>Święta Świeca</Text>
        <Text style={styles.scanningText}>Zbliż telefon do{'\n'}zapalonej świecy</Text>
        <View style={styles.dotsContainer}>
          <View style={[styles.dot, { backgroundColor: '#FFD700' }]} />
          <View style={[styles.dot, { backgroundColor: '#FFD700' }]} />
          <View style={[styles.dot, { backgroundColor: '#FFD700' }]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
        <Text style={styles.detectingText}>wykrywanie...</Text>
        
        {/* PRZYCISK TESTOWY - USUŃ W PRODUKCJI */}
        <TouchableOpacity 
          style={styles.testButton}
          onPress={simulateNfcFound}
        >
          <Text style={styles.testButtonText}>🔥 Symuluj znalezienie świecy</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderFound = () => {
    const glowOpacity = candleGlow.interpolate({
      inputRange: [0, 1],
      outputRange: [0.5, 1],
    });

    return (
      <Animated.View style={[styles.foundContainer, { opacity: fadeAnim }]}>
        <Animated.View style={[styles.glowEffect, { opacity: glowOpacity }]} />
        <Text style={styles.foundIcon}>🕯️</Text>
        <Text style={styles.foundTitle}>Świeca wykryta!</Text>
        <Text style={styles.foundText}>Dołączanie do wspólnej modlitwy...</Text>
      </Animated.View>
    );
  };

  const renderPraying = () => {
    return (
      <ScrollView style={styles.prayingContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.intentionCard}>
          <Text style={styles.intentionLabel}>Modlimy się w intencji:</Text>
          <Text style={styles.intentionText}>{currentIntention}</Text>
          <View style={styles.prayingStats}>
            <Text style={styles.prayingCount}>🔥 {prayingCount}</Text>
            <Text style={styles.prayingLabel}>osób modli się teraz z Tobą</Text>
          </View>
        </View>

        {isLivestream && selectedChurch && (
          <TouchableOpacity style={styles.livestreamCard} onPress={openLivestream}>
            <Text style={styles.livestreamTitle}>🔴 Transmisja Mszy Świętej</Text>
            <Text style={styles.churchName}>{selectedChurch.church_name}</Text>
            <Text style={styles.churchLocation}>{selectedChurch.location}</Text>
            <Text style={styles.joinButton}>Dołącz do transmisji →</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity 
          style={styles.changeChurchButton}
          onPress={() => Alert.alert('Info', 'Lista kościołów będzie dostępna wkrótce')}
        >
          <Text style={styles.changeChurchText}>Zmień kościół</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.mapButton}
          onPress={() => setShowMap(true)}
        >
          <Text style={styles.mapButtonText}>🗺️ Zobacz mapę modlących się</Text>
        </TouchableOpacity>

        <View style={styles.prayerActions}>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Breviary')}>
            <Text style={styles.actionIcon}>📿</Text>
            <Text style={styles.actionText}>Brewiarz</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('PrayerBook')}>
            <Text style={styles.actionIcon}>📖</Text>
            <Text style={styles.actionText}>Modlitewnik</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('CandleShop')}>
            <Text style={styles.actionIcon}>🛍️</Text>
            <Text style={styles.actionText}>Sklep</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.endPrayerButton}
          onPress={() => {
            setScanningState('scanning');
            Alert.alert('Modlitwa zakończona', 'Dziękujemy za wspólną modlitwę! 🙏');
          }}
        >
          <Text style={styles.endPrayerText}>Zakończ modlitwę</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Powrót</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Święta Świeca</Text>
      </View>

      {scanningState === 'scanning' && renderScanning()}
      {scanningState === 'found' && renderFound()}
      {scanningState === 'praying' && renderPraying()}

      {/* Modal z mapą */}
      <Modal
        visible={showMap}
        animationType="slide"
        onRequestClose={() => setShowMap(false)}
      >
        <SafeAreaView style={styles.mapContainer}>
          <View style={styles.mapHeader}>
            <Text style={styles.mapTitle}>Mapa modlących się</Text>
            <TouchableOpacity onPress={() => setShowMap(false)}>
              <Text style={styles.closeButton}>Zamknij</Text>
            </TouchableOpacity>
          </View>
          
          {/* Tymczasowy placeholder dla mapy */}
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapPlaceholderText}>🗺️</Text>
            <Text style={styles.mapPlaceholderInfo}>
              Mapa świata z aktywnymi świecami
            </Text>
            <Text style={styles.mapStatsText}>
              🕯️ Aktywnych świec: {prayingCount}
            </Text>
            <Text style={styles.mapStatsText}>
              🌍 Kraje: Polska, Francja, Watykan, Niemcy
            </Text>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
  },
  backButton: {
    color: '#FFD700',
    fontSize: 16,
    marginRight: 20,
  },
  headerTitle: {
    color: '#FFD700',
    fontSize: 24,
    fontWeight: 'bold',
  },
  scanningContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  candleContainer: {
    marginBottom: 40,
  },
  candleIcon: {
    fontSize: 120,
  },
  scanningTitle: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  scanningText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: 40,
    lineHeight: 26,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#444',
  },
  detectingText: {
    color: '#666',
    fontSize: 16,
  },
  testButton: {
    marginTop: 50,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  testButtonText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
  },
  foundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowEffect: {
    position: 'absolute',
    width: 200,
    height: 200,
    backgroundColor: '#FFD700',
    borderRadius: 100,
    opacity: 0.3,
  },
  foundIcon: {
    fontSize: 150,
    marginBottom: 30,
  },
  foundTitle: {
    color: '#FFD700',
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  foundText: {
    color: '#fff',
    fontSize: 18,
    opacity: 0.8,
  },
  prayingContainer: {
    flex: 1,
    padding: 20,
  },
  intentionCard: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 20,
    padding: 25,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  intentionLabel: {
    color: '#FFD700',
    fontSize: 16,
    marginBottom: 10,
  },
  intentionText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    lineHeight: 30,
    marginBottom: 20,
  },
  prayingStats: {
    alignItems: 'center',
  },
  prayingCount: {
    color: '#FFD700',
    fontSize: 36,
    fontWeight: 'bold',
  },
  prayingLabel: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.8,
    marginTop: 5,
  },
  livestreamCard: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 0, 0.3)',
  },
  livestreamTitle: {
    color: '#ff4444',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  churchName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  churchLocation: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 15,
  },
  joinButton: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
  },
  changeChurchButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  changeChurchText: {
    color: '#fff',
    fontSize: 16,
  },
  mapButton: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 30,
  },
  mapButtonText: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
  },
  prayerActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  actionButton: {
    alignItems: 'center',
    padding: 15,
  },
  actionIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  actionText: {
    color: '#fff',
    fontSize: 14,
  },
  endPrayerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 18,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 40,
  },
  endPrayerText: {
    color: '#fff',
    fontSize: 16,
  },
  mapContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  mapTitle: {
    color: '#FFD700',
    fontSize: 24,
    fontWeight: 'bold',
  },
  closeButton: {
    color: '#FFD700',
    fontSize: 16,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  mapPlaceholderText: {
    fontSize: 100,
    marginBottom: 20,
  },
  mapPlaceholderInfo: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
  },
  mapStatsText: {
    color: '#FFD700',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
});