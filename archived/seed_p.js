// THIS CAN BE IGNORED (FIXED ANSWERS FOR THE QUESTIONS PROVIDED IN THE GOOGLE DOC)

require("dotenv").config();
const { MongoClient } = require("mongodb");
 
const mongoClient = new MongoClient(process.env.MONGO_URI);
 
// ─── Document Store ───────────────────────────────────────────────────────────
// Each document follows the same shape as loadPdf.js:
//   { title, content, category, sourceFile, metadata }
// Added: `category` field for faster semantic filtering by the AI.
// ─────────────────────────────────────────────────────────────────────────────
 
const documents = [
 
  // ── FACTUAL / HARD DATA ────────────────────────────────────────────────────
 
  {
    title: "GenEd Requirements",
    content: "Students must complete 30 GenEd credits in total. This is broken down into: Basic Course Requirement (6 credits), Language and Communication Course Requirement (3 credits), Faculty Course Requirement (9 credits), and GE Elective Course Requirement (12 credits).",
    category: "ge_requirements",
  },
  {
    title: "Max Credits",
    content: "Students can enroll in a maximum of 18 credits per semester.",
    category: "enrollment_policy",
  },
  {
    title: "Total Graduation Credits",
    content: "Students must complete a total of 144 credits to graduate from the B.Eng. in Computer Engineering (International Program).",
    category: "graduation_requirements",
  },
 
  // ── BASIC COURSE REQUIREMENT ───────────────────────────────────────────────
 
  {
    title: "Basic Course Requirement Overview",
    content: "The Basic Course Requirement is worth 6 credits. Students are required to take ALL courses from the following list — no selection, all are mandatory: Charm School (Code: 96641001, 2 credits, format 1-2-3), Digital Intelligence Quotient (Code: 96641002, 3 credits, format 3-0-6), Sports and Recreational Activities (Code: 96641003, 1 credit, format 0-1-2). Total = 6 credits.",
    category: "ge_requirements",
  },
  {
    title: "Q&A: Basic Course — Are all courses mandatory?",
    content: "Q: Do I need to take all courses listed under Basic Course Requirement? A: Yes. You must take all 3 courses: Charm School (2 credits), Digital Intelligence Quotient (3 credits), and Sports and Recreational Activities (1 credit). Total = 6 credits. These are mandatory — there is no choice.",
    category: "ge_requirements",
  },
 
  // ── LANGUAGE & COMMUNICATION ───────────────────────────────────────────────
 
  {
    title: "Language and Communication Course Requirement",
    content: "The Language and Communication Course Requirement is worth 3 credits. Students must select courses from the 'Language and Communication Skills' group listed in Appendix C. Additionally, students are recommended (but not required) to audit: Academic Listening and Speaking (Code: 96644004, 0 credits, format 4-0-8) and Academic Reading and Writing (Code: 96644005, 0 credits, format 4-0-8). These audit courses are 0 credits and are not compulsory.",
    category: "ge_requirements",
  },
  {
    title: "Q&A: Language — Is Academic Reading and Writing required?",
    content: "Q: Do I need to take Academic Reading and Writing? A: No. It is recommended (0 credit), not required. You only need 3 credits from the Language and Communication group to fulfill this requirement. The audit courses are optional extras.",
    category: "ge_requirements",
  },
 
  // ── FACULTY COURSE REQUIREMENT ────────────────────────────────────────────
 
  {
    title: "Faculty Course Requirement Overview",
    content: "The Faculty Course Requirement is worth 9 credits. Students must select courses exclusively from the approved Faculty Course list. Available courses include: Critical Thinking (96642011, 3 credits), Creative Thinking and Innovation (96642015, 3 credits), Philosophy of Science (96642022, 3 credits), Emerging Trends in Engineering (96642023, 1 credit), Professional Ethics and Laws (96642031, 3 credits), Asian Study (96642091, 3 credits), Dynamics of Thai Society (96642098, 3 credits), Meditation for Life Development (96642138, 3 credits), Psychology of Self-Development (96642141, 3 credits), Next Gen Leadership (96643007, 3 credits), Economics and Entrepreneurship (96643019, 3 credits), Digital Economy (96643029, 3 credits), General Economics and Project Feasibility Study (96643030, 3 credits), Public Administration and Public Policy in the 21st Century (96643037, 3 credits), English for Science and Technology (96644031, 3 credits).",
    category: "ge_requirements",
  },
  {
    title: "Q&A: Faculty Course vs GE Elective — What is the difference?",
    content: "Q: What is the difference between Faculty Course Requirement and GE Elective? A: Faculty Course Requirement (9 credits) requires you to choose only from the approved Faculty Course list — it is a restricted set. GE Elective (12 credits) allows you to choose any general education course offered by the university (KMITL). Key rule: Faculty = restricted list, GE Elective = flexible/open choice.",
    category: "ge_requirements",
  },
  {
    title: "Q&A: Faculty Course — Can I take a course not on the list?",
    content: "Q: If a course is not listed in Faculty Course Requirement, can I still take it? A: Yes, but it will count as a GE Elective credit, not as a Faculty Course credit. You cannot substitute an unlisted course to fulfill the Faculty Course Requirement.",
    category: "ge_requirements",
  },
  {
    title: "Q&A: Faculty Course — Completing exactly 9 credits",
    content: "Q: I completed 3 Faculty courses at 3 credits each. Do I fulfill the Faculty Course Requirement? A: Yes. Required = 9 credits. You completed 3 × 3 = 9 credits. Status: Completed.",
    category: "ge_requirements",
  },
  {
    title: "Q&A: Faculty Course — Taking extra credits beyond 9",
    content: "Q: I completed 4 Faculty courses (12 credits). What happens to the extra credits? A: Required = 9 credits, you have 12 credits. 9 credits count toward the Faculty Course Requirement (completed). The extra 3 credits can be reallocated to GE Elective. Status: Faculty = Completed, GE Elective = 3/12 credits fulfilled.",
    category: "ge_requirements",
  },
  {
    title: "Q&A: Faculty Course — Not enough credits",
    content: "Q: I took 2 Faculty courses (6 credits). Am I done with the Faculty Course Requirement? A: No. Required = 9 credits, you have 6 credits. You still need 3 more credits (1 more course).",
    category: "ge_requirements",
  },
 
  // ── GE ELECTIVE ───────────────────────────────────────────────────────────
 
  {
    title: "GE Elective Course Requirement Overview",
    content: "The GE Elective Course Requirement is worth 12 credits. Students may select any general education course offered at KMITL as listed in Appendix C. This is the most flexible GE category — no restricted list applies.",
    category: "ge_requirements",
  },
  {
    title: "Q&A: Course category classification — unknown course",
    content: "Q: I took a course called 'Digital Marketing'. Which GE category does it belong to? A: Check if it is in the Basic Course list — No. Check if it is in the Faculty Course list — No. Since it is not found in either mandatory list, it is classified as a GE Elective. Rule: if a course is not on the Basic or Faculty list, default to GE Elective.",
    category: "ge_requirements",
  },
  {
    title: "Q&A: Course from another faculty — where does it count?",
    content: "Q: If I take a course from another faculty, where does it count? A: It will count as a GE Elective, as long as it is an approved GE course in the university catalog.",
    category: "ge_requirements",
  },
 
  // ── GE GENERAL RULES ──────────────────────────────────────────────────────
 
  {
    title: "Q&A: Can one course count for multiple GE categories?",
    content: "Q: Can one course count for multiple GE categories? A: No. Each course can count for only one category. Double-counting is not permitted.",
    category: "ge_requirements",
  },
  {
    title: "Q&A: Accidental over-enrollment in one GE category",
    content: "Q: I accidentally took too many courses in one GE category. Can I move them to another? A: Yes, if allowed by policy. Extra credits can be reallocated to GE Elective. However, they cannot be used to replace missing credits in a different required category (e.g., extra GE Elective credits cannot substitute for missing Faculty Course credits).",
    category: "ge_requirements",
  },
  {
    title: "Q&A: Fastest way to complete GE requirements",
    content: "Q: What courses should I take to finish GE as fast as possible? A: Step 1 — Complete all Basic Course Requirement courses first (they are fixed and mandatory). Step 2 — Choose 3 Faculty courses at 3 credits each to fulfill the 9-credit Faculty requirement. Step 3 — Fill remaining GE Elective slots (12 credits) with any GE courses from the university. Start early in Year 1 since Basic and some GE courses appear in the recommended plan from Semester 1.",
    category: "ge_requirements",
  },
 
  // ── STUDY PLAN ────────────────────────────────────────────────────────────
 
  {
    title: "Recommended Study Plan — Year 1 Semester 1",
    content: "Year 1 Semester 1 recommended courses: General Physics 1 (01006723, 3 credits), General Physics Laboratory 1 (01006724, 1 credit), Intro to Calculus (01006710, 3 credits), Circuits and Electronics (01276111, 4 credits), Computer Programming (01276121, 4 credits), Digital Intelligence Quotient (96641002, 3 credits), Academic Listening and Speaking (96644004, 0 credits — audit), GE Elective (9664xxxx, 3 credits). Total ≈ 21 credits (22-9-50 workload format).",
    category: "study_plan",
  },
  {
    title: "Recommended Study Plan — Year 1 Semester 2",
    content: "Year 1 Semester 2 recommended courses: General Physics 2 (01006725, 3 credits), General Physics Laboratory 2 (01006726, 1 credit), Advanced Calculus (01006711, 3 credits), Digital System Fundamentals (01276112, 4 credits), Object-Oriented Programming (01276131, 4 credits), Charm School (96641001, 2 credits), Sports and Recreational Activities (96641003, 1 credit), Academic Reading and Writing (96644005, 0 credits — audit), GE Elective (9664xxxx, 3 credits). Total ≈ 21 credits (20-12-49 workload format).",
    category: "study_plan",
  },
  {
    title: "Recommended Study Plan — Year 2 Semester 1",
    content: "Year 2 Semester 1 recommended courses: Probability and Random Variables (01276206, 3 credits), Linear Algebra (01006716, 3 credits), Discrete Mathematics (01276209, 3 credits), Data Structure and Algorithms (01276222, 4 credits), Computer Networks (01276223, 4 credits), Database Systems (01276241, 3 credits). Total = 20 credits (18-6-40 workload format).",
    category: "study_plan",
  },
  {
    title: "Recommended Study Plan — Year 2 Semester 2",
    content: "Year 2 Semester 2 recommended courses: Differential Equations (01006717, 3 credits), Introduction to Statistics (01276207, 4 credits), Computer Architecture and Organization (01276213, 4 credits), Software Development Process (01276232, 4 credits), Web Programming (01276233, 4 credits). Total = 19 credits (15-12-38 workload format).",
    category: "study_plan",
  },
  {
    title: "Recommended Study Plan — Year 3 Semester 1",
    content: "Year 3 Semester 1 recommended courses: Microcontroller Interfacing (01276314, 4 credits), Operating Systems (01276324, 3 credits), Artificial Intelligence (01276342, 3 credits), Electives in Computer Engineering (01276xxx, 3 credits), GE Elective (9664xxxx, 3 credits × 2). Total = 19 credits (18-3-38 workload format).",
    category: "study_plan",
  },
  {
    title: "Recommended Study Plan — Year 3 Semester 2",
    content: "Year 3 Semester 2 recommended courses: Information and Computer Security (01276325, 3 credits), Theory of Computation (01276326, 3 credits), Machine Learning (01276343, 3 credits), Computer Engineering Project Preparation (01276390, 2 credits), Electives in Computer Engineering (01276xxx, 3 credits), GE Elective (9664xxxx, 3 credits × 2). Total = 20 credits (19-3-38 workload format).",
    category: "study_plan",
  },
  {
    title: "Recommended Study Plan — Year 4 Capstone Track",
    content: "Year 4 Capstone Track: Semester 1 — Capstone Design Project 1 (01276901, 3 credits), Electives in Computer Engineering (3 credits), GE Elective (3 credits), Free Elective (3 credits). Total = 12 credits. Semester 2 — Capstone Design Project 2 (01276902, 3 credits), Electives in Computer Engineering (3 credits), Free Elective (3 credits). Total = 12 credits.",
    category: "study_plan",
  },
  {
    title: "Recommended Study Plan — Year 4 Co-operation Education Track",
    content: "Year 4 Co-operation Education Track: Semester 1 — Co-operation Education (01006301, 6 credits, 0-45-0 format). Semester 2 — Electives in Computer Engineering (3+3 credits), GE Elective (3+3 credits), Free Elective (3+3 credits). Total Semester 2 = 18 credits.",
    category: "study_plan",
  },
  {
    title: "Recommended Study Plan — Year 4 Overseas Training Track",
    content: "Year 4 Overseas Training Track: Semester 1 — Study Abroad (01006302, 6 credits, 0-45-0 format). Semester 2 — Electives in Computer Engineering (3+3 credits), GE Elective (3+3 credits), Free Elective (3+3 credits). Total Semester 2 = 18 credits.",
    category: "study_plan",
  },
  {
    title: "Q&A: What is the recommended Year 1 study plan?",
    content: "Q: What is the recommended study plan for Year 1? A: Year 1 Semester 1 includes General Physics 1, General Physics Laboratory 1, Intro to Calculus, Circuits and Electronics, Computer Programming, Digital Intelligence Quotient, and a GE Elective. Total ≈ 21 credits. Year 1 Semester 2 includes General Physics 2, General Physics Laboratory 2, Advanced Calculus, Digital System Fundamentals, Object-Oriented Programming, Charm School, Sports and Recreational Activities, and a GE Elective. Total ≈ 21 credits.",
    category: "study_plan",
  },
  {
    title: "Q&A: Why does the plan say to take GE even after completing it?",
    content: "Q: Why does the recommended plan tell me to take more GE even if I already completed it? A: The recommended plan is a guideline, not a strict requirement. It is designed to balance workload and ensure you reach the total graduation requirement of 144 credits. If your GE is already completed, you can replace those slots with Free Electives or Major Electives. Key rule: recommended plan ≠ mandatory plan.",
    category: "study_plan",
  },
  {
    title: "Q&A: Can I rearrange my study plan?",
    content: "Q: Can I rearrange my study plan? A: Yes. You can take courses earlier or later than the recommended plan suggests, as long as all prerequisites are met and all graduation requirements are fulfilled by the time you finish.",
    category: "study_plan",
  },
  {
    title: "Q&A: Following the recommended plan guarantees graduation?",
    content: "Q: If I followed the recommended plan exactly, am I guaranteed to graduate? A: No. You must independently verify that your total credits equal 144 and that all required categories are fully completed. The recommended plan is a guide — responsibility for tracking requirements lies with the student.",
    category: "graduation_requirements",
  },
 
  // ── FREE ELECTIVE vs MAJOR ELECTIVE ───────────────────────────────────────
 
  {
    title: "Q&A: Free Elective vs Computer Engineering Elective",
    content: "Q: What is the difference between Free Elective and Computer Engineering Elective? A: Free Elective — any course from any faculty in the university (e.g., Business, Design, Marketing). Computer Engineering Elective — courses specifically offered by the Computer Engineering department (e.g., Cloud Computing, Advanced Database, UX/UI). Key difference: Free Elective = fully flexible, Computer Engineering Elective = specialized/department-specific.",
    category: "elective_policy",
  },
  {
    title: "Q&A: Can Free Electives replace Computer Engineering Electives?",
    content: "Q: Can I take only Free Electives instead of Computer Engineering Electives? A: No. Computer Engineering Electives are a required category with their own credit quota. Free Electives cannot substitute for them.",
    category: "elective_policy",
  },
  {
    title: "Q&A: Course from another faculty — elective classification",
    content: "Q: I want to take courses from another faculty. Where will they count? A: Courses from another faculty count as Free Electives.",
    category: "elective_policy",
  },
  {
    title: "Q&A: Excess GE credits — can they become Free Electives?",
    content: "Q: I accidentally took too many GE courses. What happens to the extra credits? A: Extra GE credits beyond the required 30 may be counted as Free Electives, subject to your university's policy. Confirm with your academic advisor.",
    category: "elective_policy",
  },
 
  // ── CO-OP & OVERSEAS ──────────────────────────────────────────────────────
 
  {
    title: "Q&A: Co-op education and the recommended study plan",
    content: "Q: If I choose co-op education, do I still follow the recommended plan? A: No. Co-op education replaces certain semesters in Year 4. You follow the Co-operation Education track structure instead of the Capstone track. Co-operation Education (01006301) is 6 credits (0-45-0 format), meaning no classroom hours — it is a full work-placement semester.",
    category: "special_tracks",
  },
 
  // ── CREDIT TRACKING SCENARIOS ─────────────────────────────────────────────
 
  {
    title: "Q&A: Credit tracking — 4 GE courses completed",
    content: "Q: I already completed 4 GE courses including English. How many GE credits do I have left? A: Total GE required = 30 credits. Assuming 1 course = 3 credits: 4 courses = 12 credits completed. Remaining = 30 - 12 = 18 credits left.",
    category: "credit_tracking",
  },
  {
    title: "Q&A: Completed all GE early — still need to follow the GE plan?",
    content: "Q: I completed all GE requirements early. Do I still need to follow GE slots in the recommended plan? A: No. You can skip GE in the recommended plan and replace those slots with Free Electives or Major Electives to fill the remaining credits toward the 144-credit graduation requirement.",
    category: "credit_tracking",
  },
 
  // ── RISK / CONSEQUENCES ───────────────────────────────────────────────────
 
  {
    title: "Q&A: Consequence of misunderstanding course categories",
    content: "Q: What happens if I misunderstand course categories? A: You may take wrong courses or miss required credits. This can lead to delayed graduation. Accurate guidance on which category each course belongs to is critical. Always verify classifications with an advisor or official university records.",
    category: "graduation_requirements",
  },
 
];
 
// ─── Seed Runner ──────────────────────────────────────────────────────────────
 
async function seed() {
  try {
    await mongoClient.connect();
    const db = mongoClient.db("university");
    const col = db.collection("documents");
 
    const now = new Date();
    const prepared = documents.map((doc, i) => ({
      ...doc,
      chunkIndex: i,
      sourceFile: "seedData.js",
      metadata: {
        language: "en",
        processedAt: now,
      },
    }));
 
    const result = await col.insertMany(prepared);
    console.log(`✅ Inserted ${result.insertedCount} documents into MongoDB.`);
    console.log("\nCategories seeded:");
    const cats = [...new Set(documents.map(d => d.category))];
    cats.forEach(c => {
      const count = documents.filter(d => d.category === c).length;
      console.log(`  ${c.padEnd(28)} ${count} docs`);
    });
 
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed error:", err);
    process.exit(1);
  }
}
 
seed();