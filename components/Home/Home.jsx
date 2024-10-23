import React, { useEffect, useCallback, useState, useRef } from "react";
import {
  StyleSheet,
  View,
  RefreshControl,
  ToastAndroid,
  Text,
  TouchableOpacity,
} from "react-native";
import {
  Searchbar,
  Card,
  Title,
  Paragraph,
  IconButton,
} from "react-native-paper";
import CustomerDetailsModal from "../CustomerDetailsModal/CustomerDetailsModal";
import ConfirmationDialog from "../ConfirmationDialog/ConfirmationDialog";
import SelectDropdown from "react-native-select-dropdown";
import AsyncStorage from "@react-native-async-storage/async-storage";
import dbFirestore from "../../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  writeBatch,
} from "firebase/firestore";
import { FlashList } from "@shopify/flash-list";
import NetInfo from "@react-native-community/netinfo";
import { executeSql, updateCustomersInSQLite } from "../../Database";

const optionMapping = {
  کالا: "customer",
  واسکت: "waskat",
};

const Home = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [data, setData] = useState([]);
  const [selectedOption, setSelectedOption] = useState("customer");
  const [totalRecords, setTotalRecords] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmationVisible, setConfirmationVisible] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const flatListRef = useRef(null);

  useEffect(() => {
    // const unsubscribe = NetInfo.addEventListener((state) => {
    //   setIsConnected(state.isConnected);
    // });
    // return () => {
    //   unsubscribe();
    // };
  }, []);

  useEffect(() => {
    fetchAllData(selectedOption, searchQuery);
  }, [searchQuery, selectedOption]);

  // Combined function to fetch both data and total records
  const fetchAllData = async (option, queryText) => {
    setRefreshing(true);
    await fetchData(option, queryText);
    await fetchTotalRecords();
    await syncUpdates();
    setRefreshing(false);
  };

  const fetchData = useCallback(
    async (option, queryText) => {
      try {
        const customersCollection = collection(dbFirestore, option);
        const sqlQuery = "SELECT * FROM customers";
        const results = await executeSql(sqlQuery);
        setData(results.rows._array);

        if (isConnected) {
          const q = queryText
            ? query(
                customersCollection,
                where("name", ">=", queryText),
                where("name", "<=", queryText + "\uf8ff")
              )
            : query(customersCollection);

          const querySnapshot = await getDocs(q);
          const fetchedData = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          await updateSQLiteWithFetchedData(fetchedData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    },
    [isConnected]
  );

  const updateSQLiteWithFetchedData = async (data) => {
    try {
      await updateCustomersInSQLite(data);
      console.log("Customers updated");
    } catch (error) {
      console.error("Error updating SQLite:", error);
    }
  };

  const fetchTotalRecords = async () => {
    try {
      if (data && data.length > 0) {
        setTotalRecords(data.length);
      } else {
        console.log("No data available");
        setTotalRecords(0);
      }
    } catch (error) {
      console.error("Error fetching total records:", error);
    }
  };

  useEffect(() => {
    if (isConnected) {
      syncDeletions();
    }
  }, [isConnected]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAllData(selectedOption, searchQuery);
  }, [selectedOption, searchQuery]);

  const handleDetails = (item) => {
    setSelectedCustomer(item);
    setModalVisible(true);
  };

  const handleDelete = (item) => {
    setSelectedCustomer(item);
    setConfirmationVisible(true);
  };

  const syncDeletions = async () => {
    try {
      const deletedCustomer = await AsyncStorage.getItem("deletedCustomer");
      const customers = deletedCustomer ? JSON.parse(deletedCustomer) : [];

      if (customers.length > 0 && isConnected) {
        for (const customer of customers) {
          if (customer.id) {
            console.log("Syncing deletion:", customer.id);
            const q = query(
              collection(dbFirestore, selectedOption),
              where("id", "==", customer.id)
            );
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
              querySnapshot.forEach(async (docSnapshot) => {
                await deleteDoc(
                  doc(dbFirestore, selectedOption, docSnapshot.id)
                );
              });
            }
          }
        }
        await AsyncStorage.removeItem("deletedCustomer");
      }
    } catch (error) {
      console.error("Error syncing deletions:", error);
    }
  };

  const syncUpdates = async () => {
    try {
      const updatedCustomer = await AsyncStorage.getItem("updatedCustomer");
      const customers = updatedCustomer ? JSON.parse(updatedCustomer) : [];

      if (customers.length > 0 && isConnected) {
        const batch = writeBatch(dbFirestore); // Firestore batch for multiple updates

        for (const customer of customers) {
          if (customer.id) {
            console.log("Syncing updateCustomer:", customer.id);

            const q = query(
              collection(dbFirestore, selectedOption),
              where("id", "==", customer.id)
            );
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
              querySnapshot.forEach((docSnapshot) => {
                // Pass the data you want to update
                batch.update(doc(dbFirestore, selectedOption, docSnapshot.id), {
                  ...customer, // Assuming the customer object has all the updated fields
                });
              });
            }
          }
        }

        // Commit the batch of updates
        await batch.commit();
        await AsyncStorage.removeItem("updatedCustomer"); // Clear synced customers from AsyncStorage
      }
    } catch (error) {
      console.error("Error syncing updates:", error); // Updated error message
    }
  };

  const confirmDelete = async () => {
    if (!selectedCustomer || !selectedCustomer.id) return;

    const { id } = selectedCustomer;
    setData((prevData) => prevData.filter((item) => item.id !== id));

    try {
      if (isConnected) {
        const sqliteQuery = `DELETE FROM customers WHERE id = '${id}'`;
        await executeSql(sqliteQuery);
        setConfirmationVisible(false);
        const q = query(
          collection(dbFirestore, selectedOption),
          where("id", "==", id)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          querySnapshot.forEach(async (docSnapshot) => {
            await deleteDoc(doc(dbFirestore, selectedOption, docSnapshot.id));
          });
        }
        ToastAndroid.show("Customer deleted successfully!", ToastAndroid.SHORT);
      } else {
        const customersInStorage = await AsyncStorage.getItem(
          "deletedCustomer"
        );
        const customers = customersInStorage
          ? JSON.parse(customersInStorage)
          : [];

        if (!customers.some((customer) => customer.id === id)) {
          customers.push(selectedCustomer);
        }
        await AsyncStorage.setItem(
          "deletedCustomer",
          JSON.stringify(customers)
        );

        const sqlQuery = `DELETE FROM customers WHERE id = '${id}'`;
        await executeSql(sqlQuery);

        ToastAndroid.show(
          "No internet. Customer deleted locally.",
          ToastAndroid.SHORT
        );
      }
      setConfirmationVisible(false);
      fetchTotalRecords(selectedOption);
    } catch (error) {
      console.error("Error deleting customer:", error);
      // Optional: Show user feedback here (e.g., Toast)
      fetchData(selectedOption, searchQuery);
    }
  };

  const handleOptionChange = (option) => {
    const englishTableName = optionMapping[option];
    setSelectedOption(englishTableName);
    fetchAllData(englishTableName, searchQuery);
  };

  const ListItem = React.memo(({ item, onPressDetails, onPressDelete }) => {
    return (
      <Card
        style={styles.card}
        mode="elevated"
        elevation={3}
        onPress={() => onPressDetails(item)}
      >
        <View style={styles.cardDirection}>
          <View style={styles.cardContent}>
            <Card.Content>
              <Title style={styles.title}>Name: {item.name}</Title>

              <Paragraph>
                Phone: <Text style={styles.content}>{item.phoneNumber}</Text>
              </Paragraph>
              <Paragraph>
                Registration Date:{" "}
                <Text style={styles.content}>{item.regestrationDate}</Text>
              </Paragraph>
            </Card.Content>
          </View>
          <Card.Actions>
            <View style={styles.iconDirection}>
              <IconButton
                icon="eye"
                iconColor="#0083D0"
                onPress={() => onPressDetails(item)}
              />
              <IconButton
                icon="delete"
                iconColor="red"
                onPress={() => onPressDelete(item)}
              />
            </View>
          </Card.Actions>
        </View>
      </Card>
    );
  });

  const renderItem = useCallback(
    ({ item }) => (
      <ListItem
        item={item}
        onPressDetails={handleDetails}
        onPressDelete={handleDelete}
      />
    ),
    []
  );

  const renderListHeader = useCallback(
    () => (
      <View style={styles.totalRecords}>
        <Text>Total Number of records: {totalRecords}</Text>
      </View>
    ),
    [totalRecords]
  );

  const goToTop = () => {
    flatListRef.current.scrollToOffset({ animated: true, offset: 0 });
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search..."
          onChangeText={(text) => setSearchQuery(text)}
          value={searchQuery}
          style={styles.searchbar}
        />
        <SelectDropdown
          data={["کالا", "واسکت"]}
          onSelect={(selectedItem) =>
            handleOptionChange(selectedItem.toLowerCase())
          }
          defaultButtonText={"کالا"}
          buttonTextAfterSelection={(selectedItem) => selectedItem}
          rowTextForSelection={(item) => item}
          buttonStyle={styles.dropdownButton}
          buttonTextStyle={styles.dropdownButtonText}
          dropdownStyle={styles.dropdown}
          dropdownTextStyle={styles.dropdownItemText}
        />
      </View>

      <FlashList
        ref={flatListRef}
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        key={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={renderListHeader}
        initialNumToRender={5}
        estimatedItemSize={139}
      />
      <View style={styles.goToTopButton}>
        <TouchableOpacity onPress={goToTop}>
          <IconButton icon="arrow-up" color="#0083D0" />
        </TouchableOpacity>
      </View>

      {modalVisible && (
        <CustomerDetailsModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          customer={selectedCustomer}
        />
      )}
      {confirmationVisible && (
        <ConfirmationDialog
          visible={confirmationVisible}
          onDismiss={() => setConfirmationVisible(false)}
          onConfirm={confirmDelete}
          title="Confirm Deletion"
          message={`Are you sure you want to delete this ${selectedOption}?`}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F5F3",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
    marginHorizontal: 10,
  },
  searchbar: {
    flex: 1,
    marginRight: 10,
    backgroundColor: "white",
    borderRadius: 15,
  },
  dropdownButton: {
    borderRadius: 15,
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: "white",
    width: 100,
    height: 55,
  },
  dropdownButtonText: {
    color: "#333",
  },
  dropdown: {
    borderWidth: 1,
    borderRadius: 10,
    borderColor: "#ccc",
  },
  dropdownItemText: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    color: "#333",
  },
  card: {
    marginVertical: 10,
    borderRadius: 10,
    marginHorizontal: 10,
    backgroundColor: "white",
    justifyContent: "center",
  },
  cardContent: {
    justifyContent: "center",
  },
  cardDirection: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  iconDirection: {
    flexDirection: "column",
    justifyContent: "flex-end",
  },
  title: {
    fontSize: 18,
    marginBottom: 5,
  },
  totalRecords: {
    marginBottom: 5,
    marginHorizontal: 10,
  },
  goToTopButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#0083D0",
    borderRadius: 20,
  },
});

export default Home;
