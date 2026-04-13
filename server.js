// backend/server.js
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const fs = require("fs");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect("mongodb://127.0.0.1:27017/resumeAI");

const User = mongoose.model("User", {
    email: String,
    password: String
});

const upload = multer({ dest: "uploads/" });

function auth(req, res, next) {
    const token = req.headers["authorization"];
    if (!token) return res.status(401).json({ msg: "No token" });

    try {
        const decoded = jwt.verify(token, "secret123");
        req.user = decoded;
        next();
    } catch {
        res.status(401).json({ msg: "Invalid token" });
    }
}

app.post("/api/signup", async (req, res) => {
    const { email, password } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    await new User({ email, password: hashed }).save();
    res.json({ msg: "User created" });
});

app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ msg: "Wrong password" });

    const token = jwt.sign({ id: user._id }, "secret123");
    res.json({ token });
});

app.post("/api/analyze", auth, upload.single("resume"), async (req, res) => {
    const pdf = await pdfParse(fs.readFileSync(req.file.path));
    const resumeText = pdf.text;

    const keywords = (await axios.post("http://localhost:5000/keywords", {})).data.keywords;

    const result = await axios.post("http://localhost:5000/analyze", {
        resume: resumeText,
        jobDescription: req.body.jobDescription,
        keywords
    });

    res.json(result.data);
});

app.listen(3000, () => console.log("Backend running"));
