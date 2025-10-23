import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Image, ImageBackground } from 'react-native';
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

  // 🐾 Devuelve el emoji según la especie
  const getSpeciesEmoji = (species) => {
    if (!species) return '❓';
    const normalized = species.toLowerCase();
    if (normalized.includes('dog')) return '🐶';
    if (normalized.includes('cat')) return '🐱';
    if (normalized.includes('rabbit')) return '🐰';
    if (normalized.includes('hamster')) return '🐹';
    return '🐾';
  };

  return (
    <ImageBackground
      source={require("../assets/fondodos.jpg")}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <View style={styles.cardContainer}>
          <FlatList
            data={pets}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <TouchableOpacity onPress={() => navigation.navigate('PetProfile', { petId: item.id })}>
                  {item.image ? (
                    <Image
                      source={{ uri: item.image }}
                      style={styles.image}
                    />
                  ) : (
                    <View style={styles.emojiContainer}>
                      <Text style={styles.emoji}>{getSpeciesEmoji(item.species)}</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <View style={styles.namecontainer}>
                  <TouchableOpacity onPress={() => navigation.navigate('PetProfile', { petId: item.id })}>
                    <Text
                      adjustsFontSizeToFit={true}
                      minimumFontScale={0.5}
                      numberOfLines={1}
                      allowFontScaling={true}
                      style={styles.name}
                    >
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteButton}>
                  <Text style={styles.deleteText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        </View>

        {/* Botón volver */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>{I18n.t("back")}</Text>
        </TouchableOpacity>
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
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.93)',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  cardContainer: {
    margin: 30,
    width: '100%',
    height: '85%',
    display: 'flex',
    flexDirection: 'column'
  },
  card: {
    marginTop: 10,
    backgroundColor: '#e1f3b4c2',
    borderBottomColor: '#39843bff',
    borderBottomWidth: 4,
    borderRightColor: '#39843bff',
    borderRightWidth: 4,
    width: '100%',
    height: 100,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 12
  },
  image: {
    width: 100,
    height: '100%',
    borderRadius: 12,
  },
  emojiContainer: {
    width: 100,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: 'tranparent',
  },
  emoji: {
    fontSize: 70,
    padding: 0,
  },
  namecontainer: {
    width: 200,
    height: "100%",
    justifyContent: 'center',
    alignItems: 'center'
  },
  name: {
    color: '#422626ea',
    fontSize: 50,
    fontStyle: 'italic',
    fontWeight: 'bold',
  },
  deleteButton: {
    height: '100%',
    width: 50,
    alignItems: 'center',
    justifyContent: 'center'
  },
  deleteText: {
    fontSize: 35,
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

export default PetListScreen;
