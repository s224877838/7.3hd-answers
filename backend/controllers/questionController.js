const Answer = require("../models/Answer");
const Question = require("../models/question");
const Report = require("../models/Report");
const { slugify } = require("../utils/slug");

async function getQuestions(req, res) {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    const questions = await Question.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("author", "name email");

    const totalQuestions = await Question.countDocuments();
    const totalPages = Math.ceil(totalQuestions / limit);

    res.json({
      data: questions,
      currentPage: page,
      totalPages,
      totalQuestions,
    });
  } catch  {
    res.status(500).json({ error: "Failed to fetch questions" });
  }
}

async function createQuestion(req, res) {
  try {
    const { title, body } = req.body;

    if (!title || !body) {
      return res.status(400).json({ error: "Title and body are required" });
    }

    const slug = slugify(title);
    const existingQuestion = await Question.findOne({ slug });

    if (existingQuestion) {
      return res
        .status(400)
        .json({ error: "A question with this title already exists" });
    }

    const question = await Question.create({
      ...req.body,
      slug,
      author: req.user._id,
    });

    res
      .status(201)
      .json({ message: "Question created successfully", question });
  } catch  {
    res.status(500).json({ error: "Failed to create question" });
  }
}

async function updateQuestion(req, res) {
  try {
    const { title, body } = req.body;

    if (!title && !body) {
      return res
        .status(400)
        .json({ error: "At least one of title or body is required" });
    }

    const updateData = { ...req.body };

    if (title) {
      const slug = slugify(title, { lower: true, strict: true });
      const existingQuestion = await Question.findOne({
        slug,
        _id: { $ne: req.params.id },
      });

      if (existingQuestion) {
        return res
          .status(400)
          .json({ error: "A question with this title already exists" });
      }

      updateData.slug = slug;
    }

    const question = await Question.findOneAndUpdate(
      { _id: req.params.id, author: req.user._id },
      updateData,
      { new: true }
    );

    if (!question) {
      return res
        .status(403)
        .json({ error: "You are not authorized to update this question" });
    }

    res.json({ message: "Question updated successfully", question });
  } catch  {
    res.status(500).json({ error: "Failed to update question" });
  }
}

async function deleteQuestion(req, res) {
  try {
    const question = await Question.findById(req.params.id);

    if (
      !question ||
      (question.author.toString() !== req.user._id.toString() &&
        !["admin", "super-admin"].includes(req.user.role))
    ) {
      return res
        .status(403)
        .json({ error: "You are not authorized to delete this question" });
    }

    await Question.findByIdAndDelete(req.params.id);
    await Answer.deleteMany({ question: req.params.id });

    res.json({ message: "Question deleted successfully" });
  } catch  {
    res.status(500).json({ error: "Failed to delete question" });
  }
}

async function getQuestionDetails(req, res) {
  try {
    const question = await Question.findById(req.params.id).populate(
      "author",
      "name email"
    );

    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }

    const answers = await Answer.find({ question: req.params.id }).populate(
      "author",
      "name email"
    );

    res.js
    on({ question, answers });
  } catch  {
    res.status(500).json({ error: "Failed to fetch question details" });
  }
}
async function addQuestionReport(req, res) {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }
    if (!req.body.reason) {
      return res.status(400).json({ error: "Reason is required" });
    }
    const report = await Report.create({
      ...req.body,
      reportedBy: req.user._id,
    });
    question.reports.push(report._id);
    await question.save();

    res.json(report);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to fetch question details" });
  }
}

module.exports = {
  getQuestions,
  createQuestion,
  deleteQuestion,
  updateQuestion,
  getQuestionDetails,
  addQuestionReport,
};
