require("dotenv").config();
 
const express = require("express");
const OpenAI = require("openai");
const { MongoClient } = require("mongodb");
 
const app = express();
app.use(express.json());
 
const cors = require("cors");
app.use(cors());
 
// --- OpenAI ---
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});
 
// --- MongoDB ---
const mongoClient = new MongoClient(process.env.MONGO_URI);
 
let db;
 
async function connectDB() {
    try {
        await mongoClient.connect();
        db = mongoClient.db("university");
        console.log("MongoDB connected");
    } catch (err) {
        console.error("MongoDB error:", err);
    }
}
 
connectDB();
 
// --- Helpers ---
 
// Maps keywords in a question to a category stored in the documents.
// If matched, we boost search results from that category first.
function detectCategory(question) {
    const q = question.toLowerCase();
    if (/ge elective|general ed|gened|elective|free elective/.test(q))         return "ge_requirements";
    if (/faculty course|faculty requirement/.test(q))                           return "ge_requirements";
    if (/basic course|charm school|digital intelligence|sports.*activit/.test(q)) return "ge_requirements";
    if (/language.*comm|communication.*course|academic (reading|writing|listening|speaking)/.test(q)) return "ge_requirements";
    if (/study plan|semester|year [1-4]|recommended (plan|course)|schedule/.test(q)) return "study_plan";
    if (/graduat|144 credit|finish degree|degree requirement/.test(q))          return "graduation_requirements";
    if (/co.?op|internship|overseas|study abroad/.test(q))                      return "special_tracks";
    if (/free elective|major elective|computer engineering elective/.test(q))   return "elective_policy";
    if (/how many credit|credit left|credit remaining|tracking|completed/.test(q)) return "credit_tracking";
    return null;
}
 
// Pulls meaningful search tokens — strips stop words so the regex
// doesn't match on "I", "the", "a", "do", etc.
function extractKeywords(question) {
    const stopWords = new Set([
        "i","a","an","the","is","it","in","on","at","to","do","be","of",
        "and","or","for","my","me","we","you","am","are","was","were",
        "if","can","will","what","how","why","when","which","that","this",
        "have","has","had","with","not","does","did","should","would",
        "could","need","want","take","get","give","go","still","already",
        "just","also","only","more","any","all","from","than","there","by",
    ]);
    return question
        .replace(/[^a-zA-Z0-9\s]/g, "")
        .split(/\s+/)
        .filter(w => w.length > 2 && !stopWords.has(w.toLowerCase()));
}
 
// --- Routes ---
 
app.get("/", (req, res) => {
    res.send("Server running");
});
 
app.get("/test-db", async (req, res) => {
    try {
        const docs = await db.collection("documents").find().toArray();
        res.json(docs);
    } catch (err) {
        res.status(500).json({ error: "DB error" });
    }
});
 
// --- Main AI route ---
app.post("/ask", async (req, res) => {
    const { question } = req.body;
    if (!question || !question.trim()) {
        return res.status(400).json({ error: "Question is required." });
    }
 
    try {
        const keywords  = extractKeywords(question);
        const category  = detectCategory(question);
        const collection = db.collection("documents");
 
        let docs = [];
 
        // ── Step 1: Category-boosted search ──────────────────────────────────
        // If we detected a category, pull the best docs from that category first.
        if (category && keywords.length > 0) {
            const regex = new RegExp(keywords.join("|"), "i");
            docs = await collection.find({
                category,
                $or: [
                    { content: { $regex: regex } },
                    { title:   { $regex: regex } },
                ],
            }).limit(4).toArray();
        }
 
        // ── Step 2: Broad keyword search (fallback / supplement) ─────────────
        // Always run this — merge results so we have up to 6 unique docs total.
        if (keywords.length > 0) {
            const regex = new RegExp(keywords.join("|"), "i");
            const broad = await collection.find({
                $or: [
                    { content: { $regex: regex } },
                    { title:   { $regex: regex } },
                ],
            }).limit(6).toArray();
 
            // Merge, deduplicate by _id string
            const seen = new Set(docs.map(d => d._id.toString()));
            for (const d of broad) {
                if (!seen.has(d._id.toString())) {
                    docs.push(d);
                    seen.add(d._id.toString());
                }
            }
        }
 
        // ── Step 3: Category-only fallback ────────────────────────────────────
        // If we still have nothing and we know the category, grab any docs from it.
        if (docs.length === 0 && category) {
            docs = await collection.find({ category }).limit(5).toArray();
        }
 
        // ── Step 4: Last resort — return a broad sample ───────────────────────
        if (docs.length === 0) {
            docs = await collection.find({}).limit(5).toArray();
        }
 
        // Cap at 6 docs to avoid overloading the context window
        docs = docs.slice(0, 6);
 
        // ── Build structured context ──────────────────────────────────────────
        const context = docs
            .map((doc, i) =>
                `[${i + 1}] Title: ${doc.title}\nCategory: ${doc.category || "general"}\nContent: ${doc.content}`
            )
            .join("\n\n---\n\n");
 
        // ── Call OpenAI ───────────────────────────────────────────────────────
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            temperature: 0.3,       // Lower = more factual, less hallucination
            max_tokens: 600,
            messages: [
                {
                    role: "system",
                    content: `
You are an academic advisor assistant for KMITL's B.Eng. Computer Engineering (International Program).
Your job is to answer student questions about curriculum requirements, GE credits, study plans, and graduation rules.
 
You are given numbered context documents retrieved from the university knowledge base.
Each document has a Title, Category, and Content.
 
Rules you must follow:
1. Base your answer primarily on the provided context documents.
2. If the context directly answers the question, give a clear and complete answer.
3. If multiple documents are relevant, synthesize them into one coherent answer.
4. If the context is partially relevant, use what applies and note any gaps briefly.
5. Use bullet points or numbered steps when listing requirements or steps — it is easier for students to read.
6. State credit numbers and course names exactly as they appear in the context — do not guess.
7. If the context has zero relevant information, say: "I don't have enough information in the knowledge base to answer this accurately. Please check with your academic advisor." — do NOT invent an answer.
8. Keep answers concise and student-friendly. Avoid academic jargon.
                    `.trim(),
                },
                {
                    role: "user",
                    content: `Context Documents:\n\n${context}\n\n---\n\nStudent Question: ${question}`,
                },
            ],
        });
 
        const answer = completion.choices[0].message.content;
 
        res.json({
            answer,
            used_docs: docs,
        });
 
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Something went wrong" });
    }
});
 
// --- Start server ---
app.listen(3000, () => {
    console.log("Server running on port 3000");
});