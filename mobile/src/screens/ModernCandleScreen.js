// mobile/src/screens/ModernCandleScreen.js
// OREMUS 2025 - Modernized CandleScreen with glassmorphism + ALL existing NFC functions

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Import existing services (ZACHOWANE)
import { supabase } from '../services/supabase';

// Import new design system
import {
  DesignTokens,
  GlassCard,
  GlassButton,
  AnimatedCard,
  FlameAnimation,
  PulseAnimation,
  NeumorphicButton,
} from '../components/modern/DesignSystem';

// Import responsive hooks
import { useOremusLayout } from '../hooks/useResponsiveLayout';

const { width, height } = Dimensions.get('window');

// =====================================================
// 🔥 MODERN CANDLE SCREEN COMPONENT
// =====================================================

export default function ModernCandleScreen({ navigation }) {
  // ===== EXISTING STATE (zachowane z obecnego CandleScreen) =====
  const [isScanning, setIsScanning] = useState(false);
  const [scanAnimation] = useState(new Animated.Value(0));
  const [pulseAnimation] = useState(new Animated.Value(1));
  
  // ===== NEW ENHANCED STATE =====
  const [scanProgress, setScanProgress] = useState(0);
  const [nfcStatus, setNfcStatus] = useState('ready'); // ready, scanning, found, error
  const [detectedCandle, setDetectedCandle] = useState(null);
  const [scanCount, setScanCount] = useState(0);
  
  // Layout and animations
  const layout = useOremusLayout();
  const glowAnimation = useRef(new Animated.Value(0)).current;
  const backgroundAnimation = useRef(new Animated.Value(0)).current;
  const scanRingAnimation = useRef(new Animated.Value(0)).current;

  // =====================================================
  // 🔄 EXISTING FUNCTIONS (zachowane bez zmian)
  // =====================================================

  useEffect(() => {
    startPulseAnimation();
    startBackgroundAnimation();
  }, []);

  // ZACHOWANA funkcja z obecnego CandleScreen
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

  // Nowe animacje background
  const startBackgroundAnimation = () => {
    Animated.loop(
      Animated.timing(backgroundAnimation, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: true,
      })
    ).start();
  };

  const startScanAnimation = () => {
    // Reset animations
    scanRingAnimation.setValue(0);
    glowAnimation.setValue(0);
    
    // Scan ring animation
    Animated.loop(
      Animated.timing(scanRingAnimation, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();
    
    // Glow effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnimation, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopScanAnimation = () => {
    scanRingAnimation.setValue(0);
    glowAnimation.setValue(0);
    scanRingAnimation.stopAnimation();
    glowAnimation.stopAnimation();
  };

  // =====================================================
  // 🔍 ENHANCED NFC SIMULATION (rozszerzona logika)
  // =====================================================

  // ZACHOWANA i rozszerzona funkcja z obecnego CandleScreen
  const simulateNFCScan = async () => {
    if (isScanning) return;
    
    setIsScanning(true);
    setNfcStatus('scanning');
    setScanProgress(0);
    setScanCount(prev => prev + 1);
    
    startScanAnimation();
    
    // Haptic feedback
    if (layout.platform === 'ios') {
      Vibration.vibrate([100]);
    }

    // Enhanced scenarios with more variety
    const scenarios = [
      { 
        success: true, 
        candleId: 'CANDLE_001', 
        location: 'Kościół św. Jana, Warszawa',
        nfcId: 'NFC_HOLY_001',
        batteryLevel: 85,
        lastUsed: '2 godziny temu',
        totalUses: 156
      },
      { 
        success: true, 
        candleId: 'CANDLE_002', 
        location: 'Bazylika Mariacka, Kraków',
        nfcId: 'NFC_HOLY_002', 
        batteryLevel: 92,
        lastUsed: '5 minut temu',
        totalUses: 234
      },
      { 
        success: true, 
        candleId: 'CANDLE_003', 
        location: 'Katedra, Gdańsk',
        nfcId: 'NFC_HOLY_003',
        batteryLevel: 67,
        lastUsed: '1 dzień temu',
        totalUses: 89
      },
      { 
        success: false, 
        error: 'NFC_NOT_DETECTED',
        message: 'Nie wykryto świecy OREMUS' 
      },
      { 
        success: false, 
        error: 'NFC_READ_ERROR',
        message: 'Błąd odczytu chip\'u NFC' 
      },
      { 
        success: false, 
        error: 'CANDLE_INACTIVE',
        message: 'Świeca nie jest aktywna' 
      }
    ];

    const randomScenario = scenarios[Math.floor(Math.random() * scenarios.length)];

    // Simulate scanning progress
    const progressInterval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + Math.random() * 15 + 5;
      });
    }, 200);

    // Wait for scan completion
    setTimeout(async () => {
      clearInterval(progressInterval);
      setScanProgress(100);
      setIsScanning(false);
      stopScanAnimation();

      if (randomScenario.success) {
        setNfcStatus('found');
        setDetectedCandle(randomScenario);
        
        // Haptic success feedback
        if (layout.platform === 'ios') {
          Vibration.vibrate([50, 100, 50]);
        }
        
        // Save candle session (ZACHOWANA logika)
        await saveCandleSession(randomScenario);
        
        // Navigate to CandlePortal after brief delay
        setTimeout(() => {
          navigation.navigate('CandlePortal', {
            candleId: randomScenario.candleId,
            location: randomScenario.location,
            nfcData: randomScenario
          });
        }, 2000);
        
      } else {
        setNfcStatus('error');
        
        // Haptic error feedback
        if (layout.platform === 'ios') {
          Vibration.vibrate([200]);
        }
        
        Alert.alert(
          'Wykrywanie nieudane',
          randomScenario.message,
          [
            { text: 'Anuluj', style: 'cancel' },
            { text: 'Spróbuj ponownie', onPress: () => setNfcStatus('ready') }
          ]
        );
      }
    }, 3000);
  };

  // ZACHOWANA funkcja z obecnego CandleScreen
  const saveCandleSession = async (candleData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        await supabase
          .from('candle_sessions')
          .insert({
            user_id: user.id,
            candle_id: candleData.candleId,
            location: candleData.location,
            nfc_id: candleData.nfcId,
            started_at: new Date().toISOString(),
            is_active: true,
            scan_count: scanCount
          });
      }
    } catch (error) {
      console.error('Error saving candle session:', error);
    }
  };

  // =====================================================
  // 🎨 RENDER FUNCTIONS
  // =====================================================

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <GlassCard style={styles.backButtonCard}>
          <Ionicons name="arrow-back" size={24} color={DesignTokens.colors.secondary} />
        </GlassCard>
      </TouchableOpacity>
      
      <View style={styles.headerInfo}>
        <Text style={[styles.headerTitle, { fontSize: layout.utils.fontSize(20) }]}>
          Święta Świeca OREMUS
        </Text>
        <Text style={[styles.headerSubtitle, { fontSize: layout.utils.fontSize(14) }]}>
          System NFC • Wersja 2025
        </Text>
      </View>
      
      <View style={styles.statusIndicator}>
        <View style={[
          styles.statusDot, 
          { backgroundColor: nfcStatus === 'ready' ? DesignTokens.colors.success : DesignTokens.colors.warning }
        ]} />
        <Text style={styles.statusText}>
          {nfcStatus === 'ready' ? 'Gotowy' : 'Skanowanie'}
        </Text>
      </View>
    </View>
  );

  const renderCandleAnimation = () => {
    const rotateValue = scanRingAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    const glowOpacity = glowAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 0.8],
    });

    const backgroundRotate = backgroundAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    return (
      <View style={styles.candleContainer}>
        {/* Background particles */}
        <Animated.View 
          style={[
            styles.backgroundParticles,
            { transform: [{ rotate: backgroundRotate }] }
          ]}
        >
          <View style={[styles.particle, { top: '20%', left: '10%' }]} />
          <View style={[styles.particle, { top: '60%', right: '15%' }]} />
          <View style={[styles.particle, { bottom: '30%', left: '20%' }]} />
          <View style={[styles.particle, { top: '40%', right: '25%' }]} />
        </Animated.View>
        
        {/* Main candle with glow */}
        <Animated.View 
          style={[
            styles.candleIconContainer,
            { transform: [{ scale: pulseAnimation }] }
          ]}
        >
          {/* Glow effect */}
          <Animated.View 
            style={[
              styles.candleGlow,
              { 
                opacity: glowOpacity,
                transform: [{ scale: pulseAnimation }]
              }
            ]}
          />
          
          {/* Main candle */}
          <GlassCard style={styles.candleCard} gradient>
            <FlameAnimation 
              size={layout.responsive(80, 100, 120)} 
              color={DesignTokens.colors.secondary}
            />
          </GlassCard>
        </Animated.View>
        
        {/* Scanning rings */}
        {isScanning && (
          <>
            <Animated.View 
              style={[
                styles.scanRing,
                styles.scanRingOuter,
                { transform: [{ rotate: rotateValue }, { scale: scanRingAnimation }] }
              ]}
            />
            <Animated.View 
              style={[
                styles.scanRing,
                styles.scanRingInner,
                { transform: [{ rotate: rotateValue }, { scale: scanRingAnimation }] }
              ]}
            />
          </>
        )}
        
        {/* NFC indicator */}
        <View style={styles.nfcIndicator}>
          <Ionicons 
            name="wifi" 
            size={layout.responsive(20, 24, 28)} 
            color={DesignTokens.colors.secondary} 
          />
          <Text style={[styles.nfcText, { fontSize: layout.utils.fontSize(12) }]}>
            NFC READY
          </Text>
        </View>
      </View>
    );
  };

  const renderInstructions = () => (
    <AnimatedCard style={styles.instructionsCard}>
      <View style={styles.instructionsHeader}>
        <Ionicons name="information-circle" size={24} color={DesignTokens.colors.secondary} />
        <Text style={[styles.instructionsTitle, { fontSize: layout.utils.fontSize(18) }]}>
          Jak skanować świecę
        </Text>
      </View>
      
      <View style={styles.instructionsList}>
        <View style={styles.instructionItem}>
          <View style={styles.instructionNumber}>
            <Text style={styles.instructionNumberText}>1</Text>
          </View>
          <Text style={styles.instructionText}>
            Zbliż telefon do górnej części świecy OREMUS
          </Text>
        </View>
        
        <View style={styles.instructionItem}>
          <View style={styles.instructionNumber}>
            <Text style={styles.instructionNumberText}>2</Text>
          </View>
          <Text style={styles.instructionText}>
            Naciśnij przycisk "Rozpocznij wykrywanie"
          </Text>
        </View>
        
        <View style={styles.instructionItem}>
          <View style={styles.instructionNumber}>
            <Text style={styles.instructionNumberText}>3</Text>
          </View>
          <Text style={styles.instructionText}>
            Poczekaj na wykrycie chip'u NFC w świecy
          </Text>
        </View>
      </View>
    </AnimatedCard>
  );

  const renderScanButton = () => (
    <View style={styles.scanButtonContainer}>
      {isScanning ? (
        <GlassCard style={styles.scanningCard} gradient>
          <ActivityIndicator size="large" color={DesignTokens.colors.secondary} />
          <Text style={[styles.scanningText, { fontSize: layout.utils.fontSize(18) }]}>
            Wykrywanie świecy...
          </Text>
          <Text style={[styles.scanningSubtext, { fontSize: layout.utils.fontSize(14) }]}>
            Trzymaj telefon blisko świecy
          </Text>
          
          {/* Progress bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { width: `${scanProgress}%` }
                ]}
              />
            </View>
            <Text style={styles.progressText}>{Math.round(scanProgress)}%</Text>
          </View>
        </GlassCard>
      ) : (
        <GlassButton
          size="lg"
          variant="primary"
          onPress={simulateNFCScan}
          style={styles.scanButton}
        >
          <Ionicons name="scan" size={32} color={DesignTokens.colors.primary} />
          <Text style={[styles.scanButtonText, { fontSize: layout.utils.fontSize(18) }]}>
            Rozpocznij wykrywanie
          </Text>
        </GlassButton>
      )}
    </View>
  );

  const renderDetectedCandle = () => {
    if (!detectedCandle || nfcStatus !== 'found') return null;

    return (
      <AnimatedCard style={styles.detectedCard} animation="glow">
        <View style={styles.detectedHeader}>
          <FlameAnimation size={32} color={DesignTokens.colors.success} />
          <Text style={styles.detectedTitle}>Świeca wykryta!</Text>
        </View>
        
        <View style={styles.detectedInfo}>
          <View style={styles.detectedRow}>
            <Text style={styles.detectedLabel}>Lokalizacja:</Text>
            <Text style={styles.detectedValue}>{detectedCandle.location}</Text>
          </View>
          <View style={styles.detectedRow}>
            <Text style={styles.detectedLabel}>ID Świecy:</Text>
            <Text style={styles.detectedValue}>{detectedCandle.candleId}</Text>
          </View>
          <View style={styles.detectedRow}>
            <Text style={styles.detectedLabel}>Chip NFC:</Text>
            <Text style={styles.detectedValue}>{detectedCandle.nfcId}</Text>
          </View>
          <View style={styles.detectedRow}>
            <Text style={styles.detectedLabel}>Ostatnie użycie:</Text>
            <Text style={styles.detectedValue}>{detectedCandle.lastUsed}</Text>
          </View>
        </View>
        
        <Text style={styles.redirectText}>
          Przekierowanie do portalu świecy...
        </Text>
      </AnimatedCard>
    );
  };

  const renderInfoSection = () => (
    <View style={styles.infoSection}>
      <Text style={[styles.sectionTitle, { fontSize: layout.utils.fontSize(16) }]}>
        💡 Informacje o technologii NFC
      </Text>
      
      <View style={styles.infoGrid}>
        <GlassCard style={styles.infoCard}>
          <Ionicons name="hardware-chip" size={24} color={DesignTokens.colors.secondary} />
          <Text style={styles.infoCardTitle}>Chip NFC</Text>
          <Text style={styles.infoCardText}>
            Każda świeca ma wbudowany chip komunikacji bezprzewodowej
          </Text>
        </GlassCard>
        
        <GlassCard style={styles.infoCard}>
          <Ionicons name="shield-checkmark" size={24} color={DesignTokens.colors.success} />
          <Text style={styles.infoCardTitle}>Bezpieczeństwo</Text>
          <Text style={styles.infoCardText}>
            Połączenie zabezpieczone kryptografią end-to-end
          </Text>
        </GlassCard>
        
        <GlassCard style={styles.infoCard}>
          <Ionicons name="location" size={24} color={DesignTokens.colors.info} />
          <Text style={styles.infoCardTitle}>Lokalizacja</Text>
          <Text style={styles.infoCardText}>
            Automatyczne określenie lokalizacji kościoła
          </Text>
        </GlassCard>
        
        <GlassCard style={styles.infoCard}>
          <Ionicons name="people" size={24} color={DesignTokens.colors.prayer} />
          <Text style={styles.infoCardTitle}>Wspólnota</Text>
          <Text style={styles.infoCardText}>
            Połączenie z globalną wspólnotą modlitwy
          </Text>
        </GlassCard>
      </View>
    </View>
  );

  // =====================================================
  // 🎨 MAIN RENDER
  // =====================================================

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={DesignTokens.colors.gradientBlue}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {renderHeader()}
        
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {renderCandleAnimation()}
          {renderInstructions()}
          {renderScanButton()}
          {renderDetectedCandle()}
          {renderInfoSection()}
          
          {/* Debug info in development */}
          {__DEV__ && (
            <GlassCard style={styles.debugCard}>
              <Text style={styles.debugTitle}>🔧 Debug Info</Text>
              <Text style={styles.debugText}>Status: {nfcStatus}</Text>
              <Text style={styles.debugText}>Scans: {scanCount}</Text>
              <Text style={styles.debugText}>Device: {layout.deviceType}</Text>
              <Text style={styles.debugText}>Platform: {layout.platform}</Text>
            </GlassCard>
          )}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

// =====================================================
// 🎨 STYLES
// =====================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  background: {
    flex: 1,
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DesignTokens.spacing.md,
    paddingTop: DesignTokens.spacing.sm,
    paddingBottom: DesignTokens.spacing.md,
  },
  
  backButton: {
    marginRight: DesignTokens.spacing.md,
  },
  
  backButtonCard: {
    padding: DesignTokens.spacing.sm,
    borderRadius: DesignTokens.radius.round,
  },
  
  headerInfo: {
    flex: 1,
  },
  
  headerTitle: {
    fontWeight: DesignTokens.typography.weights.bold,
    color: DesignTokens.colors.secondary,
  },
  
  headerSubtitle: {
    color: DesignTokens.colors.text,
    opacity: 0.8,
    marginTop: 2,
  },
  
  statusIndicator: {
    alignItems: 'center',
  },
  
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  
  statusText: {
    fontSize: 10,
    color: DesignTokens.colors.text,
    opacity: 0.8,
  },
  
  content: {
    flex: 1,
  },
  
  scrollContent: {
    paddingHorizontal: DesignTokens.spacing.md,
    paddingBottom: DesignTokens.spacing.xl,
  },
  
  // Candle animation
  candleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: height * 0.35,
    marginBottom: DesignTokens.spacing.xl,
    position: 'relative',
  },
  
  backgroundParticles: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    backgroundColor: DesignTokens.colors.secondary,
    borderRadius: 2,
    opacity: 0.3,
  },
  
  candleIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  
  candleGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    backgroundColor: DesignTokens.colors.secondary,
    borderRadius: 100,
    opacity: 0.2,
  },
  
  candleCard: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: DesignTokens.colors.secondary,
  },
  
  scanRing: {
    position: 'absolute',
    borderWidth: 3,
    borderStyle: 'dashed',
    borderColor: DesignTokens.colors.secondary,
    borderRadius: 1000,
  },
  
  scanRingOuter: {
    width: 250,
    height: 250,
    opacity: 0.6,
  },
  
  scanRingInner: {
    width: 180,
    height: 180,
    opacity: 0.8,
  },
  
  nfcIndicator: {
    position: 'absolute',
    bottom: -40,
    alignItems: 'center',
    backgroundColor: DesignTokens.colors.glassWhite,
    paddingHorizontal: DesignTokens.spacing.md,
    paddingVertical: DesignTokens.spacing.sm,
    borderRadius: DesignTokens.radius.md,
    borderWidth: 1,
    borderColor: DesignTokens.colors.glassSecondary,
  },
  
  nfcText: {
    color: DesignTokens.colors.secondary,
    fontWeight: DesignTokens.typography.weights.bold,
    marginTop: 4,
  },
  
  // Instructions
  instructionsCard: {
    marginBottom: DesignTokens.spacing.lg,
  },
  
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DesignTokens.spacing.md,
  },
  
  instructionsTitle: {
    fontWeight: DesignTokens.typography.weights.semibold,
    color: DesignTokens.colors.secondary,
    marginLeft: DesignTokens.spacing.sm,
  },
  
  instructionsList: {
    gap: DesignTokens.spacing.md,
  },
  
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: DesignTokens.colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: DesignTokens.spacing.md,
    marginTop: 2,
  },
  
  instructionNumberText: {
    color: DesignTokens.colors.primary,
    fontSize: 12,
    fontWeight: DesignTokens.typography.weights.bold,
  },
  
  instructionText: {
    flex: 1,
    color: DesignTokens.colors.text,
    fontSize: DesignTokens.typography.sizes.sm,
    lineHeight: 20,
  },
  
  // Scan button
  scanButtonContainer: {
    marginBottom: DesignTokens.spacing.lg,
  },
  
  scanButton: {
    paddingVertical: DesignTokens.spacing.lg,
    gap: DesignTokens.spacing.sm,
  },
  
  scanButtonText: {
    color: DesignTokens.colors.primary,
    fontWeight: DesignTokens.typography.weights.semibold,
  },
  
  // Scanning state
  scanningCard: {
    alignItems: 'center',
    paddingVertical: DesignTokens.spacing.xl,
  },
  
  scanningText: {
    color: DesignTokens.colors.secondary,
    fontWeight: DesignTokens.typography.weights.semibold,
    marginTop: DesignTokens.spacing.md,
    marginBottom: DesignTokens.spacing.sm,
  },
  
  scanningSubtext: {
    color: DesignTokens.colors.text,
    opacity: 0.8,
    textAlign: 'center',
    marginBottom: DesignTokens.spacing.lg,
  },
  
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: DesignTokens.spacing.md,
  },
  
  progressBar: {
    width: '80%',
    height: 4,
    backgroundColor: DesignTokens.colors.glassWhite,
    borderRadius: 2,
    overflow: 'hidden',
  },
  
  progressFill: {
    height: '100%',
    backgroundColor: DesignTokens.colors.secondary,
  },
  
  progressText: {
    color: DesignTokens.colors.secondary,
    fontSize: 12,
    marginTop: DesignTokens.spacing.sm,
    fontWeight: DesignTokens.typography.weights.medium,
  },
  
  // Detected candle
  detectedCard: {
    marginBottom: DesignTokens.spacing.lg,
    borderWidth: 2,
    borderColor: DesignTokens.colors.success,
  },
  
  detectedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DesignTokens.spacing.md,
  },
  
  detectedTitle: {
    fontSize: DesignTokens.typography.sizes.lg,
    fontWeight: DesignTokens.typography.weights.bold,
    color: DesignTokens.colors.success,
    marginLeft: DesignTokens.spacing.sm,
  },
  
  detectedInfo: {
    marginBottom: DesignTokens.spacing.md,
  },
  
  detectedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: DesignTokens.spacing.sm,
  },
  
  detectedLabel: {
    color: DesignTokens.colors.text,
    fontSize: DesignTokens.typography.sizes.sm,
    opacity: 0.8,
  },
  
  detectedValue: {
    color: DesignTokens.colors.secondary,
    fontSize: DesignTokens.typography.sizes.sm,
    fontWeight: DesignTokens.typography.weights.medium,
  },
  
  redirectText: {
    color: DesignTokens.colors.success,
    fontSize: DesignTokens.typography.sizes.sm,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  
  // Info section
  infoSection: {
    marginBottom: DesignTokens.spacing.lg,
  },
  
  sectionTitle: {
    fontWeight: DesignTokens.typography.weights.semibold,
    color: DesignTokens.colors.secondary,
    marginBottom: DesignTokens.spacing.md,
  },
  
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: DesignTokens.spacing.sm,
  },
  
  infoCard: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: DesignTokens.spacing.lg,
    marginBottom: DesignTokens.spacing.sm,
  },
  
  infoCardTitle: {
    fontSize: DesignTokens.typography.sizes.sm,
    fontWeight: DesignTokens.typography.weights.semibold,
    color: DesignTokens.colors.text,
    marginTop: DesignTokens.spacing.sm,
    marginBottom: DesignTokens.spacing.xs,
  },
  
  infoCardText: {
    fontSize: DesignTokens.typography.sizes.xs,
    color: DesignTokens.colors.text,
    opacity: 0.8,
    textAlign: 'center',
    lineHeight: 16,
  },
  
  // Debug card (development only)
  debugCard: {
    marginTop: DesignTokens.spacing.lg,
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderColor: 'rgba(255, 0, 0, 0.3)',
  },
  
  debugTitle: {
    color: '#ff4444',
    fontSize: DesignTokens.typography.sizes.sm,
    fontWeight: DesignTokens.typography.weights.bold,
    marginBottom: DesignTokens.spacing.sm,
  },
  
  debugText: {
    color: '#ff4444',
    fontSize: DesignTokens.typography.sizes.xs,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
});