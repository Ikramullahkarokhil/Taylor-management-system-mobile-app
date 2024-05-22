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

const SESSION_TIMEOUT = 15 * 24 * 60 * 60 * 1000;

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  NavigationBar.setBackgroundColorAsync("#F2F5F3");

  const [routes] = useState([
    {
      key: "home",
      title: "Home",
      icon: "home",
      inactiveIcon: "home-outline",
    },
    {
      key: "addCustomer",
      title: "Add Customer",
      icon: "person-add",
      inactiveIcon: "person-add-outline",
    },
    {
      key: "settings",
      title: "Settings",
      icon: "settings",
      inactiveIcon: "settings-outline",
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
          renderIcon={renderIcon}
          barStyle={{ backgroundColor: "#F2F5F3" }}
          sceneAnimationEnabled={true}
          activeColor="black"
          inactiveColor="#626262"
          activeIndicatorStyle={{ backgroundColor: "#DCDCDC" }}
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
