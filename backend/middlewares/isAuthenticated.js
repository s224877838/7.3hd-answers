//const User = require("../models/user");

async function isAuthenticated(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

module.exports = isAuthenticated;
