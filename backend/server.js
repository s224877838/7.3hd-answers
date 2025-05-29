require("dotenv").config(); 
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const seedSuperAdmin = require("./seeders/admin");
const {
  handleLogin,
  handleLogout,
  handleRegister,
} = require("./controllers/authController");
const jwt = require("jsonwebtoken");
const User = require("./models/user");
const {
  getQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getQuestionDetails,
  addQuestionReport,
} = require("./controllers/questionController");
const isAuthenticated = require("./middlewares/isAuthenticated");
const {
  createAnswer,
  updateAnswer,
  deleteAnswer,
} = require("./controllers/answerController");
const {
  getUsers,
  updateUser,
  deleteUser,
  createUser,
  getUserDetails,
} = require("./controllers/userController");
const isSuperAdmin = require("./middlewares/isSuperAdmin");
const {
  getProfile,
  updateProfile,
} = require("./controllers/profileController");

const cors = require("cors");
const router = express.Router();
dotenv.config();

const app = express();
app.use(cors());

app.use(express.static(path.join(__dirname, "..", "public")));

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
      } catch  {
        req.user = null;
      }
    }
    next();
  });
};

app.use(extractSession);
app.use("/api", router);

// ************** Auth Routes **************

router.post("/auth/logout", handleLogout);
router.post("/auth/register", handleRegister);
router.post("/auth/login", handleLogin);

// ************** Question Routes **************

router.get("/questions", getQuestions);
router.get("/questions/:id", getQuestionDetails);
router.post("/questions", isAuthenticated, createQuestion);
router.put("/questions/:id", isAuthenticated, updateQuestion);
router.delete("/questions/:id", isAuthenticated, deleteQuestion);
router.post("/questions/:id/report", isAuthenticated, addQuestionReport);

// ************** Answer Routes **************

router.post("/answers", isAuthenticated, createAnswer);
router.put("/answers/:id", isAuthenticated, updateAnswer);
router.delete("/answers/:id", isAuthenticated, deleteAnswer);

// ************** User Routes **************

router.get("/users", isAuthenticated, getUsers);
router.get("/users/:id", isAuthenticated, getUserDetails);
router.post("/users", isAuthenticated, isSuperAdmin, createUser);
router.put("/users/:id", isAuthenticated, updateUser);
router.delete("/users/:id", isAuthenticated, deleteUser);

// ************** Profile Routes **************

router.get("/profile", isAuthenticated, getProfile);
router.post("/profile", isAuthenticated, updateProfile);
mongoose.connect(process.env.MONGODB_URI).then(() => {
  app.listen(process.env.PORT, () =>
    console.log(`Server on ${process.env.PORT}`)
  );
});

mongoose.connection.once("open", async () => {
  await seedSuperAdmin();
});
