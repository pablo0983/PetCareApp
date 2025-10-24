import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  Dimensions,
} from "react-native";
import { BarCodeScanner } from "expo-barcode-scanner";
import * as Location from "expo-location";
import MapView, { Marker } from "react-native-maps";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width, height } = Dimensions.get("window");

export default function TagTrackerScreen() {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [lastScan, setLastScan] = useState(null);
  const [showMap, setShowMap] = useState(false);

  // pedir permisos
  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === "granted");
      await Location.requestForegroundPermissionsAsync();
    })();
  }, []);

  const handleBarCodeScanned = async ({ data }) => {
    setScanned(true);
    try {
      const location = await Location.getCurrentPositionAsync({});
      const newRecord = {
        id: Date.now().toString(),
        tagData: data,
        date: new Date().toISOString(),
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      // Guardar localmente
      const existing = JSON.parse(await AsyncStorage.getItem("tagRecords")) || [];
      existing.push(newRecord);
      await AsyncStorage.setItem("tagRecords", JSON.stringify(existing));

      setLastScan(newRecord);

      Alert.alert(
        "🐾 Tag leído",
        `Código: ${data}\nUbicación guardada correctamente.`,
        [
          { text: "Ver ubicación", onPress: () => setShowMap(true) },
          { text: "OK", onPress: () => setScanned(false) },
        ]
      );
    } catch (e) {
      Alert.alert("Error al obtener ubicación", e.message);
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.center}>
        <Text>Solicitando permisos...</Text>
      </View>
    );
  }
  if (hasPermission === false) {
    return (
      <View style={styles.center}>
        <Text>Sin permiso para usar la cámara</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 📷 Escáner */}
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
      />

      {/* 🔁 Botón para reintentar */}
      {scanned && (
        <TouchableOpacity style={styles.scanButton} onPress={() => setScanned(false)}>
          <Text style={styles.scanText}>🔁 Escanear otro</Text>
        </TouchableOpacity>
      )}

      {/* 🗺️ Modal con el mapa */}
      <Modal
        visible={showMap}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMap(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {lastScan ? (
              <>
                <Text style={styles.mapTitle}>Última ubicación</Text>
                <MapView
                  style={styles.map}
                  initialRegion={{
                    latitude: lastScan.latitude,
                    longitude: lastScan.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                >
                  <Marker
                    coordinate={{
                      latitude: lastScan.latitude,
                      longitude: lastScan.longitude,
                    }}
                    title={`Tag: ${lastScan.tagData}`}
                    description={new Date(lastScan.date).toLocaleString()}
                  />
                </MapView>
              </>
            ) : (
              <Text>No hay datos aún</Text>
            )}

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowMap(false)}
            >
              <Text style={styles.closeText}>Cerrar mapa</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scanButton: {
    position: "absolute",
    bottom: 60,
    backgroundColor: "#4caf50",
    padding: 14,
    borderRadius: 8,
  },
  scanText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: width * 0.9,
    height: height * 0.7,
    backgroundColor: "white",
    borderRadius: 16,
    overflow: "hidden",
    alignItems: "center",
  },
  map: {
    width: "100%",
    height: "85%",
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 10,
  },
  closeButton: {
    backgroundColor: "#333",
    padding: 10,
    width: "100%",
    alignItems: "center",
  },
  closeText: {
    color: "white",
    fontSize: 16,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
