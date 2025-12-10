import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ImageBackground, Image, Alert } from 'react-native';
import { getMedicalIncidents } from '../services/localStorage';
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import I18n from '../src/locales/i18n.js'; 
import { LinearGradient } from "expo-linear-gradient";

const MedicalHistoryScreen = ({ route, navigation }) => {
  const { petId } = route.params;
  const [incidents, setIncidents] = useState([]);

  useFocusEffect(
  useCallback(() => {
    loadIncidents();
  }, [])
);

  const loadIncidents = async () => {
    const data = await getMedicalIncidents(petId);
    setIncidents(data);
  };
  const generatePDF = async () => {
  if (incidents.length === 0) {
    Alert.alert(I18n.t("no_data"));
    return;
  }

  // 🧠 Crear contenido HTML del PDF
  const htmlContent = `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: Arial; padding: 20px; }
          h1 { text-align: center; color: #4CAF50; }
          .card {
            border: 2px solid #4CAF50;
            border-radius: 10px;
            padding: 10px;
            margin-bottom: 15px;

          }
          .date { font-size: 14px; color: #333; }
          .desc { font-size: 16px; margin: 4px 0; }
          .signature {
            width: 55px;
            height: 55px;
            margin-top: 12px;
            border-top: 1px solid #000000ff;
            padding-top: 4px;
          }
        </style>
      </head>
      <body>
        <h1>📋 Historial Médico</h1>
        ${incidents
          .map(
            (item) => `
          <div class="card">
            <p class="date">📅 ${new Date(item.date).toLocaleDateString("es-ES")}</p>
            <p class="desc">🩺 ${item.type}</p>
            <p class="desc">📋 ${item.description}</p>
            <p class="desc">💊 ${item.product}</p>
            <p class="desc">👨‍⚕️ ${item.vetName}</p>
            <p class="desc">✍️ Firma:</p>
            <img src="${item.signature}" class="signature"/>       
          </div>
        `
          )
          .join("")}
      </body>
    </html>
  `;

  try {
    // 🖨️ Generar el PDF
    const { uri } = await Print.printToFileAsync({ html: htmlContent });

    // 📤 Compartir o imprimir
    await Sharing.shareAsync(uri);
  } catch (error) {
    Alert.alert(I18n.t("error_pdf"));
  }
};

  return (
    <LinearGradient
      colors={["#E8FFF3", "#D7F7F0", "#C2EFEA"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.background}
    >
      <View style={styles.container}>
        <Text style={styles.title}>{I18n.t("medical_history")}</Text>
        {incidents.length === 0 ? (
          <Text style={styles.empty}>{I18n.t("no_records")}</Text>
        ) : (
          <FlatList
            style={styles.list}
            data={incidents}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style= {styles.info}>
                  <Text style={styles.date}>
                    📅 {new Date(item.date).toLocaleDateString()}
                  </Text>
                  <Text style={styles.desc}>🩺{item.type}</Text>
                  <Text style={styles.desc}>📋{item.description}</Text>
                  <Text style={styles.desc}>💊{item.product}</Text>
                  <Text style={styles.desc}>👨‍⚕️{item.vetName}</Text>
                </View>
                {/* 🖼️ Mostrar imagen del producto si existe */}
                {item.productImage && (
                   <Image
                    source={{ uri: item.productImage }}
                    style={styles.productImage}
                    resizeMode="cover"
                  />
                 )}
              </View>
            )}
          />
        )}
        <View style={styles.buttons}>
          <TouchableOpacity style={styles.pdfButton} onPress={generatePDF}>
            <Text style={styles.buttonText}>{I18n.t("export_pdf")}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>{I18n.t("back")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },

  container: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.6)",
  },

  title: {
    fontSize: 30,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 20,
    marginTop: 45,
    color: "#2D2A32",
  },

  empty: {
    textAlign: "center",
    color: "#777",
    fontSize: 16,
    marginTop: 50,
    fontStyle: "italic",
  },

  list: {
    width: "100%",
    marginTop: 10,
  },

  card: {
    width: "100%",
    backgroundColor: "#FFFFFFEE",
    padding: 15,
    borderRadius: 16,
    marginBottom: 18,
    flexDirection: "row",
    alignItems: "center",

    // ⭐ Sombra estilo iOS
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 6,
    shadowOffset: { height: 3 },
    elevation: 3,

    borderLeftWidth: 6,
    borderLeftColor: "#6CC17E",
  },

  info: {
    flexDirection: "column",
    flex: 1,
  },

  productImage: {
    width: 85,
    height: 85,
    borderRadius: 12,
    marginLeft: 15,
    borderWidth: 2,
    borderColor: "#6CC17E",
  },

  date: {
    fontSize: 14,
    color: "#6A6A6A",
    marginBottom: 4,
  },

  desc: {
    fontSize: 17,
    fontWeight: "500",
    color: "#2D2A32",
    marginBottom: 2,
  },

  buttons: {
    width: "100%",
    marginTop: 10,
  },

  pdfButton: {
    alignItems: "center",
    backgroundColor: "#1ba363d6",
    padding: 14,
    borderRadius: 50,
    marginTop: 6,
    width: "100%",
    paddingVertical: 15,
    marginBottom: 20,

    shadowColor: "#4A90E2",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 2,
  },

  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },

  backButton: {
    alignItems: "center",
    backgroundColor: "#2195f3ff",
    padding: 14,
    borderRadius: 50,
    marginTop: 6,
    width: "100%",
    paddingVertical: 15,
    marginBottom: 20,

    shadowColor: "#4A90E2",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 2,
  },

  backText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
});


export default MedicalHistoryScreen;
