const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    title: String,
    body: String,
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reports: [{ type: mongoose.Schema.Types.ObjectId, ref: "Report" }],
    slug: { type: String, unique: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Question", questionSchema);
