// mobile/App.js

import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Import services
import { supabase, authService } from './src/services/supabase';

// Import screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import SpiritualityScreen from './src/screens/SpiritualityScreen';
import CommunityScreen from './src/screens/CommunityScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import CandleScreen from './src/screens/CandleScreen';
import CandlePortal from './src/screens/CandlePortal';
import GlobalPrayer from './src/screens/GlobalPrayer';
import PrayersMap from './src/screens/PrayersMap';
import MassStream from './src/screens/MassStream';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const MainStack = createStackNavigator();

// Kolory aplikacji
const colors = {
  primary: '#1a237e',
  secondary: '#FFD700',
  background: '#000',
  text: '#fff',
  tabBackground: 'rgba(0,0,0,0.8)',
  cardBackground: 'rgba(255,255,255,0.1)',
};

// Stack dla autoryzacji
function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Login" 
        component={LoginScreen} 
        options={{ title: 'Logowanie' }}
      />
      <Stack.Screen 
        name="Register" 
        component={RegisterScreen} 
        options={{ title: 'Rejestracja' }}
      />
    </Stack.Navigator>
  );
}

// Główne taby aplikacji
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Spirituality') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Community') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.secondary,
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: colors.tabBackground,
          borderTopWidth: 0,
          elevation: 0,
        },
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ 
          title: 'Główna',
          headerTitle: 'OREMUS'
        }} 
      />
      <Tab.Screen 
        name="Spirituality" 
        component={SpiritualityScreen} 
        options={{ title: 'Duchowość' }} 
      />
      <Tab.Screen 
        name="Community" 
        component={CommunityScreen} 
        options={{ title: 'Wspólnota' }} 
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ title: 'Profil' }} 
      />
    </Tab.Navigator>
  );
}

// Stack główny dla zalogowanych użytkowników
function AppStack() {
  return (
    <MainStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <MainStack.Screen 
        name="MainTabs" 
        component={MainTabs} 
        options={{ headerShown: false }}
      />
      <MainStack.Screen 
        name="CandleScreen" 
        component={CandleScreen}
        options={{ title: 'Zapal Świecę' }}
      />
      <MainStack.Screen 
        name="CandlePortal" 
        component={CandlePortal}
        options={{ title: 'Portal Świec' }}
      />
      <MainStack.Screen 
        name="GlobalPrayer" 
        component={GlobalPrayer}
        options={{ title: 'Globalna Modlitwa' }}
      />
      <MainStack.Screen 
        name="PrayersMap" 
        component={PrayersMap}
        options={{ title: 'Mapa Modlitw' }}
      />
      <MainStack.Screen 
        name="MassStream" 
        component={MassStream}
        options={{ title: 'Transmisja Mszy' }}
      />
    </MainStack.Navigator>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Sprawdź sesję przy starcie
    checkSession();

    // Nasłuchuj zmian w autoryzacji
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const checkSession = async () => {
    try {
      const session = await authService.getSession();
      setSession(session);
    } catch (error) {
      console.error('Session check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.secondary} />
        <Text style={styles.loadingText}>OREMUS</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        {session ? <AppStack /> : <AuthStack />}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  loadingText: {
    color: colors.secondary,
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
  },
});