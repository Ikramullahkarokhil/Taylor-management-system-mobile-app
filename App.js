import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View, Text, ActivityIndicator } from "react-native";
import { initializeDatabase } from "./Database";
import LoginPage from "./components/LoginScreen/LoginPage";
import { Ionicons } from "@expo/vector-icons"; // Import Material Icons from Expo
import Home from "./components/Home/Home";
import Settings from "./components/Settings/Settings";
import AddPage from "./components/AddPage/AddPage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { BottomNavigation } from "react-native-paper";
import * as NavigationBar from "expo-navigation-bar";
import * as Notifications from "expo-notifications";
import { Asset } from "expo-asset";

const SESSION_TIMEOUT = 15 * 24 * 60 * 60 * 1000;
const icon = require("./assets/icon.png");
const iconUri = Asset.fromModule(icon).uri;

async function registerForPushNotificationsAsync() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") {
    alert("Failed to get push token for push notification!");
    return;
  }
  token = (await Notifications.getExpoPushTokenAsync()).data;
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  NavigationBar.setBackgroundColorAsync("white");

  const [routes] = useState([
    {
      key: "home",
      title: "Home",
      icon: "home", // Change "focusedIcon" to "icon"
      inactiveIcon: "home-outline", // Change "unfocusedIcon" to "inactiveIcon"
    },
    {
      key: "addCustomer",
      title: "Add Customer",
      icon: "person-add", // Change "focusedIcon" to "icon"
      inactiveIcon: "person-add-outline", // Change "unfocusedIcon" to "inactiveIcon"
    },
    {
      key: "settings",
      title: "Settings",
      icon: "settings", // Change "focusedIcon" to "icon"
      inactiveIcon: "settings-outline",
      // No need for "unfocusedIcon" for Settings as it doesn't have an alternative
    },
  ]);

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const loginTimestamp = await AsyncStorage.getItem("loginTimestamp");
        if (loginTimestamp) {
          const lastLoginTime = new Date(parseInt(loginTimestamp));
          const currentTime = new Date();
          const sessionExpired = currentTime - lastLoginTime > SESSION_TIMEOUT;
          if (sessionExpired) {
            // Session expired, log out user
            setIsLoggedIn(false);
            await AsyncStorage.removeItem("loginTimestamp");
          } else {
            setIsLoggedIn(true);
          }
        }
      } catch (error) {
        console.error("Error checking login status:", error);
      } finally {
        setLoading(false); // Set loading to false after checking login status
      }
    };

    const appOpenHandler = async () => {
      initializeDatabase();
      await checkLoginStatus();
    };

    appOpenHandler();
  }, []);

  useEffect(() => {
    registerForPushNotificationsAsync();
    Notifications.scheduleNotificationAsync({
      content: {
        title: "Time to Backup!",
        body: "Don't forget to backup your data.",
        icon: iconUri,
      },
      trigger: {
        seconds: 60 * 60 * 24 * 3,
        repeats: true,
      },
    });
  }, []);

  const handleLogin = async () => {
    setIsLoggedIn(true);
    await AsyncStorage.setItem("loginTimestamp", Date.now().toString());
  };

  const handleLogout = async () => {
    setIsLoggedIn(false);
    await AsyncStorage.removeItem("loginTimestamp");
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const renderIcon = ({ route, focused, color }) => {
    const iconName = focused ? route.icon : route.inactiveIcon;
    return <Ionicons name={iconName} size={22} color={color} />;
  };

  const renderScene = BottomNavigation.SceneMap({
    home: Home,
    addCustomer: AddPage,
    settings: () => <Settings onLogout={handleLogout} />,
  });

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <StatusBar style="dark" backgroundColor="#F2F5F3" />
        <Text style={styles.AppTitle}>
          <Text style={styles.AppTitle2}>0747826587</Text> / خیاطی عادل فیشن
        </Text>
        <BottomNavigation
          navigationState={{ index, routes }}
          onIndexChange={setIndex}
          renderScene={renderScene}
          renderIcon={renderIcon} // Pass the custom renderIcon function
          barStyle={{ backgroundColor: "white" }}
          sceneAnimationEnabled={true}
        />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    backgroundColor: "#F2F5F3",
  },
  AppTitle: {
    textAlign: "center",
    fontSize: 24,
    marginTop: 35,
    marginBottom: 5,
    fontStyle: "italic",
    color: "#0083D0",
  },
  AppTitle2: {
    fontSize: 15,
    fontStyle: "italic",
  },
});
