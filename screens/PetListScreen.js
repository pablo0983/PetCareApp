import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Image, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { getPets, deletePet } from '../services/localStorage';
import I18n from '../src/locales/i18n';

const PetListScreen = ({ navigation }) => {
  const [pets, setPets] = useState([]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadPets);
    return unsubscribe;
  }, [navigation]);

  const loadPets = async () => {
    const data = await getPets();
    setPets(data);
  };

  const handleDelete = async (id) => {
    await deletePet(id);
    loadPets();
  };

  const getSpeciesEmoji = (species) => {
    if (!species) return '❓';
    const s = species.toLowerCase();
    if (s.includes('dog')) return '🐶';
    if (s.includes('cat')) return '🐱';
    if (s.includes('rabbit')) return '🐰';
    if (s.includes('hamster')) return '🐹';
    return '🐾';
  };

  return (
    <View style={styles.background}>
      
      {/* Fondo pastel premium */}
      <LinearGradient
        colors={["#F8C8DC", "#B5D6FF", "#C8F7C5"]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <View style={styles.container}>
        
        <FlatList
          data={pets}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 30}}
          renderItem={({ item }) => (
            <BlurView intensity={40} tint="light" style={styles.card}>
              
              <TouchableOpacity
                onPress={() => navigation.navigate('PetProfile', { petId: item.id })}
                style={styles.imageWrap}
              >
                {item.image ? (
                  <Image source={{ uri: item.image }} style={styles.image} />
                ) : (
                  <View style={styles.emojiContainer}>
                    <Text style={styles.emoji}>{getSpeciesEmoji(item.species)}</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.nameContainer}
                onPress={() => navigation.navigate('PetProfile', { petId: item.id })}
              >
                <Text style={styles.name}>{item.name}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleDelete(item.id)}
                style={styles.deleteButton}
              >
                <Text style={styles.deleteText}>✖</Text>
              </TouchableOpacity>
            </BlurView>
          )}
        />

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>{I18n.t("back")}</Text>
        </TouchableOpacity>

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1
  },

  gradient: {
    ...StyleSheet.absoluteFillObject
  },

  container: {
    flex: 1,
    padding: 20,
    paddingTop: 40
  },

  card: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: 20,
  padding: 8,
  borderRadius: 24,
  height: 100,

  ...(Platform.OS === "ios"
    ? {
        overflow: "hidden",
        backgroundColor: "rgba(255,255,255,0.15)",
        borderColor: "rgba(255,255,255,0.35)",
        shadowColor: "#000",
        shadowOpacity: 0.10,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 4 },
      }
    : {
        backgroundColor: "rgba(255,255,255,0.28)",
        borderRadius: 24,
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



  imageWrap: {
    width: 100,
    height: "100%"
  },

  image: {
    width: 100,
    height: "100%",
    borderRadius: 20
  },

  emojiContainer: {
    width: 100,
    height: "100%",
    justifyContent: "center",
    alignItems: "center"
  },

  emoji: {
    fontSize: 70
  },

  nameContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 15,
  },

  name: {
    fontSize: 32,
    fontWeight: "700",
    color: "#333"
  },

  deleteButton: {
    width: 60,
    justifyContent: "center",
    alignItems: "center"
  },

  deleteText: {
    fontSize: 32,
    color: "#C62828",
    fontWeight: "bold"
  },

  backButton: {
    width: "100%",
    backgroundColor: "#64B5F6",
    alignItems: "center",
    elevation: 3,
    padding: 14,
    borderRadius: 50,
    marginTop: 6,
    marginBottom: 20,
  },

  backText: {
    color: "#fff", 
    fontSize: 18, 
    fontWeight: "600"
  }
});

export default PetListScreen;
