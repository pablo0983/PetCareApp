import * as Localization from "expo-localization";

// Detecta idioma del sistema
const lang = Localization.locale.startsWith("pt")
  ? "pt"
  : Localization.locale.startsWith("en")
  ? "en"
  : "es"; // default español

const permissionsText = {
  camera: {
    es: "Necesitamos acceso a la cámara para tomar fotos de tu mascota.",
    en: "We need camera access to take photos of your pet.",
    pt: "Precisamos de acesso à câmera para tirar fotos do seu pet.",
  },
  gallery: {
    es: "Necesitamos acceder a tu galería para elegir una foto de tu mascota.",
    en: "We need photo library access to select a photo of your pet.",
    pt: "Precisamos acessar sua galeria para escolher uma foto do seu pet.",
  },
  save: {
    es: "Necesitamos guardar fotos de tu mascota en tu galería.",
    en: "We need access to save your pet's photos to your gallery.",
    pt: "Precisamos salvar as fotos do seu pet na sua galeria.",
  },
};

export const t = (key) => permissionsText[key][lang];
