// mobile/src/screens/ProfileScreen.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { authService, apiService } from '../services/supabase';

const colors = {
  primary: '#1a237e',
  secondary: '#FFD700',
  background: '#000',
  text: '#fff',
  cardBackground: 'rgba(255,255,255,0.05)',
  cardBorder: 'rgba(255,255,255,0.1)',
  danger: '#ff5252',
};

export default function ProfileScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      
      if (currentUser) {
        const profileResult = await apiService.getUserProfile();
        if (profileResult.success) {
          setProfile(profileResult.data);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Wylogowanie',
      'Czy na pewno chcesz się wylogować?',
      [
        {
          text: 'Anuluj',
          style: 'cancel',
        },
        {
          text: 'Wyloguj',
          style: 'destructive',
          onPress: async () => {
            const result = await authService.signOut();
            if (!result.success) {
              Alert.alert('Błąd', 'Nie udało się wylogować');
            }
            // App.js automatycznie przekieruje do ekranu logowania
          },
        },
      ]
    );
  };

  const menuItems = [
    {
      icon: 'time-outline',
      title: 'Historia Mszy',
      onPress: () => Alert.alert('Historia Mszy', 'Funkcja będzie dostępna wkrótce'),
    },
    {
      icon: 'stats-chart-outline',
      title: 'Statystyki duchowe',
      onPress: () => Alert.alert('Statystyki', 'Funkcja będzie dostępna wkrótce'),
    },
    {
      icon: 'notifications-outline',
      title: 'Przypomnienia',
      onPress: () => Alert.alert('Przypomnienia', 'Funkcja będzie dostępna wkrótce'),
    },
    {
      icon: 'settings-outline',
      title: 'Ustawienia',
      onPress: () => Alert.alert('Ustawienia', 'Funkcja będzie dostępna wkrótce'),
    },
    {
      icon: 'help-circle-outline',
      title: 'Pomoc i kontakt',
      onPress: () => Alert.alert('Pomoc', 'Funkcja będzie dostępna wkrótce'),
    },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.secondary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={60} color={colors.secondary} />
          </View>
          <Text style={styles.profileName}>
            {profile?.full_name || 'Użytkownik'}
          </Text>
          <Text style={styles.profileEmail}>
            {user?.email || ''}
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{profile?.prayer_days || 0}</Text>
            <Text style={styles.statLabel}>Dni modlitwy</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Zamówione Msze</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{profile?.total_candles || 0}</Text>
            <Text style={styles.statLabel}>Zapalone świece</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{profile?.total_rosaries || 0}</Text>
            <Text style={styles.statLabel}>Różańce</Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <View style={styles.menuLeft}>
                <Ionicons name={item.icon} size={24} color={colors.text} />
                <Text style={styles.menuText}>{item.title}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.text} opacity={0.5} />
            </TouchableOpacity>
          ))}

          {/* Logout Button */}
          <TouchableOpacity
            style={[styles.menuItem, styles.logoutButton]}
            onPress={handleLogout}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="log-out-outline" size={24} color={colors.danger} />
              <Text style={[styles.menuText, styles.logoutText]}>Wyloguj się</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.danger} opacity={0.5} />
          </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.cardBackground,
    borderWidth: 2,
    borderColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 5,
  },
  profileEmail: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.7,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  statCard: {
    width: '48%',
    backgroundColor: colors.cardBackground,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 20,
    margin: '1%',
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.secondary,
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.7,
  },
  menuContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 18,
    marginBottom: 10,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  menuText: {
    fontSize: 16,
    color: colors.text,
  },
  logoutButton: {
    marginTop: 20,
    borderColor: 'rgba(255,82,82,0.3)',
  },
  logoutText: {
    color: colors.danger,
  },
});