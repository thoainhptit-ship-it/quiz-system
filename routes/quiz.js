const express = require("express");
const router = express.Router();
const db = require("../db");
const authMiddleware = require("../middleware/authMiddleware");

// 1. TẠO ĐỀ THI
router.post("/create", authMiddleware, async (req, res) => {
  try {
    const { title, description, time_limit, quiz_password, questions } =
      req.body;
    const creator_id = req.user.id;

    if (!title || !quiz_password || !questions || questions.length === 0) {
      return res
        .status(400)
        .json({ message: "Vui lòng điền đầy đủ thông tin và câu hỏi." });
    }

    const quizCode = "MS-" + Math.floor(1000 + Math.random() * 9000);

    const sqlQuiz = `
      INSERT INTO quizzes (creator_id, title, description, quiz_password, time_limit, quiz_code)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
    `;
    const quizResult = await db.query(sqlQuiz, [
      creator_id,
      title,
      description,
      quiz_password,
      time_limit,
      quizCode,
    ]);
    const quiz_id = quizResult.rows[0].id;

    for (const q of questions) {
      if (q.correctAnswer === undefined || q.correctAnswer === null) {
        return res
          .status(400)
          .json({ message: "Mọi câu hỏi đều phải chọn một đáp án đúng!" });
      }

      const sqlQuestion = `INSERT INTO questions (quiz_id, question_text) VALUES ($1, $2) RETURNING id`;
      const questionResult = await db.query(sqlQuestion, [quiz_id, q.question]);
      const question_id = questionResult.rows[0].id;

      for (let index = 0; index < q.options.length; index++) {
        const opt = q.options[index];
        const isCorrect = index == q.correctAnswer;
        const sqlOption = `INSERT INTO options (question_id, option_text, is_correct) VALUES ($1, $2, $3)`;
        await db.query(sqlOption, [question_id, opt, isCorrect]);
      }
    }

    res.json({ message: "Tạo đề thành công!", quizCode: quizCode });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi tạo đề" });
  }
});

// 2. VÀO PHÒNG THI (ĐÃ VÁ LỖI BẢO MẬT ĐÁP ÁN)
router.post("/join", async (req, res) => {
  try {
    const { quiz_code, quiz_password } = req.body;

    const sqlQuiz = `SELECT * FROM quizzes WHERE quiz_code = $1`;
    const quizResult = await db.query(sqlQuiz, [quiz_code]);

    if (quizResult.rows.length === 0) {
      return res.json({ success: false, message: "Không tìm thấy mã đề này!" });
    }

    const quiz = quizResult.rows[0];

    if (quiz.quiz_password !== quiz_password) {
      return res.json({
        success: false,
        message: "Mật khẩu phòng thi không chính xác!",
      });
    }

    const sqlQuestions = `SELECT id, question_text FROM questions WHERE quiz_id = $1`;
    const questionResult = await db.query(sqlQuestions, [quiz.id]);

    let questions = [];
    for (const q of questionResult.rows) {
      // CHỈ lấy id và option_text, tuyệt đối không lấy cột is_correct ở đây
      const sqlOptions = `SELECT id, option_text FROM options WHERE question_id = $1`;
      const optionResult = await db.query(sqlOptions, [q.id]);
      questions.push({
        id: q.id,
        question: q.question_text,
        options: optionResult.rows,
      });
    }

    res.json({
      success: true,
      quiz: {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        time_limit: quiz.time_limit,
        questions,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi hệ thống khi vào đề" });
  }
});

// 3. NỘP BÀI & CHẤM ĐIỂM TỰ ĐỘNG
router.post("/submit", authMiddleware, async (req, res) => {
  try {
    const { quiz_id, answers } = req.body;
    const user_id = req.user.id;

    if (!answers || answers.length === 0) {
      return res.status(400).json({ message: "Dữ liệu bài làm không hợp lệ." });
    }

    let correctCount = 0;
    const reviewData = [];

    const questionIds = answers.map((a) => a.question_id);

    if (questionIds.length === 0) {
      return res
        .status(400)
        .json({ message: "Không có câu hỏi nào được trả lời." });
    }

    // Tối ưu hiệu năng: Lấy tất cả đáp án đúng cùng lúc
    const allOptionsResult = await db.query(
      `SELECT id, question_id, is_correct FROM options WHERE question_id = ANY($1)`,
      [questionIds],
    );
    const allOptions = allOptionsResult.rows;

    for (const a of answers) {
      const currentQuestionOptions = allOptions.filter(
        (o) => o.question_id == a.question_id,
      );
      const correctOption = currentQuestionOptions.find((o) => o.is_correct);

      const isCorrect =
        correctOption && correctOption.id == a.selected_option_id;
      if (isCorrect) correctCount++;

      reviewData.push({
        question_id: a.question_id,
        selected_option_id: a.selected_option_id,
        correct_option_id: correctOption ? correctOption.id : null,
        isCorrect,
      });
    }

    const total = answers.length;
    const finalScore = ((correctCount / total) * 10).toFixed(2);

    const sqlResult = `
      INSERT INTO results (user_id, quiz_id, correct_answers, total_questions, score)
      VALUES ($1, $2, $3, $4, $5)
    `;
    await db.query(sqlResult, [
      user_id,
      quiz_id,
      correctCount,
      total,
      finalScore,
    ]);

    res.json({
      score: finalScore,
      correct: correctCount,
      total,
      reviewData,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi hệ thống khi nộp bài" });
  }
});

module.exports = router;
