 import I18n from "../locales/i18n";
 
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
  if (weight == null || weight <= 0 || !birthDate) return { text: I18n.t("missing") };

  const getSpeciesType = (species) => {
    const sp = (species || "").toLowerCase();

    if (sp.includes("dog") || sp.includes("perro")) return "mammal";
    if (sp.includes("cat") || sp.includes("gato")) return "mammal";
    if (sp.includes("hamster")) return "mammal";
    if (sp.includes("rabbit") || sp.includes("conejo")) return "mammal";

    if (sp.includes("bird") || sp.includes("ave")) return "bird";
    if (sp.includes("fish") || sp.includes("pez")) return "fish";
    if (sp.includes("reptile") || sp.includes("reptil") || sp.includes("tortuga")) return "reptile";

    return "mammal";
  };

  const birth = new Date(birthDate);
  const today = new Date();

  const ageMonths =
    (today.getFullYear() - birth.getFullYear()) * 12 +
    (today.getMonth() - birth.getMonth());

  const ageYears = ageMonths / 12;

  const type = getSpeciesType(species);

  const RER = 70 * Math.pow(weight, 0.75);

  let MER = null;
  let gramsPerDay = null;

  /* ================= MAMÍFEROS ================= */
  if (type === "mammal") {
    MER = RER;

    if (ageMonths < 4) MER *= 3;
    else if (ageMonths < 12) MER *= 2;
    else {
      MER *= esterilizado ? 1.4 : 1.8;
      if (ageYears >= 8) MER *= 0.8;
      if (estadoCorporal >= 7) MER *= 0.7;
    }

    const activityFactors = { baja: 0.9, normal: 1.0, alta: 1.2 };
    MER *= activityFactors[activity] || 1;

    gramsPerDay = foodKcalPer100g
      ? (MER / foodKcalPer100g) * 100
      : null;
  }

  /* ================= AVES ================= */
  if (type === "bird") {
    let factor = 2.5;
    if (weight < 0.1) factor = 3.5;
    if (weight > 0.5) factor = 2.2;

    MER = RER * factor;

    if (ageMonths < 6) MER *= 1.3;
    if (estadoCorporal >= 7) MER *= 0.8;

    const activityFactors = { baja: 0.9, normal: 1.0, alta: 1.2 };
    MER *= activityFactors[activity] || 1;

    let percentage = 0.1;
    if (weight < 0.1) percentage = 0.15;
    if (estadoCorporal >= 7) percentage = 0.08;

    const gramsAlt = weight * 1000 * percentage;

    const gramsFromKcal = foodKcalPer100g
      ? (MER / foodKcalPer100g) * 100
      : gramsAlt;

    gramsPerDay = (gramsFromKcal + gramsAlt) / 2;
  }

  /* ================= PECES ================= */
  if (type === "fish") {
    let percentage = ageMonths < 6 ? 0.04 : 0.02;
    if (estadoCorporal >= 7) percentage = 0.015;

    gramsPerDay = weight * 1000 * percentage;

    return {
      text:
        `🍽️ ${I18n.t("recommended_grams")}: ${Math.round(gramsPerDay)} g/día\n` +
        `🔻 ${I18n.t("to_lose")}: ${Math.round(gramsPerDay * 0.8)} g/día\n` +
        `🔺 ${I18n.t("to_gain")}: ${Math.round(gramsPerDay * 1.2)} g/día\n` +
        `📊 ${(percentage * 100).toFixed(1)}% del peso corporal`,
    };
  }

  /* ================= REPTILES ================= */
  if (type === "reptile") {
    let percentage = 0.03;
    if (activity === "baja") percentage = 0.02;
    if (activity === "alta") percentage = 0.05;

    gramsPerDay = weight * 1000 * percentage;

    return {
      text:
        `🦎 ${I18n.t("recommended_grams")}: ${Math.round(gramsPerDay)} g/día\n` +
        `📊 ${(percentage * 100).toFixed(1)}% del peso corporal`,
    };
  }

  /* ================= RESULTADO FINAL ================= */

  return {
    RER: Math.round(RER),
    MER: Math.round(MER),
    gramsPerDay: Math.round(gramsPerDay),
    gramsLoss: Math.round(gramsPerDay * 0.85),
    gramsGain: Math.round(gramsPerDay * 1.15),
    factor: (MER / RER).toFixed(2),
    text:
      `${type === "bird" ? "🐦" : "🐾"} ${I18n.t("daily_energy")}: ${Math.round(MER)} kcal\n` +
      `🍽️ ${I18n.t("recommended_grams")}: ${Math.round(gramsPerDay)} g/día\n` +
      `🔻 ${I18n.t("to_lose")}: ${Math.round(gramsPerDay * 0.85)} g/día\n` +
      `🔺 ${I18n.t("to_gain")}: ${Math.round(gramsPerDay * 1.15)} g/día\n` +
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

export {
  calculateProfessionalFeeding,
  calculateWeightPlan
};