import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from './screens/HomeScreen';
import PetListScreen from './screens/PetListScreen';
import AddPetScreen from './screens/AddPetScreen';
import PetProfileScreen from './screens/PetProfileScreen';
import AddIncidentScreen from './screens/AddIncidentScreen';
import MedicalHistoryScreen from './screens/MedicalHistoryScreen';
import RemindersScreen from './screens/RemindersScreen';
import * as Notifications from "expo-notifications";
import * as Localization from 'expo-localization';
import I18n from './src/locales/i18n';


Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,   
    shouldSetBadge: false,
  }),
});

const Stack = createNativeStackNavigator();

export default function App() {
  const [localeLoaded, setLocaleLoaded] = useState(false);

 useEffect(() => {
  try {
    const locales = Localization.getLocales?.(); 
    let language = 'en'; 

    if (Array.isArray(locales) && locales.length > 0) {
      const tag = locales[0].languageTag;
      language = tag.split('-')[0];
    } else if (Localization.locale) {
      // fallback si getLocales no existe
      language = Localization.locale.split('-')[0];
    }

    I18n.locale = language;
  } catch (e) {
    I18n.locale = 'en';
  }

  setLocaleLoaded(true);
}, []);

  if (!localeLoaded) {
    return <View><Text>Cargando...</Text></View>;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="PetList" component={PetListScreen} />
        <Stack.Screen name="AddPet" component={AddPetScreen} />
        <Stack.Screen name="PetProfile" component={PetProfileScreen} />
        <Stack.Screen name="AddIncidentScreen" component={AddIncidentScreen} />
        <Stack.Screen name="MedicalHistoryScreen" component={MedicalHistoryScreen} />
        <Stack.Screen name="Reminders" component={RemindersScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
