import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { Provider as PaperProvider } from "react-native-paper";
import { AuthProvider } from "./src/context/AuthContext";
import AppNavigator from "./src/navigation/AppNavigator";
import { initializeData } from "./src/services/localStorage";
import {
  validateAndCleanAllData,
  checkDataIntegrity,
} from "./src/utils/dataValidator";

export default function App() {
  useEffect(() => {
    const setupApp = async () => {
      await initializeData();
      await validateAndCleanAllData();
      await checkDataIntegrity();
    };
    setupApp();
  }, []);

  return (
    <PaperProvider>
      <AuthProvider>
        <AppNavigator />
        <StatusBar style="auto" />
      </AuthProvider>
    </PaperProvider>
  );
}
