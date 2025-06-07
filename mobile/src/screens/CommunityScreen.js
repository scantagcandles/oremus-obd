// mobile/src/screens/CommunityScreen.js

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

export default function CommunityScreen({ navigation }) {
  const communityFeatures = [
    {
      icon: 'people',
      emoji: '👥',
      title: 'Grupa Modlitewna',
      description: 'Dołącz do grup modlitewnych w Twojej okolicy lub stwórz własną',
      memberCount: '847 osób',
      buttonText: 'Przeglądaj grupy',
      onPress: () => Alert.alert('Grupy Modlitewne', 'Funkcja będzie dostępna wkrótce'),
    },
    {
      icon: 'megaphone',
      emoji: '📢',
      title: 'Wydarzenia',
      description: 'Rekolekcje, pielgrzymki i spotkania religijne w Twojej okolicy',
      memberCount: '12 dzisiaj',
      buttonText: 'Zobacz wydarzenia',
      onPress: () => Alert.alert('Wydarzenia', 'Funkcja będzie dostępna wkrótce'),
    },
    {
      icon: 'map',
      emoji: '🗺️',
      title: 'Mapa Kościołów',
      description: 'Znajdź najbliższy kościół i sprawdź godziny Mszy Świętych',
      memberCount: '2.5 km',
      buttonText: 'Otwórz mapę',
      onPress: () => Alert.alert('Mapa', 'Funkcja będzie dostępna wkrótce'),
    },
    {
      icon: 'business',
      emoji: '🏛️',
      title: 'Sanktuaria Online',
      description: 'Wirtualne pielgrzymki do najświętszych miejsc na świecie',
      memberCount: 'Nowe',
      buttonText: 'Rozpocznij pielgrzymkę',
      onPress: () => Alert.alert('Sanktuaria', 'Funkcja będzie dostępna wkrótce'),
    },
  ];

  const testimonials = [
    {
      name: 'Maria K.',
      text: 'Dzięki OREMUS mogę modlić się z rodziną mimo odległości',
      location: 'Warszawa',
    },
    {
      name: 'Jan P.',
      text: 'Codziennie zapalam świecę i czuję łączność z innymi',
      location: 'Kraków',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Wspólnota</Text>
          <Text style={styles.headerSubtitle}>Razem w modlitwie, mimo odległości</Text>
        </View>

        {/* Community Features */}
        <View style={styles.featuresContainer}>
          {communityFeatures.map((feature, index) => (
            <View key={index} style={styles.featureCard}>
              <View style={styles.featureHeader}>
                <View style={styles.featureLeft}>
                  <Text style={styles.featureEmoji}>{feature.emoji}</Text>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{feature.memberCount}</Text>
                </View>
              </View>
              
              <Text style={styles.featureDescription}>{feature.description}</Text>
              
              <TouchableOpacity 
                style={styles.featureButton}
                onPress={feature.onPress}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonText}>{feature.buttonText}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Active Now Section */}
        <View style={styles.activeSection}>
          <Text style={styles.sectionTitle}>Aktywni teraz</Text>
          <View style={styles.activeCard}>
            <View style={styles.activeInfo}>
              <Text style={styles.activeNumber}>3,847</Text>
              <Text style={styles.activeText}>osób modli się teraz</Text>
            </View>
            <View style={styles.activeDots}>
              <View style={[styles.dot, styles.dotActive]} />
              <View style={[styles.dot, styles.dotActive]} />
              <View style={[styles.dot, styles.dotActive]} />
            </View>
          </View>
        </View>

        {/* Testimonials */}
        <View style={styles.testimonialsSection}>
          <Text style={styles.sectionTitle}>Świadectwa</Text>
          {testimonials.map((testimonial, index) => (
            <View key={index} style={styles.testimonialCard}>
              <Text style={styles.testimonialText}>"{testimonial.text}"</Text>
              <Text style={styles.testimonialAuthor}>
                {testimonial.name} • {testimonial.location}
              </Text>
            </View>
          ))}
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
  featuresContainer: {
    padding: 20,
    paddingTop: 10,
  },
  featureCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 20,
    marginBottom: 15,
  },
  featureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureEmoji: {
    fontSize: 24,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  badge: {
    backgroundColor: 'rgba(255,215,0,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    color: colors.secondary,
    fontSize: 14,
    fontWeight: '600',
  },
  featureDescription: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.8,
    marginBottom: 15,
    lineHeight: 20,
  },
  featureButton: {
    backgroundColor: colors.secondary,
    borderRadius: 25,
    padding: 15,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  activeSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.secondary,
    marginBottom: 15,
  },
  activeCard: {
    backgroundColor: 'rgba(255,215,0,0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activeInfo: {
    flex: 1,
  },
  activeNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.secondary,
  },
  activeText: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.8,
  },
  activeDots: {
    flexDirection: 'row',
    gap: 5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dotActive: {
    backgroundColor: colors.secondary,
  },
  testimonialsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  testimonialCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 18,
    marginBottom: 12,
  },
  testimonialText: {
    fontSize: 16,
    color: colors.text,
    fontStyle: 'italic',
    marginBottom: 10,
    lineHeight: 22,
  },
  testimonialAuthor: {
    fontSize: 14,
    color: colors.secondary,
    opacity: 0.8,
  },
});