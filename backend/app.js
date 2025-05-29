const express = require("express");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const router = express.Router();

const User = require("./models/User");
const {
  handleLogin,
  handleLogout,
  handleRegister,
} = require("./controllers/authController");
const {
  getQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getQuestionDetails,
  addQuestionReport,
} = require("./controllers/questionController");
const {
  createAnswer,
  updateAnswer,
  deleteAnswer,
  //addAnswerReport,
} = require("./controllers/answerController");
const {
  getUsers,
  updateUser,
  deleteUser,
  createUser,
  getUserDetails,
} = require("./controllers/userController");
const {
  getProfile,
  updateProfile,
} = require("./controllers/profileController");
const isAuthenticated = require("./middlewares/isAuthenticated");
const isSuperAdmin = require("./middlewares/isSuperAdmin");

dotenv.config();

const app = express();
app.use(express.json());

const extractSession = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      req.user = null;
    } else {
      try {
        const user = await User.findById(decoded.id);
        req.user = user || null;
      } catch {
        req.user = null;
      }
    }
    next();
  });
};

app.use(extractSession);
app.use("/api", router);

// Auth
router.post("/auth/logout", handleLogout);
router.post("/auth/register", handleRegister);
router.post("/auth/login", handleLogin);

// Questions
router.get("/questions", getQuestions);
router.get("/questions/:id", getQuestionDetails);
router.post("/questions", isAuthenticated, createQuestion);
router.put("/questions/:id", isAuthenticated, updateQuestion);
router.delete("/questions/:id", isAuthenticated, deleteQuestion);
router.post("/questions/:id/report", isAuthenticated, addQuestionReport);

// Answers
router.post("/answers", isAuthenticated, createAnswer);
router.put("/answers/:id", isAuthenticated, updateAnswer);
router.delete("/answers/:id", isAuthenticated, deleteAnswer);

// Users
router.get("/users", isAuthenticated, getUsers);
router.get("/users/:id", isAuthenticated, getUserDetails);
router.post("/users", isAuthenticated, isSuperAdmin, createUser);
router.put("/users/:id", isAuthenticated, updateUser);
router.delete("/users/:id", isAuthenticated, deleteUser);

// Profile
router.get("/profile", isAuthenticated, getProfile);
router.post("/profile", isAuthenticated, updateProfile);

module.exports = app;
