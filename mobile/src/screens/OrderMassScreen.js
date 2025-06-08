// mobile/src/screens/OrderMassScreen.js
// OREMUS 2025 - NEW FEATURE: Online Mass Ordering System

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';

// Import services
import { supabase } from '../services/supabase';

// Import design system
import {
  DesignTokens,
  GlassCard,
  GlassButton,
  AnimatedCard,
  ResponsiveGrid,
  FeatureCard,
} from '../components/modern/DesignSystem';

// Import responsive hooks
import { useOremusLayout } from '../hooks/useResponsiveLayout';

// =====================================================
// 📊 MASS TYPES AND PRICING
// =====================================================

const massTypes = [
  {
    id: 'standard',
    name: 'Msza zwykła',
    price: 20,
    duration: '45 min',
    description: 'Standardowa Msza Święta z intencją',
    icon: 'business',
    emoji: '⛪',
    popular: false,
  },
  {
    id: 'gregorian',
    name: 'Msza gregoriańska',
    price: 600,
    duration: '30 dni',
    description: 'Cykl 30 Mszy Świętych w tradycji gregoriańskiej',
    icon: 'calendar',
    emoji: '📅',
    popular: true,
  },
  {
    id: 'novena',
    name: 'Nowenna',
    price: 180,
    duration: '9 dni',
    description: 'Dziewięciodniowy cykl Mszy za intencję',
    icon: 'heart',
    emoji: '❤️',
    popular: false,
  },
  {
    id: 'thanksgiving',
    name: 'Msza dziękczynna',
    price: 30,
    duration: '60 min',
    description: 'Uroczysta Msza dziękczynna',
    icon: 'star',
    emoji: '⭐',
    popular: false,
  },
];

const paymentMethods = [
  {
    id: 'apple_pay',
    name: 'Apple Pay',
    icon: 'logo-apple',
    description: 'Szybka płatność Touch ID / Face ID',
    fee: 0,
    instant: true,
    available: Platform.OS === 'ios',
    recommended: true,
  },
  {
    id: 'google_pay',
    name: 'Google Pay',
    icon: 'logo-google',
    description: 'Szybka płatność odciskiem palca',
    fee: 0,
    instant: true,
    available: Platform.OS === 'android',
    recommended: true,
  },
  {
    id: 'blik',
    name: 'BLIK',
    icon: 'phone-portrait',
    description: 'Płatność mobilna BLIK (PL)',
    fee: 0,
    instant: true,
    popular: true,
  },
  {
    id: 'card',
    name: 'Karta płatnicza',
    icon: 'card',
    description: 'Visa, Mastercard, American Express',
    fee: 0,
    popular: true,
  },
  {
    id: 'paypal',
    name: 'PayPal',
    icon: 'logo-paypal',
    description: 'Bezpieczne płatności PayPal',
    fee: 2.5,
  },
  {
    id: 'transfer',
    name: 'Przelew bankowy',
    icon: 'business',
    description: 'Tradycyjny przelew (2-3 dni)',
    fee: 0,
    slow: true,
  },
];

// =====================================================
// 🏛️ ORDER MASS SCREEN COMPONENT
// =====================================================

export default function OrderMassScreen({ navigation }) {
  // Form state
  const [intention, setIntention] = useState('');
  const [selectedMassType, setSelectedMassType] = useState(massTypes[0]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedChurch, setSelectedChurch] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(paymentMethods[0]);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [requesterName, setRequesterName] = useState('');
  const [requesterEmail, setRequesterEmail] = useState('');
  const [requesterPhone, setRequesterPhone] = useState('');
  
  // UI state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showChurchModal, setShowChurchModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [churches, setChurches] = useState([]);
  
  // Layout
  const layout = useOremusLayout();

  // =====================================================
  // 🔄 LIFECYCLE AND DATA LOADING
  // =====================================================

  useEffect(() => {
    loadChurches();
    loadUserData();
    setupDefaultPayment();
  }, []);

  const setupDefaultPayment = () => {
    // Auto-select best payment method based on platform
    const availableMethods = paymentMethods.filter(method => 
      method.available !== false && (method.available === undefined || method.available === true)
    );
    
    // Prioritize instant payments
    const instantMethod = availableMethods.find(method => method.instant && method.recommended);
    const popularMethod = availableMethods.find(method => method.popular);
    
    setSelectedPayment(instantMethod || popularMethod || availableMethods[0]);
  };

  const loadChurches = async () => {
    try {
      // Mock churches data - in production would load from Supabase
      const mockChurches = [
        {
          id: '1',
          name: 'Kościół św. Jana Chrzciciela',
          address: 'ul. Kościelna 15',
          city: 'Warszawa',
          phone: '+48 22 123 45 67',
          email: 'kontakt@swjan.pl',
          massHours: ['6:30', '8:00', '10:00', '12:00', '18:00'],
          priest: 'Ks. Jan Kowalski',
          distance: '2.3 km',
        },
        {
          id: '2',
          name: 'Bazylika Mariacka',
          address: 'Plac Mariacki 5',
          city: 'Kraków',
          phone: '+48 12 987 65 43',
          email: 'biuro@mariacka.pl',
          massHours: ['7:00', '9:00', '11:00', '17:00', '19:00'],
          priest: 'Ks. Piotr Nowak',
          distance: '1.8 km',
        },
        {
          id: '3',
          name: 'Katedra Oliwska',
          address: 'ul. Biskupa Edmunda 4',
          city: 'Gdańsk',
          phone: '+48 58 321 09 87',
          email: 'sekretariat@katedra.gda.pl',
          massHours: ['6:00', '8:00', '10:00', '12:00', '16:00', '18:00'],
          priest: 'Ks. Bp. Stanisław Wiśniewski',
          distance: '5.1 km',
        },
      ];
      
      setChurches(mockChurches);
      setSelectedChurch(mockChurches[0]); // Default selection
    } catch (error) {
      console.error('Error loading churches:', error);
    }
  };

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setRequesterEmail(user.email);
        
        // Try to load user profile for name
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, phone')
          .eq('id', user.id)
          .single();
          
        if (profile) {
          setRequesterName(profile.full_name || '');
          setRequesterPhone(profile.phone || '');
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  // =====================================================
  // 📝 FORM HANDLERS
  // =====================================================

  const handleDateChange = (event, date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
    }
  };

  const validateForm = () => {
    if (!intention.trim()) {
      Alert.alert('Błąd', 'Proszę wpisać intencję Mszy Świętej');
      return false;
    }
    
    if (!requesterName.trim()) {
      Alert.alert('Błąd', 'Proszę podać imię i nazwisko');
      return false;
    }
    
    if (!requesterEmail.trim()) {
      Alert.alert('Błąd', 'Proszę podać adres email');
      return false;
    }
    
    if (!selectedChurch) {
      Alert.alert('Błąd', 'Proszę wybrać kościół');
      return false;
    }
    
    // Check if date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDateOnly = new Date(selectedDate);
    selectedDateOnly.setHours(0, 0, 0, 0);
    
    if (selectedDateOnly < today) {
      Alert.alert('Błąd', 'Data Mszy nie może być z przeszłości');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const orderData = {
        user_id: user.id,
        mass_type: selectedMassType.id,
        intention: intention.trim(),
        mass_date: selectedDate.toISOString(),
        church_id: selectedChurch.id,
        church_name: selectedChurch.name,
        church_address: selectedChurch.address,
        church_city: selectedChurch.city,
        requester_name: requesterName.trim(),
        requester_email: requesterEmail.trim(),
        requester_phone: requesterPhone.trim(),
        payment_method: selectedPayment.id,
        payment_amount: selectedMassType.price,
        additional_notes: additionalNotes.trim(),
        status: 'pending_payment',
        created_at: new Date().toISOString(),
      };
      
      // Process payment based on selected method
      const paymentResult = await processPayment(orderData);
      
      if (!paymentResult.success) {
        Alert.alert('Błąd płatności', paymentResult.error);
        return;
      }
      
      // Update order with payment info
      orderData.payment_status = paymentResult.status;
      orderData.payment_id = paymentResult.payment_id;
      orderData.status = paymentResult.status === 'completed' ? 'confirmed' : 'pending_payment';
      
      const { data, error } = await supabase
        .from('mass_orders')
        .insert([orderData])
        .select()
        .single();
      
      if (error) throw error;
      
      // Show success message based on payment method
      const successMessage = getSuccessMessage(selectedPayment, data);
      
      Alert.alert(
        'Zamówienie złożone! ⛪',
        successMessage,
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.goBack();
            }
          }
        ]
      );
      
    } catch (error) {
      console.error('Error submitting order:', error);
      Alert.alert(
        'Błąd',
        'Nie udało się złożyć zamówienia. Spróbuj ponownie lub skontaktuj się z parafią bezpośrednio.'
      );
    } finally {
      setLoading(false);
    }
  };

  const processPayment = async (orderData) => {
    const amount = orderData.payment_amount + (selectedPayment.fee || 0);
    
    try {
      switch (selectedPayment.id) {
        case 'apple_pay':
          return await processApplePay(amount, orderData);
          
        case 'google_pay':
          return await processGooglePay(amount, orderData);
          
        case 'blik':
          return await processBlikPayment(amount, orderData);
          
        case 'card':
          return await processCardPayment(amount, orderData);
          
        case 'paypal':
          return await processPayPalPayment(amount, orderData);
          
        case 'transfer':
          return {
            success: true,
            status: 'pending',
            payment_id: `TRANSFER_${Date.now()}`,
            message: 'Przelew bankowy - dane do przelewu wysłane na email'
          };
          
        default:
          throw new Error('Nieobsługiwana metoda płatności');
      }
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Błąd przetwarzania płatności'
      };
    }
  };

  const processApplePay = async (amount, orderData) => {
    // Mock Apple Pay implementation
    // In production: integrate with react-native-payments or Stripe
    return new Promise((resolve) => {
      setTimeout(() => {
        if (Math.random() > 0.1) { // 90% success rate
          resolve({
            success: true,
            status: 'completed',
            payment_id: `APPLE_PAY_${Date.now()}`,
            message: 'Płatność Apple Pay zakończona pomyślnie'
          });
        } else {
          resolve({
            success: false,
            error: 'Płatność Apple Pay została anulowana lub odrzucona'
          });
        }
      }, 2000);
    });
  };

  const processGooglePay = async (amount, orderData) => {
    // Mock Google Pay implementation  
    // In production: integrate with react-native-google-pay
    return new Promise((resolve) => {
      setTimeout(() => {
        if (Math.random() > 0.1) { // 90% success rate
          resolve({
            success: true,
            status: 'completed',
            payment_id: `GOOGLE_PAY_${Date.now()}`,
            message: 'Płatność Google Pay zakończona pomyślnie'
          });
        } else {
          resolve({
            success: false,
            error: 'Płatność Google Pay została anulowana lub odrzucona'
          });
        }
      }, 2000);
    });
  };

  const processBlikPayment = async (amount, orderData) => {
    // Mock BLIK implementation
    // In production: integrate with Polish payment gateway (PayU, Przelewy24, etc.)
    return new Promise((resolve) => {
      setTimeout(() => {
        if (Math.random() > 0.05) { // 95% success rate for BLIK
          resolve({
            success: true,
            status: 'completed',
            payment_id: `BLIK_${Date.now()}`,
            message: 'Płatność BLIK zakończona pomyślnie'
          });
        } else {
          resolve({
            success: false,
            error: 'Błąd autoryzacji BLIK - sprawdź kod w aplikacji bankowej'
          });
        }
      }, 1500);
    });
  };

  const processCardPayment = async (amount, orderData) => {
    // Mock card payment implementation
    // In production: integrate with Stripe, PayU, or other payment processor
    return new Promise((resolve) => {
      setTimeout(() => {
        if (Math.random() > 0.15) { // 85% success rate
          resolve({
            success: true,
            status: 'completed',
            payment_id: `CARD_${Date.now()}`,
            message: 'Płatność kartą zakończona pomyślnie'
          });
        } else {
          resolve({
            success: false,
            error: 'Płatność odrzucona - sprawdź dane karty lub saldo'
          });
        }
      }, 3000);
    });
  };

  const processPayPalPayment = async (amount, orderData) => {
    // Mock PayPal implementation
    // In production: integrate with PayPal SDK
    return new Promise((resolve) => {
      setTimeout(() => {
        if (Math.random() > 0.1) { // 90% success rate
          resolve({
            success: true,
            status: 'completed',
            payment_id: `PAYPAL_${Date.now()}`,
            message: 'Płatność PayPal zakończona pomyślnie'
          });
        } else {
          resolve({
            success: false,
            error: 'Płatność PayPal została anulowana'
          });
        }
      }, 2500);
    });
  };

  const getSuccessMessage = (paymentMethod, orderData) => {
    const baseMessage = `Twoje zamówienie Mszy zostało przekazane do ${selectedChurch.name}.\n\nNumer zamówienia: ${orderData.id}`;
    
    switch (paymentMethod.id) {
      case 'apple_pay':
      case 'google_pay':
      case 'blik':
      case 'card':
      case 'paypal':
        return `${baseMessage}\n\n✅ Płatność zakończona pomyślnie.\nOtrzymasz potwierdzenie na email w ciągu 1 godziny.`;
        
      case 'transfer':
        return `${baseMessage}\n\n📧 Dane do przelewu zostały wysłane na Twój email.\nPo zaksięgowaniu przelewu otrzymasz potwierdzenie.`;
        
      default:
        return `${baseMessage}\n\nOtrzymasz potwierdzenie na email w ciągu 24 godzin.`;
    }
  };

  // =====================================================
  // 🎨 RENDER FUNCTIONS
  // =====================================================

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity 
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <GlassCard style={styles.backButtonCard}>
          <Ionicons name="arrow-back" size={24} color={DesignTokens.colors.secondary} />
        </GlassCard>
      </TouchableOpacity>
      
      <View style={styles.headerInfo}>
        <Text style={[styles.headerTitle, { fontSize: layout.utils.fontSize(20) }]}>
          Zamów Mszę Świętą
        </Text>
        <Text style={[styles.headerSubtitle, { fontSize: layout.utils.fontSize(14) }]}>
          Online rezerwacja • Krok {currentStep}/3
        </Text>
      </View>
      
      <View style={styles.headerIcon}>
        <Ionicons name="business" size={28} color={DesignTokens.colors.secondary} />
      </View>
    </View>
  );

  const renderProgressBar = () => (
    <GlassCard style={styles.progressCard}>
      <View style={styles.progressSteps}>
        {[1, 2, 3].map(step => (
          <View key={step} style={styles.progressStep}>
            <View style={[
              styles.progressDot,
              { 
                backgroundColor: step <= currentStep 
                  ? DesignTokens.colors.secondary 
                  : DesignTokens.colors.glassWhite 
              }
            ]}>
              {step <= currentStep && (
                <Ionicons name="checkmark" size={16} color={DesignTokens.colors.primary} />
              )}
            </View>
            <Text style={[
              styles.progressLabel,
              { 
                color: step <= currentStep 
                  ? DesignTokens.colors.secondary 
                  : DesignTokens.colors.text,
                opacity: step <= currentStep ? 1 : 0.6,
              }
            ]}>
              {step === 1 ? 'Typ Mszy' : step === 2 ? 'Szczegóły' : 'Płatność'}
            </Text>
          </View>
        ))}
      </View>
      
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBg} />
        <View style={[
          styles.progressBarFill,
          { width: `${(currentStep / 3) * 100}%` }
        ]} />
      </View>
    </GlassCard>
  );

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { fontSize: layout.utils.fontSize(18) }]}>
        1️⃣ Wybierz typ Mszy Świętej
      </Text>
      
      <ResponsiveGrid
        mobileColumns={1}
        tabletColumns={2}
        desktopColumns={2}
        spacing={DesignTokens.spacing.md}
      >
        {massTypes.map(type => (
          <TouchableOpacity 
            key={type.id}
            onPress={() => setSelectedMassType(type)}
            style={styles.massTypeContainer}
          >
            <GlassCard style={[
              styles.massTypeCard,
              {
                borderColor: selectedMassType.id === type.id 
                  ? DesignTokens.colors.secondary 
                  : DesignTokens.colors.glassWhite,
                borderWidth: selectedMassType.id === type.id ? 2 : 1,
                backgroundColor: selectedMassType.id === type.id 
                  ? DesignTokens.colors.glassSecondary 
                  : DesignTokens.colors.glassWhite,
              }
            ]}>
              {type.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>POPULARNE</Text>
                </View>
              )}
              
              <View style={styles.massTypeHeader}>
                <Text style={styles.massTypeEmoji}>{type.emoji}</Text>
                <View style={styles.massTypeInfo}>
                  <Text style={styles.massTypeName}>{type.name}</Text>
                  <Text style={styles.massTypeDuration}>{type.duration}</Text>
                </View>
                <Text style={styles.massTypePrice}>{type.price} zł</Text>
              </View>
              
              <Text style={styles.massTypeDescription}>
                {type.description}
              </Text>
              
              {selectedMassType.id === type.id && (
                <View style={styles.selectedIndicator}>
                  <Ionicons name="checkmark-circle" size={20} color={DesignTokens.colors.secondary} />
                </View>
              )}
            </GlassCard>
          </TouchableOpacity>
        ))}
      </ResponsiveGrid>
      
      <GlassButton
        size="lg"
        variant="primary"
        onPress={() => setCurrentStep(2)}
        style={styles.nextButton}
      >
        <Text style={styles.nextButtonText}>Dalej</Text>
        <Ionicons name="arrow-forward" size={20} color={DesignTokens.colors.primary} />
      </GlassButton>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { fontSize: layout.utils.fontSize(18) }]}>
        2️⃣ Szczegóły zamówienia
      </Text>
      
      {/* Intention */}
      <GlassCard style={styles.inputSection}>
        <Text style={styles.inputLabel}>Intencja Mszy Świętej *</Text>
        <TextInput
          style={styles.textInput}
          placeholder="np. Za zdrowie rodziny, w intencji zmarłego..."
          placeholderTextColor={DesignTokens.colors.text + '80'}
          value={intention}
          onChangeText={setIntention}
          multiline
          numberOfLines={3}
          maxLength={200}
        />
        <Text style={styles.charCount}>{intention.length}/200</Text>
      </GlassCard>
      
      {/* Date */}
      <GlassCard style={styles.inputSection}>
        <Text style={styles.inputLabel}>Data Mszy</Text>
        <TouchableOpacity 
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Ionicons name="calendar" size={20} color={DesignTokens.colors.secondary} />
          <Text style={styles.dateText}>
            {selectedDate.toLocaleDateString('pl-PL', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
          <Ionicons name="chevron-down" size={16} color={DesignTokens.colors.text} />
        </TouchableOpacity>
      </GlassCard>
      
      {/* Church selection */}
      <GlassCard style={styles.inputSection}>
        <Text style={styles.inputLabel}>Kościół *</Text>
        <TouchableOpacity 
          style={styles.churchButton}
          onPress={() => setShowChurchModal(true)}
        >
          {selectedChurch ? (
            <View style={styles.churchInfo}>
              <View style={styles.churchMain}>
                <Text style={styles.churchName}>{selectedChurch.name}</Text>
                <Text style={styles.churchAddress}>{selectedChurch.address}, {selectedChurch.city}</Text>
                <Text style={styles.churchDistance}>📍 {selectedChurch.distance}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={DesignTokens.colors.secondary} />
            </View>
          ) : (
            <View style={styles.churchPlaceholder}>
              <Ionicons name="business" size={20} color={DesignTokens.colors.text} />
              <Text style={styles.churchPlaceholderText}>Wybierz kościół</Text>
            </View>
          )}
        </TouchableOpacity>
      </GlassCard>
      
      {/* Requester info */}
      <GlassCard style={styles.inputSection}>
        <Text style={styles.inputLabel}>Dane zamawiającego</Text>
        
        <TextInput
          style={styles.textInput}
          placeholder="Imię i nazwisko *"
          placeholderTextColor={DesignTokens.colors.text + '80'}
          value={requesterName}
          onChangeText={setRequesterName}
        />
        
        <TextInput
          style={[styles.textInput, styles.inputSpacing]}
          placeholder="Email *"
          placeholderTextColor={DesignTokens.colors.text + '80'}
          value={requesterEmail}
          onChangeText={setRequesterEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        
        <TextInput
          style={[styles.textInput, styles.inputSpacing]}
          placeholder="Telefon (opcjonalnie)"
          placeholderTextColor={DesignTokens.colors.text + '80'}
          value={requesterPhone}
          onChangeText={setRequesterPhone}
          keyboardType="phone-pad"
        />
      </GlassCard>
      
      {/* Additional notes */}
      <GlassCard style={styles.inputSection}>
        <Text style={styles.inputLabel}>Dodatkowe uwagi (opcjonalne)</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Specjalne życzenia, uwagi dla celebransa..."
          placeholderTextColor={DesignTokens.colors.text + '80'}
          value={additionalNotes}
          onChangeText={setAdditionalNotes}
          multiline
          numberOfLines={2}
          maxLength={500}
        />
      </GlassCard>
      
      <View style={styles.stepButtons}>
        <GlassButton
          size="md"
          variant="secondary"
          onPress={() => setCurrentStep(1)}
          style={styles.backStepButton}
        >
          <Ionicons name="arrow-back" size={20} color={DesignTokens.colors.secondary} />
          <Text style={styles.backStepButtonText}>Wstecz</Text>
        </GlassButton>
        
        <GlassButton
          size="md"
          variant="primary"
          onPress={() => setCurrentStep(3)}
          style={styles.nextStepButton}
        >
          <Text style={styles.nextButtonText}>Dalej</Text>
          <Ionicons name="arrow-forward" size={20} color={DesignTokens.colors.primary} />
        </GlassButton>
      </View>
    </View>
  );

  const renderStep3 = () => {
    const total = selectedMassType.price + (selectedPayment.fee || 0);
    
    return (
      <View style={styles.stepContainer}>
        <Text style={[styles.stepTitle, { fontSize: layout.utils.fontSize(18) }]}>
          3️⃣ Podsumowanie i płatność
        </Text>
        
        {/* Order summary */}
        <GlassCard style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>📋 Podsumowanie zamówienia</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Typ Mszy:</Text>
            <Text style={styles.summaryValue}>{selectedMassType.name}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Data:</Text>
            <Text style={styles.summaryValue}>
              {selectedDate.toLocaleDateString('pl-PL')}
            </Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Kościół:</Text>
            <Text style={styles.summaryValue}>{selectedChurch?.name}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Intencja:</Text>
            <Text style={styles.summaryValue} numberOfLines={2}>
              {intention || 'Brak intencji'}
            </Text>
          </View>
          
          <View style={styles.summaryDivider} />
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Ofiara za Mszę:</Text>
            <Text style={styles.summaryPrice}>{selectedMassType.price} zł</Text>
          </View>
          
          {selectedPayment.fee > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Opłata {selectedPayment.name}:</Text>
              <Text style={styles.summaryPrice}>{selectedPayment.fee} zł</Text>
            </View>
          )}
          
          <View style={styles.summaryTotalRow}>
            <Text style={styles.summaryTotalLabel}>Do zapłaty:</Text>
            <Text style={styles.summaryTotalValue}>{total} zł</Text>
          </View>
        </GlassCard>
        
        {/* Payment methods */}
        <GlassCard style={styles.paymentSection}>
          <Text style={styles.paymentTitle}>💳 Metoda płatności</Text>
          
          {/* Quick payment options */}
          <View style={styles.quickPaymentSection}>
            <Text style={styles.quickPaymentTitle}>⚡ Płatności ekspresowe</Text>
            <View style={styles.quickPaymentGrid}>
              {paymentMethods
                .filter(method => method.instant && (method.available !== false))
                .map(method => (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.quickPaymentMethod,
                    {
                      backgroundColor: selectedPayment.id === method.id 
                        ? DesignTokens.colors.glassSecondary 
                        : DesignTokens.colors.glassWhite,
                      borderColor: selectedPayment.id === method.id 
                        ? DesignTokens.colors.secondary 
                        : 'transparent',
                      opacity: method.available === false ? 0.5 : 1,
                    }
                  ]}
                  onPress={() => method.available !== false && setSelectedPayment(method)}
                  disabled={method.available === false}
                >
                  <Ionicons name={method.icon} size={32} color={DesignTokens.colors.secondary} />
                  <Text style={styles.quickPaymentName}>{method.name}</Text>
                  {method.recommended && (
                    <View style={styles.recommendedBadge}>
                      <Text style={styles.recommendedText}>POLECANE</Text>
                    </View>
                  )}
                  {selectedPayment.id === method.id && (
                    <View style={styles.selectedQuickBadge}>
                      <Ionicons name="checkmark-circle" size={16} color={DesignTokens.colors.secondary} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          {/* Standard payment options */}
          <View style={styles.standardPaymentSection}>
            <Text style={styles.standardPaymentTitle}>💳 Inne metody płatności</Text>
            {paymentMethods
              .filter(method => !method.instant && (method.available !== false))
              .map(method => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.paymentMethod,
                  {
                    backgroundColor: selectedPayment.id === method.id 
                      ? DesignTokens.colors.glassSecondary 
                      : 'transparent',
                    borderColor: selectedPayment.id === method.id 
                      ? DesignTokens.colors.secondary 
                      : DesignTokens.colors.glassWhite,
                  }
                ]}
                onPress={() => setSelectedPayment(method)}
              >
                <View style={styles.paymentMethodLeft}>
                  <Ionicons name={method.icon} size={24} color={DesignTokens.colors.secondary} />
                  <View style={styles.paymentMethodInfo}>
                    <View style={styles.paymentMethodHeader}>
                      <Text style={styles.paymentMethodName}>{method.name}</Text>
                      {method.popular && (
                        <View style={styles.popularPaymentBadge}>
                          <Text style={styles.popularPaymentText}>POPULARNE</Text>
                        </View>
                      )}
                      {method.slow && (
                        <View style={styles.slowPaymentBadge}>
                          <Text style={styles.slowPaymentText}>2-3 DNI</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.paymentMethodDesc}>{method.description}</Text>
                  </View>
                </View>
                
                <View style={styles.paymentMethodRight}>
                  {method.fee > 0 && (
                    <Text style={styles.paymentFee}>+{method.fee} zł</Text>
                  )}
                  {selectedPayment.id === method.id && (
                    <Ionicons name="checkmark-circle" size={20} color={DesignTokens.colors.secondary} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Payment security info */}
          <View style={styles.paymentSecurityInfo}>
            <Ionicons name="shield-checkmark" size={16} color={DesignTokens.colors.success} />
            <Text style={styles.paymentSecurityText}>
              Wszystkie płatności są zabezpieczone SSL i nie przechowujemy danych karty
            </Text>
          </View>
        </GlassCard>
        
        <View style={styles.stepButtons}>
          <GlassButton
            size="md"
            variant="secondary"
            onPress={() => setCurrentStep(2)}
            style={styles.backStepButton}
          >
            <Ionicons name="arrow-back" size={20} color={DesignTokens.colors.secondary} />
            <Text style={styles.backStepButtonText}>Wstecz</Text>
          </GlassButton>
          
          <GlassButton
            size="md"
            variant="primary"
            onPress={handleSubmit}
            style={[styles.submitButton, { opacity: loading ? 0.7 : 1 }]}
            disabled={loading}
          >
            {loading ? (
              <>
                <ActivityIndicator size="small" color={DesignTokens.colors.primary} />
                <Text style={styles.submitButtonText}>Składanie zamówienia...</Text>
              </>
            ) : (
              <>
                <Text style={styles.submitButtonText}>Złóż zamówienie</Text>
                <Ionicons name="checkmark" size={20} color={DesignTokens.colors.primary} />
              </>
            )}
          </GlassButton>
        </View>
      </View>
    );
  };

  const renderChurchModal = () => (
    <Modal
      visible={showChurchModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowChurchModal(false)}
    >
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.modalContainer}>
          <GlassCard style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Wybierz kościół</Text>
              <TouchableOpacity onPress={() => setShowChurchModal(false)}>
                <Ionicons name="close" size={24} color={DesignTokens.colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.churchList} showsVerticalScrollIndicator={false}>
              {churches.map(church => (
                <TouchableOpacity
                  key={church.id}
                  style={[
                    styles.churchItem,
                    {
                      backgroundColor: selectedChurch?.id === church.id 
                        ? DesignTokens.colors.glassSecondary 
                        : 'transparent'
                    }
                  ]}
                  onPress={() => {
                    setSelectedChurch(church);
                    setShowChurchModal(false);
                  }}
                >
                  <View style={styles.churchItemContent}>
                    <View style={styles.churchItemLeft}>
                      <Text style={styles.churchItemName}>{church.name}</Text>
                      <Text style={styles.churchItemAddress}>
                        {church.address}, {church.city}
                      </Text>
                      <Text style={styles.churchItemPriest}>
                        Proboszcz: {church.priest}
                      </Text>
                      <Text style={styles.churchItemDistance}>
                        📍 {church.distance}
                      </Text>
                      
                      <View style={styles.churchItemHours}>
                        <Text style={styles.churchItemHoursLabel}>Msze Święte:</Text>
                        <Text style={styles.churchItemHoursText}>
                          {church.massHours.join(', ')}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.churchItemRight}>
                      {selectedChurch?.id === church.id && (
                        <Ionicons name="checkmark-circle" size={24} color={DesignTokens.colors.secondary} />
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </GlassCard>
        </SafeAreaView>
      </View>
    </Modal>
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
        {renderProgressBar()}
        
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </ScrollView>
        
        {/* Date picker */}
        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            minimumDate={new Date()}
            maximumDate={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)} // 1 year ahead
          />
        )}
        
        {renderChurchModal()}
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
  
  // Header
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
  
  headerIcon: {
    marginLeft: DesignTokens.spacing.md,
  },
  
  // Progress bar
  progressCard: {
    marginHorizontal: DesignTokens.spacing.md,
    marginBottom: DesignTokens.spacing.lg,
  },
  
  progressSteps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: DesignTokens.spacing.md,
  },
  
  progressStep: {
    alignItems: 'center',
    flex: 1,
  },
  
  progressDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DesignTokens.spacing.xs,
  },
  
  progressLabel: {
    fontSize: DesignTokens.typography.sizes.xs,
    textAlign: 'center',
  },
  
  progressBarContainer: {
    height: 4,
    backgroundColor: DesignTokens.colors.glassWhite,
    borderRadius: 2,
    position: 'relative',
  },
  
  progressBarBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: DesignTokens.colors.glassWhite,
    borderRadius: 2,
  },
  
  progressBarFill: {
    height: '100%',
    backgroundColor: DesignTokens.colors.secondary,
    borderRadius: 2,
  },
  
  // Content
  content: {
    flex: 1,
  },
  
  scrollContent: {
    paddingHorizontal: DesignTokens.spacing.md,
    paddingBottom: DesignTokens.spacing.xl,
  },
  
  stepContainer: {
    marginBottom: DesignTokens.spacing.lg,
  },
  
  stepTitle: {
    fontWeight: DesignTokens.typography.weights.bold,
    color: DesignTokens.colors.secondary,
    marginBottom: DesignTokens.spacing.lg,
  },
  
  // Mass type selection
  massTypeContainer: {
    marginBottom: DesignTokens.spacing.md,
  },
  
  massTypeCard: {
    position: 'relative',
    padding: DesignTokens.spacing.lg,
  },
  
  popularBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: DesignTokens.colors.error,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: DesignTokens.radius.sm,
  },
  
  popularText: {
    color: 'white',
    fontSize: 10,
    fontWeight: DesignTokens.typography.weights.bold,
  },
  
  massTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DesignTokens.spacing.sm,
  },
  
  massTypeEmoji: {
    fontSize: 32,
    marginRight: DesignTokens.spacing.md,
  },
  
  massTypeInfo: {
    flex: 1,
  },
  
  massTypeName: {
    fontSize: DesignTokens.typography.sizes.lg,
    fontWeight: DesignTokens.typography.weights.semibold,
    color: DesignTokens.colors.text,
  },
  
  massTypeDuration: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.secondary,
    marginTop: 2,
  },
  
  massTypePrice: {
    fontSize: DesignTokens.typography.sizes.xl,
    fontWeight: DesignTokens.typography.weights.bold,
    color: DesignTokens.colors.secondary,
  },
  
  massTypeDescription: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.text,
    opacity: 0.8,
    lineHeight: 20,
  },
  
  selectedIndicator: {
    position: 'absolute',
    bottom: 8,
    right: 8,
  },
  
  // Form inputs
  inputSection: {
    marginBottom: DesignTokens.spacing.lg,
  },
  
  inputLabel: {
    fontSize: DesignTokens.typography.sizes.md,
    fontWeight: DesignTokens.typography.weights.medium,
    color: DesignTokens.colors.secondary,
    marginBottom: DesignTokens.spacing.sm,
  },
  
  textInput: {
    backgroundColor: DesignTokens.colors.glassWhite,
    borderRadius: DesignTokens.radius.md,
    padding: DesignTokens.spacing.md,
    color: DesignTokens.colors.text,
    fontSize: DesignTokens.typography.sizes.md,
    borderWidth: 1,
    borderColor: DesignTokens.colors.glassWhite,
    minHeight: 48,
  },
  
  inputSpacing: {
    marginTop: DesignTokens.spacing.sm,
  },
  
  charCount: {
    fontSize: DesignTokens.typography.sizes.xs,
    color: DesignTokens.colors.text,
    opacity: 0.6,
    textAlign: 'right',
    marginTop: DesignTokens.spacing.xs,
  },
  
  // Date button
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DesignTokens.colors.glassWhite,
    borderRadius: DesignTokens.radius.md,
    padding: DesignTokens.spacing.md,
    borderWidth: 1,
    borderColor: DesignTokens.colors.glassWhite,
  },
  
  dateText: {
    flex: 1,
    color: DesignTokens.colors.text,
    fontSize: DesignTokens.typography.sizes.md,
    marginLeft: DesignTokens.spacing.sm,
  },
  
  // Church selection
  churchButton: {
    backgroundColor: DesignTokens.colors.glassWhite,
    borderRadius: DesignTokens.radius.md,
    padding: DesignTokens.spacing.md,
    borderWidth: 1,
    borderColor: DesignTokens.colors.glassWhite,
  },
  
  churchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  churchMain: {
    flex: 1,
  },
  
  churchName: {
    color: DesignTokens.colors.text,
    fontSize: DesignTokens.typography.sizes.md,
    fontWeight: DesignTokens.typography.weights.medium,
  },
  
  churchAddress: {
    color: DesignTokens.colors.text,
    fontSize: DesignTokens.typography.sizes.sm,
    opacity: 0.8,
    marginTop: 2,
  },
  
  churchDistance: {
    color: DesignTokens.colors.secondary,
    fontSize: DesignTokens.typography.sizes.sm,
    marginTop: 4,
  },
  
  churchPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  churchPlaceholderText: {
    color: DesignTokens.colors.text,
    opacity: 0.6,
    marginLeft: DesignTokens.spacing.sm,
  },
  
  // Step buttons
  stepButtons: {
    flexDirection: 'row',
    gap: DesignTokens.spacing.md,
    marginTop: DesignTokens.spacing.xl,
  },
  
  backStepButton: {
    flex: 1,
  },
  
  nextStepButton: {
    flex: 2,
  },
  
  submitButton: {
    flex: 2,
  },
  
  nextButton: {
    marginTop: DesignTokens.spacing.xl,
    gap: DesignTokens.spacing.sm,
  },
  
  nextButtonText: {
    color: DesignTokens.colors.primary,
    fontSize: DesignTokens.typography.sizes.md,
    fontWeight: DesignTokens.typography.weights.semibold,
  },
  
  backStepButtonText: {
    color: DesignTokens.colors.secondary,
    fontSize: DesignTokens.typography.sizes.md,
    fontWeight: DesignTokens.typography.weights.medium,
  },
  
  submitButtonText: {
    color: DesignTokens.colors.primary,
    fontSize: DesignTokens.typography.sizes.md,
    fontWeight: DesignTokens.typography.weights.semibold,
  },
  
  // Summary
  summaryCard: {
    marginBottom: DesignTokens.spacing.lg,
  },
  
  summaryTitle: {
    fontSize: DesignTokens.typography.sizes.lg,
    fontWeight: DesignTokens.typography.weights.semibold,
    color: DesignTokens.colors.secondary,
    marginBottom: DesignTokens.spacing.md,
  },
  
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: DesignTokens.spacing.sm,
  },
  
  summaryLabel: {
    color: DesignTokens.colors.text,
    fontSize: DesignTokens.typography.sizes.sm,
    opacity: 0.8,
    flex: 1,
  },
  
  summaryValue: {
    color: DesignTokens.colors.text,
    fontSize: DesignTokens.typography.sizes.sm,
    fontWeight: DesignTokens.typography.weights.medium,
    flex: 1,
    textAlign: 'right',
  },
  
  summaryPrice: {
    color: DesignTokens.colors.secondary,
    fontSize: DesignTokens.typography.sizes.sm,
    fontWeight: DesignTokens.typography.weights.medium,
  },
  
  summaryDivider: {
    height: 1,
    backgroundColor: DesignTokens.colors.glassWhite,
    marginVertical: DesignTokens.spacing.md,
  },
  
  summaryTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: DesignTokens.spacing.sm,
    paddingTop: DesignTokens.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: DesignTokens.colors.glassWhite,
  },
  
  summaryTotalLabel: {
    color: DesignTokens.colors.secondary,
    fontSize: DesignTokens.typography.sizes.lg,
    fontWeight: DesignTokens.typography.weights.bold,
  },
  
  summaryTotalValue: {
    color: DesignTokens.colors.secondary,
    fontSize: DesignTokens.typography.sizes.xl,
    fontWeight: DesignTokens.typography.weights.bold,
  },
  
  // Payment section
  paymentSection: {
    marginBottom: DesignTokens.spacing.lg,
  },
  
  paymentTitle: {
    fontSize: DesignTokens.typography.sizes.lg,
    fontWeight: DesignTokens.typography.weights.semibold,
    color: DesignTokens.colors.secondary,
    marginBottom: DesignTokens.spacing.md,
  },
  
  // Quick payment section
  quickPaymentSection: {
    marginBottom: DesignTokens.spacing.lg,
  },
  
  quickPaymentTitle: {
    fontSize: DesignTokens.typography.sizes.md,
    fontWeight: DesignTokens.typography.weights.semibold,
    color: DesignTokens.colors.success,
    marginBottom: DesignTokens.spacing.md,
  },
  
  quickPaymentGrid: {
    flexDirection: 'row',
    gap: DesignTokens.spacing.sm,
  },
  
  quickPaymentMethod: {
    flex: 1,
    alignItems: 'center',
    padding: DesignTokens.spacing.md,
    borderRadius: DesignTokens.radius.md,
    borderWidth: 2,
    position: 'relative',
    minHeight: 80,
    justifyContent: 'center',
  },
  
  quickPaymentName: {
    color: DesignTokens.colors.text,
    fontSize: DesignTokens.typography.sizes.xs,
    fontWeight: DesignTokens.typography.weights.medium,
    textAlign: 'center',
    marginTop: DesignTokens.spacing.xs,
  },
  
  recommendedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: DesignTokens.colors.success,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  
  recommendedText: {
    color: 'white',
    fontSize: 8,
    fontWeight: DesignTokens.typography.weights.bold,
  },
  
  selectedQuickBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
  },
  
  // Standard payment section
  standardPaymentSection: {
    marginBottom: DesignTokens.spacing.md,
  },
  
  standardPaymentTitle: {
    fontSize: DesignTokens.typography.sizes.md,
    fontWeight: DesignTokens.typography.weights.medium,
    color: DesignTokens.colors.text,
    marginBottom: DesignTokens.spacing.md,
    opacity: 0.8,
  },
  
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DesignTokens.spacing.md,
    borderRadius: DesignTokens.radius.md,
    borderWidth: 1,
    marginBottom: DesignTokens.spacing.sm,
  },
  
  paymentMethodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  paymentMethodInfo: {
    marginLeft: DesignTokens.spacing.md,
    flex: 1,
  },
  
  paymentMethodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing.xs,
  },
  
  paymentMethodName: {
    color: DesignTokens.colors.text,
    fontSize: DesignTokens.typography.sizes.md,
    fontWeight: DesignTokens.typography.weights.medium,
  },
  
  paymentMethodDesc: {
    color: DesignTokens.colors.text,
    fontSize: DesignTokens.typography.sizes.sm,
    opacity: 0.8,
    marginTop: 2,
  },
  
  paymentMethodRight: {
    alignItems: 'flex-end',
  },
  
  paymentFee: {
    color: DesignTokens.colors.warning,
    fontSize: DesignTokens.typography.sizes.sm,
    marginBottom: 4,
  },
  
  popularPaymentBadge: {
    backgroundColor: DesignTokens.colors.warning,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  
  popularPaymentText: {
    color: 'white',
    fontSize: 9,
    fontWeight: DesignTokens.typography.weights.bold,
  },
  
  slowPaymentBadge: {
    backgroundColor: DesignTokens.colors.error,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  
  slowPaymentText: {
    color: 'white',
    fontSize: 9,
    fontWeight: DesignTokens.typography.weights.bold,
  },
  
  // Payment security
  paymentSecurityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DesignTokens.spacing.sm,
    backgroundColor: DesignTokens.colors.glassWhite,
    borderRadius: DesignTokens.radius.sm,
    marginTop: DesignTokens.spacing.md,
  },
  
  paymentSecurityText: {
    color: DesignTokens.colors.text,
    fontSize: DesignTokens.typography.sizes.xs,
    marginLeft: DesignTokens.spacing.xs,
    flex: 1,
    opacity: 0.8,
    lineHeight: 16,
  },
  
  // Church modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  
  modalContent: {
    maxHeight: '80%',
    marginHorizontal: DesignTokens.spacing.md,
    marginBottom: DesignTokens.spacing.md,
  },
  
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DesignTokens.spacing.lg,
  },
  
  modalTitle: {
    fontSize: DesignTokens.typography.sizes.lg,
    fontWeight: DesignTokens.typography.weights.bold,
    color: DesignTokens.colors.secondary,
  },
  
  churchList: {
    maxHeight: 400,
  },
  
  churchItem: {
    borderRadius: DesignTokens.radius.md,
    marginBottom: DesignTokens.spacing.sm,
  },
  
  churchItemContent: {
    flexDirection: 'row',
    padding: DesignTokens.spacing.md,
  },
  
  churchItemLeft: {
    flex: 1,
  },
  
  churchItemName: {
    fontSize: DesignTokens.typography.sizes.md,
    fontWeight: DesignTokens.typography.weights.semibold,
    color: DesignTokens.colors.text,
    marginBottom: 4,
  },
  
  churchItemAddress: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.text,
    opacity: 0.8,
    marginBottom: 4,
  },
  
  churchItemPriest: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.secondary,
    marginBottom: 4,
  },
  
  churchItemDistance: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.info,
    marginBottom: 8,
  },
  
  churchItemHours: {
    marginTop: 4,
  },
  
  churchItemHoursLabel: {
    fontSize: DesignTokens.typography.sizes.xs,
    color: DesignTokens.colors.text,
    opacity: 0.6,
    marginBottom: 2,
  },
  
  churchItemHoursText: {
    fontSize: DesignTokens.typography.sizes.xs,
    color: DesignTokens.colors.secondary,
  },
  
  churchItemRight: {
    justifyContent: 'center',
    marginLeft: DesignTokens.spacing.md,
  },
});