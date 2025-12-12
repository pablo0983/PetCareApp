import React, { useState } from 'react';
import { Text, TextInput, StyleSheet, TouchableOpacity, Platform, View, ImageBackground, Image, ScrollView, Alert, Modal } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy'; 
import { addPet } from '../services/localStorage';
import I18n from '../src/locales/i18n.js'; 
import { t } from "../src/utils/permissionsText.js";

const AddPetScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [breed, setBreed] = useState('');
  const [gender, setGender] = useState('');
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');
  const [birthDate, setBirthDate] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [image, setImage] = useState(null);

  // 🔹 Nuevo: menú desplegable para especie
  const [speciesModalVisible, setSpeciesModalVisible] = useState(false);
  const speciesOptions = [
    { value: "dog", label: I18n.t("species.dog") },
    { value: "cat", label: I18n.t("species.cat") },
    { value: "rabbit", label: I18n.t("species.rabbit") },
    { value: "hamster", label: I18n.t("species.hamster") },
    { value: "other",label: I18n.t("species.other") },
  ];

  const showDatePicker = () => setDatePickerVisibility(true);
  const hideDatePicker = () => setDatePickerVisibility(false);
  const handleConfirm = (date) => { setBirthDate(date); hideDatePicker(); };
  
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      alert(t("gallery"));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      const sourceUri = result.assets[0].uri;
      const fileName = sourceUri.split('/').pop();
      const petsDir = `${FileSystem.documentDirectory}pets`;

      try {
        // 🔹 Crear carpeta "pets" si no existe
        await FileSystem.makeDirectoryAsync(petsDir, { intermediates: true });

        const destPath = `${petsDir}/${Date.now()}_${fileName}`; // nombre único
        // 🔹 Copiar imagen a la carpeta permanente
        await FileSystem.copyAsync({ from: sourceUri, to: destPath });

        // 🔹 Guardar la URI permanente en el estado correcto
        setImage(destPath);
      } catch (err) {
        console.error("Error copiando imagen:", err);
      }
    }
  };


  const handleSave = async () => {
  if (!name) {
    Alert.alert("⚠️", I18n.t("name_required"));
    return;
  }

  const newPet = {
    name,
    species,
    breed,
    gender,
    weight,
    notes,
    birthDate: birthDate.toISOString(),
    image, 
  };

  await addPet(newPet);
  Alert.alert(I18n.t("save_sus") + " 🐾");
  navigation.goBack();
};


  return (
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{I18n.t("pet_data")}</Text> 

        <TextInput style={styles.input} placeholder={I18n.t("name")} value={name} onChangeText={setName} />

        {/* 🔹 Menú desplegable para especie */}
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setSpeciesModalVisible(true)}
        >
          <Text style={{ fontSize: 16 }}>
            {species ? speciesOptions.find((item) => item.value === species)?.label : I18n.t("pet_species")}
          </Text>
        </TouchableOpacity>

        <Modal
          visible={speciesModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setSpeciesModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            onPress={() => setSpeciesModalVisible(false)}
          >
            <View style={styles.modalContainer}>
              {speciesOptions.map((item) => (
                <TouchableOpacity
                  key={item.value}
                  style={styles.modalItem}
                  onPress={() => {
                    setSpecies(item.value);
                    setSpeciesModalVisible(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        <TextInput style={styles.input} placeholder={I18n.t("breed")} value={breed} onChangeText={setBreed} />
        <TextInput style={styles.input} placeholder={I18n.t("sex")} value={gender} onChangeText={setGender} />
        <TextInput style={styles.input} placeholder={I18n.t("weight")} value={weight} keyboardType="numeric" onChangeText={setWeight} />
        <TextInput style={styles.input} placeholder={I18n.t("other_info")} value={notes} onChangeText={setNotes} />

        {/* 📅 Fecha */}
        <TouchableOpacity onPress={showDatePicker} style={styles.dateButton}>
          <Text style={styles.dateText}>
            {I18n.t("birth")} {birthDate.toLocaleDateString()}
          </Text>
        </TouchableOpacity>
        
        {Platform.OS === "ios" ? (
          <Modal visible={isDatePickerVisible} transparent animationType="slide">
            <View style={styles.overlay}>
              <View style={styles.modalContent}>
                <DateTimePicker
                  value={birthDate}
                  mode="date"
                  maximumDate={new Date()}
                  locale={I18n.locale}
                  display="spinner"
                  onChange={(e, selectedDate) => setBirthDate(selectedDate || birthDate)}
                  textColor="black"
                />

                <View style={styles.buttonRow}>
                  <TouchableOpacity style={styles.cancelButton} onPress={hideDatePicker}>
                    <Text style={styles.cancelText}>Cancelar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={() => {
                      handleConfirm(birthDate);
                      hideDatePicker();
                    }}
                  >
                    <Text style={styles.confirmText}>Confirmar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        ) : (
          isDatePickerVisible && (
            <DateTimePicker
              value={birthDate}
              mode="date"
              maximumDate={new Date()}
              display="calendar"
              onChange={(event, selectedDate) => {
                setDatePickerVisibility(false);
                if (selectedDate) {
                  handleConfirm(selectedDate);
                }
              }}
            />
          )
        )}

        {/* 🖼 Imagen */}
        <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
          {image ? (
            <Image source={{ uri: image }} style={styles.imagePreview} />
          ) : (
            <Text>{I18n.t("add_im")}</Text>
          )}
        </TouchableOpacity>

        {/* 💾 Guardar */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveText}>💾 {I18n.t("save_pet")}</Text>
        </TouchableOpacity>

        {/* ⬅️ Volver */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>{I18n.t("back")}</Text>
        </TouchableOpacity>
      </ScrollView>
     );
    };

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    width: '100%',
    padding: 20,
    alignItems: 'center',
    backgroundColor: "#d0e0f3ff",
  },

  title: {
    fontSize: 30,
    fontWeight: '900',
    marginVertical: 20,
    color: '#1f527cff',
    textAlign: 'center',
  },

  input: {
    width: '100%',
    height: 50,
    paddingHorizontal: 14,
    marginBottom: 14,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cfd8d2',

    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 2,
  },

  /* 📅 Fecha */
  dateButton: {
    width: '100%',
    height: 50,
    justifyContent: 'center',
    paddingHorizontal: 12,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#cfd8d2',

    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 2,
  },

  dateText: { 
    fontSize: 17,
    color: '#333',
    fontWeight: '500',
  },

  /* iOS Date Picker */
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.30)",
    justifyContent: "flex-end",
    alignItems: "center",
  },

  modalContent: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: "#dfe5e0",
  },

  buttonRow: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    width: "100%", 
    marginTop: 20,
  },

  cancelButton: { 
    flex: 1,
    marginRight: 10,
    backgroundColor: "#93b6a1",
    padding: 12,
    borderRadius: 10,
  },

  confirmButton: { 
    flex: 1,
    marginLeft: 10,
    backgroundColor: "#4caf50",
    padding: 12,
    borderRadius: 10,
  },

  cancelText: { 
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 18,
  },

  confirmText: { 
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 18,
  },

  /* 🐾 Imagen */
  imageButton: {
    width: '100%',
    minHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 14,

    borderWidth: 1,
    borderColor: '#cfd8d2',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 2,
  },

  imagePreview: { 
    width: '100%', 
    height: 200, 
    borderRadius: 12, 
    resizeMode: 'cover',
  },

  /* 💾 Botón guardar */
  saveButton: { 
    width: '100%',
    backgroundColor: '#4caf50',
    padding: 14,
    borderRadius: 50,
    marginBottom: 10,
  },

  saveText: { 
    color: 'white',
    fontSize: 20,
    textAlign: 'center',
    fontWeight: 'bold',
  },

  /* Volver */
  backButton: { 
    alignItems: "center",
    backgroundColor: "#2195f3ff",
    padding: 14,
    borderRadius: 50,
    width: "100%",
  },

  backText: { 
    color: "#fff", fontSize: 17, fontWeight: "600" 
  },

  /* 🔽 Selector especie */
  pickerButton: {
    width: '100%',
    height: 50,
    justifyContent: 'center',
    paddingHorizontal: 12,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#cfd8d2',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.30)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalContainer: {
    width: "80%",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingVertical: 12,

    borderWidth: 1,
    borderColor: "#dfe5e0",

    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },

  modalItem: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderColor: "#f0f0f0",
  },

  modalItemText: { 
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
});


export default AddPetScreen;
