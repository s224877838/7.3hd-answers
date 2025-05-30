const Answer = require("../models/Answer");
const User = require('../models/user');
const Question = require("../models/question");
const { slugify } = require("../utils/slug");
const { sendAnswerNotificationEmail } = require("../utils/mailer"); 

async function createAnswer(req, res) {
  try {
    const { question, body } = req.body;

    if (!body) {
      return res.status(400).json({ error: "Body is required" });
    }

    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }

    const isValidQuestion = await Question.findById(question);
    if (!isValidQuestion) {
      return res.status(400).json({ error: "Invalid question ID" });
    }

    const answer = await Answer.create({
      ...req.body,
      author: req.user._id,
    });

    try {
      const questionData = await Question.findById(question).populate('author')
      .populate('author', 'email name') // Correct populate syntax
      .exec();
      if (questionData && questionData.author && questionData.author.email) {
        await sendAnswerNotificationEmail(
          questionData.author.email,
          questionData.author.name,
          questionData.title,
          answer.body,
          questionData._id // Pass the question ID for the link
        );
        console.log(`Notification email sent to ${questionData.author.email} for question "${questionData.title}"`);
      } else {
        console.warn('Could not send answer notification: Question author not found or has no email.');
      }
    } catch (emailError) {
      console.error('Error sending answer notification email:', emailError);
      // email sending is  secondary.
    }
    

    res.status(201).json({ message: "Answer created successfully", answer });
  } catch  {
    res.status(500).json({ error: "Failed to create answer" });
  }
}

async function updateAnswer(req, res) {
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
      const existinganswer = await Answer.findOne({
        slug,
        _id: { $ne: req.params.id },
      });

      if (existinganswer) {
        return res
          .status(400)
          .json({ error: "A answer with this title already exists" });
      }

      updateData.slug = slug;
    }

    const answer = await Answer.findOneAndUpdate(
      { _id: req.params.id, author: req.user._id },
      updateData,
      { new: true }
    );

    if (!answer) {
      return res
        .status(403)
        .json({ error: "You are not authorized to update this answer" });
    }

    res.json({ message: "answer updated successfully", answer });
  } catch  {
    res.status(500).json({ error: "Failed to update answer" });
  }
}

async function deleteAnswer(req, res) {
  try {
    const answer = await Answer.findById(req.params.id);

    if (
      !answer ||
      (answer.author.toString() !== req.user._id.toString() &&
        !["admin", "super-admin"].includes(req.user.role))
    ) {
      return res
        .status(403)
        .json({ error: "You are not authorized to delete this answer" });
    }

    await Answer.findByIdAndDelete(req.params.id);

    res.json({ message: "answer deleted successfully" });
  } catch  {
    res.status(500).json({ error: "Failed to delete answer" });
  }
}

module.exports = {
  createAnswer,
  deleteAnswer,
  updateAnswer,
};