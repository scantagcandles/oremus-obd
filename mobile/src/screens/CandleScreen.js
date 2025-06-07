// mobile/src/screens/CandleScreen.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';

const { width } = Dimensions.get('window');

export default function CandleScreen({ navigation }) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanAnimation] = useState(new Animated.Value(0));
  const [pulseAnimation] = useState(new Animated.Value(1));

  useEffect(() => {
    startPulseAnimation();
  }, []);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const startScanAnimation = () => {
    Animated.loop(
      Animated.timing(scanAnimation, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();
  };

  const stopScanAnimation = () => {
    scanAnimation.setValue(0);
    scanAnimation.stopAnimation();
  };

  // Symulacja wykrywania NFC (w prawdziwej aplikacji używałbyś react-native-nfc-manager)
  const simulateNFCScan = () => {
    setIsScanning(true);
    startScanAnimation();

    // Symulacja różnych scenariuszy wykrywania
    const scenarios = [
      { success: true, candleId: 'CANDLE_001', location: 'Kościół św. Jana, Warszawa' },
      { success: true, candleId: 'CANDLE_002', location: 'Bazylika Mariacka, Kraków' },
      { success: true, candleId: 'CANDLE_003', location: 'Katedra, Gdańsk' },
      { success: false, error: 'Nie wykryto świecy' }
    ];

    const randomScenario = scenarios[Math.floor(Math.random() * scenarios.length)];

    setTimeout(() => {
      setIsScanning(false);
      stopScanAnimation();

      if (randomScenario.success) {
        // Zapisz dane świecy do bazy
        saveCandleSession(randomScenario);
        // Przejdź do portalu świecy
        navigation.navigate('CandlePortal', {
          candleId: randomScenario.candleId,
          location: randomScenario.location
        });
      } else {
        Alert.alert(
          'Wykrywanie nieudane',
          'Nie udało się wykryć świecy OREMUS. Upewnij się, że telefon jest blisko świecy.',
          [{ text: 'Spróbuj ponownie', onPress: () => {} }]
        );
      }
    }, 3000);
  };

  const saveCandleSession = async (candleData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase
        .from('candle_sessions')
        .insert({
          user_id: user.id,
          candle_id: candleData.candleId,
          location: candleData.location,
          started_at: new Date().toISOString(),
          is_active: true
        });
    } catch (error) {
      console.error('Error saving candle session:', error);
    }
  };

  const scanRotation = scanAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFD700" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Świeca OREMUS</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.candleContainer}>
          <Animated.View 
            style={[
              styles.candleIcon,
              { transform: [{ scale: pulseAnimation }] }
            ]}
          >
            <Ionicons name="flame" size={80} color="#FFD700" />
          </Animated.View>
          
          {isScanning && (
            <Animated.View 
              style={[
                styles.scanRing,
                { transform: [{ rotate: scanRotation }] }
              ]}
            >
              <View style={styles.scanRingInner} />
            </Animated.View>
          )}
        </View>

        <Text style={styles.title}>Zbliż telefon do świecy</Text>
        <Text style={styles.subtitle}>
          Automatyczne wykrywanie świecy OREMUS za pomocą technologii NFC
        </Text>

        <TouchableOpacity 
          style={[styles.scanButton, isScanning && styles.scanButtonActive]}
          onPress={simulateNFCScan}
          disabled={isScanning}
        >
          {isScanning ? (
            <ActivityIndicator size="large" color="#1a237e" />
          ) : (
            <View style={styles.scanButtonContent}>
              <Ionicons name="scan" size={32} color="#1a237e" />
              <Text style={styles.scanButtonText}>Rozpocznij wykrywanie</Text>
            </View>
          )}
        </TouchableOpacity>

        {isScanning && (
          <View style={styles.scanningInfo}>
            <Text style={styles.scanningText}>Wykrywanie świecy...</Text>
            <Text style={styles.scanningSubtext}>
              Trzymaj telefon blisko górnej części świecy
            </Text>
          </View>
        )}

        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <Ionicons name="information-circle" size={24} color="#FFD700" />
            <Text style={styles.infoText}>
              Każda świeca OREMUS ma wbudowany chip NFC
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="wifi" size={24} color="#FFD700" />
            <Text style={styles.infoText}>
              Upewnij się, że NFC jest włączone w telefonie
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="location" size={24} color="#FFD700" />
            <Text style={styles.infoText}>
              Twoja modlitwa będzie widoczna na mapie
            </Text>
          </View>
        </View>
      </View>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  candleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    marginBottom: 40,
    position: 'relative',
  },
  candleIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanRing: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: '#FFD700',
    borderStyle: 'dashed',
  },
  scanRingInner: {
    flex: 1,
    borderRadius: 100,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
  },
  scanButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginBottom: 30,
    minWidth: 200,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  scanButtonActive: {
    backgroundColor: '#E6C200',
  },
  scanButtonContent: {
    alignItems: 'center',
  },
  scanButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a237e',
    marginTop: 8,
  },
  scanningInfo: {
    alignItems: 'center',
    marginBottom: 30,
  },
  scanningText: {
    fontSize: 18,
    color: '#FFD700',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  scanningSubtext: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
  },
  infoSection: {
    width: '100%',
    marginTop: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#fff',
    marginLeft: 15,
    flex: 1,
    lineHeight: 20,
  },
});