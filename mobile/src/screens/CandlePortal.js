// mobile/src/screens/CandlePortal.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';

const { width } = Dimensions.get('window');

export default function CandlePortal({ navigation, route }) {
  const { candleId, location } = route.params;
  const [activeUsers, setActiveUsers] = useState(0);
  const [currentIntentions, setCurrentIntentions] = useState([]);
  const [massTime, setMassTime] = useState('18:00');
  const [flameAnimation] = useState(new Animated.Value(1));

  useEffect(() => {
    loadCandleData();
    startFlameAnimation();
    
    // Aktualizuj dane co 30 sekund
    const interval = setInterval(loadCandleData, 30000);
    return () => clearInterval(interval);
  }, []);

  const startFlameAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(flameAnimation, {
          toValue: 1.1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(flameAnimation, {
          toValue: 0.9,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const loadCandleData = async () => {
    try {
      // Pobierz liczbę aktywnych użytkowników przy tej świecy
      const { data: activeSessions } = await supabase
        .from('candle_sessions')
        .select('*')
        .eq('candle_id', candleId)
        .eq('is_active', true)
        .gte('started_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()); // ostatnia godzina

      setActiveUsers(activeSessions?.length || 0);

      // Pobierz bieżące intencje
      const { data: intentions } = await supabase
        .from('prayer_intentions')
        .select('intention, created_at, user_name')
        .eq('candle_id', candleId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(5);

      setCurrentIntentions(intentions || []);
    } catch (error) {
      console.error('Error loading candle data:', error);
    }
  };

  const joinGlobalPrayer = () => {
    navigation.navigate('GlobalPrayer', { 
      candleId, 
      location,
      source: 'candle'
    });
  };

  const watchMassStream = () => {
    Alert.alert(
      'Transmisja Mszy Świętej',
      `Transmisja na żywo o godzinie ${massTime}\n\nLokalizacja: ${location}`,
      [
        { text: 'Anuluj', style: 'cancel' },
        { text: 'Dołącz do transmisji', onPress: () => {
          navigation.navigate('MassStream', { candleId, location });
        }}
      ]
    );
  };

  const showPrayersMap = () => {
    navigation.navigate('PrayersMap', { candleId, location });
  };

  const joinPrayer = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Dodaj użytkownika do aktywnych modlitw
      await supabase
        .from('active_prayers')
        .insert({
          user_id: user.id,
          candle_id: candleId,
          prayer_type: 'candle_prayer',
          started_at: new Date().toISOString()
        });

      Alert.alert(
        'Dołączyłeś do modlitwy',
        'Twoja modlitwa jest teraz widoczna na mapie. Inne osoby mogą do Ciebie dołączyć.',
        [{ text: 'OK' }]
      );
      
      // Odśwież dane
      loadCandleData();
    } catch (error) {
      console.error('Error joining prayer:', error);
      Alert.alert('Błąd', 'Nie udało się dołączyć do modlitwy');
    }
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
          <Text style={styles.headerTitle}>Portal Świecy</Text>
          <Text style={styles.headerSubtitle}>{location}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Animowana świeca */}
        <View style={styles.candleContainer}>
          <Animated.View 
            style={[
              styles.flame,
              { transform: [{ scale: flameAnimation }] }
            ]}
          >
            <Ionicons name="flame" size={60} color="#FFD700" />
          </Animated.View>
          <View style={styles.candleBody}>
            <Text style={styles.candleId}>ID: {candleId}</Text>
          </View>
        </View>

        {/* Licznik aktywnych użytkowników */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Ionicons name="people" size={24} color="#FFD700" />
            <Text style={styles.statNumber}>{activeUsers}</Text>
            <Text style={styles.statLabel}>modli się teraz</Text>
          </View>
        </View>

        {/* Główna funkcja - Globalna modlitwa */}
        <TouchableOpacity style={styles.mainFeature} onPress={joinGlobalPrayer}>
          <View style={styles.mainFeatureHeader}>
            <Ionicons name="globe" size={32} color="#1a237e" />
            <Text style={styles.mainFeatureTitle}>Globalna Modlitwa z Intencjami</Text>
          </View>
          <Text style={styles.mainFeatureDescription}>
            Dołącz do wspólnej modlitwy z wiernymi z całego świata
          </Text>
          <View style={styles.intentionsPreview}>
            {currentIntentions.slice(0, 3).map((intention, index) => (
              <Text key={index} style={styles.intentionText} numberOfLines={1}>
                • {intention.intention}
              </Text>
            ))}
            {currentIntentions.length > 3 && (
              <Text style={styles.moreIntentions}>
                +{currentIntentions.length - 3} więcej intencji...
              </Text>
            )}
          </View>
        </TouchableOpacity>

        {/* Funkcje dodatkowe */}
        <View style={styles.additionalFeatures}>
          <Text style={styles.sectionTitle}>Funkcje dodatkowe</Text>
          
          <TouchableOpacity style={styles.featureCard} onPress={watchMassStream}>
            <View style={styles.featureHeader}>
              <Ionicons name="videocam" size={24} color="#FFD700" />
              <View style={styles.featureInfo}>
                <Text style={styles.featureTitle}>Transmisja Mszy</Text>
                <Text style={styles.featureTime}>Codziennie o {massTime}</Text>
              </View>
              <View style={styles.liveIndicator}>
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.featureCard} onPress={showPrayersMap}>
            <View style={styles.featureHeader}>
              <Ionicons name="map" size={24} color="#FFD700" />
              <View style={styles.featureInfo}>
                <Text style={styles.featureTitle}>Mapa Modlących Się</Text>
                <Text style={styles.featureDescription}>
                  Zobacz wszystkie aktywne świece OREMUS
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#FFD700" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.featureCard} onPress={joinPrayer}>
            <View style={styles.featureHeader}>
              <Ionicons name="add-circle" size={24} color="#FFD700" />
              <View style={styles.featureInfo}>
                <Text style={styles.featureTitle}>Dołącz do Modlitwy</Text>
                <Text style={styles.featureDescription}>
                  Pokaż się na mapie jako modlący się
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#FFD700" />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  candleContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  flame: {
    marginBottom: 5,
  },
  candleBody: {
    width: 20,
    height: 80,
    backgroundColor: '#8BC34A',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 10,
  },
  candleId: {
    fontSize: 8,
    color: '#fff',
    transform: [{ rotate: '90deg' }],
  },
  statsContainer: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFD700',
    marginTop: 10,
  },
  statLabel: {
    fontSize: 14,
    color: '#fff',
    marginTop: 5,
  },
  mainFeature: {
    backgroundColor: '#FFD700',
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
  },
  mainFeatureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  mainFeatureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a237e',
    marginLeft: 10,
    flex: 1,
  },
  mainFeatureDescription: {
    fontSize: 14,
    color: '#1a237e',
    marginBottom: 15,
    lineHeight: 20,
  },
  intentionsPreview: {
    backgroundColor: 'rgba(26, 35, 126, 0.1)',
    borderRadius: 10,
    padding: 15,
  },
  intentionText: {
    fontSize: 12,
    color: '#1a237e',
    marginBottom: 5,
  },
  moreIntentions: {
    fontSize: 12,
    color: '#1a237e',
    fontStyle: 'italic',
    marginTop: 5,
  },
  additionalFeatures: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 15,
  },
  featureCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureInfo: {
    flex: 1,
    marginLeft: 15,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  featureDescription: {
    fontSize: 12,
    color: '#fff',
    marginTop: 2,
  },
  featureTime: {
    fontSize: 12,
    color: '#FFD700',
    marginTop: 2,
  },
  liveIndicator: {
    backgroundColor: '#f44336',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
  },
  liveText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
});