import { create } from "zustand";
import { executeSql, updateCustomersInSQLite } from "./Database";
import dbFirestore from "./firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

const useCustomerStore = create((set) => ({
  data: [],
  sqliteData: [],
  totalRecords: 0,
  isConnected: true,

  fetchData: async (option, searchQuery, isConnected) => {
    if (!isConnected) {
      // Use SQLite data directly if offline
      const sqlQuery = "SELECT * FROM customers";
      const results = await executeSql(sqlQuery);
      console.log("Fetched SQLite data:", results.rows._array); // Debug SQLite data
      set({ sqliteData: results.rows._array, data: results.rows._array });
      return;
    }

    const customersCollection = collection(dbFirestore, option);
    try {
      let q;
      if (searchQuery) {
        q = query(
          customersCollection,
          where("name", ">=", searchQuery),
          where("name", "<=", searchQuery + "\uf8ff")
        );
      } else {
        q = query(customersCollection);
      }

      const querySnapshot = await getDocs(q);
      const fetchedData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Update SQLite with fetched data and set state
      await updateCustomersInSQLite(fetchedData);
      set({ data: fetchedData });
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  },

  fetchTotalRecords: async (option, isConnected, sqliteData) => {
    if (!isConnected) {
      set({ totalRecords: sqliteData.length || 0 });
      return;
    }

    const totalCollection = collection(dbFirestore, option);
    try {
      const q = query(totalCollection);
      const querySnapshot = await getDocs(q);
      set({ totalRecords: querySnapshot.size });
    } catch (error) {
      console.error("Error fetching total records:", error);
    }
  },

  setConnectionStatus: (status) => set({ isConnected: status }),
}));

export default useCustomerStore;
