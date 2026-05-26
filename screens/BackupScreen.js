import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator
} from 'react-native';

import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import I18n from "../src/locales/i18n";
import { exportAllData, importAllData } from '../services/localStorage';

const BackupScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const data = await exportAllData();

      if (!data) {
        Alert.alert(I18n.t("not_exported"));
        return;
      }

      const fileUri = FileSystem.documentDirectory + 'petcare_backup.json';

      await FileSystem.writeAsStringAsync(fileUri, data);
      await Sharing.shareAsync(fileUri);

      Alert.alert(I18n.t("backup_created"));
    } catch (error) {
      Alert.alert(I18n.t("problem_exporting"));
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json'
      });

      if (result.canceled) return;

      const fileUri = result.assets[0].uri;
      const content = await FileSystem.readAsStringAsync(fileUri);

      Alert.alert(
        I18n.t("restore_data"),
        [
          { text: I18n.t("cancel"), style: 'cancel' },
          {
            text: I18n.t("restore"),
            style: 'destructive',
            onPress: async () => {
              setLoading(true);
              const success = await importAllData(content);

              setLoading(false);

              if (success) {
                Alert.alert(
                  I18n.t("done"),
<<<<<<< HEAD
                  I18n.t("done_restart_app"),
                  [
                    {
                      text: "OK",
                      onPress: () => {
                        navigation.reset({
                          index: 0,
                          routes: [{ name: 'Home' }],
                        });
                      }
                    }
                  ]
=======
                  I18n.t("done_restart_app")
>>>>>>> 1a72bfb3467b4be59b17b7a8f12c1141f11fc561
                );
              } else {
                Alert.alert(I18n.t("not_be_restored"));
              }
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert(I18n.t("problem_importing"));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{I18n.t("data_backup")}</Text>
      <Text style={styles.subtitle}>
        {I18n.t("save_pets_information")}
      </Text>

      {/* EXPORTAR */}
      <TouchableOpacity style={styles.card} onPress={handleExport}>
        <Text style={styles.icon}>📤</Text>
        <View style={styles.textConteiner}>
          <Text style={styles.cardTitle}>{I18n.t("export_data")}</Text>
          <Text style={styles.cardText}>
            {I18n.t("save_file")}
          </Text>
        </View>
      </TouchableOpacity>

      {/* IMPORTAR */}
      <TouchableOpacity style={styles.card} onPress={handleImport}>
        <Text style={styles.icon}>📥</Text>
        <View style={styles.textConteiner}>
          <Text style={styles.cardTitle}>{I18n.t("import_data")}</Text>
          <Text style={styles.cardText}>
            {I18n.t("restore_from_backup")}
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>{I18n.t("back")}</Text>
      </TouchableOpacity>

      {/* LOADING */}
      {loading && (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={{ marginTop: 10 }}>{I18n.t("processing")}</Text>
        </View>
      )}
    </View>
  );
};

export default BackupScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6FA',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 15,
    marginTop: 25,
  },
  subtitle: {
    fontSize: 25,
    color: '#666',
    marginBottom: 30,
    textAlign: "center",
  },
  card: {
    width: '100%',
    height: "20%",
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 4,
  },
  icon: {
    fontSize: 50,
    marginRight: 15
  },
  textConteiner: {
    width: '80%'
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: 'bold'
  },
  cardText: {
    fontSize: 23,
    color: '#666',
    marginTop: 2
  },
  loading: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center'
  },
  backButton: { 
    alignItems: "center",
    backgroundColor: "#2195f3ff",
    padding: 14,
    borderRadius: 50,
    width: "100%",
  },

  backText: { 
    color: "#fff", fontSize: 17, fontWeight: "600" 
  },
});