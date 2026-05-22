const express = require("express");
const cors = require("cors");
require("dotenv").config(); // Tải biến môi trường từ file .env

const authRoutes = require("./routes/auth");
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
  console.log(`Server chạy tại http://localhost:${PORT}`);
});
