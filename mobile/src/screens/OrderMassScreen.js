// mobile/src/screens/OrderMassScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Alert
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '../services/supabase';

export default function OrderMassScreen({ navigation }) {
  const [intention, setIntention] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedType, setSelectedType] = useState('zwykła');
  const [churchName, setChurchName] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const massTypes = [
    { id: 'zwykła', name: 'Msza zwykła', price: 20 },
    { id: 'gregoriańska', name: 'Msza gregoriańska (30 dni)', price: 600 },
    { id: 'nowenna', name: 'Nowenna (9 dni)', price: 180 },
  ];

  const handleSubmit = async () => {
    if (!intention || !churchName) {
      Alert.alert('Błąd', 'Proszę wypełnić wszystkie wymagane pola');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('mass_orders')
        .insert({
          user_id: user.id,
          intention,
          mass_type: selectedType,
          church_name: churchName,
          mass_date: selectedDate.toISOString(),
          additional_notes: additionalNotes,
          status: 'pending'
        });

      if (error) throw error;

      Alert.alert(
        'Sukces',
        'Zamówienie Mszy zostało przyjęte. Otrzymasz potwierdzenie na email.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Błąd', 'Nie udało się zamówić Mszy. Spróbuj ponownie.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Powrót</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Zamów Mszę Świętą</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Intencja Mszy *</Text>
          <TextInput
            style={styles.input}
            placeholder="np. Za zdrowie rodziny..."
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            value={intention}
            onChangeText={setIntention}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rodzaj Mszy</Text>
          {massTypes.map(type => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.typeOption,
                selectedType === type.id && styles.typeOptionActive
              ]}
              onPress={() => setSelectedType(type.id)}
            >
              <View style={styles.typeInfo}>
                <Text style={styles.typeName}>{type.name}</Text>
                <Text style={styles.typePrice}>{type.price} zł</Text>
              </View>
              <View style={[
                styles.radio,
                selectedType === type.id && styles.radioActive
              ]} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Mszy</Text>
          <TouchableOpacity 
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateText}>
              {selectedDate.toLocaleDateString('pl-PL', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kościół *</Text>
          <TextInput
            style={styles.input}
            placeholder="Nazwa kościoła"
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            value={churchName}
            onChangeText={setChurchName}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dodatkowe uwagi</Text>
          <TextInput
            style={styles.input}
            placeholder="Opcjonalne uwagi..."
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            value={additionalNotes}
            onChangeText={setAdditionalNotes}
            multiline
            numberOfLines={2}
          />
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Zamów Mszę</Text>
        </TouchableOpacity>
      </ScrollView>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowDatePicker(false);
            if (date) setSelectedDate(date);
          }}
          minimumDate={new Date()}
        />
      )}
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
    padding: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
    color: '#fff',
    fontSize: 16,
  },
  typeOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  typeOptionActive: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  typeInfo: {
    flex: 1,
  },
  typeName: {
    color: '#fff',
    fontSize: 16,
  },
  typePrice: {
    color: '#FFD700',
    fontSize: 14,
    marginTop: 5,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#fff',
  },
  radioActive: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
  },
  dateButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
  },
  dateText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#FFD700',
    padding: 18,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  submitButtonText: {
    color: '#1a237e',
    fontSize: 18,
    fontWeight: 'bold',
  },
});