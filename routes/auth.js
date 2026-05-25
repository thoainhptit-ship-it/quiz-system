const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db");

const SECRET_KEY = process.env.JWT_SECRET || "quiz_secret_key";

router.post("/register", async (req, res) => {
  try {
    const { display_name, email, password } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!display_name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập đầy đủ thông tin" });
    }

    const existing = await db.query(`SELECT * FROM users WHERE email = $1`, [
      email,
    ]);

    if (existing.rows.length > 0) {
      return res.json({
        message: "Email đã tồn tại",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      `
            INSERT INTO users
            (
                email,
                password,
                display_name
            )
            VALUES ($1, $2, $3)
            `,
      [email, hashedPassword, display_name],
    );

    res.json({
      message: "Đăng ký thành công",
    });
  } catch (err) {
    console.log("Register Error:", err);
    res.status(500).json({
      message: "Lỗi server",
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập đầy đủ email và mật khẩu" });
    }

    const userResult = await db.query(`SELECT * FROM users WHERE email = $1`, [
      email,
    ]);

    if (userResult.rows.length === 0) {
      return res.json({
        message: "Sai email",
      });
    }

    const user = userResult.rows[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.json({
        message: "Sai mật khẩu",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      SECRET_KEY,
      {
        expiresIn: "7d",
      },
    );

    res.json({
      message: "Đăng nhập thành công",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.display_name,
      },
    });
  } catch (err) {
    console.log("Login Error:", err);

    res.status(500).json({
      message: "Lỗi server",
    });
  }
});

module.exports = router;
