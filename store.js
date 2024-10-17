import { create } from "zustand";
import { dbFirestore } from "./firebase";
import {
  collection,
  getDocs,
  query,
  where,
  startAfter,
  limit,
} from "firebase/firestore";

const useStore = create((set, get) => ({
  searchQuery: "",
  data: [],
  selectedOption: "customer",
  totalRecords: 0,
  loadedRecords: 10,
  startAfterDoc: null, // For pagination

  setSearchQuery: (query) => set({ searchQuery: query }),
  setData: (data) => set({ data }),
  setSelectedOption: (option) => set({ selectedOption: option }),
  setTotalRecords: (total) => set({ totalRecords: total }),
  setLoadedRecords: (records) => set({ loadedRecords: records }),

  fetchCustomerData: async (searchQuery, startAfterDoc = null) => {
    const customersCollection = collection(dbFirestore, "customer");
    try {
      let customerQuery = query(
        customersCollection,
        where("name", "==", searchQuery),
        limit(10)
      );
      if (startAfterDoc) {
        customerQuery = query(customerQuery, startAfter(startAfterDoc));
      }
      const snapshot = await getDocs(customerQuery);
      const customerData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      set({ data: [...get().data, ...customerData] }); // Append new data to existing data
      if (snapshot.docs.length > 0) {
        set({ startAfterDoc: snapshot.docs[snapshot.docs.length - 1] }); // Store the last document for pagination
      }
    } catch (error) {
      console.error("Error fetching customer data:", error);
    }
  },

  fetchWaskatData: async (searchQuery, startAfterDoc = null) => {
    const waskatCollection = collection(dbFirestore, "waskat");
    try {
      let waskatQuery = query(
        waskatCollection.where("name", "==", searchQuery),
        limit(10)
      );
      if (startAfterDoc) {
        waskatQuery = query(waskatQuery, startAfter(startAfterDoc));
      }
      const snapshot = await getDocs(waskatQuery);
      const waskatData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      set({ data: [...get().data, ...waskatData] }); // Append new data to existing data
      if (snapshot.docs.length > 0) {
        set({ startAfterDoc: snapshot.docs[snapshot.docs.length - 1] }); // Store the last document for pagination
      }
    } catch (error) {
      console.error("Error fetching waskat data:", error);
    }
  },

  fetchData: async (selectedOption, searchQuery) => {
    if (selectedOption === "customer") {
      await get().fetchCustomerData(searchQuery, get().startAfterDoc);
    } else if (selectedOption === "waskat") {
      await get().fetchWaskatData(searchQuery, get().startAfterDoc);
    }
  },

  fetchTotalRecords: async (selectedOption) => {
    const customersCollection = collection(dbFirestore, selectedOption);
    try {
      const snapshot = await getDocs(customersCollection);
      const total = snapshot.size;
      set({ totalRecords: total });
    } catch (error) {
      console.error("Error counting total records:", error);
    }
  },
}));

export default useStore;
