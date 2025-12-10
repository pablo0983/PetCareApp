import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  Platform,
  ImageBackground,
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import DateTimePicker from "@react-native-community/datetimepicker";
import I18n from "../src/locales/i18n";

export default function RemindersScreen({ route, navigation }) {
  const { petId } = route.params;
  const [reminder, setReminder] = useState("");
  const [date, setDate] = useState(new Date());
  const [tempDate, setTempDate] = useState(new Date());
  const [isPickerVisible, setPickerVisible] = useState(false);
  const [reminders, setReminders] = useState([]);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    requestNotificationPermission();
    loadReminders();
  }, []);

  const requestNotificationPermission = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") {
      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      if (newStatus !== "granted") {
        Alert.alert(
          "⚠️ " + I18n.t("notify")
        );
      }
    }
  };

  const loadReminders = async () => {
    try {
      const key = `reminders_${petId}`;
      const stored = await AsyncStorage.getItem(key);
      setReminders(stored ? JSON.parse(stored) : []);
    } catch (e) {
      console.error("Error cargando recordatorios:", e);
    }
  };

  const saveReminders = async (newReminders) => {
    try {
      const key = `reminders_${petId}`;
      await AsyncStorage.setItem(key, JSON.stringify(newReminders));
      setReminders(newReminders);
    } catch (e) {
      console.error("Error guardando recordatorios:", e);
    }
  };

  const scheduleNotification = async (text, date) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "📌 " + I18n.t("reminder"),
        body: text,
      },
      trigger: { date },
    });
  };

  const handleAddReminder = async () => {
    if (!reminder.trim()) {
      Alert.alert(I18n.t("error_rem") + " 🐾");
      return;
    }

    // ✅ Validación de fecha futura
    if (date <= new Date()) {
      Alert.alert("⚠️ " + I18n.t("future_date"));
      return;
    }

    const newReminder = {
      id: Date.now().toString(),
      text: reminder,
      date: date.toISOString(),
    };

    const updated = [...reminders, newReminder];
    await saveReminders(updated);
    await scheduleNotification(reminder, date);
    setReminder("");
    Alert.alert("✅ " + I18n.t("alert_save_rem"));
  };

  const handleDelete = async (id) => {
    const updated = reminders.filter((r) => r.id !== id);
    await saveReminders(updated);
  };

  const cancelDate = () => {
    setPickerVisible(false);
  };

  const confirmDate = () => {
    setDate(tempDate);
    setPickerVisible(false);
  };

  const onAndroidDateChange = (event, selectedDate) => {
    setPickerVisible(false);
    if (event.type === "set" && selectedDate) {
      setTempDate(selectedDate);
      setShowTimePicker(true);
    }
  };

  const onAndroidTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (event.type === "set" && selectedTime) {
      const finalDate = new Date(
        tempDate.getFullYear(),
        tempDate.getMonth(),
        tempDate.getDate(),
        selectedTime.getHours(),
        selectedTime.getMinutes()
      );
      setTempDate(finalDate);
      setDate(finalDate);
    }
  };

  return (
    <LinearGradient
     colors={["#F8C8DC", "#B5D6FF", "#C8F7C5"]}
     style={styles.background}
     start={{ x: 0, y: 0 }}
     end={{ x: 1, y: 1 }}
    >

      <View style={styles.container}>
        <Text style={styles.title}>📅 {I18n.t("reminders")}</Text>

        <TextInput
          style={styles.input}
          placeholder={I18n.t("wr_rem")}
          value={reminder}
          onChangeText={setReminder}
        />

        {/* 📆 Botón abrir selector de fecha */}
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => {
            setTempDate(date);
            setPickerVisible(true);
          }}
        >
          <Text>📆 {date.toLocaleString(I18n.locale)}</Text>
        </TouchableOpacity>

        {/* 🗓️ Modal de fecha (iOS y Android) */}
        {Platform.OS === "ios" ? (
          <Modal
            visible={isPickerVisible}
            transparent
            animationType="slide"
            onRequestClose={cancelDate}
          >
            <View style={styles.overlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalContentText}>{I18n.t("sel_date")}</Text>

                <DateTimePicker
                  value={tempDate}
                  mode="datetime"
                  display="spinner"
                  locale={(I18n.locale || "en").toString()}
                  minimumDate={new Date()}
                  onChange={(event, selected) => {
                    if (selected) setTempDate(selected);
                  }}
                  style={styles.modalCon}
                />

                <View style={styles.buttonRow}>
                  <TouchableOpacity style={styles.cancelButton} onPress={cancelDate}>
                    <Text style={styles.cancelText}>{I18n.t("cancel")}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.confirmButton} onPress={confirmDate}>
                    <Text style={styles.confirmText}>{I18n.t("confirm")}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        ) : (
          <>
            {isPickerVisible && !showTimePicker && (
              <DateTimePicker
                value={tempDate}
                mode="date"
                minimumDate={new Date()}
                display="calendar"
                onChange={onAndroidDateChange}
                style={styles.modalCon}
              />
            )}

            {showTimePicker && (
              <DateTimePicker
                value={tempDate}
                mode="time"
                is24Hour={true}
                display="spinner"
                onChange={onAndroidTimeChange}
                style={styles.modalCon}
              />
            )}
          </>
        )}

        {/* 💾 Botón guardar */}
        <TouchableOpacity style={styles.saveButton} onPress={handleAddReminder}>
          <Text style={styles.saveText}>💾 {I18n.t("save_rem")}</Text>
        </TouchableOpacity>

        {/* 📋 Lista de recordatorios */}
        <FlatList
          style={styles.list}
          data={reminders.sort((a, b) => new Date(a.date) - new Date(b.date))}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.reminderCard}>
              <Text style={styles.reminderDate}>
                {new Date(item.date).toLocaleString(I18n.locale)}
              </Text>
              <Text style={styles.reminderText}>{item.text}</Text>
              <TouchableOpacity onPress={() => handleDelete(item.id)}>
                <Text style={styles.delete}>🗑️</Text>
              </TouchableOpacity>
            </View>
          )}
        />

        {/* 🔙 Botón volver */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>{I18n.t("back")}</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },

  // 🌈 Fondo profesional pastel
  container: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    backgroundColor: "transparent",
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    marginTop: 40,
    marginBottom: 15,
    color: "#2D2A32",
  },

  input: {
    width: "100%",
    height: 50,
    backgroundColor: "#ffffffEE",
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 12,
    borderWidth: 0,
  },

  dateButton: {
    width: "100%",
    height: 50,
    backgroundColor: "#ffffffEE",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 15,
  },

  saveButton: {
    width: "100%",
    height: 52,
    backgroundColor: "#6CC17E",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: 20,
    shadowColor: "#6CC17E",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },

  saveText: {
    color: "white",
    fontSize: 17,
    fontWeight: "700",
  },

  list: {
    width: "100%",
    marginTop: 10,
    flex: 1,
  },

  reminderCard: {
    backgroundColor: "#FFFFFFDD",
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    // Sombra suave estilo iOS
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 6,
    shadowOffset: { height: 2 },
    elevation: 2,

    borderLeftWidth: 6,
    borderLeftColor: "#6CC17E",
  },

  reminderDate: {
    fontSize: 12,
    color: "#6A6A6A",
  },

  reminderText: {
    fontSize: 17,
    flex: 1,
    marginHorizontal: 10,
    color: "#2D2A32",
    fontWeight: "500",
  },

  delete: {
    fontSize: 22,
    color: "#E24C4B",
  },

  backButton: {
    alignItems: "center",
    backgroundColor: "#2195f3ff",
    padding: 14,
    borderRadius: 50,
    marginTop: 6,
    width: "100%",
    paddingVertical: 15,
    marginBottom: 20,

    shadowColor: "#4A90E2",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 2,
  },

  backText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },

  // 🟣 Modal iOS elegante
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
    alignItems: "center",
  },

  modalContent: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 25,
    paddingBottom: 40,
  },

  modalContentText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2D2A32",
    marginBottom: 10,
  },

  modalCon: {
    marginVertical: -15,
  },

  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },

  cancelButton: {
    flex: 1,
    backgroundColor: "#EFEFEF",
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 10,
  },

  confirmButton: {
    flex: 1,
    backgroundColor: "#6CC17E",
    paddingVertical: 12,
    borderRadius: 12,
    marginLeft: 10,
  },

  cancelText: {
    textAlign: "center",
    fontWeight: "600",
    color: "#444",
    fontSize: 17,
  },

  confirmText: {
    textAlign: "center",
    fontWeight: "700",
    color: "white",
    fontSize: 17,
  },
});

