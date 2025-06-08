// mobile/src/components/modern/DesignSystem.js
// OREMUS 2025 - Complete Design System Foundation

import React, { useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Animated, 
  Dimensions, 
  StyleSheet,
  Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

// =====================================================
// 🎨 DESIGN TOKENS 2025
// =====================================================
export const DesignTokens = {
  // Colors - zachowane + rozszerzone
  colors: {
    // Główne kolory (istnieje w obecnej aplikacji)
    primary: '#1a237e',
    secondary: '#FFD700',
    background: '#000000',
    text: '#FFFFFF',
    
    // Glassmorphism (nowe)
    glassPrimary: 'rgba(26, 35, 126, 0.15)',
    glassSecondary: 'rgba(255, 215, 0, 0.25)',
    glassWhite: 'rgba(255, 255, 255, 0.1)',
    glassBlack: 'rgba(0, 0, 0, 0.3)',
    
    // Neumorphism (nowe)
    neuLight: 'rgba(255, 255, 255, 0.1)',
    neuShadow: 'rgba(0, 0, 0, 0.2)',
    neuRaised: '#1e2749',
    neuPressed: '#161d3a',
    
    // Gradients (nowe)
    gradientGold: ['#FFD700', '#F4E4BC', '#A78B52'],
    gradientBlue: ['#1a237e', '#303f9f', '#1a237e'],
    gradientDark: ['#000000', '#1a1a1a', '#000000'],
    
    // Status colors
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    info: '#2196F3',
    
    // Semantic colors for new features
    prayer: '#FFD700',
    mass: '#9C27B0',
    academy: '#4CAF50',
    library: '#FF5722',
    player: '#3F51B5',
  },
  
  // Spacing system
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  // Border radius
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    round: 25,
    pill: 50,
  },
  
  // Typography
  typography: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    sizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 24,
      xxl: 32,
      hero: 48,
    },
    weights: {
      light: '300',
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
  
  // Shadows
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
    glow: {
      shadowColor: '#FFD700',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 10,
    },
  },
  
  // Animation durations
  animations: {
    fast: 150,
    normal: 300,
    slow: 500,
    verySlow: 1000,
  },
};

// =====================================================
// 🪟 GLASSMORPHISM COMPONENTS
// =====================================================

// Podstawowy GlassCard - zastąpi zwykłe karty
export const GlassCard = ({ 
  children, 
  style, 
  blur = 15, 
  opacity = 0.15, 
  borderColor = DesignTokens.colors.glassSecondary,
  gradient = false,
  ...props 
}) => {
  return (
    <View 
      style={[
        styles.glassCard,
        {
          backgroundColor: gradient 
            ? DesignTokens.colors.glassSecondary 
            : DesignTokens.colors.glassWhite,
          borderColor: borderColor,
        },
        style
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

// GlassButton - nowoczesne przyciski
export const GlassButton = ({ 
  children, 
  onPress, 
  variant = 'primary', 
  size = 'md',
  style,
  disabled = false,
  ...props 
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  const handlePressIn = () => {
    if (!disabled) {
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
      }).start();
    }
  };
  
  const handlePressOut = () => {
    if (!disabled) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    }
  };
  
  const buttonStyles = [
    styles.glassButton,
    styles[`glassButton${size.charAt(0).toUpperCase() + size.slice(1)}`],
    styles[`glassButton${variant.charAt(0).toUpperCase() + variant.slice(1)}`],
    disabled && styles.glassButtonDisabled,
    style
  ];
  
  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={buttonStyles}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={0.8}
        {...props}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};

// =====================================================
// 🔄 NEUMORPHIC COMPONENTS  
// =====================================================

// NeumorphicCard - alternatywa dla glassmorphism
export const NeumorphicCard = ({ children, style, pressed = false, ...props }) => {
  return (
    <View 
      style={[
        styles.neuCard,
        pressed ? styles.neuPressed : styles.neuRaised,
        style
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

// NeumorphicButton - przyciski z efektem wypukłości
export const NeumorphicButton = ({ 
  children, 
  onPress, 
  style,
  disabled = false,
  ...props 
}) => {
  const [pressed, setPressed] = useState(false);
  
  return (
    <TouchableOpacity
      style={[
        styles.neuButton,
        pressed ? styles.neuPressed : styles.neuRaised,
        disabled && styles.neuDisabled,
        style
      ]}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      disabled={disabled}
      activeOpacity={1}
      {...props}
    >
      {children}
    </TouchableOpacity>
  );
};

// =====================================================
// ✨ ANIMATED COMPONENTS
// =====================================================

// AnimatedCard - karty z animacjami
export const AnimatedCard = ({ 
  children, 
  animation = 'glow',
  style,
  ...props 
}) => {
  const animValue = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    if (animation === 'glow') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1.05,
            duration: DesignTokens.animations.slow,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0.95,
            duration: DesignTokens.animations.slow,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else if (animation === 'float') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1.02,
            duration: DesignTokens.animations.verySlow,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0.98,
            duration: DesignTokens.animations.verySlow,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [animation]);
  
  return (
    <Animated.View 
      style={[
        { transform: [{ scale: animValue }] },
        style
      ]}
      {...props}
    >
      <GlassCard>
        {children}
      </GlassCard>
    </Animated.View>
  );
};

// FlameAnimation - animowana świeca
export const FlameAnimation = ({ 
  size = 32, 
  color = DesignTokens.colors.secondary,
  style 
}) => {
  const flameAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(flameAnim, {
          toValue: 1.3,
          duration: 1500 + Math.random() * 1000,
          useNativeDriver: true,
        }),
        Animated.timing(flameAnim, {
          toValue: 0.7,
          duration: 1500 + Math.random() * 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);
  
  return (
    <Animated.View 
      style={[
        { transform: [{ scale: flameAnim }] },
        style
      ]}
    >
      <Ionicons name="flame" size={size} color={color} />
    </Animated.View>
  );
};

// PulseAnimation - pulsujący element
export const PulseAnimation = ({ children, style, duration = 2000 }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: duration / 2,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: duration / 2,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);
  
  return (
    <Animated.View 
      style={[
        { transform: [{ scale: pulseAnim }] },
        style
      ]}
    >
      {children}
    </Animated.View>
  );
};

// =====================================================
// 📱 RESPONSIVE LAYOUT COMPONENTS
// =====================================================

// ResponsiveGrid - adaptacyjna siatka
export const ResponsiveGrid = ({ 
  children, 
  mobileColumns = 2,
  tabletColumns = 3,
  desktopColumns = 4,
  spacing = DesignTokens.spacing.md,
  style 
}) => {
  const screenWidth = Dimensions.get('window').width;
  
  const getColumns = () => {
    if (screenWidth < 768) return mobileColumns;
    if (screenWidth < 1024) return tabletColumns;
    return desktopColumns;
  };
  
  const columns = getColumns();
  const itemWidth = (screenWidth - (spacing * (columns + 1))) / columns;
  
  return (
    <View style={[styles.responsiveGrid, { gap: spacing }, style]}>
      {React.Children.map(children, (child, index) => (
        <View style={{ width: itemWidth }}>
          {child}
        </View>
      ))}
    </View>
  );
};

// AdaptiveContainer - kontener dostosowujący się do urządzenia
export const AdaptiveContainer = ({ 
  children, 
  style,
  maxWidth = 1200,
  ...props 
}) => {
  const screenWidth = Dimensions.get('window').width;
  const containerWidth = Math.min(screenWidth - 40, maxWidth);
  
  return (
    <View 
      style={[
        styles.adaptiveContainer,
        { width: containerWidth },
        style
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

// =====================================================
// 🎯 FEATURE-SPECIFIC COMPONENTS
// =====================================================

// FeatureCard - karta funkcji z nowym designem
export const FeatureCard = ({ 
  icon, 
  emoji, 
  title, 
  subtitle,
  onPress,
  isNew = false,
  variant = 'glass',
  style 
}) => {
  const CardComponent = variant === 'glass' ? GlassCard : NeumorphicCard;
  
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <CardComponent style={[styles.featureCard, style]}>
        {isNew && (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>NOWE</Text>
          </View>
        )}
        
        <View style={styles.featureIconContainer}>
          {emoji ? (
            <Text style={styles.featureEmoji}>{emoji}</Text>
          ) : (
            <Ionicons name={icon} size={32} color={DesignTokens.colors.secondary} />
          )}
        </View>
        
        <Text style={styles.featureTitle}>{title}</Text>
        {subtitle && (
          <Text style={styles.featureSubtitle}>{subtitle}</Text>
        )}
        
        <View style={styles.featureArrow}>
          <Ionicons name="arrow-forward" size={16} color={DesignTokens.colors.secondary} />
        </View>
      </CardComponent>
    </TouchableOpacity>
  );
};

// StatCard - karta statystyk
export const StatCard = ({ 
  icon, 
  value, 
  label, 
  trend,
  color = DesignTokens.colors.secondary,
  style 
}) => {
  return (
    <GlassCard style={[styles.statCard, style]}>
      <View style={styles.statHeader}>
        <Ionicons name={icon} size={24} color={color} />
        {trend && (
          <View style={[styles.trendBadge, { backgroundColor: trend > 0 ? DesignTokens.colors.success : DesignTokens.colors.error }]}>
            <Ionicons 
              name={trend > 0 ? "trending-up" : "trending-down"} 
              size={12} 
              color="white" 
            />
          </View>
        )}
      </View>
      
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </GlassCard>
  );
};

// QuoteCard - karta cytatu z nowym designem
export const QuoteCard = ({ 
  title = "Słowo na dziś", 
  quote, 
  source,
  style 
}) => {
  return (
    <GlassCard style={[styles.quoteCard, style]} gradient>
      <View style={styles.quoteHeader}>
        <Ionicons name="book-open" size={20} color={DesignTokens.colors.secondary} />
        <Text style={styles.quoteTitle}>{title}</Text>
      </View>
      
      <Text style={styles.quoteText}>{quote}</Text>
      
      {source && (
        <Text style={styles.quoteSource}>{source}</Text>
      )}
    </GlassCard>
  );
};

// =====================================================
// 📐 STYLES
// =====================================================

const styles = StyleSheet.create({
  // Glass Card styles
  glassCard: {
    borderRadius: DesignTokens.radius.lg,
    borderWidth: 1,
    padding: DesignTokens.spacing.lg,
    ...DesignTokens.shadows.md,
  },
  
  // Glass Button styles
  glassButton: {
    borderRadius: DesignTokens.radius.round,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    ...DesignTokens.shadows.sm,
  },
  
  glassButtonSm: {
    paddingHorizontal: DesignTokens.spacing.md,
    paddingVertical: DesignTokens.spacing.sm,
  },
  
  glassButtonMd: {
    paddingHorizontal: DesignTokens.spacing.lg,
    paddingVertical: DesignTokens.spacing.md,
  },
  
  glassButtonLg: {
    paddingHorizontal: DesignTokens.spacing.xl,
    paddingVertical: DesignTokens.spacing.lg,
  },
  
  glassButtonPrimary: {
    backgroundColor: DesignTokens.colors.secondary,
    borderColor: DesignTokens.colors.secondary,
  },
  
  glassButtonSecondary: {
    backgroundColor: DesignTokens.colors.glassWhite,
    borderColor: DesignTokens.colors.glassSecondary,
  },
  
  glassButtonDisabled: {
    opacity: 0.5,
  },
  
  // Neumorphic styles
  neuCard: {
    borderRadius: DesignTokens.radius.lg,
    padding: DesignTokens.spacing.lg,
  },
  
  neuRaised: {
    backgroundColor: DesignTokens.colors.neuRaised,
    shadowColor: '#000',
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  
  neuPressed: {
    backgroundColor: DesignTokens.colors.neuPressed,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  
  neuButton: {
    borderRadius: DesignTokens.radius.md,
    padding: DesignTokens.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  neuDisabled: {
    opacity: 0.5,
  },
  
  // Responsive Grid
  responsiveGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  
  adaptiveContainer: {
    alignSelf: 'center',
    paddingHorizontal: DesignTokens.spacing.md,
  },
  
  // Feature Card
  featureCard: {
    position: 'relative',
    alignItems: 'center',
    minHeight: 120,
  },
  
  newBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: DesignTokens.colors.error,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: DesignTokens.radius.sm,
  },
  
  newBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  
  featureIconContainer: {
    marginBottom: DesignTokens.spacing.sm,
  },
  
  featureEmoji: {
    fontSize: 40,
    textAlign: 'center',
  },
  
  featureTitle: {
    fontSize: DesignTokens.typography.sizes.md,
    fontWeight: DesignTokens.typography.weights.semibold,
    color: DesignTokens.colors.text,
    textAlign: 'center',
    marginBottom: DesignTokens.spacing.xs,
  },
  
  featureSubtitle: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.text,
    opacity: 0.8,
    textAlign: 'center',
  },
  
  featureArrow: {
    position: 'absolute',
    bottom: 8,
    right: 8,
  },
  
  // Stat Card
  statCard: {
    alignItems: 'center',
    minHeight: 100,
  },
  
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DesignTokens.spacing.sm,
  },
  
  trendBadge: {
    marginLeft: DesignTokens.spacing.xs,
    borderRadius: DesignTokens.radius.sm,
    padding: 2,
  },
  
  statValue: {
    fontSize: DesignTokens.typography.sizes.xxl,
    fontWeight: DesignTokens.typography.weights.bold,
    marginBottom: DesignTokens.spacing.xs,
  },
  
  statLabel: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.text,
    opacity: 0.8,
    textAlign: 'center',
  },
  
  // Quote Card
  quoteCard: {
    borderLeftWidth: 4,
    borderLeftColor: DesignTokens.colors.secondary,
  },
  
  quoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DesignTokens.spacing.md,
  },
  
  quoteTitle: {
    fontSize: DesignTokens.typography.sizes.md,
    fontWeight: DesignTokens.typography.weights.semibold,
    color: DesignTokens.colors.secondary,
    marginLeft: DesignTokens.spacing.sm,
  },
  
  quoteText: {
    fontSize: DesignTokens.typography.sizes.md,
    color: DesignTokens.colors.text,
    fontStyle: 'italic',
    lineHeight: 24,
    marginBottom: DesignTokens.spacing.sm,
  },
  
  quoteSource: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.secondary,
    textAlign: 'right',
    fontWeight: DesignTokens.typography.weights.medium,
  },
});

// =====================================================
// 🔗 EXPORTS
// =====================================================

export {
  // Design tokens
  DesignTokens,
  
  // Glass components
  GlassCard,
  GlassButton,
  
  // Neumorphic components
  NeumorphicCard,
  NeumorphicButton,
  
  // Animated components
  AnimatedCard,
  FlameAnimation,
  PulseAnimation,
  
  // Layout components
  ResponsiveGrid,
  AdaptiveContainer,
  
  // Feature components
  FeatureCard,
  StatCard,
  QuoteCard,
};

export default {
  DesignTokens,
  GlassCard,
  GlassButton,
  NeumorphicCard,
  NeumorphicButton,
  AnimatedCard,
  FlameAnimation,
  PulseAnimation,
  ResponsiveGrid,
  AdaptiveContainer,
  FeatureCard,
  StatCard,
  QuoteCard,
};