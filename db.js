const mysql = require("mysql2");

// Tạo Pool kết nối
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Kiểm tra kết nối ngay khi khởi động
pool.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Lỗi kết nối Database:", err.message);
  } else {
    console.log("✅ Kết nối MySQL (freedb) thành công!");
    connection.release();
  }
});

module.exports = pool.promise();
