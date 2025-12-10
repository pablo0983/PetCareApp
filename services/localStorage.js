import AsyncStorage from '@react-native-async-storage/async-storage';

// 🐾 Guardar mascota
export const addPet = async (pet) => {
  try {
    const jsonValue = await AsyncStorage.getItem('pets');
    const currentPets = jsonValue ? JSON.parse(jsonValue) : [];
    const newPet = { id: Date.now().toString(), ...pet };
    const updatedPets = [...currentPets, newPet];
    await AsyncStorage.setItem('pets', JSON.stringify(updatedPets));
    return newPet;
  } catch (e) {
    console.error('Error guardando mascota:', e);
  }
};

// 🐾 Obtener todas las mascotas
export const getPets = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem('pets');
    return jsonValue ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error('Error obteniendo mascotas:', e);
    return [];
  }
};

// 🐾 Obtener mascota por ID
export const getPetById = async (id) => {
  try {
    const pets = await getPets();
    return pets.find((p) => p.id === id) || null;
  } catch (e) {
    console.error('Error obteniendo mascota:', e);
    return null;
  }
};

// 🐾 Actualizar mascota
export const updatePet = async (id, updatedData) => {
  try {
    const pets = await getPets();
    const newPets = pets.map((p) =>
      p.id === id ? { ...p, ...updatedData } : p
    );
    await AsyncStorage.setItem('pets', JSON.stringify(newPets));
    return newPets;
  } catch (e) {
    console.error('Error actualizando mascota:', e);
  }
};

// 🐾 Eliminar mascota
export const deletePet = async (id) => {
  try {
    const pets = await getPets();
    const updatedPets = pets.filter((p) => p.id !== id);
    await AsyncStorage.setItem('pets', JSON.stringify(updatedPets));
    await AsyncStorage.removeItem(`incidents_${id}`); // elimina incidencias también
    return updatedPets;
  } catch (e) {
    console.error('Error eliminando mascota:', e);
  }
};

// 🏥 Agregar incidencia médica
export const addMedicalIncident = async (petId, incident) => {
  try {
    const key = `incidents_${petId}`;
    const stored = JSON.parse(await AsyncStorage.getItem(key)) || [];
    const newIncident = { id: Date.now().toString(), ...incident };
    const updated = [...stored, newIncident];
    await AsyncStorage.setItem(key, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Error guardando incidencia:', e);
  }
};

// 🏥 Obtener incidencias
export const getMedicalIncidents = async (petId) => {
  try {
    const key = `incidents_${petId}`;
    return JSON.parse(await AsyncStorage.getItem(key)) || [];
  } catch (e) {
    console.error('Error obteniendo incidencias:', e);
    return [];
  }
};

// 📝 Guardar registro de peso histórico
export const addWeightRecord = async (petId, weight) => {
  const key = `weight_history_${petId}`;
  const stored = JSON.parse(await AsyncStorage.getItem(key)) || [];

  const newRecord = { 
    date: new Date().toISOString(),
    weight: weight
  };

  stored.push(newRecord);

  await AsyncStorage.setItem(key, JSON.stringify(stored));
  return stored;
};

// 📝 Obtener historial de peso
export const getWeightHistory = async (petId) => {
  const key = `weight_history_${petId}`;
  return JSON.parse(await AsyncStorage.getItem(key)) || [];
};
