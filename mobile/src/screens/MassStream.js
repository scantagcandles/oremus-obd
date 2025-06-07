// mobile/src/screens/MassStream.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';

const { width, height } = Dimensions.get('window');

export default function MassStream({ navigation, route }) {
  const { candleId, location } = route.params;
  const [isLive, setIsLive] = useState(false);
  const [viewers, setViewers] = useState(0);
  const [massTime, setMassTime] = useState('18:00');
  const [timeUntilMass, setTimeUntilMass] = useState('');
  const [streamQuality, setStreamQuality] = useState('HD');
  const [isLoading, setIsLoading] = useState(false);
  const [participants, setParticipants] = useState([]);

  useEffect(() => {
    checkMassSchedule();
    loadViewers();
    
    const interval = setInterval(() => {
      updateTimeUntilMass();
      loadViewers();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const checkMassSchedule = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Sprawdź czy jest czas Mszy (18:00 - 19:00)
    if (currentHour === 18 || (currentHour === 17 && currentMinute >= 55)) {
      setIsLive(true);
    } else {
      setIsLive(false);
      updateTimeUntilMass();
    }
  };

  const updateTimeUntilMass = () => {
    const now = new Date();
    const today = new Date();
    today.setHours(18, 0, 0, 0);
    
    let nextMass = today;
    if (now > today) {
      nextMass = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    }
    
    const diff = nextMass.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      setTimeUntilMass(`${hours}h ${minutes}min`);
    } else {
      setTimeUntilMass(`${minutes} minut`);
    }
  };

  const loadViewers = async () => {
    try {
      if (isLive) {
        // Symulacja liczby oglądających (w prawdziwej aplikacji z API)
        const randomViewers = Math.floor(Math.random() * 200) + 50;
        setViewers(randomViewers);
        
        // Symulacja uczestników
        const sampleParticipants = [
          { id: 1, name: 'Maria K.', location: 'Warszawa' },
          { id: 2, name: 'Jan P.', location: 'Kraków' },
          { id: 3, name: 'Anna S.', location: 'Gdańsk' },
          { id: 4, name: 'Piotr M.', location: 'Wrocław' },
          { id: 5, name: 'Katarzyna L.', location: 'Poznań' },
        ];
        setParticipants(sampleParticipants);
      } else {
        setViewers(0);
        setParticipants([]);
      }
    } catch (error) {
      console.error('Error loading viewers:', error);
    }
  };

  const joinStream = async () => {
    if (!isLive) {
      Alert.alert(
        'Transmisja niedostępna',
        `Następna Msza Święta o godzinie ${massTime}.\nCzas do rozpoczęcia: ${timeUntilMass}`,
        [{ text: 'OK' }]
      );
      return;
    }

    setIsLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Dodaj użytkownika do oglądających
      await supabase
        .from('mass_viewers')
        .insert({
          user_id: user.id,
          candle_id: candleId,
          mass_date: new Date().toISOString().split('T')[0],
          joined_at: new Date().toISOString()
        });

      // Symulacja ładowania strumienia
      setTimeout(() => {
        setIsLoading(false);
        Alert.alert(
          'Dołączyłeś do transmisji',
          'Transmisja Mszy Świętej rozpocznie się za chwilę',
          [{ text: 'OK' }]
        );
        loadViewers();
      }, 2000);
      
    } catch (error) {
      console.error('Error joining stream:', error);
      setIsLoading(false);
      Alert.alert('Błąd', 'Nie udało się dołączyć do transmisji');
    }
  };

  const setReminder = () => {
    Alert.alert(
      'Przypomnienie ustawione',
      `Otrzymasz powiadomienie 15 minut przed rozpoczęciem Mszy o godzinie ${massTime}`,
      [{ text: 'OK' }]
    );
  };

  const changeQuality = () => {
    const qualities = ['SD', 'HD', 'Full HD'];
    const currentIndex = qualities.indexOf(streamQuality);
    const nextIndex = (currentIndex + 1) % qualities.length;
    setStreamQuality(qualities[nextIndex]);
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
          <Text style={styles.headerTitle}>Transmisja Mszy</Text>
          <Text style={styles.headerSubtitle}>{location}</Text>
        </View>
        {isLive && (
          <View style={styles.liveIndicator}>
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        )}
      </View>

      <ScrollView style={styles.content}>
        {/* Video Player Area */}
        <View style={styles.videoContainer}>
          {isLive ? (
            <View style={styles.liveVideo}>
              <View style={styles.videoPlaceholder}>
                <Ionicons name="videocam" size={60} color="#FFD700" />
                <Text style={styles.videoText}>Transmisja na żywo</Text>
                <Text style={styles.videoSubtext}>Msza Święta</Text>
              </View>
              
              {/* Controls overlay */}
              <View style={styles.videoControls}>
                <TouchableOpacity 
                  style={styles.qualityButton}
                  onPress={changeQuality}
                >
                  <Text style={styles.qualityText}>{streamQuality}</Text>
                </TouchableOpacity>
                
                <View style={styles.viewerCount}>
                  <Ionicons name="eye" size={16} color="#fff" />
                  <Text style={styles.viewerText}>{viewers}</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.offlineVideo}>
              <Ionicons name="time" size={60} color="#FFD700" />
              <Text style={styles.offlineTitle}>Transmisja niedostępna</Text>
              <Text style={styles.offlineTime}>Następna Msza o {massTime}</Text>
              <Text style={styles.countdown}>Za {timeUntilMass}</Text>
            </View>
          )}
        </View>

        {/* Mass Information */}
        <View style={styles.massInfo}>
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Ionicons name="calendar" size={24} color="#FFD700" />
              <Text style={styles.infoTitle}>Informacje o Mszy</Text>
            </View>
            <View style={styles.infoContent}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Godzina:</Text>
                <Text style={styles.infoValue}>{massTime} codziennie</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Lokalizacja:</Text>
                <Text style={styles.infoValue}>{location}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Język:</Text>
                <Text style={styles.infoValue}>Polski</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Celebrans:</Text>
                <Text style={styles.infoValue}>Ks. Jan Kowalski</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {isLive ? (
            <TouchableOpacity 
              style={[styles.actionButton, styles.joinButton]}
              onPress={joinStream}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#1a237e" />
              ) : (
                <>
                  <Ionicons name="play" size={24} color="#1a237e" />
                  <Text style={styles.joinButtonText}>Dołącz do transmisji</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.actionButton, styles.reminderButton]}
              onPress={setReminder}
            >
              <Ionicons name="notifications" size={24} color="#FFD700" />
              <Text style={styles.reminderButtonText}>Ustaw przypomnienie</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Participants (if live) */}
        {isLive && participants.length > 0 && (
          <View style={styles.participantsSection}>
            <Text style={styles.sectionTitle}>Uczestnicy transmisji</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {participants.map((participant) => (
                <View key={participant.id} style={styles.participantCard}>
                  <View style={styles.participantAvatar}>
                    <Ionicons name="person" size={20} color="#1a237e" />
                  </View>
                  <Text style={styles.participantName}>{participant.name}</Text>
                  <Text style={styles.participantLocation}>{participant.location}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Mass Schedule */}
        <View style={styles.scheduleSection}>
          <Text style={styles.sectionTitle}>Harmonogram Mszy</Text>
          <View style={styles.scheduleCard}>
            <View style={styles.scheduleDay}>
              <Text style={styles.dayName}>Poniedziałek - Piątek</Text>
              <Text style={styles.dayTime}>18:00</Text>
            </View>
            <View style={styles.scheduleDay}>
              <Text style={styles.dayName}>Sobota</Text>
              <Text style={styles.dayTime}>18:00</Text>
            </View>
            <View style={styles.scheduleDay}>
              <Text style={styles.dayName}>Niedziela</Text>
              <Text style={styles.dayTime}>8:00, 10:00, 12:00, 18:00</Text>
            </View>
          </View>
        </View>
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
  liveIndicator: {
    backgroundColor: '#f44336',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  liveText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  videoContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  liveVideo: {
    height: height * 0.3,
    position: 'relative',
  },
  videoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 35, 126, 0.8)',
  },
  videoText: {
    fontSize: 18,
    color: '#FFD700',
    fontWeight: 'bold',
    marginTop: 10,
  },
  videoSubtext: {
    fontSize: 14,
    color: '#fff',
    marginTop: 5,
  },
  videoControls: {
    position: 'absolute',
    top: 15,
    left: 15,
    right: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  qualityButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  qualityText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  viewerCount: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewerText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  offlineVideo: {
    height: height * 0.3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  offlineTitle: {
    fontSize: 18,
    color: '#FFD700',
    fontWeight: 'bold',
    marginTop: 15,
  },
  offlineTime: {
    fontSize: 16,
    color: '#fff',
    marginTop: 10,
  },
  countdown: {
    fontSize: 20,
    color: '#FFD700',
    fontWeight: 'bold',
    marginTop: 10,
  },
  massInfo: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 20,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    marginLeft: 10,
  },
  infoContent: {},
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 14,
    color: '#fff',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#FFD700',
    fontWeight: 'bold',
    flex: 2,
    textAlign: 'right',
  },
  actionButtons: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 25,
  },
  joinButton: {
    backgroundColor: '#FFD700',
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a237e',
    marginLeft: 10,
  },
  reminderButton: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  reminderButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
    marginLeft: 10,
  },
  participantsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 15,
  },
  participantCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
    marginRight: 10,
    alignItems: 'center',
    width: 100,
  },
  participantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  participantName: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  participantLocation: {
    fontSize: 10,
    color: '#fff',
    textAlign: 'center',
    marginTop: 2,
  },
  scheduleSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  scheduleCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 20,
  },
  scheduleDay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 215, 0, 0.2)',
  },
  dayName: {
    fontSize: 14,
    color: '#fff',
    flex: 1,
  },
  dayTime: {
    fontSize: 14,
    color: '#FFD700',
    fontWeight: 'bold',
  },
});