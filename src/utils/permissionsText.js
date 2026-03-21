import * as Localization from "expo-localization";

// Obtiene el idioma del sistema (seguro y compatible)
const locale =
  Localization?.locales?.[0] || // Nuevo formato (SDK 49+)
  Localization?.locale ||       // Compatibilidad con SDK anteriores
  "es";                         // Valor por defecto

// Normaliza el código de idioma (ej. "es-UY" → "es")
const languageCode = locale.split("-")[0].toLowerCase();

// Determina el idioma base de la app
const lang = ["es", "en", "pt"].includes(languageCode)
  ? languageCode
  : "es"; // Español por defecto

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
  nfc: {
    es: "Necesitamos acceso al lector NFC para identificar etiquetas de tu mascota.",
    en: "We need NFC access to identify your pet's tags.",
    pt: "Precisamos de acesso NFC para identificar as etiquetas do seu pet.",
  },
};

export const t = (key) => {
  const text = permissionsText[key]?.[lang];
  return text || permissionsText[key]?.es || "Permiso requerido.";
};
