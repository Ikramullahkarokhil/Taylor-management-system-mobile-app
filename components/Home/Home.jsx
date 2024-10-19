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
import dbFirestore from "../../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { FlashList } from "@shopify/flash-list";
import NetInfo from "@react-native-community/netinfo";
import { executeSql, updateCustomersInSQLite } from "../../Database";

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
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected);
    });
    NetInfo.fetch().then((state) => {
      setIsConnected(state.isConnected);
      return () => {
        unsubscribe();
      };
    });
  }, []);

  const getdata = async () => {
    try {
      const sqlQuery = "SELECT * FROM customers";
      const results = await executeSql(sqlQuery); // Use executeSql to fetch customers
      const customers = results.rows._array;
      setData(customers); // Update state with fetched customers
      console.log(customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  useEffect(() => {
    getdata();
    fetchData(selectedOption, searchQuery);
    fetchTotalRecords(selectedOption);
  }, [searchQuery, selectedOption]);

  const fetchData = async (option, queryText) => {
    const customersCollection = collection(dbFirestore, option);
    try {
      if (isConnected) {
        let q;
        if (queryText) {
          q = query(
            customersCollection,
            where("name", ">=", queryText),
            where("name", "<=", queryText + "\uf8ff")
          );
        } else {
          q = query(customersCollection);
        }

        const querySnapshot = await getDocs(q);
        const fetchedData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setData(fetchedData);
        updateSQLiteWithFetchedData(fetchedData);
      } else {
        console.log("offline");
        const sqlQuery = "SELECT * FROM customers";
        const results = await executeSql(sqlQuery); // Use executeSql to fetch customers
        const sqliteData = results.rows._array;
        setData(sqliteData); // Update state with fetched SQLite data
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const updateSQLiteWithFetchedData = async (data) => {
    try {
      await updateCustomersInSQLite(data);
      console.log("SQLite updated with Firestore data.");
    } catch (error) {
      console.error("Error updating SQLite:", error);
    }
  };

  const fetchTotalRecords = async (option) => {
    const totalCollection = collection(dbFirestore, option);
    try {
      if (isConnected) {
        const q = query(totalCollection);
        const querySnapshot = await getDocs(q);
        setTotalRecords(querySnapshot.size);
      } else {
        const sqlQuery = "SELECT * FROM customers";
        const results = await executeSql(sqlQuery); // Use executeSql to count records
        const cachedData = results.rows._array;
        if (cachedData) {
          setTotalRecords(cachedData.length);
          console.log("Total records calculated from SQLite");
        } else {
          console.log("No cached data found in SQLite");
          setTotalRecords(0);
        }
      }
    } catch (error) {
      console.error("Error fetching total records:", error);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData(selectedOption, searchQuery);
    fetchTotalRecords(selectedOption);
    setRefreshing(false);
  }, [selectedOption, searchQuery]);

  const handleDetails = (item) => {
    setSelectedCustomer(item);
    setModalVisible(true);
  };

  const handleDelete = (item) => {
    setSelectedCustomer(item);
    setConfirmationVisible(true);
  };

  const confirmDelete = async () => {
    if (!selectedCustomer) return;

    const { id } = selectedCustomer;

    setData((prevData) => prevData.filter((item) => item.id !== id));

    try {
      setConfirmationVisible(false);
      await deleteDoc(doc(dbFirestore, selectedOption, id));
      ToastAndroid.show("Customer deleted successfully!", ToastAndroid.SHORT);
      fetchTotalRecords(selectedOption);
    } catch (error) {
      console.error("Error deleting customer:", error);
      fetchData(selectedOption, searchQuery);
    }
  };

  const optionMapping = {
    کالا: "customer",
    واسکت: "waskat",
  };

  const handleOptionChange = (option) => {
    const englishTableName = optionMapping[option];
    setSelectedOption(englishTableName);
    fetchTotalRecords(englishTableName);
    fetchData(englishTableName, searchQuery);
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
