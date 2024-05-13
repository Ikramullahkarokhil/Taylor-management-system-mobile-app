import React, { useState } from "react";
import { SafeAreaView, StyleSheet, useWindowDimensions } from "react-native";
import { TabView, SceneMap, TabBar } from "react-native-tab-view";
import AddCustomer from "../AddCustomer/AddCustomer";
import Waskat from "../Waskat/Waskat";

const AddPage = () => {
  const layout = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: "addCustomer", title: "کالا" },
    { key: "waskat", title: "واسکت" },
  ]);

  const renderScene = SceneMap({
    addCustomer: AddCustomer,
    waskat: Waskat,
  });

  const renderTabBar = (props) => (
    <TabBar
      {...props}
      indicatorStyle={{ backgroundColor: "#0083D0" }}
      style={{ backgroundColor: "#F2F5F3" }}
      labelStyle={{ color: "#0083D0" }}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        // initialLayout={{ width: layout.width }}
        renderTabBar={renderTabBar}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F5F3",
  },
});

export default AddPage;
