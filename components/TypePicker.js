
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Platform,
  StyleSheet,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import I18n from '../src/locales/i18n';

const TypePicker = ({ value, onValueChange, options }) => {
  const [open, setOpen] = useState(false);

  const label = useMemo(
    () => (options.find((o) => o.value === value) || {}).label || I18n.t("select"),
    [options, value]
  );

  if (Platform.OS === "ios") {
    return (
      <>
        <TouchableOpacity style={styles.trigger} onPress={() => setOpen(true)}>
          <Text style={styles.triggerText}>{label}</Text>
        </TouchableOpacity>

        <Modal
          visible={open}
          transparent
          animationType="slide"
          onRequestClose={() => setOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{I18n.t("select_type")}</Text>

              <View style={styles.pickerWrap}>
                <Picker
                  selectedValue={value}
                  onValueChange={(v) => onValueChange(v)}
                  itemStyle={{ fontSize: 22, color: '#000' }}
                  style={styles.picker}
                >
                  {options.map((opt) => (
                     <Picker.Item
                        key={opt.value}
                        label={opt.label}
                        value={opt.value}
                        color="#000"
                      />
                  ))}
                </Picker>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.modalBtn} onPress={() => setOpen(false)}>
                  <Text style={styles.modalBtnText}>{I18n.t("cancel")}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.modalBtn, styles.modalBtnPrimary]} onPress={() => setOpen(false)}>
                  <Text style={[styles.modalBtnText, { color: "#fff" }]}>OK</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </>
    );
  }

  // Android: inline dropdown (normal)
  return (
    <View style={styles.androidContainer}>
      <Picker
        selectedValue={value}
        onValueChange={onValueChange}
        mode="dropdown"
        style={styles.androidPicker}
        dropdownIconColor="#4CAF50"
      >
        {/* placeholder */}
        <Picker.Item style={styles.label} label={I18n.t("select_type")} value="" color="#888" />

        {/* items traducidos */}
        {options.map((opt) => (
          <Picker.Item
            key={opt.value}
            label={opt.label}
            value={opt.value}
            color="#000"
          />
        ))}
      </Picker>
    </View>

  );
};

const styles = StyleSheet.create({
  trigger: {
    width: '100%',
    height: 50,
    backgroundColor: '#e9ee536d',
    borderWidth: 2,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  triggerText: { 
    fontSize: 20 
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalContent: {
    backgroundColor: '#c9cc80ff',
    paddingTop: 12,
    paddingHorizontal: 12,
    paddingBottom: 20,
    borderRadius: 50,
  },
  modalTitle: { 
    textAlign: "center", 
    marginBottom: 8, 
    fontWeight: "600",
    fontSize: 20,
  },
  pickerWrap: {
    width: "100%",
    height: Platform.OS === 'ios' ? 180 : 50,
    backgroundColor: Platform.OS === 'ios' ? '#c9cc80ff' : '#e9ee53ff', // 👈 blanco en iOS
    marginBottom: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  picker: {
    width: '100%',
    height: Platform.OS === 'ios' ? 180 : 50,
},
  modalButtons: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 6,
    borderRadius: 10,
    backgroundColor: "#ddd",
    alignItems: "center",
  },
  modalBtnPrimary: {
    backgroundColor: "#4caf50",
  },
  modalBtnText: { 
    fontWeight: "700" 
  },
  androidContainer: {
    width: '100%',
    height: 50,
    backgroundColor: '#e9ee536d',
    borderWidth: 2,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 5,
    marginBottom: 8,
    justifyContent: "center",
  },
  androidPicker: {
    width: "100%",
    height: 50,
    padding: 0,
    backgroundColor: 'transparent', 
  },
  label: {
    padding: 0,
    fontSize: 16,
    color: "#150505ff",
  },
});

export default TypePicker;
