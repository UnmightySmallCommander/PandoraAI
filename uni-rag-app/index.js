const express = require("express");
const app = express();

app.use(express.json());

app.get("/", (req, res) => {
    res.send("Server is running");
});

app.post("/ask", (req, res) => {
    const { question } = req.body;

    res.json({
        answer: "You asked: " + question
    });
});

app.listen(3000, () => {
    console.log("Server running on port 3000");
});