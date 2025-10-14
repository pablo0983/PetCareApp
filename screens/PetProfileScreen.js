import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ImageBackground, TextInput } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getPetById, updatePet } from '../services/localStorage';
import I18n from '../src/locales/i18n';

const PetProfileScreen = ({ route, navigation }) => {
  const { petId } = route.params;
  const [pet, setPet] = useState(null);
  const [editingWeight, setEditingWeight] = useState(false); // ✏️ estado para modo edición del peso
  const [newWeight, setNewWeight] = useState(''); // ✏️ peso temporal mientras editamos

  useEffect(() => {
    loadPet();
  }, []);

  const loadPet = async () => {
    const data = await getPetById(petId);
    setPet(data);
    setNewWeight(data?.weight?.toString() || ''); // inicializar peso editable
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      const updatedPet = { ...pet, image: result.assets[0].uri };
      setPet(updatedPet);
      await updatePet(petId, updatedPet);
    }
  };

  if (!pet) return <Text style={{ padding: 20 }}>Cargando...</Text>;

  const calculateAge = (birthDate) => {
    if (!birthDate) return '';
    const today = new Date();
    const dob = new Date(birthDate);
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };
  // 💾 Guardar nuevo peso
  const saveWeight = async () => {
    if (!newWeight || isNaN(newWeight)) {
      Alert.alert("⚠️ ");
      return;
    }

    const updatedPet = { ...pet, weight: parseFloat(newWeight) };
    await updatePet(petId, updatedPet);
    setPet(updatedPet);
    setEditingWeight(false);
    Alert.alert("✅ ");
  };

  return (
    <ImageBackground
      source={require("../assets/fondodos.jpg")} 
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}> 
        <TouchableOpacity onPress={pickImage}>
          <Image
            source={pet.image ? { uri: pet.image } : { uri: 'https://cdn-icons-png.flaticon.com/512/616/616408.png' }}
            style={styles.image}
          />
          <Text style={styles.editText}>{I18n.t("ch_im")}</Text>
        </TouchableOpacity>

        {/* Datos básicos */}
        <Text style={styles.name}>{pet.name}</Text>
        <View style={styles.info}>
          <Text style={styles.infoText}>🐾 {I18n.t("species")}: {pet.species}</Text>
          <Text style={styles.infoText}>🐕 {I18n.t("breed")}: {pet.breed}</Text>
          <Text style={styles.infoText}>⚧ {I18n.t("sex")}: {pet.gender}</Text>
          <Text style={styles.infoText}>🎂 {I18n.t("age")}: {calculateAge(pet.birthDate)} años</Text>
          {/* ⚖️ Peso editable */}
          <View style={styles.weightRow}>
            <Text style={styles.infoText}>⚖ {I18n.t("weight")}: </Text>
            {editingWeight ? (
              <>
                <TextInput
                  style={styles.weightInput}
                  keyboardType="numeric"
                  value={newWeight}
                  onChangeText={setNewWeight}
                />
                <TouchableOpacity onPress={saveWeight} style={styles.saveWeightBtn}>
                  <Text style={styles.saveWeightText}>💾</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity onPress={() => setEditingWeight(true)}>
                <Text style={[styles.infoText, styles.editableWeight]}>
                  {pet.weight} kg ✏️
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <Text 
          adjustsFontSizeToFit={true}
          minimumFontScale={0.5} 
          numberOfLines={2}
          allowFontScaling={true} 
          style={styles.infoText}>{pet.notes}</Text>
        </View>
        {/* Botones */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('AddIncidentScreen', { petId })}
        >
          <Text style={styles.buttonText}>🩹{I18n.t("add_incident")}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button1}
          onPress={() => navigation.navigate('MedicalHistoryScreen', { petId })}
        >
          <Text style={styles.buttonText}>📜 {I18n.t("view_history")}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button2}
          onPress={() => navigation.navigate('Reminders', { petId })}
        >
          <Text style={styles.buttonText}>⏱️ {I18n.t("reminders")}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>{I18n.t("back")}</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%'
    },     
  container: {
    flex: 1, 
    padding: 20,
    backgroundColor: 'rgba(227, 227, 144, 0.8)',
    alignItems: 'center',
    justifyContent: 'space-between' 
  },
  image: { 
    marginTop: 25,
    width: 200, 
    height: 200, 
    borderRadius: 100, 
    alignSelf: 'center',
    resizeMode: 'cover',
    padding: 0
  },
  editText: { 
    textAlign: 'center', 
    color: 'blue', 
    marginTop: 5,
    fontSize: 15,
    padding: 0 
  },
  name: {
    padding: 0,
    fontSize: 40,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 1,
  },
  info: {
    padding: 0,
    marginTop: 5,
    alignItems: 'center',
    width: '100%',
    height: 200,
    borderRadius: 8
  },
  infoText:  {
    fontSize: 22,
    fontWeight: 'bold'
  },

  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  editableWeight: {
    textDecorationLine: 'underline',
    color: '#0077cc'
  },
  weightInput: {
    borderBottomWidth: 2,
    borderColor: '#0077cc',
    width: 80,
    textAlign: 'center',
    fontSize: 22,
    marginRight: 8,
  },
  saveWeightBtn: {
    backgroundColor: '#4caf4f',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  saveWeightText: {
    color: '#fff',
    fontSize: 22, 
  },

  button: {
    height: 60,
    width: '100%',
    backgroundColor: '#4caf4fd4',
    padding: 0,
    borderRadius: 8,
    marginTop: 2,
    justifyContent: 'center'
  },
  button1: {
    height: 60,
    width: "100%",
    backgroundColor: '#2195f3e4',
    padding: 0,
    borderRadius: 8,
    marginTop: 2,
    justifyContent: 'center'
  },
  button2: {
    height: 60,
    width: "100%",
    backgroundColor: '#cfa51edc',
    padding: 0,
    borderRadius: 8,
    marginTop: 2,
    justifyContent: 'center'
  },
  buttonText: { 
    color: '#fefefeff',
    fontWeight: 'bold', 
    fontSize: 25,
    textAlign: 'center' 
  },
  backText: { 
    color: '#fefefeff', 
    fontSize: 20,
    fontWeight: 'bold'
  },
  backButton: { 
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    marginBottom: 25,
    width: '100%',
    backgroundColor: '#2195f39e',
    padding: 5,
    borderRadius: 12,
    position: 'relative',
    alignSelf: 'flex-end'
  }
});

export default PetProfileScreen;
