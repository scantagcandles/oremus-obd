// mobile/src/screens/SpiritualityScreen.js

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const colors = {
  primary: '#1a237e',
  secondary: '#FFD700',
  background: '#000',
  text: '#fff',
  cardBackground: 'rgba(255,255,255,0.05)',
  cardBorder: 'rgba(255,255,255,0.1)',
};

export default function SpiritualityScreen({ navigation }) {
  const spiritualItems = [
    {
      icon: 'sparkles',
      emoji: '✨',
      title: 'Świadectwa',
      description: 'Historie wiary innych osób',
      onPress: () => Alert.alert('Świadectwa', 'Funkcja będzie dostępna wkrótce'),
    },
    {
      icon: 'calendar',
      emoji: '📅',
      title: 'Kalendarz Liturgiczny',
      description: 'Święta, wspomnienia i okresy liturgiczne',
      onPress: () => Alert.alert('Kalendarz', 'Funkcja będzie dostępna wkrótce'),
    },
    {
      icon: 'book',
      emoji: '📔',
      title: 'Dziennik Duchowy',
      description: 'Zapisuj swoje refleksje i postępy',
      onPress: () => Alert.alert('Dziennik', 'Funkcja będzie dostępna wkrótce'),
    },
    {
      icon: 'bird',
      emoji: '🕊️',
      title: 'Rachunek Sumienia',
      description: 'Codzienny przegląd dnia',
      onPress: () => Alert.alert('Rachunek Sumienia', 'Funkcja będzie dostępna wkrótce'),
    },
    {
      icon: 'headset',
      emoji: '🎧',
      title: 'Audio Modlitwy',
      description: 'Medytacje i konferencje duchowe',
      onPress: () => Alert.alert('Audio', 'Funkcja będzie dostępna wkrótce'),
    },
    {
      icon: 'heart',
      emoji: '❤️',
      title: 'Nowenna',
      description: 'Dziewięciodniowe modlitwy',
      onPress: () => Alert.alert('Nowenna', 'Funkcja będzie dostępna wkrótce'),
    },
    {
      icon: 'rosary',
      emoji: '📿',
      title: 'Różaniec',
      description: 'Interaktywny różaniec z rozważaniami',
      onPress: () => Alert.alert('Różaniec', 'Funkcja będzie dostępna wkrótce'),
    },
    {
      icon: 'cross',
      emoji: '✝️',
      title: 'Droga Krzyżowa',
      description: 'Rozważania pasyjne',
      onPress: () => Alert.alert('Droga Krzyżowa', 'Funkcja będzie dostępna wkrótce'),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Duchowość</Text>
          <Text style={styles.headerSubtitle}>Narzędzia dla Twojego rozwoju duchowego</Text>
        </View>

        <View style={styles.itemsContainer}>
          {spiritualItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.card}
              onPress={item.onPress}
              activeOpacity={0.8}
            >
              <View style={styles.iconContainer}>
                <Text style={styles.emoji}>{item.emoji}</Text>
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDescription}>{item.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.text} opacity={0.5} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Cytat dnia */}
        <View style={styles.quoteCard}>
          <Text style={styles.quoteTitle}>Myśl dnia</Text>
          <Text style={styles.quoteText}>
            "Bądźcie zawsze radośni. Nieustannie się módlcie. W każdym położeniu dziękujcie."
          </Text>
          <Text style={styles.quoteSource}>1 Tes 5, 16-18</Text>
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
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.secondary,
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.text,
    opacity: 0.8,
  },
  itemsContainer: {
    padding: 20,
    paddingTop: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 18,
    marginBottom: 12,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,215,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  emoji: {
    fontSize: 28,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.7,
  },
  quoteCard: {
    margin: 20,
    marginTop: 10,
    padding: 20,
    backgroundColor: 'rgba(255,215,0,0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
  },
  quoteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.secondary,
    marginBottom: 10,
  },
  quoteText: {
    fontSize: 16,
    color: colors.text,
    fontStyle: 'italic',
    lineHeight: 24,
    marginBottom: 10,
  },
  quoteSource: {
    fontSize: 14,
    color: colors.secondary,
    textAlign: 'right',
  },
});