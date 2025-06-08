// mobile/src/screens/ModernHomeScreen.js
// OREMUS 2025 - Modernized HomeScreen with all existing functions + new features

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Import existing services (ZACHOWANE)
import { apiService } from '../services/supabase';

// Import new design system
import {
  DesignTokens,
  GlassCard,
  GlassButton,
  AnimatedCard,
  FlameAnimation,
  PulseAnimation,
  ResponsiveGrid,
  AdaptiveContainer,
  FeatureCard,
  StatCard,
  QuoteCard,
} from '../components/modern/DesignSystem';

// Import responsive hooks
import { useOremusLayout } from '../hooks/useResponsiveLayout';

// =====================================================
// 📝 EXISTING DATA - ZACHOWANE Z OBECNEGO HOMESCREEN
// =====================================================

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

// =====================================================
// 🎯 ENHANCED FEATURES - EXISTING + NEW
// =====================================================

const enhancedFeatures = [
  // ZACHOWANE FUNKCJE (z obecnej aplikacji)
  {
    id: 'candle',
    icon: 'flame',
    emoji: '🕯️',
    title: 'Święta Świeca',
    subtitle: 'NFC + Modlitwa',
    category: 'existing',
    color: DesignTokens.colors.prayer,
    isCore: true, // Główna funkcja OREMUS
  },
  {
    id: 'global-prayer',
    icon: 'globe',
    emoji: '🌍',
    title: 'Globalna Modlitwa',
    subtitle: 'Wspólne intencje',
    category: 'existing',
    color: DesignTokens.colors.prayer,
  },
  {
    id: 'prayers-map',
    icon: 'map',
    emoji: '🗺️',
    title: 'Mapa Modlitw',
    subtitle: 'Aktywne świece',
    category: 'existing',
    color: DesignTokens.colors.info,
  },
  {
    id: 'mass-stream',
    icon: 'tv',
    emoji: '📺',
    title: 'Transmisja Mszy',
    subtitle: 'Live streaming',
    category: 'existing',
    color: DesignTokens.colors.mass,
  },
  
  // NOWE FUNKCJE (z wizualizacji)
  {
    id: 'order-mass',
    icon: 'business',
    emoji: '⛪',
    title: 'Zamów Mszę',
    subtitle: 'Rezerwacja online',
    category: 'new',
    color: DesignTokens.colors.mass,
    isNew: true,
  },
  {
    id: 'odb-player',
    icon: 'musical-notes',
    emoji: '🎵',
    title: 'ODB Player',
    subtitle: 'Premium audio',
    category: 'new',
    color: DesignTokens.colors.player,
    isNew: true,
  },
  {
    id: 'academy',
    icon: 'school',
    emoji: '🎓',
    title: 'Akademia',
    subtitle: 'Kursy z certyfikatami',
    category: 'new',
    color: DesignTokens.colors.academy,
    isNew: true,
  },
  {
    id: 'library',
    icon: 'library',
    emoji: '📚',
    title: 'Biblioteka',
    subtitle: 'E-booki, materiały',
    category: 'new',
    color: DesignTokens.colors.library,
    isNew: true,
  },
  
  // DODATKOWE ZACHOWANE FUNKCJE
  {
    id: 'community',
    icon: 'people',
    emoji: '👥',
    title: 'Wspólnota',
    subtitle: 'Grupy modlitwy',
    category: 'existing',
    color: DesignTokens.colors.info,
  },
  {
    id: 'spirituality',
    icon: 'heart',
    emoji: '❤️',
    title: 'Duchowość',
    subtitle: 'Narzędzia duchowe',
    category: 'existing',
    color: DesignTokens.colors.prayer,
  },
  {
    id: 'shop',
    icon: 'storefront',
    emoji: '🛍️',
    title: 'Sklep Świec',
    subtitle: 'Zamów świece NFC',
    category: 'existing',
    color: DesignTokens.colors.warning,
  },
  {
    id: 'readings',
    icon: 'book',
    emoji: '📖',
    title: 'Czytania Dnia',
    subtitle: 'Liturgia słowa',
    category: 'existing',
    color: DesignTokens.colors.info,
  },
];

// =====================================================
// 🏠 MODERN HOME SCREEN COMPONENT
// =====================================================

export default function ModernHomeScreen({ navigation }) {
  // State (zachowany z obecnego HomeScreen)
  const [refreshing, setRefreshing] = useState(false);
  const [prayerCount, setPrayerCount] = useState(0);
  const [currentQuote, setCurrentQuote] = useState('');
  const [showNewFeatures, setShowNewFeatures] = useState(true);
  
  // Layout hooks
  const layout = useOremusLayout();
  
  // Animations
  const headerAnimation = useState(new Animated.Value(0))[0];
  const cardsAnimation = useState(new Animated.Value(0))[0];
  
  // =====================================================
  // 🔄 EXISTING FUNCTIONS - ZACHOWANE BEZ ZMIAN
  // =====================================================
  
  useEffect(() => {
    loadData();
    setRandomQuote();
    startAnimations();
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

  // =====================================================
  // 🎯 ENHANCED FEATURE HANDLER - EXISTING + NEW
  // =====================================================
  
  const handleFeaturePress = (feature) => {
    switch (feature.id) {
      // ZACHOWANE FUNKCJE (existing navigation)
      case 'candle':
        navigation.navigate('CandleScreen');
        break;
        
      case 'global-prayer':
        navigation.navigate('GlobalPrayer', { 
          candleId: 'GLOBAL', 
          location: 'Globalna Modlitwa',
          source: 'home'
        });
        break;
        
      case 'prayers-map':
        navigation.navigate('PrayersMap', { 
          candleId: 'GLOBAL', 
          location: 'Mapa Globalna' 
        });
        break;
        
      case 'mass-stream':
        navigation.navigate('MassStream', { 
          candleId: 'GLOBAL', 
          location: 'Transmisja Online' 
        });
        break;
        
      case 'community':
        navigation.navigate('Community');
        break;
        
      case 'spirituality':
        navigation.navigate('Spirituality');
        break;
        
      case 'shop':
        navigation.navigate('CandleShop');
        break;
        
      // NOWE FUNKCJE (new screens to be created)
      case 'order-mass':
        // Will navigate to new OrderMassScreen
        Alert.alert('Zamawianie Mszy', 'Nowa funkcja - rezerwacja Mszy online będzie dostępna wkrótce! ⛪');
        break;
        
      case 'odb-player':
        // Will navigate to new ODBPlayerScreen
        Alert.alert('ODB Player Premium', 'Nowa funkcja - premium odtwarzacz audio duchowego będzie dostępny wkrótce! 🎵');
        break;
        
      case 'academy':
        // Will navigate to new AcademyScreen
        Alert.alert('Akademia Formacyjna', 'Nowa funkcja - kursy formacyjne z certyfikatami będą dostępne wkrótce! 🎓');
        break;
        
      case 'library':
        // Will navigate to new LibraryScreen
        Alert.alert('Biblioteka Cyfrowa', 'Nowa funkcja - cyfrowa biblioteka z e-bookami będzie dostępna wkrótce! 📚');
        break;
        
      case 'readings':
        Alert.alert('Czytania Dnia', 'Funkcja będzie dostępna wkrótce');
        break;
        
      default:
        Alert.alert('Informacja', 'Funkcja w przygotowaniu');
        break;
    }
  };

  // =====================================================
  // ✨ ANIMATIONS
  // =====================================================
  
  const startAnimations = () => {
    Animated.stagger(200, [
      Animated.timing(headerAnimation, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(cardsAnimation, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // =====================================================
  // 🎨 RENDER FUNCTIONS
  // =====================================================
  
  const renderHeader = () => (
    <Animated.View 
      style={[
        styles.header,
        {
          opacity: headerAnimation,
          transform: [{
            translateY: headerAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [-50, 0],
            })
          }]
        }
      ]}
    >
      <PulseAnimation style={styles.logoContainer}>
        <Text style={[styles.logoText, { fontSize: layout.utils.fontSize(48) }]}>
          OREMUS
        </Text>
        <Text style={[styles.subtitle, { fontSize: layout.utils.fontSize(14) }]}>
          Aplikacja modlitwy • 2025
        </Text>
      </PulseAnimation>
    </Animated.View>
  );

  const renderQuoteCard = () => (
    <QuoteCard 
      quote={currentQuote}
      style={[styles.quoteCard, { marginBottom: layout.utils.spacing(20) }]}
    />
  );

  const renderPrayerCounter = () => (
    <AnimatedCard 
      animation="glow" 
      style={[styles.prayerCounter, { marginBottom: layout.utils.spacing(24) }]}
    >
      <View style={styles.counterContent}>
        <FlameAnimation size={layout.prayer.flameAnimationSize} />
        
        <View style={styles.counterInfo}>
          <Text style={[
            styles.counterNumber, 
            { fontSize: layout.prayer.getPrayerCounterSize().fontSize }
          ]}>
            {prayerCount}
          </Text>
          <Text style={[styles.counterText, { fontSize: layout.utils.fontSize(14) }]}>
            osób modli się teraz
          </Text>
        </View>
        
        <GlassButton 
          size="md"
          variant="primary"
          onPress={() => handleFeaturePress({ id: 'candle' })}
          style={styles.joinButton}
        >
          <Text style={styles.joinButtonText}>Dołącz</Text>
        </GlassButton>
      </View>
    </AnimatedCard>
  );

  const renderFeaturesGrid = () => {
    const coreFeatures = enhancedFeatures.filter(f => f.isCore);
    const existingFeatures = enhancedFeatures.filter(f => f.category === 'existing' && !f.isCore);
    const newFeatures = enhancedFeatures.filter(f => f.category === 'new');
    
    return (
      <Animated.View 
        style={{
          opacity: cardsAnimation,
          transform: [{
            translateY: cardsAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [30, 0],
            })
          }]
        }}
      >
        {/* Core Feature - Święta Świeca (highlighted) */}
        <View style={[styles.section, { marginBottom: layout.utils.spacing(24) }]}>
          <Text style={[styles.sectionTitle, { fontSize: layout.utils.fontSize(18) }]}>
            🕯️ Główna Funkcja
          </Text>
          
          {coreFeatures.map((feature, index) => (
            <TouchableOpacity 
              key={feature.id}
              onPress={() => handleFeaturePress(feature)}
              activeOpacity={0.8}
              style={styles.coreFeatureContainer}
            >
              <GlassCard style={[styles.coreFeatureCard, { borderColor: feature.color }]} gradient>
                <View style={styles.coreFeatureContent}>
                  <View style={styles.coreFeatureLeft}>
                    <View style={[styles.coreFeatureIcon, { backgroundColor: `${feature.color}20` }]}>
                      <Text style={styles.coreFeatureEmoji}>{feature.emoji}</Text>
                    </View>
                    <View style={styles.coreFeatureText}>
                      <Text style={[styles.coreFeatureTitle, { color: feature.color }]}>
                        {feature.title}
                      </Text>
                      <Text style={styles.coreFeatureSubtitle}>
                        {feature.subtitle}
                      </Text>
                      <View style={styles.nfcBadge}>
                        <Ionicons name="wifi" size={12} color={feature.color} />
                        <Text style={[styles.nfcText, { color: feature.color }]}>NFC READY</Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.coreFeatureRight}>
                    <FlameAnimation size={32} color={feature.color} />
                    <Ionicons name="arrow-forward" size={20} color={feature.color} />
                  </View>
                </View>
              </GlassCard>
            </TouchableOpacity>
          ))}
        </View>

        {/* New Features Section */}
        {showNewFeatures && newFeatures.length > 0 && (
          <View style={[styles.section, { marginBottom: layout.utils.spacing(24) }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { fontSize: layout.utils.fontSize(18) }]}>
                ✨ Nowe Funkcje 2025
              </Text>
              <TouchableOpacity 
                onPress={() => setShowNewFeatures(!showNewFeatures)}
                style={styles.toggleButton}
              >
                <Text style={styles.toggleButtonText}>Zwiń</Text>
              </TouchableOpacity>
            </View>
            
            <ResponsiveGrid
              mobileColumns={2}
              tabletColumns={3}
              desktopColumns={4}
              spacing={layout.utils.spacing(12)}
            >
              {newFeatures.map((feature, index) => (
                <FeatureCard
                  key={feature.id}
                  emoji={feature.emoji}
                  title={feature.title}
                  subtitle={feature.subtitle}
                  onPress={() => handleFeaturePress(feature)}
                  isNew={feature.isNew}
                  style={[
                    styles.featureCard,
                    { 
                      borderColor: feature.color,
                      backgroundColor: `${feature.color}10`,
                    }
                  ]}
                />
              ))}
            </ResponsiveGrid>
          </View>
        )}

        {/* Existing Features Section */}
        <View style={[styles.section, { marginBottom: layout.utils.spacing(24) }]}>
          <Text style={[styles.sectionTitle, { fontSize: layout.utils.fontSize(18) }]}>
            🙏 Duchowe Narzędzia
          </Text>
          
          <ResponsiveGrid
            mobileColumns={2}
            tabletColumns={3}
            desktopColumns={4}
            spacing={layout.utils.spacing(12)}
          >
            {existingFeatures.map((feature, index) => (
              <FeatureCard
                key={feature.id}
                emoji={feature.emoji}
                title={feature.title}
                subtitle={feature.subtitle}
                onPress={() => handleFeaturePress(feature)}
                style={[
                  styles.featureCard,
                  { borderColor: `${feature.color}50` }
                ]}
              />
            ))}
          </ResponsiveGrid>
        </View>
      </Animated.View>
    );
  };

  const renderQuickActions = () => (
    <View style={[styles.section, { marginBottom: layout.utils.spacing(24) }]}>
      <Text style={[styles.sectionTitle, { fontSize: layout.utils.fontSize(16) }]}>
        ⚡ Szybkie Akcje
      </Text>
      
      <View style={styles.quickActionsRow}>
        <TouchableOpacity 
          style={styles.quickAction}
          onPress={() => handleFeaturePress({ id: 'prayers-map' })}
        >
          <GlassCard style={styles.quickActionCard}>
            <Ionicons name="map" size={20} color={DesignTokens.colors.secondary} />
            <Text style={styles.quickActionText}>Mapa świec</Text>
          </GlassCard>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.quickAction}
          onPress={() => handleFeaturePress({ id: 'global-prayer' })}
        >
          <GlassCard style={styles.quickActionCard}>
            <Ionicons name="globe" size={20} color={DesignTokens.colors.secondary} />
            <Text style={styles.quickActionText}>Globalna modlitwa</Text>
          </GlassCard>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.quickAction}
          onPress={() => Alert.alert('Powiadomienia', 'Funkcja będzie dostępna wkrótce')}
        >
          <GlassCard style={styles.quickActionCard}>
            <Ionicons name="notifications" size={20} color={DesignTokens.colors.secondary} />
            <Text style={styles.quickActionText}>Przypomnienia</Text>
          </GlassCard>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStats = () => {
    const stats = [
      {
        icon: 'people',
        value: prayerCount,
        label: 'Modlących się',
        color: DesignTokens.colors.prayer,
      },
      {
        icon: 'flame',
        value: '12.5K',
        label: 'Zapalone świece',
        color: DesignTokens.colors.warning,
      },
      {
        icon: 'heart',
        value: '8.2K',
        label: 'Intencji',
        color: DesignTokens.colors.error,
      },
      {
        icon: 'globe',
        value: '156',
        label: 'Kościołów',
        color: DesignTokens.colors.info,
      },
    ];

    return (
      <View style={[styles.section, { marginBottom: layout.utils.spacing(24) }]}>
        <Text style={[styles.sectionTitle, { fontSize: layout.utils.fontSize(16) }]}>
          📊 Statystyki Wspólnoty
        </Text>
        
        <ResponsiveGrid
          mobileColumns={2}
          tabletColumns={4}
          desktopColumns={4}
          spacing={layout.utils.spacing(12)}
        >
          {stats.map((stat, index) => (
            <StatCard
              key={index}
              icon={stat.icon}
              value={stat.value}
              label={stat.label}
              color={stat.color}
              style={styles.statCard}
            />
          ))}
        </ResponsiveGrid>
      </View>
    );
  };

  // =====================================================
  // 🎨 MAIN RENDER
  // =====================================================

  return (
    <SafeAreaView style={styles.container}>
      <AdaptiveContainer style={styles.contentContainer}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={DesignTokens.colors.secondary}
              colors={[DesignTokens.colors.secondary]}
            />
          }
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: layout.utils.spacing(40) }
          ]}
        >
          {renderHeader()}
          {renderQuoteCard()}
          {renderPrayerCounter()}
          {renderFeaturesGrid()}
          {renderQuickActions()}
          {renderStats()}
          
          {/* Footer with version info */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              OREMUS 2025 • Spo³ecznoœæ Odbudowani
            </Text>
            <Text style={styles.versionText}>
              Wersja 2.0.0 • Glassmorphism Design
            </Text>
          </View>
        </ScrollView>
      </AdaptiveContainer>
    </SafeAreaView>
  );
}

// =====================================================
// 🎨 STYLES
// =====================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignTokens.colors.background,
  },
  
  contentContainer: {
    flex: 1,
  },
  
  scrollContent: {
    paddingTop: DesignTokens.spacing.md,
  },
  
  // Header styles
  header: {
    alignItems: 'center',
    marginBottom: DesignTokens.spacing.xl,
    paddingHorizontal: DesignTokens.spacing.md,
  },
  
  logoContainer: {
    alignItems: 'center',
  },
  
  logoText: {
    fontFamily: DesignTokens.typography.fontFamily,
    fontWeight: DesignTokens.typography.weights.bold,
    color: DesignTokens.colors.secondary,
    letterSpacing: 3,
    textShadow: `0px 0px 20px ${DesignTokens.colors.secondary}50`,
  },
  
  subtitle: {
    color: DesignTokens.colors.text,
    opacity: 0.8,
    marginTop: DesignTokens.spacing.xs,
    fontWeight: DesignTokens.typography.weights.medium,
  },
  
  // Quote card
  quoteCard: {
    marginHorizontal: DesignTokens.spacing.md,
  },
  
  // Prayer counter
  prayerCounter: {
    marginHorizontal: DesignTokens.spacing.md,
  },
  
  counterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  counterInfo: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: DesignTokens.spacing.md,
  },
  
  counterNumber: {
    fontWeight: DesignTokens.typography.weights.bold,
    color: DesignTokens.colors.secondary,
    textShadow: `0px 0px 15px ${DesignTokens.colors.secondary}30`,
  },
  
  counterText: {
    color: DesignTokens.colors.text,
    opacity: 0.9,
    marginTop: DesignTokens.spacing.xs,
    textAlign: 'center',
  },
  
  joinButton: {
    minWidth: 80,
  },
  
  joinButtonText: {
    color: DesignTokens.colors.primary,
    fontWeight: DesignTokens.typography.weights.semibold,
    fontSize: DesignTokens.typography.sizes.md,
  },
  
  // Sections
  section: {
    paddingHorizontal: DesignTokens.spacing.md,
  },
  
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DesignTokens.spacing.md,
  },
  
  sectionTitle: {
    fontWeight: DesignTokens.typography.weights.semibold,
    color: DesignTokens.colors.secondary,
    marginBottom: DesignTokens.spacing.md,
  },
  
  toggleButton: {
    paddingHorizontal: DesignTokens.spacing.sm,
    paddingVertical: DesignTokens.spacing.xs,
    backgroundColor: DesignTokens.colors.glassWhite,
    borderRadius: DesignTokens.radius.sm,
  },
  
  toggleButtonText: {
    color: DesignTokens.colors.secondary,
    fontSize: DesignTokens.typography.sizes.sm,
    fontWeight: DesignTokens.typography.weights.medium,
  },
  
  // Core feature card
  coreFeatureContainer: {
    marginBottom: DesignTokens.spacing.md,
  },
  
  coreFeatureCard: {
    borderWidth: 2,
    ...DesignTokens.shadows.glow,
  },
  
  coreFeatureContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  coreFeatureLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  coreFeatureIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: DesignTokens.spacing.md,
  },
  
  coreFeatureEmoji: {
    fontSize: 28,
  },
  
  coreFeatureText: {
    flex: 1,
  },
  
  coreFeatureTitle: {
    fontSize: DesignTokens.typography.sizes.lg,
    fontWeight: DesignTokens.typography.weights.bold,
    marginBottom: DesignTokens.spacing.xs,
  },
  
  coreFeatureSubtitle: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.text,
    opacity: 0.8,
    marginBottom: DesignTokens.spacing.xs,
  },
  
  nfcBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DesignTokens.spacing.sm,
    paddingVertical: DesignTokens.spacing.xs,
    backgroundColor: DesignTokens.colors.glassWhite,
    borderRadius: DesignTokens.radius.sm,
    alignSelf: 'flex-start',
  },
  
  nfcText: {
    fontSize: 10,
    fontWeight: DesignTokens.typography.weights.bold,
    marginLeft: DesignTokens.spacing.xs,
  },
  
  coreFeatureRight: {
    alignItems: 'center',
    gap: DesignTokens.spacing.sm,
  },
  
  // Feature cards
  featureCard: {
    borderWidth: 1,
    marginBottom: DesignTokens.spacing.sm,
  },
  
  // Quick actions
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: DesignTokens.spacing.sm,
  },
  
  quickAction: {
    flex: 1,
  },
  
  quickActionCard: {
    alignItems: 'center',
    paddingVertical: DesignTokens.spacing.md,
    paddingHorizontal: DesignTokens.spacing.sm,
  },
  
  quickActionText: {
    fontSize: DesignTokens.typography.sizes.xs,
    color: DesignTokens.colors.secondary,
    marginTop: DesignTokens.spacing.sm,
    textAlign: 'center',
    fontWeight: DesignTokens.typography.weights.medium,
  },
  
  // Stats
  statCard: {
    marginBottom: DesignTokens.spacing.sm,
  },
  
  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: DesignTokens.spacing.xl,
    marginTop: DesignTokens.spacing.xl,
  },
  
  footerText: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.text,
    opacity: 0.6,
    textAlign: 'center',
    marginBottom: DesignTokens.spacing.xs,
  },
  
  versionText: {
    fontSize: DesignTokens.typography.sizes.xs,
    color: DesignTokens.colors.secondary,
    opacity: 0.8,
    textAlign: 'center',
  },
});