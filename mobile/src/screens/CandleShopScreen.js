// mobile/src/screens/CandleShopScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabase';

export default function CandleShopScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    fetchProducts();
    loadCartCount();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('candle_products')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      // Fallback data if database fails
      setProducts([
        {
          id: '1',
          name: 'Świeca OREMUS Mała',
          size: 'small',
          duration_hours: 48,
          price: 29.99,
          description: 'Idealna do codziennej modlitwy. Zapach lawendy i białego piżma. Czas palenia: 48 godzin.',
          height_cm: 10,
          diameter_cm: 7,
          weight_g: 200
        },
        {
          id: '2',
          name: 'Świeca OREMUS Średnia',
          size: 'medium',
          duration_hours: 120,
          price: 49.99,
          description: 'Doskonała na dłuższe modlitwy i nowenny. Zapach lawendy i białego piżma. Czas palenia: 120 godzin.',
          height_cm: 15,
          diameter_cm: 8,
          weight_g: 400
        },
        {
          id: '3',
          name: 'Świeca OREMUS Duża',
          size: 'large',
          duration_hours: 240,
          price: 79.99,
          description: 'Świeca na specjalne intencje i długie czuwania modlitewne. Zapach lawendy i białego piżma. Czas palenia: 240 godzin.',
          height_cm: 20,
          diameter_cm: 10,
          weight_g: 700
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadCartCount = async () => {
    try {
      const savedCart = await AsyncStorage.getItem('oremus_cart');
      if (savedCart) {
        const items = JSON.parse(savedCart);
        const count = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
        setCartCount(count);
      }
    } catch (error) {
      console.error('Error loading cart count:', error);
    }
  };

  const addToCart = async (product) => {
    try {
      const savedCart = await AsyncStorage.getItem('oremus_cart');
      let cart = savedCart ? JSON.parse(savedCart) : [];
      
      const existingItem = cart.find(item => item.id === product.id);
      if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 1) + 1;
      } else {
        cart.push({ ...product, quantity: 1 });
      }
      
      await AsyncStorage.setItem('oremus_cart', JSON.stringify(cart));
      loadCartCount();
      
      Alert.alert(
        'Dodano do koszyka! 🛒',
        `${product.name} została dodana do koszyka`,
        [
          { text: 'Kontynuuj zakupy', style: 'cancel' },
          { text: 'Przejdź do koszyka', onPress: () => navigation.navigate('Cart') }
        ]
      );
    } catch (error) {
      Alert.alert('Błąd', 'Nie udało się dodać do koszyka');
    }
  };

  const getSizeIcon = (size) => {
    switch (size) {
      case 'small': return '🕯️';
      case 'medium': return '🕯️🕯️';
      case 'large': return '🕯️🕯️🕯️';
      default: return '🕯️';
    }
  };

  const getSizeIndicator = (size) => {
    switch (size) {
      case 'small': return 'S';
      case 'medium': return 'M';
      case 'large': return 'L';
      default: return 'S';
    }
  };

  const renderProduct = (product) => {
    const isSelected = selectedProduct?.id === product.id;
    
    return (
      <TouchableOpacity
        key={product.id}
        style={[styles.productCard, isSelected && styles.productCardSelected]}
        onPress={() => setSelectedProduct(product)}
      >
        <View style={styles.productImageContainer}>
          <Text style={styles.productEmoji}>{getSizeIcon(product.size)}</Text>
          <Text style={styles.sizeIndicator}>{getSizeIndicator(product.size)}</Text>
        </View>
        
        <Text style={styles.productName}>{product.name}</Text>
        
        <View style={styles.productSpecs}>
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>Wysokość</Text>
            <Text style={styles.specValue}>{product.height_cm} cm</Text>
          </View>
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>Czas palenia</Text>
            <Text style={styles.specValue}>{product.duration_hours}h</Text>
          </View>
        </View>
        
        <Text style={styles.productPrice}>{product.price} zł</Text>
        
        <TouchableOpacity 
          style={styles.addToCartButton}
          onPress={() => addToCart(product)}
        >
          <Text style={styles.addToCartText}>Dodaj do koszyka</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Powrót</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sklep Świec OREMUS</Text>
        </View>
        <ActivityIndicator size="large" color="#FFD700" style={styles.loader} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Powrót</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sklep Świec OREMUS</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Cart')}>
          <Text style={styles.cartButton}>🛒 ({cartCount})</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Święte Świece OREMUS</Text>
          <Text style={styles.heroSubtitle}>
            Każda świeca wyposażona w chip NFC{'\n'}
            łączący świat fizyczny z duchowym
          </Text>
        </View>

        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Dlaczego nasze świece?</Text>
          
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🌿</Text>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Naturalny wosk</Text>
                <Text style={styles.featureDescription}>
                  100% naturalny wosk sojowy z domieszką wosku pszczelego
                </Text>
              </View>
            </View>
            
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🌸</Text>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Święty zapach</Text>
                <Text style={styles.featureDescription}>
                  Lawenda i białe piżmo - kompozycja wspierająca modlitwę i medytację
                </Text>
              </View>
            </View>
            
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>📱</Text>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Technologia NFC</Text>
                <Text style={styles.featureDescription}>
                  Wbudowany chip łączy świecę z aplikacją i globalną wspólnotą modlitwy
                </Text>
              </View>
            </View>
            
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>✨</Text>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Błogosławieństwo</Text>
                <Text style={styles.featureDescription}>
                  Każda świeca jest pobłogosławiona przed wysyłką
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.productsSection}>
          <Text style={styles.sectionTitle}>Wybierz rozmiar</Text>
          <View style={styles.productsGrid}>
            {products.map(product => renderProduct(product))}
          </View>
        </View>

        {selectedProduct && (
          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>Szczegóły produktu</Text>
            <Text style={styles.productDescription}>{selectedProduct.description}</Text>
            
            <View style={styles.specsList}>
              <View style={styles.specsRow}>
                <Text style={styles.specsLabel}>Wymiary:</Text>
                <Text style={styles.specsValue}>
                  {selectedProduct.height_cm} x {selectedProduct.diameter_cm} cm
                </Text>
              </View>
              <View style={styles.specsRow}>
                <Text style={styles.specsLabel}>Waga:</Text>
                <Text style={styles.specsValue}>{selectedProduct.weight_g}g</Text>
              </View>
              <View style={styles.specsRow}>
                <Text style={styles.specsLabel}>Czas palenia:</Text>
                <Text style={styles.specsValue}>{selectedProduct.duration_hours} godzin</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Jak to działa?</Text>
          <Text style={styles.infoText}>
            1. Zamów świecę OREMUS{'\n'}
            2. Odbierz przesyłkę i zapal świecę{'\n'}
            3. Otwórz aplikację i zbliż telefon{'\n'}
            4. Dołącz do globalnej wspólnoty modlitwy
          </Text>
        </View>

        <View style={styles.shippingInfo}>
          <Text style={styles.shippingTitle}>📦 Dostawa</Text>
          <Text style={styles.shippingText}>
            Darmowa dostawa przy zamówieniu powyżej 100 zł{'\n'}
            Czas dostawy: 2-3 dni robocze{'\n'}
            Płatność: Przelew, BLIK, karta płatnicza
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.cartSummaryButton}
          onPress={() => navigation.navigate('Cart')}
        >
          <Text style={styles.cartSummaryText}>
            🛒 Koszyk ({cartCount} {cartCount === 1 ? 'produkt' : 'produktów'})
          </Text>
        </TouchableOpacity>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
  },
  backButton: {
    color: '#FFD700',
    fontSize: 16,
  },
  headerTitle: {
    color: '#FFD700',
    fontSize: 20,
    fontWeight: 'bold',
  },
  cartButton: {
    color: '#FFD700',
    fontSize: 18,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  heroSection: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  heroTitle: {
    color: '#FFD700',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  heroSubtitle: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 24,
  },
  featuresSection: {
    padding: 20,
  },
  sectionTitle: {
    color: '#FFD700',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  featuresList: {
    gap: 20,
  },
  featureItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  featureIcon: {
    fontSize: 30,
    marginRight: 15,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  featureDescription: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.8,
    lineHeight: 20,
  },
  productsSection: {
    padding: 20,
  },
  productsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  productCard: {
    width: '31%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  productCardSelected: {
    borderWidth: 2,
    borderColor: '#FFD700',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  productImageContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  productEmoji: {
    fontSize: 50,
  },
  sizeIndicator: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: '#FFD700',
    color: '#1a237e',
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  productName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  productSpecs: {
    marginBottom: 10,
  },
  specItem: {
    alignItems: 'center',
    marginBottom: 5,
  },
  specLabel: {
    color: '#fff',
    fontSize: 10,
    opacity: 0.7,
  },
  specValue: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: 'bold',
  },
  productPrice: {
    color: '#FFD700',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  addToCartButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
  },
  addToCartText: {
    color: '#1a237e',
    fontSize: 12,
    fontWeight: 'bold',
  },
  detailsSection: {
    padding: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  productDescription: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  specsList: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 10,
    padding: 15,
  },
  specsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  specsLabel: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.8,
  },
  specsValue: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
  },
  infoSection: {
    padding: 20,
  },
  infoTitle: {
    color: '#FFD700',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  infoText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 26,
  },
  shippingInfo: {
    margin: 20,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
  },
  shippingTitle: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  shippingText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 22,
  },
  cartSummaryButton: {
    backgroundColor: '#FFD700',
    margin: 20,
    padding: 18,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 40,
  },
  cartSummaryText: {
    color: '#1a237e',
    fontSize: 18,
    fontWeight: 'bold',
  },
});