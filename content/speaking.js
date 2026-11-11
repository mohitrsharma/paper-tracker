/* ============================================================
   Daily Hour — Track 4: Speaking (10 min)
   Every day: (a) recite today's śloka (2 min), then
   (b) one main prompt (6–8 min), rotating through
   Interview / Defense / Fluency.
   ============================================================ */
window.SPEAKING = [
  { kind: "Fluency", prompt: "Introduce yourself and your research to someone at a dinner party who is not a scientist. 60 seconds, no jargon.", tip: "Start with a picture they know: rain on a window, coffee spilling on a table. Then say what you compute and why it matters." },
  { kind: "Defense", prompt: "Explain why VOF conserves mass exactly but a basic level-set method does not.", tip: "Name the conserved quantity, show where level set loses it (reinitialization, non-conservative advection), and end with what VOF pays for it (normals, curvature)." },
  { kind: "Interview", prompt: "\"Tell us about your research in three minutes.\" (faculty interview opener)", tip: "Problem → why it is hard → what you did → the result in one number → what comes next in your own lab." },
  { kind: "Fluency", prompt: "Describe yesterday's work as a short story: the situation, the obstacle, what you did, how it ended.", tip: "Use past tense consistently and connecting words: first, then, but, so, finally." },
  { kind: "Defense", prompt: "A committee member asks: \"Why use machine learning for interface reconstruction when analytic methods already exist?\"", tip: "Acknowledge the question is fair. Give the cost argument (iterations of golden-section search), your measured speed-up, and how you protect accuracy." },
  { kind: "Interview", prompt: "\"What will your first grant proposal be about?\"", tip: "One clear title, the gap, the agency (NSF CBET/CMMI, DOE…), and why you are the right person. Keep it to 90 seconds." },
  { kind: "Fluency", prompt: "Explain today's classic paper to a curious high-school student.", tip: "One analogy, one number, one sentence about why it changed the field." },
  { kind: "Defense", prompt: "\"Why is your multiphase pressure Poisson matrix ill-conditioned, and what do you do about it?\"", tip: "Density ratio → coefficient jump → spread of eigenvalues → more iterations. Then: preconditioning, multigrid. Give one number from your condition-number study." },
  { kind: "Interview", prompt: "Teaching demo: teach the Reynolds number to first-year engineering students in three minutes.", tip: "Start with a question to the class, use a demonstration (honey vs. water), write one equation, end with a check question." },
  { kind: "Fluency", prompt: "Take a side for two minutes: \"PhD students should publish fast\" vs. \"PhD students should publish deep.\"", tip: "State your position in the first sentence, give two reasons with examples, admit one point from the other side, conclude." },
  { kind: "Defense", prompt: "\"What are the limitations of your contact-line model?\"", tip: "Name them before they do: grid-dependent apparent angle, slip regularization, hysteresis. Then say what you have tested and what is future work." },
  { kind: "Interview", prompt: "\"How would you mentor your first PhD student?\"", tip: "Concrete practices: weekly meetings, a first small project with a guaranteed result, code review, writing early. Mention what you learned from your own advisor." },
  { kind: "Fluency", prompt: "Describe one figure from your work in words only, so a listener could sketch it.", tip: "Axes first, then what the curves are, then the trend, then the one point that matters." },
  { kind: "Defense", prompt: "\"How did you validate your solver?\"", tip: "Use the Nyāya frame: comparison with benchmarks (upamāna), convergence studies (anumāna), exact solutions like a static droplet, and published data (śabda)." },
  { kind: "Interview", prompt: "\"Why do you want to join our department?\"", tip: "Name two specific faculty or facilities, one course you could teach, and one collaboration you can imagine. Practise with a real department you like." },
  { kind: "Fluency", prompt: "Explain today's śloka in English and connect it to a modern situation — at work, at home, or in the news.", tip: "Translate first, then one story, then one sentence on what you will do differently." },
  { kind: "Defense", prompt: "\"Is quantum computing realistic for your pressure solver?\"", tip: "Be honest and precise: condition number κ, state preparation, readout of the full field. Where it might help: a few output quantities. Show you understand the fine print." },
  { kind: "Interview", prompt: "\"Describe a research failure and what you learned from it.\"", tip: "Pick a real one (e.g., the ML results computed but never applied to the arrays). Situation → what went wrong → how you found it → the habit you changed." },
  { kind: "Fluency", prompt: "Give your elevator pitch three times: 60 seconds, then 30 seconds, then 10 seconds.", tip: "Each version must keep the same core sentence. Find what that sentence is." },
  { kind: "Defense", prompt: "\"Are your speed-up numbers a fair comparison?\"", tip: "Same hardware, same compiler flags, same accuracy target, timing what exactly? Say where the comparison could be unfair and how you controlled for it." },
  { kind: "Interview", prompt: "\"Which course would you most like to teach, and how?\"", tip: "Course name, level, two active-learning methods, one project students would do (e.g., write their own 2D projection solver)." },
  { kind: "Fluency", prompt: "Explain fluid–structure interaction to a medical doctor, using heart valves as the example.", tip: "Peskin started exactly here (Classic, Day 24). Blood pushes the valve, the valve moves the blood — two-way coupling in everyday words." },
  { kind: "Defense", prompt: "\"What is new in your thesis compared with earlier work in your group?\"", tip: "Be specific and generous: what Pathak & Raessi established, then your exact additions — three-phase reconstruction, PLIC-Net, contact-line treatment." },
  { kind: "Interview", prompt: "\"Where do you see your research program in five years?\"", tip: "Three threads: a core you own, a growth area (ML + multiphase), a high-risk idea (quantum linear solvers). Show how students and funding fit." },
  { kind: "Fluency", prompt: "Tell a two-minute story about why you chose engineering and research.", tip: "One specific moment or person. Stories with a concrete scene are remembered; lists of reasons are not." },
  { kind: "Defense", prompt: "Practise not knowing: answer a question you cannot fully answer, e.g. \"How would your method behave at density ratio 10⁴?\"", tip: "\"I haven't tested that. Based on X, I would expect Y, and I would check it by Z.\" Calm, honest, and with a plan." },
  { kind: "Interview", prompt: "\"How will you collaborate with experimentalists?\"", tip: "Name a measurable quantity (contact angle vs. time, droplet spreading radius), what data you need, and what simulations give them in return." },
  { kind: "Fluency", prompt: "Summarize your whole week in 90 seconds: done, learned, next.", tip: "End with one sentence of gratitude — to a person, a result, or yourself." }
];

/* Shared self-check rubric for every speaking session */
window.SPEAKING_RUBRIC = [
  "Opened with a clear first sentence (no 'so, basically…')",
  "One main idea, stated early",
  "At least one concrete number, example or picture",
  "Calm pace (≈130–150 words per minute), pauses instead of 'um'",
  "A clear ending sentence",
  "Gītā 17.15 check: true, useful, and calm"
];

/* Recitation guide for IAST pronunciation */
window.IAST_GUIDE = [
  ["ā ī ū", "long vowels — hold twice as long as a, i, u"],
  ["ṛ", "vocalic r, like 'ri' in 'rhythm' (kṛṣṇa)"],
  ["ṃ", "anusvāra — nasal hum, takes the nasal of the next consonant"],
  ["ḥ", "visarga — a soft echo of the preceding vowel (śāntiḥ ≈ śāntihi)"],
  ["ṭ ḍ ṇ", "retroflex — tongue curled back to the roof of the mouth"],
  ["t d n", "dental — tongue touching the teeth"],
  ["ś", "palatal 'sh' as in 'ship'"],
  ["ṣ", "retroflex 'sh', tongue curled back"],
  ["c", "always 'ch' as in 'church'"],
  ["kh, gh, th…", "aspirated — with a breath of air after the consonant"]
];
