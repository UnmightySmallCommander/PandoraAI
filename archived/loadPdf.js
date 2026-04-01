require("dotenv").config();
const fs = require("fs");
const path = require("path");
const pdf = require("pdf-parse");
const { MongoClient } = require("mongodb");

const mongoClient = new MongoClient(process.env.MONGO_URI);
const CHUNK_SIZE = 300;
const CHUNK_OVERLAP = 50;

// 1. Capture filename from command line
const fileName = process.argv[2];

if (!fileName) {
    console.error("Please provide a PDF filename: node loadPdf.js <filename.pdf>");
    process.exit(1);
}

function chunkText(text) {
    const chunks = [];
    let start = 0;
    while (start < text.length) {
        const end = start + CHUNK_SIZE;
        const chunk = text.slice(start, end).trim();
        if (chunk.length > 0) chunks.push(chunk);
        start += CHUNK_SIZE - CHUNK_OVERLAP;
    }
    return chunks;
}

/**
 * Validates content for English and Thai characters.
 * Includes: Latin (A-Z), Numbers, Standard Punctuation, and Thai Unicode Range.
 */
function isValidContent(text) {
    const allowedCharsRegex = /^[A-Za-z0-9\s\u0E00-\u0E7F!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~~\u2000-\u206F]+$/;
    return allowedCharsRegex.test(text);
}
async function run() {
    try {
        const filePath = path.join(__dirname, fileName);
        if (!fs.existsSync(filePath)) {
            console.error(`File not found: ${filePath}`);
            process.exit(1);
        }

        await mongoClient.connect();
        const db = mongoClient.db("university");

        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdf(dataBuffer);
        
        // Clean and normalize text
        let text = data.text
            .replace(/\s+/g, " ")
            .replace(/\n+/g, "\n")
            .trim();

        // 2. Safety Check (Now allows Thai)
        if (!isValidContent(text)) {
            console.error("❌ Error: PDF contains unsupported characters outside of English/Thai sets.");
            process.exit(1);
        }

        // 3. Dynamic Title (Filename without .pdf extension)
        const docTitle = path.parse(fileName).name;

        const chunks = chunkText(text);
        const docs = chunks.map((chunk, index) => ({
            title: docTitle,
            content: chunk,
            chunkIndex: index,
            sourceFile: fileName,
            metadata: {
                language: "en-th",
                processedAt: new Date()
            }
        }));

        // 4. Insert into MongoDB
        if (docs.length > 0) {
            await db.collection("documents").insertMany(docs);
            console.log(`✅ Success! Inserted ${chunks.length} chunks from "${docTitle}" into MongoDB.`);
        } else {
            console.log("⚠️ No content found to insert.");
        }
        
        process.exit();
    } catch (err) {
        console.error("Processing error:", err);
        process.exit(1);
    }
}

run();