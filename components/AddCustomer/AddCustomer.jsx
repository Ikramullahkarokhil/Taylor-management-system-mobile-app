import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  ToastAndroid,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { TextInput, Checkbox } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import SelectDropdown from "react-native-select-dropdown";
import { Formik } from "formik";
import dbFirestore from "../../firebase";
import { addDoc, collection } from "firebase/firestore";
import * as Yup from "yup";
import NetInfo from "@react-native-community/netinfo";
import { insertCustomer } from "../../Database";

const validationSchema = Yup.object().shape({
  name: Yup.string().required(),
});

const DynamicSelectField = ({
  label,
  name,
  handleChange,
  items,
  errors,
  resetField,
}) => (
  <View style={styles.row}>
    <View style={styles.fieldContainer}>
      <SelectDropdown
        data={items}
        onSelect={(selectedItem, index) => {
          handleChange(name)(selectedItem);
        }}
        buttonTextAfterSelection={(selectedItem, index) => {
          return selectedItem;
        }}
        rowTextForSelection={(item, index) => {
          return item;
        }}
        error={errors[name] ? true : false}
        defaultButtonText={`انتخاب ${label}`}
        buttonStyle={styles.dropdownButton}
        buttonTextStyle={styles.dropdownButtonText}
        dropdownStyle={styles.dropdown}
        dropdownTextStyle={styles.dropdownItem}
        rowTextStyle={styles.dropdownItemText}
        key={resetField}
      />
    </View>
  </View>
);

const DynamicInputField = ({
  label,
  name,
  handleChange,
  handleBlur,
  value,
  errors,
  keyboard,
}) => {
  const handleInputChange = (inputValue) => {
    if (keyboard === "numeric" && name !== "phoneNumber") {
      const regex = /^\d{0,2}(\.\d{0,1})?$/;
      if (regex.test(inputValue) || inputValue === "") {
        handleChange(name)(inputValue);
      }
    } else {
      handleChange(name)(inputValue);
    }
  };

  return (
    <View style={styles.fieldContainer}>
      <TextInput
        label={label}
        onChangeText={handleInputChange}
        onBlur={handleBlur(name)}
        value={value}
        style={styles.input}
        error={errors[name] ? true : false}
        keyboardType={keyboard}
        multiline={true}
      />
    </View>
  );
};

const AddCustomer = () => {
  const [resetFields, setResetFields] = useState(false);
  const [jeebTunbanChecked, setJeebTunbanChecked] = useState(false);
  const [yakhanBinChecked, setYakhanBinChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  const getCurrentDate = () => {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    let month = currentDate.getMonth() + 1;
    let day = currentDate.getDate();
    month = month < 10 ? "0" + month : month;
    day = day < 10 ? "0" + day : day;
    return `${year}-${month}-${day}`;
  };

  const currentDate = getCurrentDate();

  const selectYakhan = [
    "یخن ګلدوزی",
    "یخن هندی",
    "قاسمی",
    "یخن هفت",
    "یخن ګول",
    "یخن عربی",
    "کټ بین",
    "ساده بین",
    "ترکی بین",
    "کالر",
    "ګول کالر",
  ];

  const selectDaman = ["ګول", "چهار کنج", "ترخزی", "2 ترخزی", "دامن بردار"];
  const selectCaff = [
    "چسف کف",
    "ګول کف",
    "ډبل کف",
    "ساده",
    "ساده بردار",
    "ساده بردار مثلث",
    "میژدار",
    "کف فلیټ دار",
    "کف میژدار",
  ];
  const selectJeeb = ["2 جیب بغل 1 پیشرو", "2 جیب بغل"];
  const selectTunbanStyle = ["تنبان آزاد", "تنبان متوسط", "تنبان بلوچی"];

  const syncOfflineData = async () => {
    const customersInStorage = await AsyncStorage.getItem("customers");
    const customers = customersInStorage ? JSON.parse(customersInStorage) : [];

    if (customers.length > 0 && isConnected) {
      try {
        const customersCollection = collection(dbFirestore, "customer");
        for (const customer of customers) {
          await addDoc(customersCollection, customer);
        }
        await AsyncStorage.removeItem("customers");
        ToastAndroid.show("Data synced with Firebase", ToastAndroid.SHORT);
      } catch (error) {
        console.error("Error syncing data:", error);
      }
    }
  };

  useEffect(() => {
    if (isConnected) {
      syncOfflineData();
    }
  }, [isConnected]);

  const saveCustomer = async (
    values,
    resetForm,
    yakhanBinChecked,
    jeebTunbanChecked
  ) => {
    setLoading(true);
    try {
      const customerData = {
        name: values.name,
        phoneNumber: values.phoneNumber,
        qad: values.qad,
        barDaman: values.barDaman,
        baghal: values.baghal,
        shana: values.shana,
        astin: values.astin,
        tunban: values.tunban,
        pacha: values.pacha,
        yakhan: values.yakhan,
        yakhanValue: values.yakhanValue,
        yakhanBin: yakhanBinChecked ? true : false,
        farmaish: values.farmaish,
        daman: values.daman,
        caff: values.caff,
        caffValue: values.caffValue,
        jeeb: values.jeeb,
        tunbanStyle: values.tunbanStyle,
        jeebTunban: jeebTunbanChecked ? true : false,
        regestrationDate: currentDate,
      };

      if (isConnected) {
        const customersCollection = collection(dbFirestore, "customer");
        await addDoc(customersCollection, customerData);
        ToastAndroid.show("Customer added to Firebase!", ToastAndroid.SHORT);
      } else {
        const customersInStorage = await AsyncStorage.getItem("customers");
        const customers = customersInStorage
          ? JSON.parse(customersInStorage)
          : [];
        customers.push(customerData);
        await AsyncStorage.setItem("customers", JSON.stringify(customers));
        ToastAndroid.show(
          "No internet. Customer added to local storage.",
          ToastAndroid.SHORT
        );
      }
      await insertCustomer(customerData);
      console.log("Customer added:", customerData);

      resetForm();
      setResetFields(!resetFields);
      setJeebTunbanChecked(false);
      setYakhanBinChecked(false);
    } catch (error) {
      console.error("Error adding customer:", error);
      ToastAndroid.show(
        "Failed to add customer. Please try again.",
        ToastAndroid.SHORT
      );
    }
    setLoading(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Formik
        initialValues={{
          name: "",
          phoneNumber: "",
          qad: "",
          barDaman: "",
          baghal: "",
          shana: "",
          astin: "",
          tunban: "",
          pacha: "",
          yakhan: "",
          yakhanValue: "",
          yakhanBin: "",
          farmaish: "",
          daman: "",
          caff: "",
          caffValue: "",
          jeeb: "",
          tunbanStyle: "",
          jeebTunban: "",
        }}
        validationSchema={validationSchema}
        onSubmit={(values, { resetForm }) => saveCustomer(values, resetForm)}
      >
        {({ handleChange, handleBlur, handleSubmit, values, errors }) => (
          <View style={styles.form}>
            <View style={styles.fieldContainer}>
              <DynamicInputField
                label="نام مشتری"
                name="name"
                handleChange={handleChange}
                handleBlur={handleBlur}
                value={values.name}
                errors={errors}
                keyboard="default"
              />
            </View>
            <View style={styles.fieldContainer}>
              <DynamicInputField
                label="شماره تلفن"
                name="phoneNumber"
                handleChange={handleChange}
                handleBlur={handleBlur}
                value={values.phoneNumber}
                errors={errors}
                keyboard="numeric"
              />
            </View>
            <View style={styles.fieldContainer2}>
              <View style={styles.fieldContainer}>
                <DynamicInputField
                  label="قد"
                  name="qad"
                  handleChange={handleChange}
                  handleBlur={handleBlur}
                  value={values.qad}
                  errors={errors}
                  keyboard="numeric"
                />
              </View>

              <View style={styles.fieldContainer}>
                <DynamicSelectField
                  label="یخن"
                  name="yakhan"
                  handleChange={handleChange}
                  handleBlur={handleBlur}
                  value={values.yakhan}
                  items={selectYakhan}
                  errors={errors}
                  resetField={resetFields}
                />
              </View>
            </View>

            <View style={styles.fieldContainer2}>
              <View style={styles.fieldContainer}>
                <DynamicInputField
                  label="بر دامن"
                  name="barDaman"
                  handleChange={handleChange}
                  handleBlur={handleBlur}
                  value={values.barDaman}
                  errors={errors}
                  keyboard="numeric"
                />
              </View>

              <View style={styles.fieldContainer}>
                <DynamicInputField
                  label="اندازه یخن"
                  name="yakhanValue"
                  handleChange={handleChange}
                  handleBlur={handleBlur}
                  value={values.yakhanValue}
                  errors={errors}
                  keyboard="numeric"
                />
              </View>
            </View>
            <View style={styles.fieldContainer2}>
              <View style={styles.fieldContainer}>
                <DynamicInputField
                  label="بغل"
                  name="baghal"
                  handleChange={handleChange}
                  handleBlur={handleBlur}
                  value={values.baghal}
                  errors={errors}
                  keyboard="numeric"
                />
              </View>

              <View style={styles.fieldContainer}>
                <Checkbox.Item
                  label="بن دار"
                  status={yakhanBinChecked ? "checked" : "unchecked"}
                  onPress={() => setYakhanBinChecked(!yakhanBinChecked)}
                  labelStyle={styles.checkboxLabel}
                  color="#0083D0"
                  uncheckedColor="#0083D0"
                  style={styles.checkbox}
                />
              </View>
            </View>

            <View style={styles.fieldContainer2}>
              <View style={styles.fieldContainer}>
                <DynamicInputField
                  label="شانه"
                  name="shana"
                  handleChange={handleChange}
                  handleBlur={handleBlur}
                  value={values.shana}
                  errors={errors}
                  keyboard="numeric"
                />
              </View>

              <View style={styles.fieldContainer}>
                <DynamicSelectField
                  label="آستین"
                  name="caff"
                  handleChange={handleChange}
                  handleBlur={handleBlur}
                  value={values.caff}
                  items={selectCaff}
                  errors={errors}
                  resetField={resetFields}
                />
              </View>
            </View>
            <View style={styles.fieldContainer2}>
              <View style={styles.fieldContainer}>
                <DynamicInputField
                  label="آستین"
                  name="astin"
                  handleChange={handleChange}
                  handleBlur={handleBlur}
                  value={values.astin}
                  errors={errors}
                  keyboard="numeric"
                />
              </View>
              <View style={styles.fieldContainer}>
                <DynamicInputField
                  label={`اندازه ${values.caff}`}
                  name="caffValue"
                  handleChange={handleChange}
                  handleBlur={handleBlur}
                  value={values.caffValue}
                  errors={errors}
                  keyboard="numeric"
                />
              </View>
            </View>

            <View style={styles.fieldContainer2}>
              <View style={styles.fieldContainer}>
                <DynamicInputField
                  label="تنبان"
                  name="tunban"
                  handleChange={handleChange}
                  handleBlur={handleBlur}
                  value={values.tunban}
                  errors={errors}
                  keyboard="numeric"
                />
              </View>

              <View style={styles.fieldContainer}>
                <DynamicSelectField
                  label="دامن"
                  name="daman"
                  handleChange={handleChange}
                  handleBlur={handleBlur}
                  value={values.daman}
                  items={selectDaman}
                  errors={errors}
                  resetField={resetFields}
                />
              </View>
            </View>
            <View style={styles.fieldContainer2}>
              <View style={styles.fieldContainer}>
                <DynamicInputField
                  label="پاچه"
                  name="pacha"
                  handleChange={handleChange}
                  handleBlur={handleBlur}
                  value={values.pacha}
                  errors={errors}
                  keyboard="numeric"
                />
              </View>
              <View style={styles.fieldContainer}>
                <DynamicSelectField
                  label="تنبان"
                  name="tunbanStyle"
                  handleChange={handleChange}
                  handleBlur={handleBlur}
                  value={values.tunbanStyle}
                  items={selectTunbanStyle}
                  errors={errors}
                  resetField={resetFields}
                />
              </View>
            </View>

            <View style={styles.fieldContainer2}>
              <View style={styles.fieldContainer}>
                <DynamicSelectField
                  label="جیب"
                  name="jeeb"
                  handleChange={handleChange}
                  handleBlur={handleBlur}
                  value={values.jeeb}
                  items={selectJeeb}
                  errors={errors}
                  resetField={resetFields}
                />
              </View>
              <View style={styles.fieldContainer}>
                <Checkbox.Item
                  label="جیب تنبان"
                  status={jeebTunbanChecked ? "checked" : "unchecked"}
                  onPress={() => setJeebTunbanChecked(!jeebTunbanChecked)}
                  labelStyle={styles.checkboxLabel}
                  color="#0083D0" // Change checkbox color
                  uncheckedColor="#0083D0" // Change unchecked checkbox color
                  style={styles.checkbox}
                />
              </View>
            </View>

            <View style={[styles.fieldContainer2, { marginTop: 10 }]}>
              <View style={styles.fieldContainer}>
                <DynamicInputField
                  label="فرمایشات"
                  name="farmaish"
                  handleChange={handleChange}
                  handleBlur={handleBlur}
                  value={values.farmaish}
                  errors={errors}
                />
              </View>
            </View>

            <View style={styles.fieldContainer2}>
              <View style={styles.fieldContainer}>
                <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                  {loading ? (
                    <ActivityIndicator color="#ffffff" size={24} />
                  ) : (
                    <Text style={styles.buttonText}>اضافه کردن مشتری</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </Formik>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingTop: 20,
    paddingBottom: 20,
  },
  form: {
    width: "100%",
  },
  input: {
    marginBottom: 10,
    backgroundColor: "white",
    borderColor: "black",
  },
  error: {
    color: "red",
  },
  fieldContainer: {
    flex: 1,
  },

  fieldContainer2: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },

  dropdownContainer: {
    marginBottom: 10,
  },
  dropdownButton: {
    borderBottomWidth: 0.5,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 1,
    borderColor: "black",
    width: "auto",
    height: 55,
    backgroundColor: "white",
  },
  dropdownButtonText: {
    color: "#333",
    textAlign: "left",
  },
  dropdown: {
    borderWidth: 1,
    borderRadius: 5,
    borderColor: "#ccc",
    marginTop: 5,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  dropdownItemText: {
    color: "#333",
  },
  checkboxLabel: {
    fontSize: 16,
    color: "#333",
  },
  checkbox: {
    backgroundColor: "white",
    borderBottomWidth: 0.5,
    borderColor: "black",
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    height: 55,
    width: "auto",
  },
  button: {
    backgroundColor: "#0083D0",
    borderRadius: 5,
    paddingVertical: 17,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default AddCustomer;
