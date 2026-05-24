require("dotenv").config();

const { Pool } = require("pg");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
});

pool.connect()
    .then(() => {
        console.log("✅ Kết nối Supabase PostgreSQL thành công!");
    })
    .catch((err) => {
        console.log("❌ Lỗi kết nối DB:", err.message);
    });

module.exports = pool;