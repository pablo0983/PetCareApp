import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Image } from 'react-native';

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      {/* Logo opcional */}
      <Image
        source={require('../assets/icon.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>PetCareApp</Text>
      <ActivityIndicator size="large" color="#4CAF50" style={{ marginTop: 20 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
});
