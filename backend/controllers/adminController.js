const Answer = require("../models/Answer");
const Question = require("../models/question");
const User = require("../models/user"); // Adjust the path as necessary

exports.admins = function (req, res) {
  User.find({ role: "admin" })
    .then((admins) => {
      res.render("user-list", { users: admins, modifiable: true });
    })
    .catch((_err) => {
      res.status(500).send({ error: "Failed to fetch admins" });
    });
};

exports.createAdminPage = function (req, res) {
  res.render("create-admin");
};

exports.createAdmin = async function (req, res) {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.redirect("/admin/create?error=Email+already+in+use");
    }

    const newAdmin = new User({
      name,
      email,
      password,
      role: "admin",
    });

    await newAdmin.save();

    res.redirect("/admin/create?success=Admin+created+successfully");
  } catch  {
    res.redirect("/admin/create?error=Server+error");
  }
};

exports.deleteUser = async function (req, res) {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.redirect("/admin/admins?error=User+not+found");
    }
    res.redirect("/admin/admins?success=User+deleted+successfully");
  } catch (err) {
    console.error("User deletion error:", err);
    res.redirect("/admin/admins?error=Failed+to+delete+user");
  }
};

exports.getUsers = async function (req, res) {
  User.find({ role: "user" })
    .then((users) => {
      res.render("user-list", { users: users, modifiable: false });
    })
    .catch((_err) => {
      res.status(500).send({ error: "Failed to fetch admins" });
    });
};
exports.deleteQuestion = async function (req, res) {
  const backURL = req.header("Referer") || "/";
  await Question.findOneAndDelete({
    _id: req.params.id,
  });
  await Answer.deleteMany({ question: req.params.id });
  res.redirect(backURL);
};
exports.deleteAnswer = async function (req, res) {
  const backURL = req.header("Referer") || "/";
  await Answer.findOneAndDelete({ _id: req.params.id });
  res.redirect(backURL);
};
