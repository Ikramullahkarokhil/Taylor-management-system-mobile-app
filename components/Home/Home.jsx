import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  StyleSheet,
  View,
  FlatList,
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

import db from "../../Database";
import CustomerDetailsModal from "../CustomerDetailsModal/CustomerDetailsModal";
import ConfirmationDialog from "../ConfirmationDialog/ConfirmationDialog";
import SelectDropdown from "react-native-select-dropdown";
import WaskatDetailsComponent from "../WaskatDetailsComponent/WaskatDetailsComponent";

const Home = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [data, setData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmationVisible, setConfirmationVisible] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loadedRecords, setLoadedRecords] = useState(10);
  const [selectedOption, setSelectedOption] = useState("customer"); // Default selected option
  const flatListRef = useRef(null);

  useEffect(() => {
    fetchData();
    fetchTotalRecords();
  }, [searchQuery, selectedOption]); // Trigger fetch data when search query, updateData, or selectedOption changes

  const fetchData = useCallback(() => {
    if (selectedOption === "customer") {
      fetchCustomerData();
    } else if (selectedOption === "waskat") {
      fetchWaskatData();
    }
  }, [selectedOption, searchQuery, loadedRecords]);

  const fetchCustomerData = useCallback(() => {
    let query =
      "SELECT * FROM customer WHERE name LIKE ? OR phoneNumber LIKE ?";
    const queryParams = [`%${searchQuery}%`, `%${searchQuery}%`];

    db.transaction((tx) => {
      tx.executeSql(
        query,
        queryParams,
        (_, { rows: { _array } }) => {
          setData(_array);
        },
        (error) => {
          console.log("Error:", error);
        }
      );
    });
  }, [searchQuery, loadedRecords]);

  const fetchWaskatData = useCallback(() => {
    let query = "SELECT * FROM waskat WHERE name LIKE ? OR phoneNumber LIKE ?";
    const queryParams = [`%${searchQuery}%`, `%${searchQuery}%`];

    db.transaction((tx) => {
      tx.executeSql(
        query,
        queryParams,
        (_, { rows: { _array } }) => {
          setData(_array);
        },
        (error) => {
          console.log("Error:", error);
        }
      );
    });
  }, [searchQuery, loadedRecords]);

  const optionMapping = {
    کالا: "customer",
    واسکت: "waskat",
  };

  const handleOptionChange = (option) => {
    const englishTableName = optionMapping[option];
    setSelectedOption(englishTableName);
    fetchTotalRecords();
  };

  const goToTop = () => {
    flatListRef.current.scrollToOffset({ animated: true, offset: 0 });
    setLoadedRecords(10);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
    fetchTotalRecords();
    setRefreshing(false);
  }, [fetchData]);

  const handleDetails = (item) => {
    setSelectedCustomer(item);
    setModalVisible(true);
  };

  const handleDelete = (item) => {
    setSelectedCustomer(item);
    setConfirmationVisible(true);
  };

  const confirmDelete = () => {
    if (!selectedCustomer) return;

    const { id } = selectedCustomer;

    db.transaction((tx) => {
      tx.executeSql(
        `DELETE FROM ${selectedOption} WHERE id = ?`,
        [id],
        () => {
          ToastAndroid.show(
            "Customer deleted successfully!",
            ToastAndroid.SHORT
          );
          setModalVisible(false);
          setConfirmationVisible(false);
          fetchTotalRecords();
          fetchData();
        },
        (error) => {
          console.log("Error deleting customer:", error);
        }
      );
    });
  };

  const fetchTotalRecords = useCallback(() => {
    const query = `SELECT COUNT(id) AS total FROM ${selectedOption}`;

    db.transaction((tx) => {
      tx.executeSql(
        query,
        [],
        (_, { rows }) => {
          const { total } = rows.item(0);
          setTotalRecords(total);
        },
        (error) => {
          console.log("Error counting total records:", error);
        }
      );
    });
  }, [selectedOption]);

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
    [fetchData]
  );

  const renderListHeader = useCallback(
    () => (
      <View style={styles.totalRecords}>
        <Text>Total Number of records {totalRecords}</Text>
      </View>
    ),
    [totalRecords]
  );

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

      <FlatList
        ref={flatListRef}
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={renderListHeader}
        initialNumToRender={5}
      />

      <TouchableOpacity style={styles.goToTopButton} onPress={goToTop}>
        <IconButton icon="arrow-up" color="#0083D0" />
      </TouchableOpacity>

      {modalVisible && selectedOption === "customer" && (
        <CustomerDetailsModal
          visible={modalVisible}
          customer={selectedCustomer}
          onClose={() => setModalVisible(false)}
          onDelete={handleDelete}
        />
      )}

      {modalVisible && selectedOption === "waskat" && (
        <WaskatDetailsComponent
          visible={modalVisible}
          customer={selectedCustomer}
          onClose={() => setModalVisible(false)}
          onDelete={handleDelete}
        />
      )}

      <ConfirmationDialog
        visible={confirmationVisible}
        onCancel={() => setConfirmationVisible(false)}
        onConfirm={confirmDelete}
      />
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
  goToBottomButton: {
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
  },
});

export default Home;
