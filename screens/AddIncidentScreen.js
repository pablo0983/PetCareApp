import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Image,
  Alert,
  ImageBackground,
  Modal
} from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { addMedicalIncident } from "../services/localStorage";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import Signature from "react-native-signature-canvas";
import TypePicker from "../components/TypePicker";
import I18n from '../src/locales/i18n';
import { t} from "..src/utils/permissionsText";

const AddIncidentScreen = ({ route, navigation }) => {
  const { petId } = route.params;

  const [date, setDate] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());
  const [description, setDescription] = useState("");
  const [product, setProduct] = useState("");
  const [type, setType] = useState("");
  const options = [
  { label: I18n.t("vac"), value: "Vacuna" },
  { label: I18n.t("dewo"), value: "Desparasitacion" },
  { label: I18n.t("treat"), value: "Tratamiento" },
  { label: I18n.t("hospi"), value: "Internacion" },
  { label: I18n.t("other"), value: "Otros" },
];
  const [productImage, setProductImage] = useState(null);
  const [vetName, setVetName] = useState("");
  const [signature, setSignature] = useState(null);
  const [isSigning, setIsSigning] = useState(false);
  // 📅 Mostrar/ocultar calendario
  const showDatePicker = () => {
  setTempDate(date); 
  setDatePickerVisibility(true);
};
  const hideDatePicker = () => setDatePickerVisibility(false);
  const handleConfirmModal = (selectedDate) => {
  setDate(selectedDate);
  hideDatePicker();
};
const confirmIOSDate = () => {
  setDate(tempDate);
  hideDatePicker();
};
const cancelIOSDate = () => {
  setTempDate(date);
  hideDatePicker();
};

  // 📸 Seleccionar imagen producto
  const pickProductImage = async () => {
  try {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("📷", t("camera"));
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

   
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      setProductImage(uri);
    }
  } catch (error) {
    console.error("Error al tomar la foto:", error);
  }
};

  // ✍ Guardar firma
  const handleSignature = (sig) => {
    setSignature(sig);
  };

  const handleSave = async () => {
    if (!description.trim() || !vetName.trim() || !signature) {
      Alert.alert(I18n.t("alert_obli") + " 🐾");
      return;
    }

    const incident = {
      date: date.toISOString(),
      type,
      description,
      product,
      productImage,
      vetName,
      signature,
    };

    await addMedicalIncident(petId, incident);

    Alert.alert("✅ " + I18n.t("alert_sus"));
    navigation.goBack();
  };

  return (
    <ImageBackground
      source={require("../assets/fondodos.jpg")}
      style={styles.background}
      resizeMode="cover" 
    >
      <KeyboardAwareScrollView
        contentContainerStyle={styles.container}
        enableOnAndroid={true}
        extraScrollHeight={120}
        enableAutomaticScroll={true}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={!isSigning}
      >
        <Text style={styles.title}>{I18n.t("add_imed")}</Text>
        {/* Selector de fecha */}
        <View style={styles.dateWrapper}>
          <TouchableOpacity onPress={showDatePicker} style={styles.dateButton}>
            <Text style={styles.dateText}>{I18n.t("date")} {date.toLocaleDateString()}</Text>
          </TouchableOpacity>

          {Platform.OS === "ios" ? (
            <Modal
              visible={isDatePickerVisible}
              transparent
              animationType="slide"
              onRequestClose={cancelIOSDate}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalContentText}>
                    {I18n.t("sel_date")}
                  </Text>

                  <DateTimePicker
                    value={tempDate}
                    mode="date"
                    locale={I18n.locale}
                    display="spinner"
                    maximumDate={new Date()}
                    onChange={(event, selected) => {
                      if (selected) setTempDate(selected);
                    }}
                    style={styles.modalCon}
                    textColor="black"                
                  />

                  <View style={styles.modalButtons}>
                    <TouchableOpacity style={styles.modBut} onPress={cancelIOSDate}>
                      <Text style={styles.modButText}>{I18n.t("cancel")}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.modBut1} onPress={confirmIOSDate}>
                      <Text style={styles.modButText1}>{I18n.t("confirm")}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          ) : (
            
            <DateTimePickerModal
              isVisible={isDatePickerVisible}
              mode="date"
              display="calendar"
              date={date}
              locale={I18n.locale}
              maximumDate={new Date()}
              onConfirm={handleConfirmModal}
              onCancel={hideDatePicker}
            />
          )}
        </View>

        {/* Tipo de incidencia */}

        <View style={styles.pickerContainer}>
          <TypePicker 
            value={type}
            onValueChange={setType} 
            options={options} 
          />
        </View>

        {/* Descripción */}

        <TextInput
          style={styles.input}
          placeholder={I18n.t("incident_desc")}
          multiline
          value={description}
          onChangeText={setDescription}
        />
        <TextInput
          style={styles.input}
          placeholder={I18n.t("pused")}
          multiline
          value={product}
          onChangeText={setProduct}
        />

        {/* Imagen del producto */}

        <TouchableOpacity style={styles.imagePicker} onPress={pickProductImage}>
          {productImage ? (
            <Image source={{ uri: productImage }} style={styles.image} />
          ) : (
            <Text>📷 {I18n.t("product_im")}</Text>
          )}
        </TouchableOpacity>

        {/* Nombre veterinario */}
        
        <TextInput
          style={styles.input}
          placeholder="Dr. ..."
          value={vetName}
          onChangeText={setVetName}
        />

        {/* Firma veterinario */}
        <Text style={styles.label}>{I18n.t("vet_sig")}</Text>
        <View style={styles.signatureContainer}>
          <Signature
            onBegin={() => setIsSigning(true)}
            onEnd={() => setIsSigning(false)}
            onOK={handleSignature}
            onClear={() => setSignature(null)}
            clearText={I18n.t("clean")}
            confirmText={I18n.t("confirm")}
            webStyle={signatureStyle}
            backgroundColor="transparent"
            autoClear={false} 
            penColor="black"
            dotSize={1.5}
          />
        </View>

        {signature && (
          <>
            <Text style={styles.label}>{I18n.t("prev_sig")}</Text>
            <Image
              source={{ uri: signature }}
              style={styles.preview}
            />
          </>
        )}

        {/* Guardar */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveText}>💾 {I18n.t("save_histo")}</Text>
        </TouchableOpacity>
        {/* Botón volver */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>{I18n.t("back")}</Text>
        </TouchableOpacity>
      </KeyboardAwareScrollView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  container: { 
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#e9ee53bb',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center', 
    justifyContent: 'space-around'
  },
  title: { 
    padding: 0,
    marginTop: 25,
    fontSize: 25, 
    fontWeight: "bold", 
    textAlign: "center", 
    marginBottom: 10 
  },
  label: { 
    marginTop: 0, 
    fontWeight: "bold" 
  },
  dateWrapper: { 
    width: "100%",
  },
  dateButton: {
    width: '100%',
    height: 50,
    padding: 8,
    backgroundColor: '#e9ee536d',
    borderColor: "#ccc",
    borderWidth: 2,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  dateText: { 
    fontSize: 20 
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end", // 👈 alinea al fondo
    backgroundColor: "rgba(0,0,0,0.4)", // fondo semitransparente
  },
  modalContent: {
    marginBottom: 0,
    borderRadius: 50,
    width: '100%',
    alignItems: 'center',
    backgroundColor: '#c9cc80ff',
    padding: 18,
    justifyContent: 'space-between'
  },
  modalContentText: {
    color: "black",
    fontWeight: 700,
    fontSize: 28
  },
  modalCon: {
    backgroundColor: '#c9cc80ff',
    borderRadius: 50
  },
  modalButtons: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  modBut: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 6,
    borderRadius: 10,
    backgroundColor: "#ddd",
    alignItems: "center",
  },
  modBut1: {
    backgroundColor: "#4caf50",
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 6,
    borderRadius: 10,
    alignItems: "center",
  },
  modButText: {
    fontWeight: 'bold',
    color: "black",
    fontSize: 16,
  },
  modButText1: {
    fontWeight: 'bold',
    color: "#ffffff",
    fontSize: 16,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#e9ee536d',
    borderWidth: 2,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  pickerContainer: {
    width: "100%",
    borderRadius: 50,
  },
  imagePicker: {
    width: '100%',
    backgroundColor: '#e9ee536d',
    alignItems: "center",
    justifyContent: "center",
    height: 150,
    borderWidth: 2,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 8,
  },
  image: { 
    width: "100%",
    height: "100%", 
    marginBottom: 8,
    borderRadius: 10, 
  },
  signatureContainer: {
    width: "100%",
    height: 200,
    borderWidth: 1,
    borderColor: "#ccc",
    marginTop: 5,
    borderRadius: 10,
    overflow: "hidden",
    margintop: 5
  },
  preview: { 
    width: "100%", 
    height: 120, 
    marginTop: 10 
  },
  saveButton: {
    width: '100%',
    backgroundColor: '#4caf4fe7',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  saveText: {
    color: 'white',
    fontSize: 22,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  backButton: { 
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    marginBottom: 25,
    width: '100%',
    backgroundColor: '#2195f39e',
    padding: 5,
    borderRadius: 12 
  },
  backText: { 
    color: '#fefefeff', 
    fontSize: 20,
    fontWeight: 'bold'
  },
});

const signatureStyle = `
  .m-signature-pad {
    box-shadow: none !important;
    border: none !important;
    position: relative;
  }

  .m-signature-pad--body {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    border-radius: 10px !important;
    background-color: #e9ee53a6 !important;
    position: relative;
  }

  /* ✍️ Texto centrado */
  .m-signature-pad--body::before {
    content: "✍️";
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: #555;
    font-size: 18px;
    font-weight: bold;
    pointer-events: none;
    opacity: 0.6;
  }

  /* 📏 Footer */
  .m-signature-pad--footer {
    width: 100%;
    height: 50px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: transparent !important;
    padding: 0 20px;
    position: absolute;
    bottom: 0;
    left: 0;
  }

  /* 🎯 Botones centrados vertical y horizontalmente */
  .m-signature-pad--footer .button {
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    height: 40px !important;
    min-width: 100px !important;
    line-height: 40px !important;
    text-align: center !important;
    font-weight: bold !important;
    font-size: 15px !important;
    border: none !important;
    border-radius: 8px !important;
    cursor: pointer !important;
  }

  /* 🧹 Limpiar */
  .m-signature-pad--footer .button:first-child {
    background-color: #f06358ff !important;
    color: #fff !important;
  }

  /* 💾 Guardar */
  .m-signature-pad--footer .button:last-child {
    background-color: #4caf4fe7 !important;
    color: #fff !important;
  }

  body, html {
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    background-color: transparent !important;
  }
`;



export default AddIncidentScreen;
