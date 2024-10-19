// database.js
import * as SQLite from "expo-sqlite/legacy";

const db = SQLite.openDatabase("custom");

export const initializeDatabase = () => {
  db.transaction((tx) => {
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phoneNumber TEXT,
        qad TEXT,
        barDaman TEXT,
        baghal TEXT,
        shana TEXT,
        astin TEXT,
        tunban TEXT,
        pacha TEXT,
        yakhan TEXT,
        yakhanValue TEXT,
        yakhanBin BOOLEAN,
        farmaish TEXT,
        daman TEXT,
        caff TEXT,
        caffValue TEXT,
        jeeb TEXT,
        tunbanStyle TEXT,
        jeebTunban BOOLEAN,
        regestrationDate TEXT
      );`
    );
  });
};

export const insertCustomer = (customerData) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        `INSERT INTO customers (name, phoneNumber, qad, barDaman, baghal, shana, astin, tunban, pacha, yakhan, yakhanValue, yakhanBin, farmaish, daman, caff, caffValue, jeeb, tunbanStyle, jeebTunban, regestrationDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          customerData.name,
          customerData.phoneNumber,
          customerData.qad,
          customerData.barDaman,
          customerData.baghal,
          customerData.shana,
          customerData.astin,
          customerData.tunban,
          customerData.pacha,
          customerData.yakhan,
          customerData.yakhanValue,
          customerData.yakhanBin,
          customerData.farmaish,
          customerData.daman,
          customerData.caff,
          customerData.caffValue,
          customerData.jeeb,
          customerData.tunbanStyle,
          customerData.jeebTunban,
          customerData.regestrationDate,
        ],
        (_, result) => resolve(result),
        (_, error) => reject(error)
      );
    });
  });
};

export const fetchCustomersFromSQLite = async () => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        "SELECT * FROM customers",
        [],
        (_, { rows }) => {
          const customers = rows._array;
          resolve(customers);
        },
        (_, error) => {
          console.error("Error fetching customers from SQLite", error);
          reject(error);
        }
      );
    });
  });
};

export const updateCustomersInSQLite = async (customers) => {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        // Clear existing data in SQLite if necessary
        tx.executeSql("DELETE FROM customers");

        // Insert new data from Firestore
        customers.forEach((customer) => {
          tx.executeSql(
            "INSERT INTO customers (id, name, phoneNumber, qad, barDaman, baghal, shana, astin, tunban, pacha, yakhan, yakhanValue, yakhanBin, farmaish, daman, caff, caffValue, jeeb, tunbanStyle, jeebTunban, regestrationDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
              customer.id,
              customer.name,
              customer.phoneNumber,
              customer.qad,
              customer.barDaman,
              customer.baghal,
              customer.shana,
              customer.astin,
              customer.tunban,
              customer.pacha,
              customer.yakhan,
              customer.yakhanValue,
              customer.yakhanBin,
              customer.farmaish,
              customer.daman,
              customer.caff,
              customer.caffValue,
              customer.jeeb,
              customer.tunbanStyle,
              customer.jeebTunban,
              customer.regestrationDate,
            ]
          );
        });

        resolve(true);
      },
      (error) => {
        console.error("Error updating SQLite:", error);
        reject(error);
      }
    );
  });
};

export const executeSql = async (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        sql,
        params,
        (_, results) => resolve(results),
        (_, error) => reject(error)
      );
    });
  });
};
