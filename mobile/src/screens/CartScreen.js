// mobile/src/screens/CartScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabase';

export default function CartScreen({ navigation }) {
  const [cartItems, setCartItems] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [discountCode, setDiscountCode] = useState('');
  const [discount, setDiscount] = useState(null);
  const [shippingMethod, setShippingMethod] = useState(null);
  const [shippingMethods, setShippingMethods] = useState([]);

  useEffect(() => {
    loadCart();
    fetchShippingMethods();
  }, []);

  const loadCart = async () => {
    try {
      const savedCart = await AsyncStorage.getItem('oremus_cart');
      if (savedCart) {
        const items = JSON.parse(savedCart);
        setCartItems(items);
        
        // Initialize quantities
        const initialQuantities = {};
        items.forEach(item => {
          initialQuantities[item.id] = item.quantity || 1;
        });
        setQuantities(initialQuantities);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  };

  const fetchShippingMethods = async () => {
    try {
      const { data, error } = await supabase
        .from('shipping_methods')
        .select('*')
        .eq('is_active', true)
        .order('price');

      if (data && data.length > 0) {
        setShippingMethods(data);
        setShippingMethod(data[0]);
      } else {
        // Fallback shipping methods
        const fallbackMethods = [
          {
            id: '1',
            name: 'Kurier DPD',
            description: 'Dostawa kurierska do drzwi',
            price: 15.00,
            free_from: 100.00,
            estimated_days: '2-3 dni robocze'
          },
          {
            id: '2',
            name: 'Paczkomat InPost',
            description: 'Odbiór w paczkomacie',
            price: 12.00,
            free_from: 100.00,
            estimated_days: '1-2 dni robocze'
          }
        ];
        setShippingMethods(fallbackMethods);
        setShippingMethod(fallbackMethods[0]);
      }
    } catch (error) {
      console.error('Error fetching shipping methods:', error);
    }
  };

  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    
    setQuantities(prev => ({ ...prev, [itemId]: newQuantity }));
    
    const updatedCart = cartItems.map(item => 
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    );
    setCartItems(updatedCart);
    await AsyncStorage.setItem('oremus_cart', JSON.stringify(updatedCart));
  };

  const removeFromCart = async (itemId) => {
    Alert.alert(
      'Usuń z koszyka',
      'Czy na pewno chcesz usunąć ten produkt z koszyka?',
      [
        { text: 'Anuluj', style: 'cancel' },
        { 
          text: 'Usuń', 
          style: 'destructive',
          onPress: async () => {
            const updatedCart = cartItems.filter(item => item.id !== itemId);
            setCartItems(updatedCart);
            
            // Remove from quantities
            const newQuantities = { ...quantities };
            delete newQuantities[itemId];
            setQuantities(newQuantities);
            
            await AsyncStorage.setItem('oremus_cart', JSON.stringify(updatedCart));
          }
        }
      ]
    );
  };

  const applyDiscountCode = async () => {
    if (!discountCode.trim()) return;

    try {
      const { data, error } = await supabase
        .from('discount_codes')
        .select('*')
        .eq('code', discountCode.toUpperCase())
        .eq('is_active', true)
        .single();

      if (error || !data) {
        Alert.alert('Błąd', 'Nieprawidłowy kod rabatowy');
        return;
      }

      // Check validity
      const now = new Date();
      if (data.valid_from && new Date(data.valid_from) > now) {
        Alert.alert('Błąd', 'Ten kod rabatowy nie jest jeszcze aktywny');
        return;
      }
      if (data.valid_until && new Date(data.valid_until) < now) {
        Alert.alert('Błąd', 'Ten kod rabatowy wygasł');
        return;
      }
      if (data.usage_limit && data.used_count >= data.usage_limit) {
        Alert.alert('Błąd', 'Ten kod rabatowy został już wykorzystany');
        return;
      }
      if (data.min_order_amount && getSubtotal() < data.min_order_amount) {
        Alert.alert('Błąd', `Minimalna kwota zamówienia dla tego kodu to ${data.min_order_amount} zł`);
        return;
      }

      setDiscount(data);
      Alert.alert('Sukces! 🎉', 'Kod rabatowy został zastosowany');
    } catch (error) {
      console.error('Error applying discount:', error);
      Alert.alert('Błąd', 'Nie udało się zastosować kodu rabatowego');
    }
  };

  const getSubtotal = () => {
    return cartItems.reduce((sum, item) => 
      sum + (item.price * (quantities[item.id] || 1)), 0
    );
  };

  const getDiscountAmount = () => {
    if (!discount) return 0;
    
    const subtotal = getSubtotal();
    if (discount.discount_type === 'percentage') {
      return (subtotal * discount.discount_value) / 100;
    } else {
      return Math.min(discount.discount_value, subtotal);
    }
  };

  const getShippingPrice = () => {
    if (!shippingMethod) return 0;
    
    const subtotal = getSubtotal() - getDiscountAmount();
    if (shippingMethod.free_from && subtotal >= shippingMethod.free_from) {
      return 0;
    }
    return shippingMethod.price;
  };

  const getTotal = () => {
    return getSubtotal() - getDiscountAmount() + getShippingPrice();
  };

  const proceedToCheckout = () => {
    if (cartItems.length === 0) {
      Alert.alert('Błąd', 'Koszyk jest pusty');
      return;
    }

    const checkoutData = {
      items: cartItems.map(item => ({
        ...item,
        quantity: quantities[item.id] || 1
      })),
      subtotal: getSubtotal(),
      discount: discount,
      discountAmount: getDiscountAmount(),
      shippingMethod: shippingMethod,
      shippingPrice: getShippingPrice(),
      total: getTotal()
    };

    navigation.navigate('Checkout', { checkoutData });
  };

  const getSizeIcon = (size) => {
    switch (size) {
      case 'small': return '🕯️';
      case 'medium': return '🕯️🕯️';
      case 'large': return '🕯️🕯️🕯️';
      default: return '🕯️';
    }
  };

  const renderCartItem = (item) => {
    const quantity = quantities[item.id] || 1;
    const itemTotal = item.price * quantity;

    return (
      <View key={item.id} style={styles.cartItem}>
        <View style={styles.itemImage}>
          <Text style={styles.itemEmoji}>{getSizeIcon(item.size)}</Text>
          <Text style={styles.itemSize}>{item.size.toUpperCase()}</Text>
        </View>
        
        <View style={styles.itemDetails}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemSpecs}>{item.duration_hours}h palenia</Text>
          
          <View style={styles.quantityContainer}>
            <TouchableOpacity 
              style={styles.quantityButton}
              onPress={() => updateQuantity(item.id, quantity - 1)}
            >
              <Text style={styles.quantityButtonText}>−</Text>
            </TouchableOpacity>
            
            <Text style={styles.quantity}>{quantity}</Text>
            
            <TouchableOpacity 
              style={styles.quantityButton}
              onPress={() => updateQuantity(item.id, quantity + 1)}
            >
              <Text style={styles.quantityButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.itemPriceContainer}>
          <Text style={styles.itemPrice}>{itemTotal.toFixed(2)} zł</Text>
          <TouchableOpacity onPress={() => removeFromCart(item.id)}>
            <Text style={styles.removeButton}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (cartItems.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Powrót</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Koszyk</Text>
        </View>
        
        <View style={styles.emptyCart}>
          <Text style={styles.emptyCartIcon}>🛒</Text>
          <Text style={styles.emptyCartText}>Twój koszyk jest pusty</Text>
          <Text style={styles.emptyCartSubtext}>
            Dodaj świece OREMUS, aby kontynuować zakupy
          </Text>
          <TouchableOpacity 
            style={styles.shopButton}
            onPress={() => navigation.navigate('CandleShop')}
          >
            <Text style={styles.shopButtonText}>Przejdź do sklepu</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Powrót</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Koszyk ({cartItems.length})</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.itemsList}>
          {cartItems.map(item => renderCartItem(item))}
        </View>

        <View style={styles.discountSection}>
          <Text style={styles.sectionTitle}>Kod rabatowy</Text>
          <View style={styles.discountInput}>
            <TextInput
              style={styles.discountTextInput}
              placeholder="Wpisz kod (np. OREMUS2024)"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={discountCode}
              onChangeText={setDiscountCode}
              autoCapitalize="characters"
            />
            <TouchableOpacity 
              style={styles.applyButton}
              onPress={applyDiscountCode}
            >
              <Text style={styles.applyButtonText}>Zastosuj</Text>
            </TouchableOpacity>
          </View>
          {discount && (
            <Text style={styles.discountApplied}>
              ✅ Zastosowano kod: {discount.code} 
              (-{discount.discount_type === 'percentage' ? `${discount.discount_value}%` : `${discount.discount_value} zł`})
            </Text>
          )}
        </View>

        <View style={styles.shippingSection}>
          <Text style={styles.sectionTitle}>Metoda dostawy</Text>
          {shippingMethods.map(method => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.shippingOption,
                shippingMethod?.id === method.id && styles.shippingOptionActive
              ]}
              onPress={() => setShippingMethod(method)}
            >
              <View style={styles.shippingInfo}>
                <Text style={styles.shippingName}>{method.name}</Text>
                <Text style={styles.shippingTime}>{method.estimated_days}</Text>
              </View>
              <Text style={styles.shippingPrice}>
                {method.free_from && getSubtotal() - getDiscountAmount() >= method.free_from
                  ? 'GRATIS'
                  : `${method.price.toFixed(2)} zł`
                }
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Wartość produktów:</Text>
            <Text style={styles.summaryValue}>{getSubtotal().toFixed(2)} zł</Text>
          </View>
          
          {discount && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Rabat:</Text>
              <Text style={[styles.summaryValue, styles.discountValue]}>
                -{getDiscountAmount().toFixed(2)} zł
              </Text>
            </View>
          )}
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Dostawa:</Text>
            <Text style={styles.summaryValue}>
              {getShippingPrice() === 0 ? 'GRATIS' : `${getShippingPrice().toFixed(2)} zł`}
            </Text>
          </View>
          
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Do zapłaty:</Text>
            <Text style={styles.totalValue}>{getTotal().toFixed(2)} zł</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.checkoutButton}
          onPress={proceedToCheckout}
        >
          <Text style={styles.checkoutButtonText}>
            Przejdź do płatności - {getTotal().toFixed(2)} zł
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
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
  },
  backButton: {
    color: '#FFD700',
    fontSize: 16,
    marginRight: 20,
  },
  headerTitle: {
    color: '#FFD700',
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  emptyCart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyCartIcon: {
    fontSize: 100,
    marginBottom: 20,
  },
  emptyCartText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  emptyCartSubtext: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 30,
  },
  shopButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  shopButtonText: {
    color: '#1a237e',
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemsList: {
    padding: 20,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
  },
  itemImage: {
    alignItems: 'center',
    marginRight: 15,
  },
  itemEmoji: {
    fontSize: 40,
  },
  itemSize: {
    backgroundColor: '#FFD700',
    color: '#1a237e',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 5,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  itemSpecs: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 10,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 30,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  quantity: {
    color: '#fff',
    fontSize: 16,
    marginHorizontal: 15,
  },
  itemPriceContainer: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  itemPrice: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
  },
  removeButton: {
    fontSize: 20,
    marginTop: 10,
  },
  discountSection: {
    padding: 20,
  },
  sectionTitle: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  discountInput: {
    flexDirection: 'row',
    gap: 10,
  },
  discountTextInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
    color: '#fff',
    fontSize: 16,
  },
  applyButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 25,
    borderRadius: 10,
    justifyContent: 'center',
  },
  applyButtonText: {
    color: '#1a237e',
    fontSize: 16,
    fontWeight: 'bold',
  },
  discountApplied: {
    color: '#4CAF50',
    fontSize: 14,
    marginTop: 10,
  },
  shippingSection: {
    padding: 20,
  },
  shippingOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  shippingOptionActive: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  shippingInfo: {
    flex: 1,
  },
  shippingName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  shippingTime: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.7,
    marginTop: 5,
  },
  shippingPrice: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
  },
  summarySection: {
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    color: '#fff',
    fontSize: 16,
  },
  summaryValue: {
    color: '#fff',
    fontSize: 16,
  },
  discountValue: {
    color: '#4CAF50',
  },
  totalRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  totalLabel: {
    color: '#FFD700',
    fontSize: 20,
    fontWeight: 'bold',
  },
  totalValue: {
    color: '#FFD700',
    fontSize: 24,
    fontWeight: 'bold',
  },
  checkoutButton: {
    backgroundColor: '#FFD700',
    margin: 20,
    padding: 18,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 40,
  },
  checkoutButtonText: {
    color: '#1a237e',
    fontSize: 18,
    fontWeight: 'bold',
  },
});