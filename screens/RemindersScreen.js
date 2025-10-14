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
    <ImageBackground
      source={require("../assets/fondodos.jpg")}
      style={styles.background}
      resizeMode="cover"
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
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  container: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "space-between",
    padding: 20,
    backgroundColor: "#d5dc70e4",
    alignItems: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
    marginTop: 40,
  },
  input: {
    height: 50,
    width: "100%",
    borderWidth: 1,
    borderColor: "#bbb",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  modalContent: {
    width: "100%",
    height: 345,
    backgroundColor: "#adb366ff",
    borderRadius: 50,
    padding: 20,
    alignItems: "center",
  },
  modalContentText: {
    color: "black",
    fontWeight: "700",
    fontSize: 28,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    marginRight: 10,
    backgroundColor: "#e9efeaff",
    padding: 8,
    borderRadius: 10,
  },
  confirmButton: {
    flex: 1,
    marginLeft: 10,
    backgroundColor: "#4caf50",
    padding: 8,
    borderRadius: 10,
  },
  cancelText: {
    color: "#060101ff",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 20,
  },
  confirmText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 20,
  },
  dateButton: {
    width: "100%",
    height: 50,
    padding: 15,
    backgroundColor: "#eee",
    borderRadius: 12,
    marginBottom: 10,
    alignItems: "center",
  },
  saveButton: {
    height: 50,
    width: "100%",
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
  },
  saveText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  list: {
    width: "100%",
    marginTop: 10,
  },
  reminderCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderLeftWidth: 5,
    borderLeftColor: "#4CAF50",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reminderDate: {
    fontSize: 12,
    color: "#555",
  },
  reminderText: {
    fontSize: 18,
    flex: 1,
    marginHorizontal: 10,
  },
  delete: {
    fontSize: 18,
    color: "red",
  },
  backButton: {
    width: "100%",
    alignItems: "center",
    backgroundColor: "#2195f3c2",
    padding: 15,
    borderRadius: 12,
    marginBottom: 30,
  },
  backText: {
    color: "#fefefeff",
    fontSize: 20,
    fontWeight: "bold",
  },
});
