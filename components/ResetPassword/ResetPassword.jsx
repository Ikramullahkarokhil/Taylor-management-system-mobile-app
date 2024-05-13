import React from "react";
import { View, Text, Modal, StyleSheet, ToastAndroid } from "react-native";
import { Button, TextInput } from "react-native-paper";
import { Formik } from "formik";
import db from "../../Database";
import * as Yup from "yup";

const ResetPassword = ({ isVisible, onClose }) => {
  const validationSchema = Yup.object().shape({
    currentPassword: Yup.string().required("Current password is required"),
    newPassword: Yup.string().required("New password is required"),
    confirmPassword: Yup.string()
      .required("Confirm new password is required")
      .oneOf([Yup.ref("newPassword"), null], "Passwords must match"),
  });

  const handleResetPassword = (values, { resetForm, setFieldError }) => {
    const { currentPassword, newPassword } = values;
    db.transaction(
      (tx) => {
        tx.executeSql(
          "SELECT * FROM admin WHERE password = ?",
          [currentPassword],
          (_, { rows }) => {
            if (rows.length > 0) {
              tx.executeSql(
                "UPDATE admin SET password = ? WHERE password = ?",
                [newPassword, currentPassword],
                (_, { rowsAffected }) => {
                  if (rowsAffected > 0) {
                    ToastAndroid.show(
                      "Password changed successfully!",
                      ToastAndroid.SHORT
                    );
                    resetForm(); // Reset form values
                    onClose(); // Close the modal
                  } else {
                    console.log("Failed to update password");
                  }
                }
              );
            } else {
              setFieldError("currentPassword", "Incorrect password");
            }
          }
        );
      },
      (error) => {
        console.log("Transaction error:", error);
      }
    );
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalText}>Change Password</Text>
          <Formik
            initialValues={{
              currentPassword: "",
              newPassword: "",
              confirmPassword: "",
            }}
            onSubmit={handleResetPassword}
            validationSchema={validationSchema}
          >
            {({
              handleChange,
              handleSubmit,
              values,
              errors,
              touched,
              setFieldTouched,
            }) => (
              <View>
                <TextInput
                  style={[
                    styles.input,
                    touched.currentPassword && errors.currentPassword
                      ? { borderColor: "red" }
                      : null,
                  ]}
                  placeholder="Current Password"
                  value={values.currentPassword}
                  onChangeText={handleChange("currentPassword")}
                  onBlur={() => setFieldTouched("currentPassword")}
                  secureTextEntry
                />
                {touched.currentPassword && errors.currentPassword && (
                  <Text style={styles.errorText}>{errors.currentPassword}</Text>
                )}
                <TextInput
                  style={[
                    styles.input,
                    touched.newPassword && errors.newPassword
                      ? { borderColor: "red" }
                      : null,
                  ]}
                  placeholder="New Password"
                  value={values.newPassword}
                  onChangeText={handleChange("newPassword")}
                  onBlur={() => setFieldTouched("newPassword")}
                  secureTextEntry
                />
                {touched.newPassword && errors.newPassword && (
                  <Text style={styles.errorText}>{errors.newPassword}</Text>
                )}
                <TextInput
                  style={[
                    styles.input,
                    touched.confirmPassword && errors.confirmPassword
                      ? { borderColor: "red" }
                      : null,
                  ]}
                  placeholder="Confirm New Password"
                  value={values.confirmPassword}
                  onChangeText={handleChange("confirmPassword")}
                  onBlur={() => setFieldTouched("confirmPassword")}
                  secureTextEntry
                />
                {touched.confirmPassword && errors.confirmPassword && (
                  <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                )}
                <View style={styles.buttonContainer}>
                  <Button mode="contained" onPress={handleSubmit}>
                    Change Password
                  </Button>
                  <Button mode="outlined" onPress={onClose}>
                    Cancel
                  </Button>
                </View>
              </View>
            )}
          </Formik>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    width: "90%",
    elevation: 10,
  },
  modalText: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  input: {
    height: 50,
    // borderColor: "#ccc",
    // borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
    fontSize: 16,
    backgroundColor: "white",
  },
  errorText: {
    color: "red",
    marginBottom: 5,
  },
  buttonContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
});

export default ResetPassword;
