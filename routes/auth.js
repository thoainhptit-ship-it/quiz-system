const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const router = express.Router();

// Sửa lại đường dẫn: lùi 2 cấp là đủ (từ routes/routes/ về thư mục gốc)
const db = require("../db");

const SECRET_KEY = process.env.JWT_SECRET || "quiz_secret_key"; // Sử dụng biến môi trường

router.post("/register", async (req, res) => {
  try {
    const { email, password, confirmPassword, display_name } = req.body;

    if (!email || !password || !confirmPassword || !display_name) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Mật khẩu không trùng" });
    }

    const checkSql = "SELECT * FROM users WHERE email = ?";
    const [existingUsers] = await db.execute(checkSql, [email]);

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: "Email đã tồn tại" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const insertSql = `
      INSERT INTO users (email, password, display_name)
      VALUES (?, ?, ?)
    `;

    await db.execute(insertSql, [email, hashedPassword, display_name]);

    res.json({ message: "Đăng ký thành công" });
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const sql = "SELECT * FROM users WHERE email = ?";
    const [users] = await db.execute(sql, [email]);

    if (users.length === 0) {
      return res.status(400).json({ message: "Email không tồn tại" });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Sai mật khẩu" });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, {
      expiresIn: "7d",
    });

    res.json({
      message: "Đăng nhập thành công",
      token,
      user: {
        id: user.id,
        name: user.display_name,
      },
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

module.exports = router;
