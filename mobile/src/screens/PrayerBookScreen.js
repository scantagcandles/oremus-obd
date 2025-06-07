// mobile/src/screens/PrayerBookScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView
} from 'react-native';

const prayers = [
  {
    id: 1,
    title: 'Ojcze Nasz',
    category: 'Podstawowe',
    content: 'Ojcze nasz, któryś jest w niebie,\nświęć się imię Twoje,\nprzyjdź królestwo Twoje,\nbądź wola Twoja\njako w niebie, tak i na ziemi.\nChleba naszego powszedniego daj nam dzisiaj\ni odpuść nam nasze winy,\njako i my odpuszczamy naszym winowajcom.\nI nie wódź nas na pokuszenie,\nale nas zbaw ode złego.\nAmen.'
  },
  {
    id: 2,
    title: 'Zdrowaś Maryjo',
    category: 'Podstawowe',
    content: 'Zdrowaś Maryjo, łaski pełna,\nPan z Tobą.\nBłogosławionaś Ty między niewiastami\ni błogosławiony owoc żywota Twojego, Jezus.\nŚwięta Maryjo, Matko Boża,\nmódl się za nami grzesznymi\nteraz i w godzinę śmierci naszej.\nAmen.'
  },
  {
    id: 3,
    title: 'Anioł Pański',
    category: 'Codzienne',
    content: 'Anioł Pański zwiastował Pannie Maryi\ni poczęła z Ducha Świętego.\nZdrowaś Maryjo...\n\nOto ja służebnica Pańska,\nniech mi się stanie według słowa Twego.\nZdrowaś Maryjo...\n\nA Słowo ciałem się stało\ni zamieszkało między nami.\nZdrowaś Maryjo...'
  },
  {
    id: 4,
    title: 'Różaniec - Tajemnice Radosne',
    category: 'Różaniec',
    content: '1. Zwiastowanie Najświętszej Maryi Pannie\n2. Nawiedzenie św. Elżbiety\n3. Narodzenie Pana Jezusa\n4. Ofiarowanie Pana Jezusa w świątyni\n5. Znalezienie Pana Jezusa w świątyni'
  },
  {
    id: 5,
    title: 'Modlitwa poranna',
    category: 'Codzienne',
    content: 'Boże, Ty sprawiłeś, że dożyłem dnia dzisiejszego,\nspraw, abym przeżył go godnie.\nPomóż mi we wszystkich dzisiejszych sprawach\ni chroń mnie od wszelkiego zła.\nPrzez Chrystusa, Pana naszego.\nAmen.'
  }
];

export default function PrayerBookScreen({ navigation }) {
  const [selectedCategory, setSelectedCategory] = useState('Wszystkie');
  const [expandedPrayer, setExpandedPrayer] = useState(null);

  const categories = ['Wszystkie', 'Podstawowe', 'Codzienne', 'Różaniec'];

  const filteredPrayers = selectedCategory === 'Wszystkie' 
    ? prayers 
    : prayers.filter(prayer => prayer.category === selectedCategory);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Powrót</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Modlitewnik</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryContainer}>
        {categories.map(category => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryButton,
              selectedCategory === category && styles.categoryButtonActive
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text style={[
              styles.categoryText,
              selectedCategory === category && styles.categoryTextActive
            ]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.prayerList} showsVerticalScrollIndicator={false}>
        {filteredPrayers.map(prayer => (
          <TouchableOpacity
            key={prayer.id}
            style={styles.prayerCard}
            onPress={() => setExpandedPrayer(expandedPrayer === prayer.id ? null : prayer.id)}
          >
            <View style={styles.prayerHeader}>
              <View>
                <Text style={styles.prayerTitle}>{prayer.title}</Text>
                <Text style={styles.prayerCategory}>{prayer.category}</Text>
              </View>
              <Text style={styles.expandIcon}>
                {expandedPrayer === prayer.id ? '▼' : '▶'}
              </Text>
            </View>
            
            {expandedPrayer === prayer.id && (
              <View style={styles.prayerContent}>
                <Text style={styles.prayerText}>{prayer.content}</Text>
                <TouchableOpacity style={styles.prayButton}>
                  <Text style={styles.prayButtonText}>🙏 Módl się</Text>
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>
        ))}
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
  categoryContainer: {
    maxHeight: 50,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  categoryButtonActive: {
    backgroundColor: '#FFD700',
  },
  categoryText: {
    color: '#fff',
    fontSize: 14,
  },
  categoryTextActive: {
    color: '#1a237e',
    fontWeight: 'bold',
  },
  prayerList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  prayerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
  },
  prayerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  prayerTitle: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
  },
  prayerCategory: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.7,
    marginTop: 5,
  },
  expandIcon: {
    color: '#FFD700',
    fontSize: 16,
  },
  prayerContent: {
    marginTop: 15,
  },
  prayerText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
  },
  prayButton: {
    backgroundColor: '#FFD700',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 15,
  },
  prayButtonText: {
    color: '#1a237e',
    fontSize: 16,
    fontWeight: 'bold',
  },
});