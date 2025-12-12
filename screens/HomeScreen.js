import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, PixelRatio, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import I18n from '../src/locales/i18n';

const { width, height } = Dimensions.get("window");
const scaleFont = (size) => size * PixelRatio.getFontScale();

const HomeScreen = ({ navigation }) => {
  return (
    <View style={styles.background}>

      {/* Fondo profesional pastel */}
      <LinearGradient
        colors={[
           "#F8C8DC", // rosa pastel visible
           "#B5D6FF", // celeste pastel visible
           "#C8F7C5"  // verde pastel suave pero notorio
         ]}
         style={styles.gradient}
         start={{ x: 0, y: 0 }}
         end={{ x: 1, y: 1 }}
      />

      <View style={styles.container}>
        
        {/* Glass card */}
        <View style={styles.card}>
          
          <Text style={styles.title}>{I18n.t("welcome")}</Text>
          <Text style={styles.title2}>{I18n.t("welcome2")}</Text>

          <Image
            source={require("../assets/pets-header.png")}
            style={styles.headerImage}
          />
          
          <View style={styles.buttonsContainer}>

            <TouchableOpacity
              style={styles.bigButton}
              onPress={() => navigation.navigate("PetList")}
            >
              <Text style={styles.buttonText}>🐾 {I18n.t("pet_list")}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.bigButton2}
              onPress={() => navigation.navigate("AddPet")}
            >
              <Text style={styles.buttonText}>➕ {I18n.t("add_pet")}</Text>
            </TouchableOpacity>

          </View>
        </View>
      </View>
    </View>
  );
};


const styles = StyleSheet.create({
  background: {
    flex: 1,
  },

  gradient: {
    ...StyleSheet.absoluteFillObject,
  },

  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: width * 0.04,
  },

  card: {
  width: "92%",
  borderRadius: 25,
  paddingVertical: height * 0.04,
  paddingHorizontal: width * 0.05,
  alignItems: "center",

  // 👇 iOS mantiene la transparencia original (glassmorphism real)
  ...(Platform.OS === "ios"
    ? {
        backgroundColor: "rgba(255,255,255,0.35)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.45)",
        shadowColor: "#000",
        shadowOpacity: 0.10,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 4 },
      }
    : {
        // 👇 Android: SIN transparencias (esto evita el borde feo)
        backgroundColor: "rgba(255,255,255,0.28)",borderRadius: 24,
        overflow: "hidden",

        borderWidth: 0,
        borderColor: "transparent",

        elevation: 0, // sin bordes duros
        shadowColor: "#000",
        shadowOpacity: 0.10,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
      }),
},

  title: {
    fontSize: scaleFont(36),
    color: "#4A4A4A",
    fontWeight: "700",
    textAlign: "center",
  },

  title2: {
    fontSize: scaleFont(45),
    color: "#4A4A4A",
    fontWeight: "700",
    textAlign: "center",
    marginBottom: height * 0.02,
  },

  headerImage: {
    width: "80%",
    height: undefined,
    aspectRatio: 1.5,
    resizeMode: "contain",
    marginBottom: height * 0.03,
  },

  buttonsContainer: {
    width: "100%",
    marginTop: height * 0.02,
  },

  bigButton: {
    width: "100%",
    backgroundColor: "#64B5F6",
    paddingVertical: height * 0.02,
    borderRadius: 15,
    marginBottom: height * 0.02,
    elevation: 4,
  },

  bigButton2: {
    width: "100%",
    backgroundColor: "#81C784",
    paddingVertical: height * 0.02,
    borderRadius: 15,
    elevation: 4,
  },

  buttonText: {
    color: "white",
    fontSize: scaleFont(24),
    textAlign: "center",
    fontWeight: "700",
  },
});

export default HomeScreen;
