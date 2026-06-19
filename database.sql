CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    display_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE quizzes (
    id SERIAL PRIMARY KEY,
    creator_id INT REFERENCES users(id),
    title VARCHAR(255),
    description TEXT,
    quiz_password VARCHAR(255),
    time_limit INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    quiz_code VARCHAR(50)
);

CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    quiz_id INT REFERENCES quizzes(id),
    question_text TEXT
);

CREATE TABLE options (
    id SERIAL PRIMARY KEY,
    question_id INT REFERENCES questions(id),
    option_text TEXT,
    is_correct BOOLEAN DEFAULT FALSE
);

CREATE TABLE results (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    quiz_id INT REFERENCES quizzes(id),
    correct_answers INT,
    total_questions INT,
    score DECIMAL(4,2),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);