import { executeSql } from "./Database";
import { dbFirestore } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";

/** Sync unsynced customer records from SQLite to Firestore */
export const syncWithFirestore = async () => {
  try {
    const pendingCustomers = await executeSql(
      "SELECT * FROM customer WHERE sync_status = 'pending';"
    );
    console.log(
      `${pendingCustomers.rows.length} pending customers found for syncing.`
    );

    for (const customer of pendingCustomers.rows._array) {
      try {
        // Check if the customer already exists in Firestore
        const customerQuerySnapshot = await getDocs(
          collection(dbFirestore, "customers"),
          customer.id
        );
        if (customerQuerySnapshot.empty) {
          await addDoc(collection(dbFirestore, "customers"), {
            id: customer.id,
            name: customer.name,
            phoneNumber: customer.phoneNumber,
            qad: customer.qad,
            barDaman: customer.barDaman,
            baghal: customer.baghal,
            shana: customer.shana,
            astin: customer.astin,
            tunban: customer.tunban,
            pacha: customer.pacha,
            yakhan: customer.yakhan,
            yakhanValue: customer.yakhanValue,
            yakhanBin: customer.yakhanBin,
            farmaish: customer.farmaish,
            daman: customer.daman,
            caff: customer.caff,
            caffValue: customer.caffValue,
            jeeb: customer.jeeb,
            tunbanStyle: customer.tunbanStyle,
            jeebTunban: customer.jeebTunban,
            regestrationDate: customer.regestrationDate,
            sync_status: customer.sync_status, // Ensure sync_status is included
          });

          // Mark as synced in SQLite
          await executeSql(
            "UPDATE customer SET sync_status = 'synced' WHERE id = ?;",
            [customer.id]
          );
          console.log(
            `Customer ${customer.name} (ID: ${customer.id}) synced successfully.`
          );
        }
      } catch (error) {
        console.error("Error syncing customer:", error);
      }
    }
  } catch (error) {
    console.error("Error fetching pending customers:", error);
  }
};

/** Sync unsynced waskat records from SQLite to Firestore */
export const syncWaskatWithFirestore = async () => {
  try {
    const pendingWaskat = await executeSql(
      "SELECT * FROM waskat WHERE sync_status = 'pending';"
    );
    console.log(
      `${pendingWaskat.rows.length} pending waskat found for syncing.`
    );

    for (const waskat of pendingWaskat.rows._array) {
      try {
        // Check if the waskat already exists in Firestore
        const waskatQuerySnapshot = await getDocs(
          collection(dbFirestore, "waskat"),
          waskat.id
        );
        if (waskatQuerySnapshot.empty) {
          await addDoc(collection(dbFirestore, "waskat"), {
            id: waskat.id,
            name: waskat.name,
            phoneNumber: waskat.phoneNumber,
            qad: waskat.qad,
            yakhan: waskat.yakhan,
            shana: waskat.shana,
            baghal: waskat.baghal,
            kamar: waskat.kamar,
            soreen: waskat.soreen,
            astin: waskat.astin,
            yakhanValue: waskat.yakhanValue,
            regestrationDate: waskat.regestrationDate,
            sync_status: waskat.sync_status, // Ensure sync_status is included
          });

          // Mark as synced in SQLite
          await executeSql(
            "UPDATE waskat SET sync_status = 'synced' WHERE id = ?;",
            [waskat.id]
          );
          console.log(
            `Waskat ${waskat.name} (ID: ${waskat.id}) synced successfully.`
          );
        }
      } catch (error) {
        console.error("Error syncing waskat:", error);
      }
    }
  } catch (error) {
    console.error("Error fetching pending waskat:", error);
  }
};

/** Sync all customer records from Firestore to SQLite */
export const syncFromFirestore = async () => {
  try {
    const customersSnapshot = await getDocs(
      collection(dbFirestore, "customers")
    );
    console.log(
      `${customersSnapshot.size} customer records fetched from Firestore.`
    );

    for (const doc of customersSnapshot.docs) {
      const data = doc.data();
      // Check if the record exists in SQLite
      const existing = await executeSql(
        "SELECT * FROM customer WHERE id = ?;",
        [data.id]
      );

      // If the record doesn't exist, insert it into SQLite
      if (existing.rows.length === 0) {
        await executeSql(
          `INSERT INTO customer (
            id, name, phoneNumber, qad, barDaman, baghal, shana, astin, tunban,
            pacha, yakhan, yakhanValue, yakhanBin, farmaish, daman,
            caff, caffValue, jeeb, tunbanStyle, jeebTunban,
            regestrationDate, sync_status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?, ?, ?, ?, ?, 'synced');`,
          [
            data.id,
            data.name,
            data.phoneNumber,
            data.qad,
            data.barDaman,
            data.baghal,
            data.shana,
            data.astin,
            data.tunban,
            data.pacha,
            data.yakhan,
            data.yakhanValue,
            data.yakhanBin,
            data.farmaish,
            data.daman,
            data.caff,
            data.caffValue,
            data.jeeb,
            data.tunbanStyle,
            data.jeebTunban,
            data.regestrationDate,
          ]
        );
        console.log(
          `Customer ${data.name} (ID: ${data.id}) inserted into SQLite.`
        );
      }
    }
  } catch (error) {
    console.error("Error syncing customers from Firestore:", error);
  }
};

/** Sync all waskat records from Firestore to SQLite */
export const syncWaskatFromFirestore = async () => {
  try {
    const waskatSnapshot = await getDocs(collection(dbFirestore, "waskat"));
    console.log(
      `${waskatSnapshot.size} waskat records fetched from Firestore.`
    );

    for (const doc of waskatSnapshot.docs) {
      const data = doc.data();
      // Check if the record exists in SQLite
      const existing = await executeSql(
        "SELECT * FROM waskat WHERE phoneNumber = ?;",
        [data.phoneNumber]
      );

      // If the record doesn't exist, insert it into SQLite
      if (existing.rows.length === 0) {
        await executeSql(
          `INSERT INTO waskat (
            id, name, phoneNumber, qad, yakhan, shana, baghal, kamar, soreen,
            astin, yakhanValue, regestrationDate, sync_status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced');`,
          [
            data.id,
            data.name,
            data.phoneNumber,
            data.qad,
            data.yakhan,
            data.shana,
            data.baghal,
            data.kamar,
            data.soreen,
            data.astin,
            data.yakhanValue,
            data.regestrationDate,
          ]
        );
        console.log(
          `Waskat ${data.name} (Phone: ${data.phoneNumber}) inserted into SQLite.`
        );
      }
    }
  } catch (error) {
    console.error("Error syncing waskat from Firestore:", error);
  }
};
