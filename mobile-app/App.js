import Constants from "expo-constants";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";

const fallbackUrl = "https://acadex-one-beta.vercel.app";
const acadexUrl = process.env.EXPO_PUBLIC_ACADEX_URL || Constants.expoConfig?.extra?.acadexUrl || fallbackUrl;

export default function App() {
  return (
    <SafeAreaView style={styles.shell}>
      <StatusBar style="light" />
      <WebView
        source={{ uri: acadexUrl }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        allowsBackForwardNavigationGestures
        renderLoading={() => (
          <View style={styles.loading}>
            <Text style={styles.brand}>Acadex</Text>
            <ActivityIndicator color="#ffffff" />
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: "#020617"
  },
  webview: {
    flex: 1,
    backgroundColor: "#020617"
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
    backgroundColor: "#020617"
  },
  brand: {
    color: "#ffffff",
    fontSize: 34,
    fontWeight: "700"
  }
});
