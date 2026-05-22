require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
// Đảm bảo đường dẫn này trỏ đến file routes/quiz.js bạn đã sửa
const quizRoutes = require("./routes/quiz");

const app = express();

// Middleware log đơn giản để theo dõi các request
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Route mặc định cho trang chủ
app.get("/", (req, res) => {
  res.send(
    "<h1>Server đang chạy thành công!</h1><p>Truy cập các API tại /api/auth và /api/quiz</p>",
  );
});

app.use("/api/auth", authRoutes);
app.use("/api/quiz", quizRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("-----------------------------------------");
  console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
  console.log("-----------------------------------------");
});

// Xử lý lỗi tập trung để tránh server bị crash
app.use((err, req, res, next) => {
  console.error("🔥 Lỗi hệ thống:", err.stack);
  res.status(500).json({ message: "Đã xảy ra lỗi nội bộ trên server!" });
});
