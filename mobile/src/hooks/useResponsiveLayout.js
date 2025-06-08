// mobile/src/hooks/useResponsiveLayout.js
// OREMUS 2025 - Responsive Layout Hooks & Utilities

import { useState, useEffect, useRef } from 'react';
import { Dimensions, PixelRatio, Platform } from 'react-native';

// =====================================================
// 📱 DEVICE DETECTION TYPES
// =====================================================

export const DeviceTypes = {
  MOBILE: 'mobile',
  TABLET: 'tablet', 
  DESKTOP: 'desktop',
};

export const Orientations = {
  PORTRAIT: 'portrait',
  LANDSCAPE: 'landscape',
};

// =====================================================
// 📐 BREAKPOINTS (based on common standards)
// =====================================================

export const Breakpoints = {
  mobile: {
    min: 0,
    max: 767,
  },
  tablet: {
    min: 768,
    max: 1023,
  },
  desktop: {
    min: 1024,
    max: Infinity,
  },
};

// =====================================================
// 🎯 MAIN RESPONSIVE HOOK
// =====================================================

export const useResponsiveLayout = () => {
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  const [screenData, setScreenData] = useState(Dimensions.get('screen'));
  
  useEffect(() => {
    const updateDimensions = ({ window, screen }) => {
      setDimensions(window);
      setScreenData(screen);
    };
    
    const subscription = Dimensions.addEventListener('change', updateDimensions);
    
    return () => subscription?.remove();
  }, []);
  
  const { width, height } = dimensions;
  const isLandscape = width > height;
  const pixelRatio = PixelRatio.get();
  
  // Device type detection
  const getDeviceType = () => {
    if (width < Breakpoints.tablet.min) return DeviceTypes.MOBILE;
    if (width < Breakpoints.desktop.min) return DeviceTypes.TABLET;
    return DeviceTypes.DESKTOP;
  };
  
  // Screen size categories
  const isSmallScreen = width < 375;
  const isMediumScreen = width >= 375 && width < 414;
  const isLargeScreen = width >= 414;
  const isExtraLargeScreen = width >= 768;
  
  // Device-specific checks
  const isMobile = getDeviceType() === DeviceTypes.MOBILE;
  const isTablet = getDeviceType() === DeviceTypes.TABLET;
  const isDesktop = getDeviceType() === DeviceTypes.DESKTOP;
  
  // Responsive values calculator
  const responsive = (mobileValue, tabletValue, desktopValue) => {
    if (isMobile) return mobileValue;
    if (isTablet) return tabletValue || mobileValue;
    return desktopValue || tabletValue || mobileValue;
  };
  
  // Grid columns calculator
  const getGridColumns = (mobileColumns = 2, tabletColumns = 3, desktopColumns = 4) => {
    return responsive(mobileColumns, tabletColumns, desktopColumns);
  };
  
  // Font scale based on screen size
  const getFontScale = () => {
    if (isSmallScreen) return 0.9;
    if (isMediumScreen) return 1.0;
    if (isLargeScreen) return 1.1;
    if (isExtraLargeScreen) return 1.2;
    return 1.0;
  };
  
  // Spacing scale
  const getSpacingScale = () => {
    if (isSmallScreen) return 0.8;
    if (isExtraLargeScreen) return 1.2;
    return 1.0;
  };
  
  return {
    // Dimensions
    width,
    height,
    screenData,
    pixelRatio,
    
    // Device info
    deviceType: getDeviceType(),
    orientation: isLandscape ? Orientations.LANDSCAPE : Orientations.PORTRAIT,
    platform: Platform.OS,
    
    // Boolean checks
    isMobile,
    isTablet,
    isDesktop,
    isLandscape,
    isPortrait: !isLandscape,
    isSmallScreen,
    isMediumScreen,
    isLargeScreen,
    isExtraLargeScreen,
    
    // Utility functions
    responsive,
    getGridColumns,
    getFontScale,
    getSpacingScale,
    
    // Responsive breakpoint checks
    breakpoint: {
      isAbove: (breakpoint) => width > Breakpoints[breakpoint]?.min,
      isBelow: (breakpoint) => width < Breakpoints[breakpoint]?.max,
      isBetween: (min, max) => width >= Breakpoints[min]?.min && width <= Breakpoints[max]?.max,
    },
  };
};

// =====================================================
// 📱 DEVICE-SPECIFIC HOOKS
// =====================================================

export const useDeviceOrientation = () => {
  const { orientation, isLandscape, isPortrait } = useResponsiveLayout();
  
  return {
    orientation,
    isLandscape,
    isPortrait,
  };
};

// Hook for safe area handling
export const useSafeAreaDimensions = () => {
  const layout = useResponsiveLayout();
  
  // Estimated safe area insets (would be better with react-native-safe-area-context)
  const getSafeAreaInsets = () => {
    const { height, platform, deviceType } = layout;
    
    if (platform === 'ios') {
      // iPhone X+ models
      if (height >= 812) {
        return {
          top: 44,
          bottom: 34,
          left: 0,
          right: 0,
        };
      }
      // Older iPhones
      return {
        top: 20,
        bottom: 0,
        left: 0,
        right: 0,
      };
    }
    
    // Android
    return {
      top: 24,
      bottom: 0,
      left: 0,
      right: 0,
    };
  };
  
  const safeAreaInsets = getSafeAreaInsets();
  
  return {
    ...layout,
    safeAreaInsets,
    usableHeight: layout.height - safeAreaInsets.top - safeAreaInsets.bottom,
    usableWidth: layout.width - safeAreaInsets.left - safeAreaInsets.right,
  };
};

// =====================================================
// 🎨 STYLE RESPONSIVE HOOKS
// =====================================================

export const useResponsiveStyles = () => {
  const layout = useResponsiveLayout();
  
  // Dynamic spacing based on screen size
  const spacing = (baseValue) => {
    const scale = layout.getSpacingScale();
    return Math.round(baseValue * scale);
  };
  
  // Dynamic font sizes
  const fontSize = (baseSize) => {
    const scale = layout.getFontScale();
    return Math.round(baseSize * scale);
  };
  
  // Responsive padding/margin
  const padding = {
    xs: spacing(4),
    sm: spacing(8),
    md: spacing(16),
    lg: spacing(24),
    xl: spacing(32),
    xxl: spacing(48),
  };
  
  // Container widths
  const containerWidth = {
    mobile: '100%',
    tablet: Math.min(layout.width * 0.9, 600),
    desktop: Math.min(layout.width * 0.8, 1200),
  };
  
  // Responsive card dimensions
  const cardDimensions = {
    width: layout.responsive(
      layout.width - 40, // mobile: full width minus padding
      Math.min(400, layout.width * 0.8), // tablet: max 400px
      Math.min(500, layout.width * 0.6)  // desktop: max 500px
    ),
    minHeight: layout.responsive(120, 140, 160),
  };
  
  return {
    layout,
    spacing,
    fontSize,
    padding,
    containerWidth,
    cardDimensions,
    
    // Quick responsive utilities
    r: layout.responsive, // shorthand
    grid: layout.getGridColumns,
  };
};

// =====================================================
// 🔄 ANIMATION HOOKS
// =====================================================

export const useResponsiveAnimations = () => {
  const layout = useResponsiveLayout();
  
  // Animation durations based on device performance
  const getDuration = (baseDuration) => {
    // Slower animations on larger screens, faster on smaller devices
    if (layout.isSmallScreen) return baseDuration * 0.8;
    if (layout.isExtraLargeScreen) return baseDuration * 1.2;
    return baseDuration;
  };
  
  // Animation configs
  const animations = {
    fast: getDuration(150),
    normal: getDuration(300),
    slow: getDuration(500),
    verySlow: getDuration(1000),
    
    // Spring configs
    spring: {
      tension: layout.isSmallScreen ? 300 : 200,
      friction: layout.isSmallScreen ? 20 : 15,
    },
    
    // Gesture configs
    gesture: {
      threshold: layout.responsive(10, 15, 20),
      velocity: layout.responsive(0.5, 0.7, 1.0),
    },
  };
  
  return {
    animations,
    getDuration,
  };
};

// =====================================================
// 🧭 NAVIGATION HOOKS
// =====================================================

export const useAdaptiveNavigation = () => {
  const layout = useResponsiveLayout();
  
  // Navigation style based on device
  const getNavigationStyle = () => {
    if (layout.isMobile) {
      return {
        type: 'bottom-tabs',
        tabBarPosition: 'bottom',
        showLabel: !layout.isSmallScreen,
        iconSize: layout.responsive(24, 26, 28),
      };
    }
    
    if (layout.isTablet) {
      return {
        type: 'sidebar',
        position: layout.isLandscape ? 'left' : 'bottom',
        showLabel: true,
        iconSize: 28,
      };
    }
    
    // Desktop
    return {
      type: 'header',
      position: 'top',
      showLabel: true,
      iconSize: 24,
    };
  };
  
  // Modal presentation style
  const getModalStyle = () => {
    if (layout.isMobile) {
      return {
        presentationStyle: 'pageSheet',
        animationType: 'slide',
        width: '100%',
        height: '90%',
      };
    }
    
    if (layout.isTablet) {
      return {
        presentationStyle: 'formSheet',
        animationType: 'fade',
        width: '80%',
        height: '70%',
      };
    }
    
    // Desktop
    return {
      presentationStyle: 'overCurrentContext',
      animationType: 'fade',
      width: '60%',
      height: '60%',
    };
  };
  
  return {
    navigationStyle: getNavigationStyle(),
    modalStyle: getModalStyle(),
    shouldUseGestures: layout.isMobile,
    swipeEnabled: layout.isMobile,
  };
};

// =====================================================
// 📋 LAYOUT UTILITIES
// =====================================================

export const useLayoutHelpers = () => {
  const layout = useResponsiveLayout();
  
  // Grid item calculator
  const getGridItemDimensions = (columns, spacing = 16) => {
    const totalSpacing = spacing * (columns - 1);
    const itemWidth = (layout.width - 40 - totalSpacing) / columns; // 40 = container padding
    
    return {
      width: itemWidth,
      aspectRatio: layout.responsive(1, 1.2, 1.3), // Different ratios per device
    };
  };
  
  // List item height calculator
  const getListItemHeight = (hasSubtitle = false, hasAvatar = false) => {
    let baseHeight = 48;
    
    if (hasSubtitle) baseHeight += 20;
    if (hasAvatar) baseHeight = Math.max(baseHeight, 56);
    
    // Scale based on device
    return baseHeight * layout.getSpacingScale();
  };
  
  // Modal dimensions
  const getModalDimensions = (maxWidth = 400, maxHeight = 600) => {
    const width = Math.min(maxWidth, layout.width * 0.9);
    const height = Math.min(maxHeight, layout.height * 0.8);
    
    return { width, height };
  };
  
  // Card columns for different sections
  const getCardColumns = (contentType) => {
    const columnConfig = {
      features: layout.getGridColumns(2, 3, 4),
      stats: layout.getGridColumns(2, 2, 4),
      gallery: layout.getGridColumns(2, 3, 5),
      products: layout.getGridColumns(1, 2, 3),
    };
    
    return columnConfig[contentType] || layout.getGridColumns();
  };
  
  return {
    getGridItemDimensions,
    getListItemHeight,
    getModalDimensions,
    getCardColumns,
    
    // Quick utilities
    isCompactLayout: layout.isSmallScreen,
    shouldStackVertically: layout.isMobile && layout.isPortrait,
    shouldShowSidebar: layout.isTablet && layout.isLandscape,
  };
};

// =====================================================
// 🎯 SPECIALIZED HOOKS FOR OREMUS FEATURES
// =====================================================

// Hook specifically for prayer-related layouts
export const usePrayerLayoutOptimization = () => {
  const layout = useResponsiveLayout();
  const styles = useResponsiveStyles();
  
  // Prayer counter sizing
  const getPrayerCounterSize = () => {
    return {
      fontSize: styles.fontSize(layout.responsive(32, 40, 48)),
      containerHeight: layout.responsive(120, 140, 160),
      iconSize: layout.responsive(24, 28, 32),
    };
  };
  
  // Candle grid optimization
  const getCandleGridConfig = () => {
    return {
      columns: layout.getGridColumns(1, 2, 3),
      itemAspectRatio: layout.responsive(1.2, 1.1, 1.0),
      spacing: styles.spacing(layout.responsive(12, 16, 20)),
    };
  };
  
  // Mass streaming layout
  const getStreamingLayoutConfig = () => {
    return {
      videoAspectRatio: layout.responsive(16/9, 16/9, 21/9),
      showSidebar: layout.isTablet && layout.isLandscape,
      chatWidth: layout.responsive('100%', '30%', '25%'),
    };
  };
  
  return {
    getPrayerCounterSize,
    getCandleGridConfig,
    getStreamingLayoutConfig,
    
    // Prayer-specific responsive values
    intentionCardHeight: layout.responsive(100, 120, 140),
    prayerButtonSize: layout.responsive(50, 60, 70),
    flameAnimationSize: layout.responsive(60, 80, 100),
  };
};

// Hook for shop/commerce layouts
export const useCommerceLayout = () => {
  const layout = useResponsiveLayout();
  
  // Product card dimensions
  const getProductCardConfig = () => {
    return {
      columns: layout.getGridColumns(1, 2, 3),
      cardHeight: layout.responsive(200, 250, 300),
      imageHeight: layout.responsive(120, 150, 180),
      showQuickActions: layout.isTablet || layout.isDesktop,
    };
  };
  
  // Cart layout
  const getCartLayoutConfig = () => {
    return {
      showSidePanel: layout.isDesktop,
      stackItems: layout.isMobile,
      summaryPosition: layout.responsive('bottom', 'right', 'right'),
    };
  };
  
  return {
    getProductCardConfig,
    getCartLayoutConfig,
  };
};

// =====================================================
// 🔧 PERFORMANCE OPTIMIZATION HOOK
// =====================================================

export const usePerformanceOptimization = () => {
  const layout = useResponsiveLayout();
  
  // Reduce animations on smaller devices
  const shouldReduceAnimations = layout.isSmallScreen || layout.pixelRatio < 2;
  
  // Image quality based on device
  const getImageQuality = () => {
    if (layout.isSmallScreen) return 'low';
    if (layout.isMobile) return 'medium';
    return 'high';
  };
  
  // List optimization
  const getListOptimization = () => {
    return {
      windowSize: layout.responsive(10, 15, 20),
      initialNumToRender: layout.responsive(5, 8, 10),
      maxToRenderPerBatch: layout.responsive(3, 5, 8),
      updateCellsBatchingPeriod: layout.responsive(100, 50, 30),
    };
  };
  
  // Cache configuration
  const getCacheConfig = () => {
    return {
      imageCacheSize: layout.responsive(50, 100, 200), // MB
      dataCacheSize: layout.responsive(10, 20, 50), // MB
      maxCacheAge: layout.responsive(300000, 600000, 900000), // ms
    };
  };
  
  return {
    shouldReduceAnimations,
    getImageQuality,
    getListOptimization,
    getCacheConfig,
    
    // Performance flags
    enableHeavyAnimations: !shouldReduceAnimations,
    enableParallax: layout.isTablet || layout.isDesktop,
    enableBlur: !layout.isSmallScreen,
    enableShadows: !shouldReduceAnimations,
  };
};

// =====================================================
// 📱 COMPREHENSIVE LAYOUT HOOK (ALL-IN-ONE)
// =====================================================

export const useOremusLayout = () => {
  const base = useResponsiveLayout();
  const styles = useResponsiveStyles();
  const animations = useResponsiveAnimations();
  const navigation = useAdaptiveNavigation();
  const helpers = useLayoutHelpers();
  const prayer = usePrayerLayoutOptimization();
  const commerce = useCommerceLayout();
  const performance = usePerformanceOptimization();
  
  return {
    // Core responsive data
    ...base,
    
    // Style utilities
    styles,
    
    // Animation configs
    animations,
    
    // Navigation configs
    navigation,
    
    // Layout helpers
    helpers,
    
    // Feature-specific configs
    prayer,
    commerce,
    
    // Performance configs
    performance,
    
    // Quick access utilities
    utils: {
      spacing: styles.spacing,
      fontSize: styles.fontSize,
      responsive: base.responsive,
      grid: base.getGridColumns,
    },
  };
};

// =====================================================
// 🎛️ THEME PROVIDER HOOK
// =====================================================

export const useResponsiveTheme = () => {
  const layout = useResponsiveLayout();
  
  // Dynamic theme based on device
  const getTheme = () => {
    const baseTheme = {
      // Base colors remain the same
      colors: {
        primary: '#1a237e',
        secondary: '#FFD700',
        background: '#000000',
        text: '#FFFFFF',
      },
      
      // Responsive spacing
      spacing: {
        xs: layout.responsive(4, 6, 8),
        sm: layout.responsive(8, 12, 16),
        md: layout.responsive(16, 20, 24),
        lg: layout.responsive(24, 28, 32),
        xl: layout.responsive(32, 40, 48),
      },
      
      // Responsive typography
      typography: {
        caption: layout.responsive(12, 13, 14),
        body: layout.responsive(14, 15, 16),
        subheading: layout.responsive(16, 17, 18),
        heading: layout.responsive(20, 22, 24),
        title: layout.responsive(24, 28, 32),
        hero: layout.responsive(32, 40, 48),
      },
      
      // Responsive border radius
      borderRadius: {
        sm: layout.responsive(6, 8, 10),
        md: layout.responsive(10, 12, 14),
        lg: layout.responsive(14, 16, 18),
        xl: layout.responsive(18, 20, 22),
      },
      
      // Device-specific shadows
      shadows: {
        enabled: !layout.isSmallScreen,
        intensity: layout.responsive(0.1, 0.15, 0.2),
      },
    };
    
    return baseTheme;
  };
  
  return {
    theme: getTheme(),
    isDarkMode: true, // OREMUS uses dark theme
    deviceOptimized: true,
  };
};

// =====================================================
// 📤 EXPORTS
// =====================================================

export default {
  useResponsiveLayout,
  useDeviceOrientation,
  useSafeAreaDimensions,
  useResponsiveStyles,
  useResponsiveAnimations,
  useAdaptiveNavigation,
  useLayoutHelpers,
  usePrayerLayoutOptimization,
  useCommerceLayout,
  usePerformanceOptimization,
  useOremusLayout,
  useResponsiveTheme,
  
  // Constants
  DeviceTypes,
  Orientations,
  Breakpoints,
};