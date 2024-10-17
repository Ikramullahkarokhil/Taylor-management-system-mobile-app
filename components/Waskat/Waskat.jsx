import React, { useState } from "react";
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  ToastAndroid,
  TouchableOpacity,
} from "react-native";
import { TextInput } from "react-native-paper";
import SelectDropdown from "react-native-select-dropdown";
import { Formik } from "formik";
import * as Yup from "yup";
import { dbFirestore } from "../../firebase";
import { addDoc, collection } from "firebase/firestore";

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
        onSelect={(selectedItem) => {
          handleChange(name)(selectedItem);
        }}
        buttonTextAfterSelection={(selectedItem) => {
          return selectedItem;
        }}
        rowTextForSelection={(item) => {
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

const Waskat = () => {
  const [resetFields, setResetFields] = useState(false);

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
  const selectYakhan = ["وی v", "ګول", "یخندار"];

  const saveCustomerWaskat = async (values, resetForm) => {
    try {
      const waskatCollection = collection(dbFirestore, "waskat");
      await addDoc(waskatCollection, {
        name: values.name,
        phoneNumber: values.phoneNumber,
        qad: values.qad,
        yakhan: values.yakhan,
        yakhanValue: values.yakhanValue,
        shana: values.shana,
        baghal: values.baghal,
        kamar: values.kamar,
        soreen: values.soreen,
        astin: values.astin,
        registrationDate: currentDate,
      });
      ToastAndroid.show("مشتری موفقانه اضافه شد!", ToastAndroid.SHORT);
      resetForm();
      setResetFields(!resetFields);
    } catch (error) {
      console.error("Error saving customer:", error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>قد اندام واسکت</Text>
      <Formik
        initialValues={{
          name: "",
          phoneNumber: "",
          qad: "",
          yakhan: "",
          shana: "",
          baghal: "",
          kamar: "",
          soreen: "",
          astin: "",
          yakhanValue: "",
        }}
        validationSchema={validationSchema}
        onSubmit={(values, { resetForm }) =>
          saveCustomerWaskat(values, resetForm)
        }
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
                <DynamicInputField
                  label="استین"
                  name="astin"
                  handleChange={handleChange}
                  handleBlur={handleBlur}
                  value={values.astin}
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
                <DynamicInputField
                  label="سورین"
                  name="soreen"
                  handleChange={handleChange}
                  handleBlur={handleBlur}
                  value={values.soreen}
                  errors={errors}
                  keyboard="numeric"
                />
              </View>
            </View>
            <View style={styles.fieldContainer2}>
              <View style={styles.fieldContainer}>
                <DynamicInputField
                  label="کمر"
                  name="kamar"
                  handleChange={handleChange}
                  handleBlur={handleBlur}
                  value={values.kamar}
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

            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
              <Text style={styles.buttonText}>اضافه کردن واسکت مشتری</Text>
            </TouchableOpacity>
          </View>
        )}
      </Formik>
    </ScrollView>
  );
};

export default Waskat;

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingTop: 20,
    paddingBottom: 20,
  },
  title: {
    paddingBottom: 15,
    fontSize: 20,
    color: "red",
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
    borderColor: "black",
    backgroundColor: "white",
  },
  dropdownButtonText: {
    textAlign: "left",
    color: "black",
  },
  dropdown: {
    backgroundColor: "white",
    borderRadius: 5,
  },
  dropdownItem: {
    color: "black",
  },
  dropdownItemText: {
    textAlign: "left",
    color: "black",
  },
  button: {
    backgroundColor: "red",
    marginVertical: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
  },
});
