import React, { useEffect, useState } from 'react';
import { 
  View, Text, Image, TouchableOpacity, StyleSheet, ImageBackground, 
  TextInput, Alert, ScrollView 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getPetById, updatePet } from '../services/localStorage';
import I18n from '../src/locales/i18n';

const PetProfileScreen = ({ route, navigation }) => {
  const { petId } = route.params;
  const [pet, setPet] = useState(null);
  const [editingWeight, setEditingWeight] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [foodRecommendation, setFoodRecommendation] = useState('');

  useEffect(() => {
    loadPet();
  }, []);

  const loadPet = async () => {
    const data = await getPetById(petId);
    if (data) {
      setPet(data);
      setNewWeight(data.weight?.toString() || '');
      const age = calculateAgeInMonthsOrYears(data.birthDate);
      setFoodRecommendation(getFoodRecommendation(data.species, data.weight, age, data.birthDate));
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      const updatedPet = { ...pet, image: result.assets[0].uri };
      setPet(updatedPet);
      await updatePet(petId, updatedPet);
    }
  };

  const calculateAgeInMonthsOrYears = (birthDate) => {
  if (!birthDate) return '';

  const today = new Date();
  const dob = new Date(birthDate);

  let years = today.getFullYear() - dob.getFullYear();
  let months = today.getMonth() - dob.getMonth();

  if (today.getDate() < dob.getDate()) {
    months -= 1; // si el día del mes aún no llegó
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const yearLabel = years === 1 ? I18n.t("year") : I18n.t("years");
  const monthLabel = months === 1 ? I18n.t("month") : I18n.t("months");

  if (years < 1) {
    return `${months} ${monthLabel}`;
  } else if (months === 0) {
    return `${years} ${yearLabel}`;
  } else {
    return `${years} ${yearLabel} ${I18n.t("and")} ${months} ${monthLabel}`;
  }
};

  const getRecommendationColor = (species) => {
    switch (species?.toLowerCase()) {
      case "dog": return "#a0d2eb";
      case "cat": return "#f4a261";
      case "rabbit": return "#9ae79a";
      case "hamster": return "#f7e67a";
      default: return "#f9f9f9";
    }
  };

  const getFoodRecommendation = (species, weight, ageDisplay, birthDate) => {
    if (weight === null || weight === undefined || weight === "" || !birthDate) 
      return I18n.t("missing");

    let emoji = '';
    const birth = new Date(birthDate);
    const today = new Date();
    const ageInMonths = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());

    switch (species?.toLowerCase()) {
      case "dog":
        emoji = '🐶';
        if (ageInMonths < 12) return `${emoji} ${I18n.t("puppy")}`;
        if (weight < 5) return `${emoji} ${I18n.t("small_Dog_Food")}`;
        if (weight < 15) return `${emoji} ${I18n.t("medium_Dog_Food")}`;
        if (weight < 30) return `${emoji} ${I18n.t("large_Dog_Food")}`;
        return `${emoji} ${I18n.t("giant_Dog_Food")}`;

      case "cat":
        emoji = '🐱';
        if (ageInMonths < 12) return `${emoji} ${I18n.t("kitten_Food")}`;
        if (weight < 3) return `${emoji} ${I18n.t("small_Cat_Food")}`;
        if (weight < 5) return `${emoji} ${I18n.t("medium_Cat_Food")}`;
        return `${emoji} ${I18n.t("large_Cat_Food")}`;

      case "rabbit":
        emoji = '🐰';
        if (ageInMonths < 3) return `${emoji} ${I18n.t("small_rabbit")}`;
        if (weight < 2) return `${emoji} ${I18n.t("medium_rabbit")}`;
        if (weight < 4) return `${emoji} ${I18n.t("large_rabbit")}`;
        return `${emoji} ${I18n.t("giant_rabbit")}`;

      case "hamster":
        emoji = '🐹';
        if (ageInMonths < 2) return `${emoji} ${I18n.t("small_hamster")}`;
        return `${emoji} ${I18n.t("medium_hamster")}`;

      default:
        return `${I18n.t("unknown_species")}`;
    }
  };

  useEffect(() => {
    if (pet) {
      const ageDisplay = calculateAgeInMonthsOrYears(pet.birthDate);
      const weightValue = parseFloat(newWeight);
      if (!isNaN(weightValue)) {
        setFoodRecommendation(getFoodRecommendation(pet.species, weightValue, ageDisplay, pet.birthDate));
      }
    }
  }, [newWeight, pet]);

  const saveWeight = async () => {
    const normalizedWeight = newWeight.replace(',', '.');
    const weightValue = parseFloat(normalizedWeight);

    if (!normalizedWeight || isNaN(weightValue)) {
      Alert.alert("⚠️ " + I18n.t("invalid_weight"));
     return;
    }
    const updatedPet = { ...pet, weight: weightValue };
    await updatePet(petId, updatedPet);
    setPet(updatedPet);
    setEditingWeight(false);
    Alert.alert("✅ " + I18n.t("update_weight"));
  };

  if (!pet) return <Text style={{ padding: 20 }}>{I18n.t("loading")}</Text>;

  return (
    <ImageBackground
      source={require("../assets/fondodos.jpg")}
      style={styles.background}
      resizeMode="cover"
    >
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity onPress={pickImage}>
          {pet.image ? (
            <Image source={{ uri: pet.image }} style={styles.image} />
          ) : (
            <View style={styles.emojiContainer}>
              <Text style={styles.emoji}>
                {pet.species?.includes("dog") ? "🐶" :
                 pet.species?.includes("cat") ? "🐱" :
                 pet.species?.includes("rabbit") ? "🐰" :
                 pet.species?.includes("hamster") ? "🐹" :
                 "🐾"}
              </Text>
            </View>
          )}
          <Text style={styles.editText}>{I18n.t("ch_im")}</Text>
        </TouchableOpacity>

        <Text style={styles.name}>{pet.name}</Text>

        <View style={styles.info}>
          <Text style={styles.infoText}>🐾 {I18n.t("pet_species")}: {I18n.t(`species.${pet.species}`)}</Text>
          <Text style={styles.infoText}>🐕 {I18n.t("breed")}: {pet.breed}</Text>
          <Text style={styles.infoText}>⚧ {I18n.t("sex")}: {pet.gender}</Text>
          <Text style={styles.infoText}>🎂 {I18n.t("age")}: {calculateAgeInMonthsOrYears(pet.birthDate)}</Text>

          <View style={styles.weightRow}>
            <Text style={styles.infoText}>⚖ {I18n.t("weight")}: </Text>
            {editingWeight ? (
              <>
                <TextInput
                  style={styles.weightInput}
                  keyboardType="numeric"
                  value={newWeight}
                  onChangeText={setNewWeight}
                />
                <TouchableOpacity onPress={saveWeight} style={styles.saveWeightBtn}>
                  <Text style={styles.saveWeightText}>💾</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity onPress={() => setEditingWeight(true)}>
                <Text style={[styles.infoText, styles.editableWeight]}>
                  {pet.weight} kg ✏️
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <Text 
            adjustsFontSizeToFit
            minimumFontScale={0.5} 
            numberOfLines={2}
            allowFontScaling
            style={styles.infoText}
          >
            {pet.notes}
          </Text>

          <View 
            style={[
              styles.recommendationBox, 
              { backgroundColor: getRecommendationColor(pet.species) }
            ]}
          >
            <Text style={styles.recommendationTitle}>🍖 {I18n.t("nutritional")}</Text>
            <Text style={styles.recommendationText}>{foodRecommendation}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('AddIncidentScreen', { petId })}
        >
          <Text style={styles.buttonText}>🩹{I18n.t("add_incident")}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button1}
          onPress={() => navigation.navigate('MedicalHistoryScreen', { petId })}
        >
          <Text style={styles.buttonText}>📜 {I18n.t("view_history")}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button2}
          onPress={() => navigation.navigate('Reminders', { petId })}
        >
          <Text style={styles.buttonText}>⏱️ {I18n.t("reminders")}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>{I18n.t("back")}</Text>
        </TouchableOpacity>
      </ScrollView>
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
    flexGrow: 1,
    padding: 20,
    backgroundColor: 'rgba(227, 227, 144, 0.8)',
    alignItems: 'center',
    justifyContent: 'flex-start'
  },
  image: { 
    marginTop: 25, 
    width: 200, 
    height: 200, 
    borderRadius: 100, 
    resizeMode: 'cover'
  },
  emojiContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#ffffffa8',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 25,
    borderWidth: 3,
    borderColor: '#6b705c',
  },
  emoji: {
    fontSize: 150,
  },
  editText: { 
    textAlign: 'center', 
    color: 'blue', 
    marginTop: 5, 
    fontSize: 15 
  },
  name: { 
    fontSize: 40, 
    fontWeight: 'bold', 
    textAlign: 'center', 
    marginTop: 10 
  },
  info: { 
    marginTop: 10, 
    alignItems: 'center', 
    width: '100%' 
  },
  infoText: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    marginVertical: 2 
  },
  weightRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginVertical: 8 
  },
  editableWeight: { 
    textDecorationLine: 'underline', 
    color: '#0077cc' 
  },
  weightInput: { 
    borderBottomWidth: 2, 
    borderColor: '#0077cc', 
    width: 80, 
    textAlign: 'center', 
    fontSize: 22, 
    marginRight: 12 
  },
  saveWeightBtn: { 
    backgroundColor: '#4caf4f', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 6 
  },
  saveWeightText: { 
    color: '#fff', 
    fontSize: 22 
  },
  recommendationBox: { 
    borderRadius: 12, 
    padding: 5, 
    marginTop: 5, 
    borderWidth: 1, 
    borderColor: "#ddd", 
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center' 
  },
  recommendationTitle: { 
    fontSize: 16, 
    fontWeight: "bold", 
    color: "#333", 
    marginBottom: 6 
  },
  recommendationText: { 
    fontSize: 14, 
    color: "#444" 
  },
  button: { 
    height: 60, 
    width: '100%', 
    backgroundColor: '#4caf4fd4', 
    borderRadius: 8, 
    marginTop: 4, 
    justifyContent: 'center' 
  },
  button1: { 
    height: 60, 
    width: "100%", 
    backgroundColor: '#2195f3e4', 
    borderRadius: 8, 
    marginTop: 4, 
    justifyContent: 'center' 
  },
  button2: { 
    height: 60, 
    width: "100%", 
    backgroundColor: '#cfa51edc', 
    borderRadius: 8, 
    marginTop: 4, 
    justifyContent: 'center' 
  },
  buttonText: { 
    color: '#fefefeff', 
    fontWeight: 'bold', 
    fontSize: 25, 
    textAlign: 'center' 
  },
  backText: { 
    color: '#fefefeff', 
    fontSize: 20, 
    fontWeight: 'bold' 
  },
  backButton: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    height: 50, 
    marginBottom: 25, 
    width: '100%', 
    backgroundColor: '#2195f39e', 
    padding: 5, 
    borderRadius: 12,
    marginTop: 4 
  }
});

export default PetProfileScreen;
