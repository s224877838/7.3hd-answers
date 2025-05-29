const {
  createAnswer,
  updateAnswer,
  deleteAnswer,
  //addAnswerReport,
} = require("../controllers/answerController");
const Answer = require("../models/Answer");
const Question = require("../models/question");
//const Report = require("../models/Report");

// Mock models
jest.mock("../models/Answer");
jest.mock("../models/Question");
jest.mock("../models/Report");

const mockUser = { _id: "user123", role: "user" };
const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn();
  res.send = jest.fn();
  return res;
};

describe("Answer Controller", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("createAnswer - success", async () => {
    const req = {
      body: { question: "q1", body: "Answer body" },
      user: mockUser,
    };
    const res = createMockRes();

    Question.findById.mockResolvedValue({ _id: "q1" });
    Answer.create.mockResolvedValue({ _id: "a1", body: "Answer body" });

    await createAnswer(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Answer created successfully",
      })
    );
  });

  test("createAnswer - missing body", async () => {
    const req = { body: { question: "q1" }, user: mockUser };
    const res = createMockRes();

    await createAnswer(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Body is required" });
  });

  test("updateAnswer - with new title and slug conflict", async () => {
    const req = {
      body: { title: "Duplicate title" },
      params: { id: "a1" },
      user: mockUser,
    };
    const res = createMockRes();

    Answer.findOne.mockResolvedValue({ _id: "otherAnswer" }); // Conflict slug
    await updateAnswer(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "A answer with this title already exists",
    });
  });

  test("deleteAnswer - unauthorized", async () => {
    const req = {
      params: { id: "a1" },
      user: { _id: "notOwner", role: "user" },
    };
    const res = createMockRes();

    Answer.findById.mockResolvedValue({ _id: "a1", author: "owner" });

    await deleteAnswer(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: "You are not authorized to delete this answer",
    });
  });

  test("deleteAnswer - admin can delete", async () => {
    const req = {
      params: { id: "a1" },
      user: { _id: "adminId", role: "admin" },
    };
    const res = createMockRes();

    Answer.findById.mockResolvedValue({ _id: "a1", author: "someone" });
    Answer.findByIdAndDelete.mockResolvedValue({});

    await deleteAnswer(req, res);

    expect(res.json).toHaveBeenCalledWith({
      message: "answer deleted successfully",
    });
  });
});
