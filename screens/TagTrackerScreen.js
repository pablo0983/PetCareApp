import React, { useState, useEffect } from "react";
import { 
  View, Text, TouchableOpacity, StyleSheet, FlatList, 
  ImageBackground, Alert 
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import AsyncStorage from "@react-native-async-storage/async-storage";
import I18n from '../src/locales/i18n';
import { BarCodeScanner } from 'expo-barcode-scanner';
import * as Location from 'expo-location';
import NfcManager, { NfcTech } from 'react-native-nfc-manager';

const STORAGE_KEY = "@tags";

const TagTrackerScreen = ({ navigation }) => {
  const [tags, setTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState(null);
  const [showMapFull, setShowMapFull] = useState(false);

  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [scanningQR, setScanningQR] = useState(false);

  const [inputType, setInputType] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [locationPermission, setLocationPermission] = useState(false);

  useEffect(() => {
    loadTags();
    requestLocationPermission();
    NfcManager.start();
  }, []);

  const loadTags = async () => {
    try {
      const savedTags = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedTags) setTags(JSON.parse(savedTags));
    } catch (e) {
      console.error("Error cargando tags:", e);
    }
  };

  const saveTags = async (newTags) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newTags));
    } catch (e) {
      console.error("Error guardando tags:", e);
    }
  };

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setLocationPermission(status === 'granted');
    if (status !== 'granted') {
      Alert.alert("⚠️", "Permiso de ubicación denegado. Se usarán coordenadas simuladas.");
    }
  };

  const getCurrentLocation = async () => {
    if (!locationPermission) return null;
    try {
      const loc = await Location.getCurrentPositionAsync({});
      return { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
    } catch (e) {
      console.warn("Error obteniendo ubicación:", e);
      return null;
    }
  };

  const openMapFull = (tag) => {
    if (!tag?.location) {
      Alert.alert("Error", "No hay ubicación para este tag.");
      return;
    }
    setSelectedTag(tag);
    setShowMapFull(true);
  };

  const confirmTagInput = async () => {
    if (!inputValue.trim()) return;

    const currentLocation = await getCurrentLocation();
    const newTag = {
      id: Date.now().toString(),
      code: inputValue.trim(),
      type: inputType,
      location: currentLocation || { latitude: -34.9 + Math.random() * 0.02, longitude: -56.2 + Math.random() * 0.02 }
    };

    const newTags = [newTag, ...tags];
    setTags(newTags);
    saveTags(newTags);
    setScanningQR(false);
  };

  // QR Scanner
  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasCameraPermission(status === 'granted');
    })();
  }, []);

  const handleScanQR = () => {
    if (!hasCameraPermission) {
      Alert.alert("No hay permiso para usar la cámara");
      return;
    }
    setInputType("QR");
    setScanningQR(true);
  };

  const onBarCodeScanned = ({ data }) => {
    setInputValue(data);
    confirmTagInput();
  };

  // NFC Scanner
  const handleScanNFC = async () => {
    try {
      setInputType("NFC");
      await NfcManager.requestTechnology(NfcTech.Ndef);
      const tag = await NfcManager.getTag();
      setInputValue(tag.id || "NFC desconocido");
      confirmTagInput();
      NfcManager.cancelTechnologyRequest();
    } catch (ex) {
      console.warn(ex);
      NfcManager.cancelTechnologyRequest();
    }
  };

  // Full screen QR scanner
  if (scanningQR) {
    return (
      <View style={{ flex:1 }}>
        <BarCodeScanner
          onBarCodeScanned={onBarCodeScanned}
          style={{ flex:1 }}
        />
        <TouchableOpacity 
          style={styles.fullScreenCloseButton} 
          onPress={() => setScanningQR(false)}
        >
          <Text style={styles.buttonText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Full screen map
  if (showMapFull && selectedTag) {
    return (
      <View style={{ flex:1 }}>
        <MapView
          style={{ flex:1 }}
          initialRegion={{
            latitude: selectedTag.location.latitude,
            longitude: selectedTag.location.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          <Marker coordinate={selectedTag.location} title={selectedTag.code} />
        </MapView>
        <TouchableOpacity 
          style={styles.fullScreenCloseButton} 
          onPress={() => setShowMapFull(false)}
        >
          <Text style={styles.buttonText}>Cerrar Mapa</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Pantalla principal con mini mapas
  return (
    <ImageBackground
      source={require("../assets/fondodos.jpg")}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <Text style={styles.title}>📍 Tag Tracker</Text>

        <TouchableOpacity style={styles.button} onPress={handleScanQR}>
          <Text style={styles.buttonText}>📷 Escanear QR</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleScanNFC}>
          <Text style={styles.buttonText}>📡 Leer NFC</Text>
        </TouchableOpacity>

        <Text style={styles.subtitle}>Tags rastreados:</Text>

        {tags.length === 0 && <Text style={{ color: "#fff", fontSize: 18 }}>No hay tags registrados</Text>}

        <FlatList
          data={tags}
          style={styles.tagList}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.tagItem} 
              onPress={() => openMapFull(item)}
            >
              <Text style={styles.tagText}>{item.code} ({item.type})</Text>
              {/* Mini mapa */}
              {item.location && (
                <MapView
                  style={styles.miniMap}
                  initialRegion={{
                    latitude: item.location.latitude,
                    longitude: item.location.longitude,
                    latitudeDelta: 0.02,
                    longitudeDelta: 0.02,
                  }}
                  scrollEnabled={false}
                  zoomEnabled={false}
                  rotateEnabled={false}
                  pitchEnabled={false}
                >
                  <Marker coordinate={item.location} />
                </MapView>
              )}
            </TouchableOpacity>
          )}
        />

        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>{I18n.t("back")}</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: { flex: 1, width: "100%", height: "100%" },
  container: { flex:1, padding: 20, alignItems: "center", justifyContent: "flex-start", backgroundColor: "#8881c9da" },
  title: { fontSize: 36, fontWeight: "bold", marginBottom: 20, color: "#634040ff", marginTop: 20 },
  subtitle: { fontSize: 28, fontWeight: "bold", marginTop: 20, marginBottom: 10, color: "#634040ff" },
  button: { width: "100%", backgroundColor: "#4caf4fd8", paddingVertical: 18, borderRadius: 12, marginBottom: 12 },
  buttonText: { color: "#fff", fontSize: 22, textAlign: "center", fontWeight: "bold" },
  tagList: { width: "100%" },
  tagItem: { width: "100%", backgroundColor: "#28608ece", paddingVertical: 15, borderRadius: 12, marginBottom: 15, justifyContent: "center", textAlign: "center", overflow: "hidden" },
  tagText: { color: "#fff", fontSize: 18, textAlign: "center", marginBottom: 5 },
  miniMap: { width: "100%", height: 100, borderRadius: 12 },
  fullScreenCloseButton: { position: "absolute", bottom: 30, left: 20, right: 20, backgroundColor: "#7d7271eb", padding: 15, borderRadius: 12 },
  backText: { color: '#fefefeff', fontSize: 20, fontWeight: 'bold' },
  backButton: { alignItems: 'center', justifyContent: 'center', height: 50, marginBottom: 25, width: '100%', backgroundColor: '#2195f39e', padding: 5, borderRadius: 12, marginTop: 4 },
});

export default TagTrackerScreen;
