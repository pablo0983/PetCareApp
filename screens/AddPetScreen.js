import React, { useState } from 'react';
import { Text, TextInput, StyleSheet, TouchableOpacity, Platform, View, ImageBackground, Image, ScrollView, Alert, Modal 
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from 'expo-image-picker';
import { addPet } from '../services/localStorage';
import I18n from '../src/locales/i18n.js'; 

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
  
  const showDatePicker = () => setDatePickerVisibility(true);
  const hideDatePicker = () => setDatePickerVisibility(false);
  const handleConfirm = (date) => { setBirthDate(date); hideDatePicker(); };
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const handleSave = async () => {
    if (!name) return;
    const newPet = {
      name, species, breed, gender, weight, notes,
      birthDate: birthDate.toISOString(),
      image,
    };
    await addPet(newPet);
    Alert.alert(I18n.t("save_sus") + " 🐾");
    navigation.goBack();
  };

  return (
    <ImageBackground
      source={require("../assets/fondodos.jpg")}
      style={styles.background}
      resizeMode="cover"
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{I18n.t("pet_data")}</Text> 

        <TextInput style={styles.input} placeholder={I18n.t("name")} value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder={I18n.t("species")} value={species} onChangeText={setSpecies} />
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
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  scrollContainer: {
    flexGrow: 1,
    width: '100%',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: 'rgba(82, 159, 65, 0.6)',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginVertical: 20,
    color: '#262f32ff',
    textAlign: 'center'
  },
  input: {
    backgroundColor: 'rgba(187, 223, 179, 0.8)',
    width: '100%',
    height: 45,
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
  },
  dateButton: {
    width: '100%',
    height: 45,
    justifyContent: 'center',
    borderWidth: 1,
    padding: 5,
    backgroundColor: 'rgba(187, 223, 179, 0.8)',
    borderRadius: 8,
    marginBottom: 10,
  },
  dateText: {
    fontSize: 15,
  },
  // ios date picker
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  modalContent: {
    width: "100%",
    backgroundColor: "#78b57cff",
    borderRadius: 50,
    padding: 20,
    alignItems: "center",
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
    backgroundColor: "#5a7e62ff",
    padding: 8,
    borderRadius: 10,
  },
  confirmButton: {
    flex: 1,
    marginLeft: 10,
    backgroundColor: "#4caf50",
    padding: 8,
    borderRadius: 10,
  },
  cancelText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 20,
  },
  confirmText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 20
  },
  //
  imageButton: {
    width: '100%',
    minHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(187, 223, 179, 0.8)',
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  saveButton: {
    width: '100%',
    backgroundColor: '#4caf4fe7',
    padding: 20,
    borderRadius: 12,
    marginBottom: 10,
  },
  saveText: {
    color: 'white',
    fontSize: 22,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  backButton: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: '#2195f3c2',
    padding: 15,
    borderRadius: 12,
    marginBottom: 30,
  },
  backText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default AddPetScreen;
