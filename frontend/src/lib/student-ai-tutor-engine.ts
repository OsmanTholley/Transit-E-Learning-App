export type TutorContext = {
  question: string;
  courseTitle?: string;
  subject?: string;
  mode?: "formula" | "diagram" | "revision" | "default";
};

function header(title: string, subject?: string) {
  const sub = subject ? ` — ${subject} Tutor` : "";
  return `**${title}${sub}**\n\n`;
}

export function buildTutorResponse(ctx: TutorContext): string {
  const q = ctx.question.toLowerCase();
  const context = ctx.courseTitle ? ` in ${ctx.courseTitle}` : "";
  const subject = ctx.subject ?? "general";

  if (ctx.mode === "formula" || q.includes("formula") || q.includes("equation")) {
    return buildFormulaResponse(q, context, subject);
  }

  if (ctx.mode === "diagram" || q.includes("diagram") || q.includes("draw")) {
    return buildDiagramResponse(q, context, subject);
  }

  if (ctx.mode === "revision" || q.includes("revise") || q.includes("practice question")) {
    return buildRevisionResponse(q, context, subject);
  }

  if (subject === "physics" || q.includes("reflection") || q.includes("snell") || q.includes("physics")) {
    return buildPhysicsResponse(q, context);
  }

  if (subject === "mathematics" || q.includes("algebra") || q.includes("calculus") || q.includes("equation")) {
    return buildMathResponse(q, context);
  }

  if (subject === "computer-science" || q.includes("program") || q.includes("sql") || q.includes("code")) {
    return buildCsResponse(q, context);
  }

  if (subject === "agriculture" || q.includes("crop") || q.includes("soil") || q.includes("farm")) {
    return buildAgricultureResponse(q, context);
  }

  if (subject === "public-health" || q.includes("health") || q.includes("disease") || q.includes("hygiene")) {
    return buildPublicHealthResponse(q, context);
  }

  if (subject === "business" || q.includes("accounting") || q.includes("profit") || q.includes("marketing")) {
    return buildBusinessResponse(q, context);
  }

  if (subject === "education" || q.includes("pedagogy") || q.includes("teaching") || q.includes("curriculum")) {
    return buildEducationResponse(q, context);
  }

  return buildGeneralResponse(q, context);
}

function buildPhysicsResponse(q: string, context: string) {
  if (q.includes("snell") || (q.includes("refraction") && q.includes("law"))) {
    return `${header("Snell's Law", "Physics")}
**1. Definition**
Snell's Law describes how light bends when it moves between two different media${context}.

**2. Simple explanation**
Light changes speed in different materials, so its direction changes at the boundary.

**3. Real-life examples**
- A straw looks bent in a glass of water
- Swimming pools appear shallower than they are
- Eyeglasses and camera lenses

**4. Formula breakdown**
n₁ sin θ₁ = n₂ sin θ₂
- n = refractive index
- θ = angle measured from the normal (not the surface)

**5. Step-by-step**
1. Draw the normal line at the boundary
2. Label angles from the normal in medium 1 and medium 2
3. Substitute known values and solve for the unknown angle

**6. Diagram (conceptual)**
\`\`\`
        incident ray
             \\
              \\  θ₁
    -----------+-------- boundary
              /  θ₂
             /
      refracted ray
\`\`\`

**7. Revision tips**
Practice ray diagrams daily and always measure angles from the normal.`;
  }

  if (q.includes("reflection")) {
    return `${header("Reflection of Light", "Physics")}
**1. Definition**
Reflection occurs when light bounces off a surface instead of passing through it.

**2. Simple explanation**
Smooth surfaces produce clear reflections; rough surfaces scatter light.

**3. Real-life examples**
- Mirrors
- Calm water surfaces
- Retro-reflective road signs

**4. Formula breakdown**
Angle of incidence = Angle of reflection (θᵢ = θᵣ)

**5. Step-by-step**
1. Draw the surface and normal
2. Mark the incident ray and reflected ray symmetrically about the normal

**6. Diagram**
\`\`\`
      incident →  \\
                   \\ θ
    ================== surface
                   / θ
      reflected ← /
\`\`\`

**7. Revision tips**
Link reflection to mirrors, periscopes, and optical instruments.`;
  }

  return buildGeneralResponse(q, context, "Physics");
}

function buildMathResponse(q: string, context: string) {
  return `${header("Mathematics Support", "Mathematics")}
**1. Definition**
Let's analyze your mathematics question${context} systematically.

**2. Simple explanation**
Break the problem into known formulas, substitute values, and solve step-by-step.

**3. Real-life examples**
- Budget calculations (percentages)
- Engineering measurements (trigonometry)
- Data analysis (statistics)

**4. Formula breakdown**
Identify the topic: algebra, calculus, geometry, or statistics — then select the correct formula.

**5. Step-by-step approach**
1. Write what is given and what is required
2. Choose the appropriate formula
3. Substitute values carefully with units
4. Simplify and verify your answer

**6. Practice**
Try a similar problem with different numbers to confirm understanding.

**7. Revision tips**
Keep a formula sheet and practice 3 problems per topic daily.`;
}

function buildCsResponse(q: string, context: string) {
  if (q.includes("sql") || q.includes("database")) {
    return `${header("Database & SQL", "Computer Science")}
**1. Definition**
A database stores structured data; SQL is the language used to query and update it.

**2. Simple explanation**
Tables hold rows of records. You use SELECT, INSERT, UPDATE, and DELETE to work with data.

**3. Example**
\`\`\`sql
SELECT name, grade FROM students WHERE grade >= 70 ORDER BY grade DESC;
\`\`\`

**4. Key concepts**
- Primary key: unique row identifier
- Foreign key: link between tables
- JOIN: combine related tables

**5. Step-by-step**
1. Identify tables needed
2. Write SELECT columns
3. Add WHERE filters
4. Test with small data

**6. Revision tips**
Practice JOINs and aggregate functions (COUNT, AVG).`;
  }

  return buildGeneralResponse(q, context, "Computer Science");
}

function buildAgricultureResponse(q: string, context: string) {
  return `${header("Agriculture", "Agriculture")}
**1. Definition**
Agricultural science studies crop production, soil health, and sustainable farming${context}.

**2. Simple explanation**
Healthy soil + appropriate seeds + water management = better yields.

**3. Real-life examples**
- Crop rotation to maintain soil nutrients
- Irrigation during dry seasons
- Pest management using integrated approaches

**4. Key practices**
- Soil testing before planting
- Timely weeding and fertilization
- Post-harvest storage to reduce losses

**5. Step-by-step farm planning**
1. Assess land and climate
2. Select suitable crops
3. Plan planting calendar
4. Monitor growth and adjust

**6. Revision tips**
Link theory to local Sierra Leone farming conditions and case studies.`;
}

function buildPublicHealthResponse(q: string, context: string) {
  return `${header("Public Health", "Public Health")}
**1. Definition**
Public health focuses on protecting and improving community health through prevention and education${context}.

**2. Simple explanation**
Instead of only treating individuals, public health addresses causes at population level.

**3. Real-life examples**
- Vaccination campaigns
- Clean water and sanitation programs
- Health education on hygiene

**4. Key areas**
- Epidemiology (disease patterns)
- Health promotion
- Environmental health

**5. Step-by-step outbreak response**
1. Detect and confirm cases
2. Identify source and transmission
3. Implement control measures
4. Monitor and communicate with community

**6. Revision tips**
Use local case studies and WHO guidelines in your answers.`;
}

function buildBusinessResponse(q: string, context: string) {
  return `${header("Business Studies", "Business")}
**1. Definition**
Business concepts cover how organizations create value, manage resources, and serve customers${context}.

**2. Simple explanation**
Profit = Revenue − Costs. Good decisions balance risk, cost, and customer needs.

**3. Real-life examples**
- Small enterprise budgeting
- Marketing a new product
- Break-even analysis for a shop

**4. Formula breakdown**
Profit = TR − TC
Break-even units = Fixed Costs ÷ (Price − Variable Cost per unit)

**5. Step-by-step calculation**
1. List fixed and variable costs
2. Determine price per unit
3. Compute contribution margin
4. Solve for break-even point

**6. Revision tips**
Practice numerical problems and explain answers in business terms.`;
}

function buildEducationResponse(q: string, context: string) {
  return `${header("Education", "Education")}
**1. Definition**
Education studies how people learn and how teaching can be designed effectively${context}.

**2. Simple explanation**
Good teaching matches learning objectives, activities, and assessment.

**3. Real-life examples**
- Lesson planning with clear outcomes
- Active learning in classrooms
- Formative assessment to guide learners

**4. Key concepts**
- Bloom's taxonomy (levels of learning)
- Differentiation for diverse learners
- Classroom management strategies

**5. Step-by-step lesson design**
1. Set learning objectives
2. Introduce content with examples
3. Guided practice
4. Independent practice and assessment

**6. Revision tips**
Connect theory to practicum experiences and reflection journals.`;
}

function buildFormulaResponse(q: string, context: string, subject?: string) {
  return `${header("Formula Helper", subject)}
**1. Definition**
Formulas express mathematical relationships between quantities${context}.

**2. Snell's Law (optics)**
n₁ sin θ₁ = n₂ sin θ₂

**3. Variable meanings**
- n = refractive index (dimensionless)
- θ = angle from the normal (degrees or radians)

**4. Example**
Light from air (n≈1) into water (n≈1.33) at 30° incidence — solve for refracted angle using the formula.

**5. Steps**
1. Write known values
2. Substitute into formula
3. Solve for unknown
4. Check angle is physically possible (0°–90°)

**6. Revision tips**
Always define each symbol before calculating.`;
}

function buildDiagramResponse(q: string, context: string, subject?: string) {
  return `${header("Diagram Explanation", subject)}
**1. Definition**
Educational diagrams visualize processes, structures, or relationships${context}.

**2. Ray diagram (physics)**
\`\`\`
        Light source
             |
             v
    --------+-------- mirror
             \\
              \\ reflected ray
\`\`\`

**3. Flowchart (process)**
\`\`\`
[Start] → [Input] → [Process] → [Decision?] → [Output] → [End]
\`\`\`

**4. How to read diagrams**
- Identify labels and arrows
- Follow direction of flow or energy
- Relate diagram to written definition

**5. Revision tips**
Redraw diagrams from memory and explain each part aloud.`;
}

function buildRevisionResponse(q: string, context: string, subject?: string) {
  return `${header("Revision Assistant", subject)}
**1. Topic summary**
Let's revise your topic${context} with active recall.

**2. Practice questions**
1. Define the key concept in your own words.
2. Give two real-life examples.
3. Solve a short calculation (if applicable).
4. Explain one common mistake students make.

**3. Flashcard prompt**
Q: What is the core formula?
A: (Write the formula and when to use it.)

**4. Mini quiz (MCQ)**
Which statement is correct?
A) Option related to definition
B) Common misconception
C) Correct principle ✓
D) Unrelated fact

**5. Weak area tip**
Re-read lecture notes, watch one video lesson, then answer 5 practice questions without notes.

**6. Next step**
Ask me to generate more questions on a specific sub-topic.`;
}

function buildGeneralResponse(q: string, context: string, subjectLabel?: string) {
  return `${header(subjectLabel ?? "Academic Topic", subjectLabel)}
**1. Definition**
Your question touches an important academic concept${context}.

**2. Simple explanation**
I'll break this into manageable parts so you can understand the core idea first, then the details.

**3. Real-life examples**
Connect this topic to everyday experiences and your course materials.

**4. Formula / key idea**
Ask me specifically for formulas, and I'll define every symbol clearly.

**5. Step-by-step**
1. Understand the question
2. Recall related definitions
3. Apply formulas or principles
4. Verify your answer

**6. Diagram**
Request a diagram and I'll provide a text-based illustration you can redraw.

**7. Revision tips**
Explain the topic to a classmate without looking at notes — that reveals gaps in understanding.

---
*Educational guidance only — I help you learn, not replace your own thinking. Ask a follow-up for deeper detail.*`;
}
