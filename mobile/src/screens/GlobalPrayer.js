// mobile/src/screens/GlobalPrayer.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  Animated,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';

export default function GlobalPrayer({ navigation, route }) {
  const { candleId, location, source } = route.params;
  const [intentions, setIntentions] = useState([]);
  const [newIntention, setNewIntention] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isPraying, setIsPraying] = useState(false);
  const [prayerCount, setPrayerCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [flameAnimations] = useState({});

  useEffect(() => {
    loadIntentions();
    loadPrayerCount();
    
    // Aktualizuj dane co 15 sekund
    const interval = setInterval(() => {
      loadIntentions();
      loadPrayerCount();
    }, 15000);
    
    return () => clearInterval(interval);
  }, []);

  const loadIntentions = async () => {
    try {
      const { data } = await supabase
        .from('prayer_intentions')
        .select(`
          *,
          profiles(full_name)
        `)
        .eq('candle_id', candleId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      setIntentions(data || []);
      
      // Inicjalizuj animacje dla nowych intencji
      data?.forEach(intention => {
        if (!flameAnimations[intention.id]) {
          flameAnimations[intention.id] = new Animated.Value(1);
          startFlameAnimation(intention.id);
        }
      });
    } catch (error) {
      console.error('Error loading intentions:', error);
    }
  };

  const loadPrayerCount = async () => {
    try {
      const { data } = await supabase
        .from('active_prayers')
        .select('*')
        .eq('candle_id', candleId)
        .gte('started_at', new Date(Date.now() - 30 * 60 * 1000).toISOString()); // ostatnie 30 minut

      setPrayerCount(data?.length || 0);
    } catch (error) {
      console.error('Error loading prayer count:', error);
    }
  };

  const startFlameAnimation = (intentionId) => {
    if (!flameAnimations[intentionId]) return;
    
    Animated.loop(
      Animated.sequence([
        Animated.timing(flameAnimations[intentionId], {
          toValue: 1.2,
          duration: 1000 + Math.random() * 500,
          useNativeDriver: true,
        }),
        Animated.timing(flameAnimations[intentionId], {
          toValue: 0.8,
          duration: 1000 + Math.random() * 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const addIntention = async () => {
    if (!newIntention.trim()) {
      Alert.alert('Błąd', 'Proszę wpisać intencję modlitewną');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('prayer_intentions')
        .insert({
          user_id: user.id,
          candle_id: candleId,
          intention: newIntention.trim(),
          location: location,
          is_active: true
        });

      if (error) throw error;

      setNewIntention('');
      setShowAddModal(false);
      loadIntentions();
      
      Alert.alert(
        'Intencja dodana',
        'Twoja intencja została dodana do globalnej modlitwy',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error adding intention:', error);
      Alert.alert('Błąd', 'Nie udało się dodać intencji');
    }
  };

  const joinPrayerForIntention = async (intentionId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Sprawdź czy użytkownik już się modli za tę intencję
      const { data: existing } = await supabase
        .from('intention_prayers')
        .select('*')
        .eq('user_id', user.id)
        .eq('intention_id', intentionId)
        .eq('is_active', true);

      if (existing && existing.length > 0) {
        Alert.alert('Informacja', 'Już modlisz się za tę intencję');
        return;
      }

      // Dodaj modlitwę za intencję
      await supabase
        .from('intention_prayers')
        .insert({
          user_id: user.id,
          intention_id: intentionId,
          candle_id: candleId,
          started_at: new Date().toISOString(),
          is_active: true
        });

      // Zwiększ licznik modlitw za tę intencję
      await supabase
        .from('prayer_intentions')
        .update({ 
          prayer_count: supabase.sql`prayer_count + 1` 
        })
        .eq('id', intentionId);

      Alert.alert(
        'Dołączyłeś do modlitwy',
        'Modlisz się teraz za tę intencję wspólnie z innymi',
        [{ text: 'OK' }]
      );
      
      loadIntentions();
    } catch (error) {
      console.error('Error joining prayer:', error);
      Alert.alert('Błąd', 'Nie udało się dołączyć do modlitwy');
    }
  };

  const startGlobalPrayer = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      setIsPraying(true);
      
      // Rozpocznij sesję modlitwy
      await supabase
        .from('active_prayers')
        .insert({
          user_id: user.id,
          candle_id: candleId,
          prayer_type: 'global_prayer',
          started_at: new Date().toISOString()
        });

      // Po 5 minutach zakończ sesję automatycznie
      setTimeout(async () => {
        setIsPraying(false);
        await supabase
          .from('active_prayers')
          .update({ ended_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .eq('candle_id', candleId)
          .is('ended_at', null);
        
        loadPrayerCount();
      }, 5 * 60 * 1000);
      
      loadPrayerCount();
    } catch (error) {
      console.error('Error starting prayer:', error);
      setIsPraying(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadIntentions(), loadPrayerCount()]);
    setRefreshing(false);
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 1) return 'teraz';
    if (diffMins < 60) return `${diffMins} min temu`;
    if (diffHours < 24) return `${diffHours} godz. temu`;
    return `${Math.floor(diffHours / 24)} dni temu`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFD700" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Globalna Modlitwa</Text>
          <Text style={styles.headerSubtitle}>{location}</Text>
        </View>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={24} color="#FFD700" />
        </TouchableOpacity>
      </View>

      {/* Statystyki */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="people" size={24} color="#FFD700" />
          <Text style={styles.statNumber}>{prayerCount}</Text>
          <Text style={styles.statLabel}>modli się teraz</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="heart" size={24} color="#FFD700" />
          <Text style={styles.statNumber}>{intentions.length}</Text>
          <Text style={styles.statLabel}>aktywnych intencji</Text>
        </View>
      </View>

      {/* Przycisk rozpoczęcia modlitwy */}
      {!isPraying ? (
        <TouchableOpacity style={styles.prayButton} onPress={startGlobalPrayer}>
          <Ionicons name="hands-prayer" size={32} color="#1a237e" />
          <Text style={styles.prayButtonText}>Rozpocznij Modlitwę</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.prayingIndicator}>
          <Ionicons name="flame" size={32} color="#FFD700" />
          <Text style={styles.prayingText}>Modlisz się...</Text>
          <Text style={styles.prayingSubtext}>Twoja modlitwa trwa</Text>
        </View>
      )}

      {/* Lista intencji */}
      <ScrollView 
        style={styles.intentionsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.sectionTitle}>Intencje Modlitewne</Text>
        
        {intentions.map((intention) => (
          <View key={intention.id} style={styles.intentionCard}>
            <View style={styles.intentionHeader}>
              <Animated.View 
                style={[
                  styles.intentionFlame,
                  { 
                    transform: [{ 
                      scale: flameAnimations[intention.id] || new Animated.Value(1) 
                    }] 
                  }
                ]}
              >
                <Ionicons name="flame" size={20} color="#FFD700" />
              </Animated.View>
              <View style={styles.intentionInfo}>
                <Text style={styles.intentionText}>{intention.intention}</Text>
                <Text style={styles.intentionMeta}>
                  {intention.profiles?.full_name || 'Anonim'} • {formatTimeAgo(intention.created_at)}
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.joinButton}
                onPress={() => joinPrayerForIntention(intention.id)}
              >
                <Ionicons name="add-circle" size={24} color="#FFD700" />
              </TouchableOpacity>
            </View>
            
            {intention.prayer_count > 0 && (
              <View style={styles.prayerCount}>
                <Ionicons name="people" size={16} color="#FFD700" />
                <Text style={styles.prayerCountText}>
                  {intention.prayer_count} osób się modli
                </Text>
              </View>
            )}
          </View>
        ))}

        {intentions.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="heart-outline" size={48} color="#FFD700" />
            <Text style={styles.emptyText}>Brak aktywnych intencji</Text>
            <Text style={styles.emptySubtext}>
              Bądź pierwszy i dodaj swoją intencję modlitewną
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Modal dodawania intencji */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Dodaj Intencję</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color="#1a237e" />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.intentionInput}
              placeholder="Wpisz swoją intencję modlitewną..."
              placeholderTextColor="#999"
              value={newIntention}
              onChangeText={setNewIntention}
              multiline
              numberOfLines={4}
              maxLength={200}
            />
            
            <Text style={styles.charCount}>
              {newIntention.length}/200 znaków
            </Text>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>Anuluj</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.addIntentionButton}
                onPress={addIntention}
              >
                <Text style={styles.addIntentionButtonText}>Dodaj</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    marginRight: 15,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    marginTop: 2,
  },
  addButton: {
    marginLeft: 15,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    marginTop: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#fff',
    textAlign: 'center',
    marginTop: 5,
  },
  prayButton: {
    backgroundColor: '#FFD700',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 15,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  prayButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a237e',
    marginLeft: 10,
  },
  prayingIndicator: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
  },
  prayingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    marginTop: 10,
  },
  prayingSubtext: {
    fontSize: 14,
    color: '#fff',
    marginTop: 5,
  },
  intentionsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 15,
  },
  intentionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
  },
  intentionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  intentionFlame: {
    marginRight: 10,
    marginTop: 2,
  },
  intentionInfo: {
    flex: 1,
  },
  intentionText: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 22,
    marginBottom: 5,
  },
  intentionMeta: {
    fontSize: 12,
    color: '#FFD700',
  },
  joinButton: {
    marginLeft: 10,
  },
  prayerCount: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 215, 0, 0.2)',
  },
  prayerCountText: {
    fontSize: 12,
    color: '#FFD700',
    marginLeft: 5,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#FFD700',
    marginTop: 15,
    fontWeight: 'bold',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a237e',
  },
  intentionInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    textAlignVertical: 'top',
    marginBottom: 10,
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    padding: 15,
    marginRight: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#999',
  },
  addIntentionButton: {
    flex: 1,
    padding: 15,
    marginLeft: 10,
    borderRadius: 10,
    backgroundColor: '#1a237e',
    alignItems: 'center',
  },
  addIntentionButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
});