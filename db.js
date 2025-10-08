// db.js
import mysql from "mysql2/promise";

export const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "pass123",
  database: "mindease_db",
  waitForConnections: true,
  connectionLimit: 10
});

pool.getConnection()
    .then(() => console.log("✅ Connected to mindease_db!"))
    .catch(err => console.error("❌ MySQL connection failed:", err));
