// screens/PetProfileScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Polyline, Circle, Line, Rect, Text as SvgText } from "react-native-svg";

import {
  getPetById,
  updatePet,
  addWeightRecord,
  getWeightHistory,
} from "../services/localStorage";
import I18n from "../src/locales/i18n";

/* ---------------------- CÁLCULOS NUTRICIONALES (AHORA INCLUYE HAMSTER & RABBIT) ---------------------- */
const calculateProfessionalFeeding = (
  species,
  weight,
  birthDate,
  foodKcalPer100g = 350,
  activity = "normal",
  esterilizado = false,
  estadoCorporal = null,
  condicionEspecial = null
) => {
  if (!weight || !birthDate) return I18n.t("missing");

  const birth = new Date(birthDate);
  const today = new Date();
  const ageMonths = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
  const ageYears = ageMonths / 12;

  // RER (base)
  const RER = 70 * Math.pow(weight, 0.75);

  // MER por especie/etapa (factores según Opción B para hamster y rabbit)
  let MER = RER;

  const sp = (species || "").toLowerCase();

  if (sp === "dog" || sp === "perro") {
    if (ageMonths < 4) MER = RER * 3.0;
    else if (ageMonths < 12) MER = RER * 2.0;
    else {
      MER = esterilizado ? RER * 1.4 : RER * 1.8;
      if (ageYears >= 8) MER = RER * 1.4;
      if (estadoCorporal && estadoCorporal >= 7) MER = RER * 1.0;
      if (condicionEspecial === "renal") MER = RER * 1.2;
      if (condicionEspecial === "cardiaco") MER = RER * 1.3;
    }
  } else if (sp === "cat" || sp === "gato") {
    if (ageMonths < 12) MER = RER * 2.5;
    else {
      MER = esterilizado ? RER * 1.1 : RER * 1.4;
      if (ageYears >= 10) MER = RER * 1.1;
      if (estadoCorporal && estadoCorporal >= 7) MER = RER * 0.8;
      if (condicionEspecial === "renal") MER = RER * 1.1;
    }
  } else if (sp === "hamster") {
    // Hamsters: metabolismo relativamente alto — usar factor mayor (ej: MER ~ 2.5 × RER)
    // Nota: los hamsters suelen medirse en gramos; aquí asumimos kg como en el resto del sistema
    if (ageMonths < 2) MER = RER * 3.0;
    else MER = RER * 2.5;
    // ajuste actividad
    if (estadoCorporal && estadoCorporal >= 8) MER = RER * 1.6;
  } else if (sp === "rabbit" || sp === "conejo") {
    // Rabbits: factor cercano a 1.8 para adulto, más en crecimiento
    if (ageMonths < 4) MER = RER * 2.5;
    else MER = RER * 1.8;
    if (estadoCorporal && estadoCorporal >= 8) MER = RER * 1.4;
    if (condicionEspecial === "renal") MER = RER * 1.1;
  } else {
    // fallback genérico
    MER = RER * 1.5;
  }

  // Ajuste por actividad (baja / normal / alta)
  const activityFactors = { baja: 0.9, normal: 1.0, alta: 1.2 };
  const actFactor = activityFactors[activity] || 1.0;
  MER = MER * actFactor;

  // Gramos por día según kcal/100g
  const gramsPerDay = foodKcalPer100g ? (MER / foodKcalPer100g) * 100 : null;

  // Planes
  const gramsLoss = gramsPerDay ? Math.round(gramsPerDay * 0.8) : null; // ~20% déficit
  const gramsGain = gramsPerDay ? Math.round(gramsPerDay * 1.15) : null; // ~15% superávit

  return {
    RER: Math.round(RER),
    MER: Math.round(MER),
    gramsPerDay: gramsPerDay ? Math.round(gramsPerDay) : null,
    gramsLoss,
    gramsGain,
    factor: (MER / RER).toFixed(2),
    text:
      `${sp === "cat" ? "🐱" : sp === "dog" ? "🐶" : sp === "hamster" ? "🐹" : sp === "rabbit" ? "🐰" : "🐾"} ` +
      `${I18n.t("daily_energy")}: ${Math.round(MER)} kcal\n` +
      `🍽️ ${I18n.t("recommended_grams")}: ${gramsPerDay ? Math.round(gramsPerDay) : "-"} g/día\n` +
      `🔻 ${I18n.t("to_lose")}: ${gramsLoss ? gramsLoss : "-"} g/día\n` +
      `🔺 ${I18n.t("to_gain")}: ${gramsGain ? gramsGain : "-"} g/día\n` +
      `📏 RER: ${Math.round(RER)} kcal\n` +
      `🔧 MER: ${(MER / RER).toFixed(2)}x`,
  };
};

/* ---------------------- PLAN DE PESO ---------------------- */
const calculateWeightPlan = (weight, species) => {
  if (!weight) return "";
  const targetLoseKgPerWeek = Number((weight * 0.02).toFixed(2)); // 2% semanal
  const targetGainKgPerWeek = Number((weight * 0.015).toFixed(2)); // 1.5% semanal
  return `${I18n.t("recommended_loss")}: ${targetLoseKgPerWeek} kg / ${I18n.t("per_week")}\n` +
         `${I18n.t("recommended_gain")}: ${targetGainKgPerWeek} kg / ${I18n.t("per_week")}`;
};

/* ---------------------- COMPONENTE ---------------------- */
const PetProfileScreen = ({ route, navigation }) => {
  const petId = route?.params?.petId;

  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);

  const [editingWeight, setEditingWeight] = useState(false);
  const [newWeight, setNewWeight] = useState("");

  const [weightHistory, setWeightHistory] = useState([]);
  const [weightPlan, setWeightPlan] = useState("");

  const [foodKcal, setFoodKcal] = useState("350");
  const [editingFood, setEditingFood] = useState(false);

  const [recommendation, setRecommendation] = useState("");
  const [activityLevel, setActivityLevel] = useState("normal"); // baja, normal, alta
  const [esterilizado, setEsterilizado] = useState(false);
  const [estadoCorporal, setEstadoCorporal] = useState(null); // 1-9


  useEffect(() => {
    if (!petId) {
      Alert.alert(I18n.t("error"));
      setLoading(false);
      return;
    }
    loadPet();
  }, [petId]);

  const loadPet = async () => {
    setLoading(true);
    try {
      const data = await getPetById(petId);
      if (!data) {
        Alert.alert(I18n.t("error"), I18n.t("pet_not_found"));
        setLoading(false);
        return;
      }

      setPet(data);
      setNewWeight(data.weight?.toString() || "");
      setFoodKcal(data.foodKcal?.toString() || "350");
      setActivityLevel(data.activity || "normal");
      setEsterilizado(!!data.esterilizado);
      setEstadoCorporal(data.estadoCorporal || null);

      const history = await getWeightHistory(petId);
      setWeightHistory(history || []);

      setWeightPlan(calculateWeightPlan(data.weight, data.species));
      const rec = calculateProfessionalFeeding(
        data.species,
        data.weight,
        data.birthDate,
        Number(data.foodKcal || 350),
        data.activity || "normal",
        data.esterilizado,
        data.estadoCorporal,
        data.condicionEspecial
      );
      setRecommendation(rec);
    } catch (e) {
      console.error("loadPet error:", e);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------- pickImage ---------------------- */
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        const uri = result.assets?.[0]?.uri || result.uri;
        const updatedPet = { ...pet, image: uri };
        await updatePet(petId, updatedPet);
        setPet(updatedPet);
      }
    } catch (e) {
      console.error("pickImage error:", e);
    }
  };

  /* ---------------------- saveWeight ---------------------- */
  const saveWeight = async () => {
    const normalized = (newWeight || "").toString().replace(",", ".");
    const weightValue = parseFloat(normalized);
    if (!normalized || isNaN(weightValue) || weightValue <= 0) {
      Alert.alert("⚠️ " + I18n.t("invalid_weight"));
      return;
    }

    try {
      const updatedPet = { ...pet, weight: weightValue };
      await updatePet(petId, updatedPet);

      await addWeightRecord(petId, weightValue);
      const history = await getWeightHistory(petId);

      setPet(updatedPet);
      setWeightHistory(history);
      setWeightPlan(calculateWeightPlan(weightValue, pet.species));
      setEditingWeight(false);
      setNewWeight("");
      Alert.alert("✅ " + I18n.t("update_weight"));
    } catch (e) {
      console.error("saveWeight error:", e);
      Alert.alert(I18n.t("error"), I18n.t("save_failed"));
    }
  };

  /* ---------------------- saveFoodKcal ---------------------- */
  const saveFoodKcal = async () => {
    const val = parseFloat(String(foodKcal).replace(",", "."));
    if (isNaN(val) || val <= 0) {
      Alert.alert("⚠️ " + I18n.t("invalid_kcal"));
      return;
    }

    try {
      const updatedPet = { ...pet, foodKcal: val };
      await updatePet(petId, updatedPet);
      setPet(updatedPet);
      setEditingFood(false);
      Alert.alert("✅ " + I18n.t("update_saved"));
    } catch (e) {
      console.error("saveFoodKcal error:", e);
      Alert.alert(I18n.t("error"), I18n.t("save_failed"));
    }
  };

  /* ---------------------- recompute recommendation ---------------------- */
  useEffect(() => {
    if (!pet) return;
   const w = parseFloat((newWeight || pet.weight || "").toString().replace(",", "."));
   const kcal = parseFloat((foodKcal || pet.foodKcal || "350").toString().replace(",", "."));
   if (isNaN(w) || isNaN(kcal)) return;

   const rec = calculateProfessionalFeeding(
    pet.species,
    w,
    pet.birthDate,
    kcal,
    activityLevel,
    esterilizado,
    estadoCorporal,
    pet.condicionEspecial
   );
   setRecommendation(rec);
  }, [newWeight, foodKcal, activityLevel, esterilizado, estadoCorporal]);

  /* ---------------------- SVG GRAPH ---------------------- */
  const Graph = ({ data }) => {
  if (!data || data.length === 0) return null;

  const screenW = Dimensions.get("window").width - 60;
  const W = screenW;
  const H = 160;

  const weights = data.map((d) => d.weight);
  const max = Math.max(...weights);
  const min = Math.min(...weights);
  const range = max - min || 1;

  const pxPerX = W / Math.max(1, data.length - 1);

  const points = data
    .map((d, i) => {
      const x = i * pxPerX;
      const y = H - ((d.weight - min) / range) * H;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <View style={{ alignItems: "center" }}>
      <Svg width={W} height={H}>
        <Rect x="0" y="0" width={W} height={H} fill="#eef6ff" rx="12" />

        {/* ==== CONFIGURACIÓN ==== */}
        {(() => {
          const PADDING = 20;
          const usableW = W - PADDING * 2;
          const usableH = H - PADDING * 2;
        
          const len = data.length || 0;
          const minVal = Math.min(...data.map(d => d.weight));
          const maxVal = Math.max(...data.map(d => d.weight));
          const range = maxVal - minVal || 1;
        
          const stepX = len > 1 ? usableW / (len - 1) : 0;
        
          const pointsArray = data.map((d, i) => {
            const x =
              PADDING + (len > 1 ? i * stepX : usableW / 2); // si hay 1 punto -> centro
            const y =
              PADDING +
              usableH -
              ((d.weight - minVal) / range) * usableH;
          
            return { x, y, original: d };
          });
        
          const pointsStr = pointsArray
            .map(p => `${p.x},${p.y}`)
            .join(" ");
        
          return (
            <>
              {/* ==== GRILLA ==== */}
              {[0.25, 0.5, 0.75].map((f, idx) => (
                <Line
                  key={idx}
                  x1={PADDING}
                  y1={PADDING + usableH * f}
                  x2={W - PADDING}
                  y2={PADDING + usableH * f}
                  stroke="#dbe6f5"
                  strokeWidth={1}
                />
              ))}

              {/* ==== SOMBRA DE LA LÍNEA ==== */}
              <Polyline
                points={pointsStr}
                fill="none"
                stroke="#4E8BED"
                strokeWidth={6}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.15}
              />

              {/* ==== LÍNEA PRINCIPAL ==== */}
              <Polyline
                points={pointsStr}
                fill="none"
                stroke="#4E8BED"
                strokeWidth={4}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.95}
              />

              {/* ==== PUNTOS + ETIQUETAS ==== */}
              {pointsArray.map((p, i) => (
                <React.Fragment key={i}>
                  <Circle
                    cx={p.x}
                    cy={p.y}
                    r={5}
                    fill="#3480eb"
                    stroke="#fff"
                    strokeWidth={1}
                  />

                  <SvgText
                    x={p.x}
                    y={p.y - 10}
                    fontSize="13"
                    fontWeight="600"
                    fill="#2d65b4"
                    textAnchor="middle"
                  >
                    {p.original.weight}
                  </SvgText>
                </React.Fragment>
              ))}
            </>
          );
        })()}
      </Svg>
    </View>
    );
  };


  /* ---------------------- RENDER ---------------------- */
  if (loading) {
    return (
      <LinearGradient colors={["#c8e7ff", "#eaf3ff", "#ffffff"]} style={styles.background}>
        <View style={[styles.container, styles.centered]}>
          <Text>{I18n.t("loading") || "Cargando..."}</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#c8e7ff", "#eaf3ff", "#ffffff"]} style={styles.background}>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity onPress={pickImage} style={styles.imageWrap}>
          {pet?.image ? (
            <Image source={{ uri: pet.image }} style={styles.image} />
          ) : (
            <View style={styles.emojiContainer}>
              <Text style={styles.emoji}>
                {pet.species?.toLowerCase().includes("cat") ? "🐱" :
                 pet.species?.toLowerCase().includes("dog") ? "🐶" :
                 pet.species?.toLowerCase().includes("hamster") ? "🐹" :
                 pet.species?.toLowerCase().includes("rabbit") ? "🐰" :
                 "🐾"}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.name}>{pet.name}</Text>

        <View style={styles.info}>
          <Text style={styles.infoText}>🐾 {I18n.t("pet_species")}: {I18n.t(`species.${pet.species}`)}</Text>
          <Text style={styles.infoText}>🐕 {I18n.t("breed")}: {pet.breed}</Text>
          <Text style={styles.infoText}>⚧ {I18n.t("sex")}: {pet.gender || pet.sex}</Text>
          <Text style={styles.infoText}>🎂 {I18n.t("age")}: {pet.birthDate ? (() => {
            const today = new Date();
            const dob = new Date(pet.birthDate);
            const years = today.getFullYear() - dob.getFullYear();
            return years < 1 ? `${Math.max(0, Math.round(((today - dob) / (1000*60*60*24*30))))} ${I18n.t("months")}` : `${years} ${I18n.t("years")}`;
          })() : "-"}</Text>

          {/* PESO */}
          <View style={styles.weightRow}>
            <Text style={[styles.infoText, { marginRight: 8 }]}>⚖ {I18n.t("weight")}:</Text>
            {editingWeight ? (
              <>
                <TextInput style={styles.weightInput} keyboardType="numeric" value={newWeight} onChangeText={setNewWeight} />
                <TouchableOpacity onPress={saveWeight} style={styles.saveWeightBtn}><Text style={styles.saveWeightText}>💾</Text></TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity onPress={() => setEditingWeight(true)}>
                <Text style={[styles.infoText, styles.editableWeight]}>{pet.weight} kg ✏️</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* KCAL */}
          <View style={styles.weightRow}>
            <Text style={[styles.infoText, { marginRight: 8 }]}>🥫 kcal/100g:</Text>
            {editingFood ? (
              <>
                <TextInput style={styles.weightInput} keyboardType="numeric" value={foodKcal} onChangeText={setFoodKcal} />
                <TouchableOpacity onPress={saveFoodKcal} style={styles.saveWeightBtn}><Text style={styles.saveWeightText}>💾</Text></TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity onPress={() => setEditingFood(true)}>
                <Text style={[styles.infoText, styles.editableWeight]}>{pet.foodKcal || foodKcal} kcal ✏️</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={[styles.infoText, { marginTop: 8 }]}>{pet.notes}</Text>

          {/* CONTROLES DE ACTIVIDAD / ESTERILIZADO / BCS */}
          <View style={{
            backgroundColor: "#f0f7ff",
            padding: 14,
            marginTop: 10,
            borderRadius: 14,
          }}>
            <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 8 }}>
              ⚙️ {I18n.t("metabolic")}
            </Text>

            {/* Actividad */}
            <Text style={{ fontSize: 15, marginBottom: 6 }}>🥎 {I18n.t("activity")}</Text>
            <View style={{ flexDirection: "row", marginBottom: 8 }}>
              {[{key: "baja", label: I18n.t("activity_low")},{ key: "normal", label: I18n.t("activity_normal") }, { key: "alta", label: I18n.t("activity_high") }].map((a) => (
                <TouchableOpacity
                  key={a.key}
                  onPress={async () => {
                    setActivityLevel(a.key);
                    const updated = { ...pet, activity: a.key };
                    await updatePet(petId, updated);
                    setPet(updated);
                  }}
                  style={{
                    padding: 8,
                    paddingHorizontal: 16,
                    backgroundColor: activityLevel === a.key ? "#4E8BED" : "#e4ecf5",
                    borderRadius: 20,
                    marginRight: 8,
                  }}
                >
                  <Text style={{ color: activityLevel === a.key ? "#fff" : "#333" }}>
                    {a.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {/* Esterilizado */}
            <Text style={{ fontSize: 15, marginBottom: 6 }}>✂️ {I18n.t("sterilized")}</Text>
            <TouchableOpacity
              onPress={async () => {
                const newVal = !esterilizado;
                setEsterilizado(newVal);
                const updated = { ...pet, esterilizado: newVal };
                await updatePet(petId, updated);
                setPet(updated);
              }}
              style={{
                backgroundColor: esterilizado ? "#78C091" : "#e4ecf5",
                padding: 10,
                borderRadius: 20,
                width: 120,
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <Text style={{ color: esterilizado ? "#fff" : "#333" }}>
                {esterilizado ? "Sí" : "No"}
              </Text>
            </TouchableOpacity>
            
            {/* BCS */}
            <Text style={{ fontSize: 15, marginBottom: 6 }}>📏 {I18n.t("bcs")} (BCS 1-9):</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              {[1,2,3,4,5,6,7,8,9].map((n) => (
                <TouchableOpacity
                  key={n}
                  onPress={async () => {
                    setEstadoCorporal(n);
                    const updated = { ...pet, estadoCorporal: n };
                    await updatePet(petId, updated);
                    setPet(updated);
                  }}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: estadoCorporal === n ? "#A06CD5" : "#e4ecf5",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: 4,
                  }}
                >
                  <Text style={{ color: estadoCorporal === n ? "#fff" : "#333" }}>
                    {n}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* RECOMMENDATION */}
          <View style={styles.recommendationBox}>
            <Text style={styles.recommendationTitle}>🍖 {I18n.t("nutritional")}</Text>
            <Text style={styles.recommendationText}>{recommendation?.text || recommendation}</Text>
          </View>

          {/* WEIGHT PLAN */}
          <View style={styles.recommendationBox}>
            <Text style={styles.recommendationTitle}>⚖️ {I18n.t("weight_plan")}</Text>
            <Text style={styles.recommendationText}>{weightPlan}</Text>
          </View>
        </View>

        {/* GRÁFICO */}
        {weightHistory && weightHistory.length > 0 && (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>{I18n.t("weight_progress")}</Text>
            <Graph data={weightHistory} />
          </View>
        )}

        {/* BOTONES */}
        <TouchableOpacity style={styles.button1} onPress={() => navigation.navigate('MedicalHistoryScreen', { petId })}><Text style={styles.buttonText}>📜 {I18n.t("view_history")}</Text></TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('AddIncidentScreen', { petId })}><Text style={styles.buttonText}>🩹{I18n.t("add_incident")}</Text></TouchableOpacity>
        <TouchableOpacity style={styles.button2} onPress={() => navigation.navigate('Reminders', { petId })}><Text style={styles.buttonText}>⏱️ {I18n.t("reminders")}</Text></TouchableOpacity>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>{I18n.t("back")}</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
};

/* ---------------------- ESTILOS ---------------------- */
const styles = StyleSheet.create({
  background: { 
    flex: 1 
  },
  container: { 
    padding: 20, 
    paddingBottom: 80 
  },
  centered: { 
    justifyContent: "center", 
    alignItems: "center" 
  },

  imageWrap: { 
    alignItems: "center" 
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 80,
    marginTop: 15,
    marginBottom: 8,
    borderWidth: 4,
    borderColor: "#ffffffaa",
  },

  emojiContainer: {
    width: 200,
    height: 200,
    borderRadius: 80,
    backgroundColor: "#ffffff66",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
    marginBottom: 8,
  },
  emoji: { fontSize: 150 },

  name: {
    fontSize: 35,
    fontWeight: "700",
    textAlign: "center",
    color: "#2c2688",
    marginBottom: 8,
  },

  info: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },

  infoText: { 
    fontSize: 20, 
    marginBottom: 6, 
    color: "#333" 
  },

  weightRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginBottom: 6 
  },

  editableWeight: { 
    color: "#4E8BED", 
    fontWeight: "600" 
  },

  weightInput: {
    backgroundColor: "#F2F2F2",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    width: 90,
    marginRight: 10,
    fontSize: 16,
  },

  saveWeightBtn: { 
    backgroundColor: "#4E8BED", 
    padding: 8, 
    borderRadius: 10 
  },
  saveWeightText: { 
    color: "#fff", 
    fontSize: 16 
  },

  recommendationBox: {
    backgroundColor: "#f0f7ff",
    padding: 8,
    borderRadius: 10,
    marginTop: 10,
  },

  recommendationTitle: { 
    fontSize: 18, 
    fontWeight: "700", 
    color: "#2a5daa", 
    marginBottom: 6 
  },
  recommendationText: { 
    fontSize: 16, 
    color: "#333", 
    lineHeight: 20 
  },

  chartContainer: { 
    backgroundColor: "#fff", 
    padding: 16,
    borderRadius: 20,
    marginTop: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    alignItems: "center", 
  },
  chartTitle: { 
    fontWeight: "700", 
    marginBottom: 8, 
    fontSize: 16, 
    color: "#2a5daa" 
  },

  graphWrapper: { 
    alignItems: "center", 
    justifyContent: "center",
  },

  button1: { 
    backgroundColor: "#4E8BED", 
    padding: 14,
    borderRadius: 50,
    marginTop: 6 
  },
  button2: { 
    backgroundColor: "#78C091", 
    padding: 14, 
    borderRadius: 50, 
    marginTop: 6 
  },
  button: { 
    backgroundColor: "#A06CD5", 
    padding: 14, 
    borderRadius: 50, 
    marginTop: 6 
  },
  buttonText: { 
    color: "#fff", 
    fontSize: 16, 
    fontWeight: "600", 
    textAlign: "center" 
  },

  backButton: {
    alignItems: "center",
    backgroundColor: "#2195f3ff",
    padding: 14,
    borderRadius: 50,
    marginTop: 6,
  },
  backText: { 
    color: "#fff", 
    fontSize: 17, 
    fontWeight: "600" 
  },
});

export default PetProfileScreen;
