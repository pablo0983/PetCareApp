import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ImageBackground, PixelRatio } from 'react-native';
import I18n from '../src/locales/i18n';
import { Dimensions } from 'react-native';

const scaleFont = (size) => size * PixelRatio.getFontScale();
const { width, height } = Dimensions.get('window');
const HomeScreen = ({ navigation }) => {
  return (
    <ImageBackground
      source={require("../assets/fondouno.jpg")}
      style={styles.background}
      resizeMode="cover" 
    >
      <View style={styles.container}>
        {/* Header con imagen */}
        
        <View style={styles.textConteiner}>
          <Text style={styles.title}>{I18n.t('welcome')}</Text>
          <Text style={styles.title2}>{I18n.t('welcome2')}</Text>
        </View>
        <Image
          source={require('../assets/pets-header.png')}
          style={styles.headerImage}
        />
        {/* Botones principales */}
        <View style={styles.buttonsContainer}>
         <TouchableOpacity
          style={styles.bigButton}
            onPress={() => navigation.navigate('PetList')}
         >
            <Text style={styles.buttonText}>🐾  {I18n.t('pet_list')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bigButton2}
            onPress={() => navigation.navigate('AddPet')}
          >
            <Text style={styles.buttonText}>➕ {I18n.t('add_pet')}</Text>
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
    alignItems: 'center',
    justifyContent: 'space-evenly',
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingHorizontal: width * 0.02,
    display: 'flex',
    flexDirection: 'column'
  },
  headerImage: { 
    width: '90%',
    flex: 0.7,
    marginBottom: height * 0.03,
    resizeMode: 'contain',
    padding: 0
  },
  buttonsContainer: {
    width: '100%'
  }, 
  title: {
    fontSize: scaleFont(33), 
    fontWeight: 'bold', 
    marginTop: height * 0.03, 
    textAlign: 'center',
    color: '#634040ff',
    padding: 0 
  },
  title2: {
    fontSize: scaleFont(44),
    fontWeight: 'bold', 
    marginTop: height * 0.03, 
    textAlign: 'center',
    color: '#634040ff',
    padding: 0
  },
  bigButton: {
    width: '100%',
    backgroundColor: '#2195f3ce',
    paddingVertical: height * 0.02,
    borderRadius: 12,
    marginBottom: height * 0.02
  },
  bigButton2: {
    width: '100%',
    backgroundColor: '#4caf4fd8',
    paddingVertical: height * 0.02,
    borderRadius: 12,
    marginBottom: height * 0.02
  },
  buttonText: { 
    color: 'white', 
    fontSize: width * 0.07, 
    textAlign: 'center', 
    fontWeight: 'bold' 
  },
});

export default HomeScreen;
