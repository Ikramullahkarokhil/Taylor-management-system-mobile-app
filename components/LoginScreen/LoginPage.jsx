import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import { Formik } from "formik";
import { StatusBar } from "expo-status-bar";
import * as yup from "yup";
import { TextInput } from "react-native-paper";
import * as NavigationBar from "expo-navigation-bar";
import AsyncStorage from "@react-native-async-storage/async-storage"; // Import AsyncStorage

const LoginSchema = yup.object().shape({
  password: yup.string().required("Password is required"),
});

const LoginPage = ({ onLogin }) => {
  const [isPasswordIncorrect, setIsPasswordIncorrect] = useState(false);
  const [loading, setLoading] = useState(false);
  const defaultPassword = "3737"; // Set your default password here

  NavigationBar.setBackgroundColorAsync("#F2F5F3");

  useEffect(() => {
    const initializePassword = async () => {
      // await AsyncStorage.removeItem("adminPassword");
      const storedPassword = await AsyncStorage.getItem("adminPassword");
      if (!storedPassword) {
        await storePassword(defaultPassword); // Store the default password
      }
    };
    initializePassword();
    authenticate();
  }, []);

  const authenticate = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) return;

      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) return;

      const result = await LocalAuthentication.authenticateAsync();
      if (result.success) {
        onLogin(true);
      }
    } catch (error) {
      console.error("Authentication error:", error);
    }
  };

  const handleLogin = async (values) => {
    try {
      setLoading(true);
      const inputPassword = values.password;

      // Fetch the stored password from AsyncStorage
      const storedPassword = await AsyncStorage.getItem("adminPassword");

      if (!storedPassword) {
        setIsPasswordIncorrect(true);
        return;
      }

      if (inputPassword === storedPassword) {
        onLogin(true);
      } else {
        setIsPasswordIncorrect(true);
      }
    } catch (error) {
      console.error("Error during login:", error);
      alert("An error occurred during login. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const storePassword = async (password) => {
    try {
      await AsyncStorage.setItem("adminPassword", password);
      console.log("Password stored successfully.");
    } catch (error) {
      console.error("Error storing password:", error);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" backgroundColor="#F2F5F3" />
      <View style={styles.formContainer}>
        <Text style={styles.title}>Adil Fashion</Text>
        <Formik
          initialValues={{ password: "" }}
          validationSchema={LoginSchema}
          onSubmit={(values) => handleLogin(values)}
        >
          {({
            handleChange,
            handleBlur,
            handleSubmit,
            values,
            errors,
            touched,
          }) => (
            <View>
              <TextInput
                style={[
                  styles.input,
                  touched.password && errors.password
                    ? styles.inputError
                    : null,
                  isPasswordIncorrect ? styles.inputError : null,
                ]}
                onChangeText={handleChange("password")}
                onBlur={handleBlur("password")}
                value={values.password}
                placeholder="Password"
                secureTextEntry
                keyboardType="numeric"
                maxLength={6}
                error={
                  isPasswordIncorrect
                    ? "Password is incorrect!"
                    : errors.password
                }
              />
              {touched.password && errors.password && (
                <Text style={styles.error}>{errors.password}</Text>
              )}
              {isPasswordIncorrect && (
                <Text style={styles.error}>Password is incorrect!</Text>
              )}
              <TouchableOpacity
                style={styles.button}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Login</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </Formik>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F2F5F3",
    width: "100%",
  },
  formContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: "85%",
    maxWidth: 400,
    elevation: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    marginBottom: 10,
    borderRadius: 5,
    backgroundColor: "white",
  },
  inputError: {
    borderColor: "red",
  },
  error: {
    color: "red",
    fontSize: 12,
  },
  button: {
    backgroundColor: "#3498db",
    padding: 15,
    borderRadius: 5,
    marginTop: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default LoginPage;
