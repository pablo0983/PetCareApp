// screens/AddIncidentScreen.js
import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Image,
  Alert,
  Modal,
  ScrollView,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import Signature from "react-native-signature-canvas";
import { LinearGradient } from "expo-linear-gradient";

import TypePicker from "../components/TypePicker";
import I18n from "../src/locales/i18n";
import { t } from "../src/utils/permissionsText";
import { addMedicalIncident } from "../services/localStorage";

const AddIncidentScreen = ({ route, navigation }) => {
  const { petId } = route.params;

  // form state (igual que el original)
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

  // firma
  const signatureRef = useRef(null);
  const [signatureDataUrl, setSignatureDataUrl] = useState(null);
  const [isSigning, setIsSigning] = useState(false);
  const [signatureConfirmed, setSignatureConfirmed] = useState(false);

  // date picker handlers
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

  // camera / image capture
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
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setProductImage(uri);
      }
    } catch (error) {
      console.error("Error al tomar la foto:", error);
    }
  };

  // signature callbacks
  const handleSignatureOK = (sig) => {
    // recibe dataURL
    setSignatureDataUrl(sig);
    // no confirmamos automáticamente; dejamos que el usuario presione "Confirmar firma"
    setSignatureConfirmed(false);
    setIsSigning(false);
  };

  const handleSignatureBegin = () => {
    setIsSigning(true);
    setSignatureConfirmed(false);
  };

  const handleClearSignature = () => {
    // limpiar desde el webview
    signatureRef.current && signatureRef.current.clearSignature();
    setSignatureDataUrl(null);
    setSignatureConfirmed(false);
  };

  // force read signature (usar con el botón confirmar)
  const confirmSignatureFromCanvas = () => {
    if (!signatureRef.current) {
      Alert.alert(I18n.t("error"), I18n.t("unable_signature"));
      return;
    }
    // readSignature provocará onOK -> handleSignatureOK
    signatureRef.current.readSignature();
  };

  const handleConfirmSignature = () => {
    if (!signatureDataUrl) {
      Alert.alert(I18n.t("error"), I18n.t("firm_required") || "Signature required");
      return;
    }
    setSignatureConfirmed(true);
    Alert.alert(I18n.t("firm_confirmed") || "Confirmed");
  };

  // save incident
  const handleSave = async () => {
    if (!description.trim() || !vetName.trim() || !type) {
      Alert.alert(I18n.t("alert_obli") || "Error’, Please complete all required fields");
      return;
    }

    if (!signatureConfirmed) {
      Alert.alert(I18n.t("error"), I18n.t("please_confirm_signature") || "Please confirm the signature.");
      return;
    }

    const incident = {
      date: date.toISOString(),
      type,
      description,
      product,
      productImage,
      vetName,
      signature: signatureDataUrl,
    };

    try {
      await addMedicalIncident(petId, incident);
      Alert.alert("✅ " + (I18n.t("alert_sus") || "Success, Incident saved successfully"));
      navigation.goBack();
    } catch (e) {
      console.error("save incident error:", e);
      Alert.alert(I18n.t("error") || "Error", I18n.t("save_failed") || "Save failed");
    }
  };

  return (
    <LinearGradient colors={["#c8e7ff", "#eaf3ff", "#ffffff"]} style={styles.background}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.container}
        enableOnAndroid={true}
        extraScrollHeight={120}
        enableAutomaticScroll={true}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={!isSigning}
      >
        <Text style={styles.title}>{I18n.t("add_imed")}</Text>

        {/* Fecha */}
        <View style={styles.dateWrapper}>
          <TouchableOpacity onPress={showDatePicker} style={styles.dateButton}>
            <Text style={styles.dateText}>{I18n.t("date")} {date.toLocaleDateString()}</Text>
          </TouchableOpacity>

          {Platform.OS === "ios" ? (
            <Modal visible={isDatePickerVisible} transparent animationType="slide" onRequestClose={cancelIOSDate}>
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalContentText}>{I18n.t("sel_date")}</Text>

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

        {/* Tipo */}
        <View style={styles.pickerContainer}>
          <TypePicker value={type} onValueChange={setType} options={options} />
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
            <Text style={styles.imagePlaceholder}>📷 {I18n.t("product_im")}</Text>
          )}
        </TouchableOpacity>

        {/* Nombre veterinario */}
        <TextInput
          style={styles.input}
          placeholder="Dr. ..."
          value={vetName}
          onChangeText={setVetName}
        />

        {/* Firma */}
        <Text style={styles.label}>{I18n.t("vet_sig")}</Text>

        <View style={styles.signatureContainer}>
          <Signature
            ref={signatureRef}
            onBegin={handleSignatureBegin}
            onEnd={() => setIsSigning(false)}
            onOK={handleSignatureOK}
            onEmpty={() => {
              setSignatureDataUrl(null);
              setSignatureConfirmed(false);
            }}
            clearText={I18n.t("clean")}
            confirmText={I18n.t("confirm")}
            webStyle={signatureWebStyle}
            backgroundColor="transparent"
            autoClear={false}
            penColor="black"
            dotSize={1.5}
          />
        </View>

        {/* Firma preview */}
        {signatureDataUrl ? (
          <>
            <Text style={styles.label}>{I18n.t("prev_sig")}</Text>
            <Image source={{ uri: signatureDataUrl }} style={styles.preview} />
          </>
        ) : null}

        {/* Firma controls: limpiar / leer (confirmar desde canvas) / confirmar */}
        <View style={styles.signatureControls}>
          <TouchableOpacity style={styles.sigBtn} onPress={handleClearSignature}>
            <Text style={styles.sigBtnText}>{I18n.t("clean")}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.sigBtn} onPress={confirmSignatureFromCanvas}>
            <Text style={styles.sigBtnText}>{I18n.t("confirm")}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sigBtn, signatureConfirmed ? styles.sigBtnActive : null]}
            onPress={handleConfirmSignature}
          >
            <Text style={[styles.sigBtnText, signatureConfirmed ? styles.sigBtnTextActive : null]}>
              {signatureConfirmed ? (I18n.t("firm_confirmed") || "Confirmada") : (I18n.t("firm_confirm") || "Confirmar firma")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Guardar */}
        <TouchableOpacity
          style={[styles.saveButton, !signatureConfirmed && styles.saveButtonDisabled]}
          disabled={!signatureConfirmed}
          onPress={handleSave}
        >
          <Text style={styles.saveText}>💾 {I18n.t("save_histo")}</Text>
        </TouchableOpacity>

        {/* Volver */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>{I18n.t("back")}</Text>
        </TouchableOpacity>
      </KeyboardAwareScrollView>
    </LinearGradient>
  );
};

const signatureWebStyle = `
  .m-signature-pad { box-shadow: none !important; border: none !important; }
  .m-signature-pad--body { border-radius: 12px !important; background-color: transparent !important; }
  /* mostramos footer nativo (si existiera) pero igual tenemos botones nativos en RN */
  .m-signature-pad--footer { display: none !important; }
`;

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: {
    flexGrow: 1,
    padding: 20,
    alignItems: "center",
    paddingBottom: 40,
  },
  title: {
    padding: 0,
    marginTop: 20,
    fontSize: 25,
    fontWeight: "700",
    color: "#2c2688",
  },
  dateWrapper: { width: "100%", marginTop: 12 },
  dateButton: {
    width: "100%",
    height: 48,
    padding: 10,
    backgroundColor: "rgba(76, 138, 237, 0.12)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(46,86,146,0.12)",
    justifyContent: "center",
  },
  dateText: { fontSize: 16, color: "#214d7a" },

  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
  modalContent: {
    marginBottom: 0,
    borderRadius: 20,
    width: "100%",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 18,
  },
  modalContentText: { color: "#333", fontWeight: "700", fontSize: 18, marginBottom: 8 },
  modalCon: { width: "100%" },
  modalButtons: { width: "100%", flexDirection: "row", justifyContent: "space-between", marginTop: 12 },
  modBut: { flex: 1, paddingVertical: 10, marginRight: 6, borderRadius: 8, backgroundColor: "#f0f0f0", alignItems: "center" },
  modBut1: { flex: 1, paddingVertical: 10, marginLeft: 6, borderRadius: 8, backgroundColor: "#4E8BED", alignItems: "center" },
  modButText: { fontWeight: "bold", color: "#333" },
  modButText1: { fontWeight: "bold", color: "#fff" },

  pickerContainer: { width: "100%", marginTop: 12 },
  input: {
    width: "100%",
    minHeight: 48,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    textAlignVertical: "top",
  },

  imagePicker: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
    height: 140,
    borderRadius: 10,
    marginTop: 10,
  },
  imagePlaceholder: { color: "#666" },
  image: { width: "100%", height: "100%", borderRadius: 8, resizeMode: "cover" },

  label: { width: "100%", marginTop: 12, fontWeight: "700", color: "#2a5daa", textAlign: "center" },

  signatureContainer: {
    width: "100%",
    height: 190,
    backgroundColor: "transparent",
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 8,
    borderWidth: 1,
    borderColor: "rgba(46,86,146,0.08)",
  },

  preview: { width: "100%", height: 120, marginTop: 8, borderRadius: 8 },

  signatureControls: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  sigBtn: {
    flex: 1,
    marginHorizontal: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#e6eefb",
    alignItems: "center",
    justifyContent: "center"
  },
  sigBtnActive: { backgroundColor: "#A06CD5" },
  sigBtnText: { color: "#214d7a", fontWeight: "600",textAlign: "center", justifyContent: "center" },
  sigBtnTextActive: { color: "#fff" },

  saveButton: {
    width: "100%",
    backgroundColor: "#4CAF50",
    padding: 14,
    borderRadius: 50,
    marginTop: 14,
    alignItems: "center",
  },
  saveButtonDisabled: { backgroundColor: "#9bbaf0" },
  saveText: { color: "#fff", fontSize: 17, fontWeight: "700" },

  backButton: {
    backgroundColor: "#2195f3ff",
    padding: 14,
    borderRadius: 50,
    marginTop: 6,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  backText: { color: "#fff", fontSize: 17, fontWeight: "600" },
});

export default AddIncidentScreen;
