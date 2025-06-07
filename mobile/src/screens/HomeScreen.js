// mobile/src/screens/HomeScreen.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../services/supabase';

const colors = {
  primary: '#1a237e',
  secondary: '#FFD700',
  background: '#000',
  text: '#fff',
  cardBackground: 'rgba(255,255,255,0.1)',
  cardBorder: 'rgba(255,255,255,0.2)',
};

// Cytaty biblijne
const bibleQuotes = [
  '"Bądź wola Twoja jak w niebie tak i na ziemi" - Mt 6,10',
  '"Pan jest moim pasterzem, nie brak mi niczego" - Ps 23,1',
  '"Wszystko mogę w Tym, który mnie umacnia" - Flp 4,13',
  '"Miłość cierpliwa jest, łaskawa jest" - 1 Kor 13,4',
  '"Błogosławieni miłosierni, albowiem oni miłosierdzia dostąpią" - Mt 5,7',
  '"Ja jestem światłością świata" - J 8,12',
  '"Proście, a będzie wam dane" - Mt 7,7',
  '"Pokój zostawiam wam, pokój mój daję wam" - J 14,27',
  '"Jam jest drogą i prawdą, i życiem" - J 14,6',
  '"Gdzie dwaj albo trzej zgromadzeni są w imię moje" - Mt 18,20',
];

export default function HomeScreen({ navigation }) {
  const [refreshing, setRefreshing] = useState(false);
  const [prayerCount, setPrayerCount] = useState(0);
  const [currentQuote, setCurrentQuote] = useState('');

  useEffect(() => {
    loadData();
    setRandomQuote();
  }, []);

  const setRandomQuote = () => {
    const randomIndex = Math.floor(Math.random() * bibleQuotes.length);
    setCurrentQuote(bibleQuotes[randomIndex]);
  };

  const loadData = async () => {
    const result = await apiService.getActivePrayerCount();
    if (result.success) {
      setPrayerCount(result.count);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRandomQuote();
    setRefreshing(false);
  };

  const handleFeaturePress = (feature) => {
    switch (feature) {
      case 'mass':
        Alert.alert('Zamów Mszę', 'Funkcja będzie dostępna wkrótce');
        break;
      case 'candle':
        // Nawigacja do systemu Świec OREMUS
        navigation.navigate('CandleScreen');
        break;
      case 'online':
        Alert.alert('Msze Online', 'Funkcja będzie dostępna wkrótce');
        break;
      case 'readings':
        Alert.alert('Czytania Dnia', 'Funkcja będzie dostępna wkrótce');
        break;
      case 'prayer':
        Alert.alert('Modlitewnik', 'Funkcja będzie dostępna wkrótce');
        break;
      case 'intentions':
        Alert.alert('Intencje', 'Funkcja będzie dostępna wkrótce');
        break;
    }
  };

  const features = [
    { id: 'mass', icon: 'business', title: 'Zamów\nMszę', emoji: '⛪' },
    { id: 'candle', icon: 'flame', title: 'Świeca\nOremus', emoji: '🕯️' },
    { id: 'online', icon: 'tv', title: 'Msze\nOnline', emoji: '📺' },
    { id: 'readings', icon: 'book', title: 'Czytania\nDnia', emoji: '📖' },
    { id: 'prayer', icon: 'hands', title: 'Modlitewnik', emoji: '🙏' },
    { id: 'intentions', icon: 'chatbubbles', title: 'Intencje', emoji: '💬' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.secondary}
          />
        }
      >
        {/* Header z logo */}
        <View style={styles.header}>
          <Text style={styles.logoText}>OREMUS</Text>
          <Text style={styles.subtitle}>Aplikacja modlitwy</Text>
        </View>

        {/* Cytat biblijny */}
        <View style={styles.quoteContainer}>
          <View style={styles.quoteHeader}>
            <Ionicons name="book-open" size={20} color={colors.secondary} />
            <Text style={styles.quoteTitle}>Słowo na dziś</Text>
          </View>
          <Text style={styles.quoteText}>{currentQuote}</Text>
        </View>

        {/* Licznik modlących się - przeniesiony wyżej */}
        <View style={styles.prayerCounter}>
          <View style={styles.counterContent}>
            <Ionicons name="people" size={28} color={colors.secondary} />
            <View style={styles.counterInfo}>
              <Text style={styles.counterNumber}>{prayerCount}</Text>
              <Text style={styles.counterText}>osób modli się teraz</Text>
            </View>
            <TouchableOpacity 
              style={styles.joinButton}
              onPress={() => navigation.navigate('CandleScreen')}
            >
              <Text style={styles.joinButtonText}>Dołącz</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Siatka funkcji */}
        <View style={styles.grid}>
          {features.map((feature) => (
            <TouchableOpacity
              key={feature.id}
              style={[
                styles.gridItem,
                feature.id === 'candle' && styles.candleHighlight
              ]}
              onPress={() => handleFeaturePress(feature.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.gridEmoji}>{feature.emoji}</Text>
              <Text style={styles.gridTitle}>{feature.title}</Text>
              {feature.id === 'candle' && (
                <View style={styles.nfcBadge}>
                  <Ionicons name="wifi" size={10} color="#FF9800" />
                  <Text style={styles.nfcText}>NFC</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Szybkie akcje */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Szybkie akcje</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => navigation.navigate('PrayersMap', { 
                candleId: 'GLOBAL', 
                location: 'Mapa Globalna' 
              })}
            >
              <Ionicons name="map" size={20} color={colors.secondary} />
              <Text style={styles.quickActionText}>Mapa świec</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => navigation.navigate('GlobalPrayer', { 
                candleId: 'GLOBAL', 
                location: 'Globalna Modlitwa',
                source: 'home'
              })}
            >
              <Ionicons name="globe" size={20} color={colors.secondary} />
              <Text style={styles.quickActionText}>Globalna modlitwa</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => Alert.alert('Informacja', 'Funkcja wkrótce dostępna')}
            >
              <Ionicons name="notifications" size={20} color={colors.secondary} />
              <Text style={styles.quickActionText}>Przypomnienia</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.secondary,
    letterSpacing: 3,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.8,
    marginTop: 5,
  },
  quoteContainer: {
    marginBottom: 20,
    padding: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 15,
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary,
  },
  quoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  quoteTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.secondary,
    marginLeft: 8,
  },
  quoteText: {
    color: colors.text,
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  prayerCounter: {
    backgroundColor: 'rgba(255,215,0,0.1)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
    padding: 20,
    marginBottom: 20,
  },
  counterContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  counterInfo: {
    flex: 1,
    marginLeft: 15,
  },
  counterNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.secondary,
  },
  counterText: {
    fontSize: 12,
    color: colors.text,
    opacity: 0.9,
    marginTop: 2,
  },
  joinButton: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 15,
  },
  joinButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.primary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  gridItem: {
    width: '31%',
    aspectRatio: 1,
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    padding: 10,
    position: 'relative',
  },
  candleHighlight: {
    borderColor: '#FF9800',
    borderWidth: 2,
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
  },
  gridEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  gridTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
  nfcBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  nfcText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#FF9800',
    marginLeft: 2,
  },
  quickActions: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.secondary,
    marginBottom: 15,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickAction: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.cardBackground,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    minWidth: 80,
  },
  quickActionText: {
    fontSize: 10,
    color: colors.secondary,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 12,
  },
});