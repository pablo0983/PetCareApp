import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ImageBackground, Image, Alert } from 'react-native';
import { getMedicalIncidents } from '../services/localStorage';
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import I18n from '../src/locales/i18n.js'; 

const MedicalHistoryScreen = ({ route, navigation }) => {
  const { petId } = route.params;
  const [incidents, setIncidents] = useState([]);

  useEffect(() => {
    loadIncidents();
  }, []);

  const loadIncidents = async () => {
    const data = await getMedicalIncidents(petId);
    setIncidents(data);
  };
  const generatePDF = async () => {
  if (incidents.length === 0) {
    Alert.alert("Sin datos", "No hay incidencias para exportar 🐾");
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
    console.log("✅ PDF generado en:", uri);

    // 📤 Compartir o imprimir
    await Sharing.shareAsync(uri);
  } catch (error) {
    Alert.alert("Error", "No se pudo generar el PDF.");
  }
};

  return (
    <ImageBackground
      source={require("../assets/fondodos.jpg")} // 🔥 agrega tu imagen aquí
      style={styles.background}
      resizeMode="cover" // puedes usar "contain" o "stretch"
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
            <Text style={styles.pdfText}>{I18n.t("export_pdf")}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>{I18n.t("back")}</Text>
          </TouchableOpacity>
        </View>
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
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: '#d5dc70e4',
    alignItems: 'center', 
  },
  title: { 
    fontSize: 26, 
    fontWeight: "bold", 
    textAlign: "center", 
    marginBottom: 15,
    marginTop: 40 
  },
  empty: { 
    textAlign: 'center', 
    color: '#888', 
    marginTop: 50 
  },
  buttons: {
    width: "100%"
  },
  card: { 
    padding: 8, 
    borderBottomWidth: 4, 
    borderColor: '#258408ff',
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 12,
    marginTop: 20,
    display: "flex"
  },
  info: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
  },
  productImage: {
    width: 90,
    height: 90,
    borderRadius: 10,
    marginLeft: 10,
    borderWidth: 2,
    borderColor: "#4caf4fff",
  },
  date: { 
    fontSize: 16, 
    color: '#070707ff' 
  },
  desc: { 
    fontSize: 18,
    fontWeight: '500',
    fontStyle: 'italic', 
    flex: 1 
  },
  list: { 
    width: '100%',
    marginTop: 10 
  },
  pdfButton: {
  width: '100%',
  backgroundColor: '#4caf50',
  padding: 15,
  borderRadius: 12,
  marginBottom: 20
  },
  pdfText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center'
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

export default MedicalHistoryScreen;
