import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import Backup from "../BackupAndRestore/Backup";
import ResetPassword from "../ResetPassword/ResetPassword";
import { Button } from "react-native-paper";

const Settings = ({ onLogout }) => {
  const [isResetPasswordVisible, setIsResetPasswordVisible] = useState(false);

  const toggleResetPasswordModal = () => {
    setIsResetPasswordVisible(!isResetPasswordVisible);
  };

  const handleLogout = () => {
    onLogout();
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Button
          mode="elevated"
          buttonColor="white"
          onPress={toggleResetPasswordModal}
        >
          Change Password
        </Button>
        <ResetPassword
          onClose={toggleResetPasswordModal}
          isVisible={isResetPasswordVisible}
        />
        <Backup />
      </View>

      <View style={styles.logout}>
        <Button
          icon="logout"
          mode="elevated"
          buttonColor="white"
          style={styles.button}
          onPress={handleLogout}
        >
          Logout
        </Button>
      </View>
    </View>
  );
};

export default Settings;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingTop: 10,
    backgroundColor: "#F2F5F3",
  },
  content: {
    flex: 1,
  },
  logout: {
    marginBottom: 20,
  },
});
