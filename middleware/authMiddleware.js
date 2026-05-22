const jwt = require("jsonwebtoken");

const SECRET_KEY = process.env.JWT_SECRET || "quiz_secret_key"; // Sử dụng biến môi trường

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      message: "Bạn chưa đăng nhập",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, SECRET_KEY);

    req.user = decoded;

    next();
  } catch (err) {
    return res.status(401).json({
      message: "Token không hợp lệ",
    });
  }
}

module.exports = authMiddleware;
