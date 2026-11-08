// ─────────────────────────────────────────────────────────────────────────────
// ⚠️ TEMPORARY DEMO BYPASS MODE — REMOVE AFTER THE DEMO ⚠️
//
// MongoDB is unreachable from this network, so authentication and the DB-backed
// endpoints below serve in-memory demo data instead of touching the database.
//
// HOW TO RESTORE THE REAL APP: set DEMO_BYPASS to false (or delete this file
// and the `bypass` gates in authController / authMiddleware / adminCaseController /
// aiController / searchController). No other files need to change.
// ─────────────────────────────────────────────────────────────────────────────

const DEMO_BYPASS = false; // ← real database flow restored (in-memory MongoDB)

// The demo identity returned by login / register / getMe and attached to
// every protected request by authMiddleware.
const buildDemoUser = (email) => ({
  id: 'demo_1',
  _id: 'demo_1',
  fullName: 'Advocate Demo',
  email: email || 'advocate.demo@caselens.ai',
  role: 'user',
  credits: 100,
  createdAt: new Date().toISOString(),
});

// ─── In-memory case store (replaces LegalCase while in bypass mode) ──────────
const demoCases = [];
let caseCounter = 1;

const DEMO_LEGAL_FRAMEWORK = [
  'Pakistan Penal Code 1860 — Sections 302, 34 (demo)',
  'Constitution of Islamic Republic of Pakistan 1973 — Article 4 (demo)',
  'Qanun-e-Shahadat Order 1984 — Article 129 (demo)',
];

const seedDemoCases = () => {
  if (demoCases.length > 0) return;
  const now = Date.now();
  demoCases.push(
    {
      _id: 'demo_seed_case_1',
      caseTitle: 'State v. Muhammad Anwar (Narcotics Possession Appeal)',
      citation: '2025 PLD 412',
      courtName: 'Lahore High Court',
      caseType: 'Criminal Appeal',
      summary:
        'The appellant challenged a conviction under the Control of Narcotic Substances Act, disputing the recovery procedure and chain of custody of the seized substance. The appeal examined whether procedural safeguards under Section 103 Cr.P.C. were observed during the raid. (Demo data — bypass mode)',
      facts:
        'A police party recovered 1.2 kg of a controlled substance during a house search. The recovery memo was not attested by an independent witness, and the substance reached the forensic laboratory 11 days after seizure. The trial court convicted the appellant and sentenced him to 10 years. (Demo data — bypass mode)',
      keyFacts: [
        'Recovery memo lacked an independent witness (demo)',
        '11-day delay before forensic analysis (demo)',
        'Trial court sentenced the appellant to 10 years (demo)',
      ],
      legalLaws: DEMO_LEGAL_FRAMEWORK,
      lawsApplied: DEMO_LEGAL_FRAMEWORK,
      verdict:
        'Conviction commuted to time served; procedural lapses in chain of custody noted. (Demo — bypass mode)',
      pastCases: [
        {
          id: 'demo_seed_related_1',
          caseTitle: 'Umar Khan v. The State (Recovery Procedure)',
          citation: '2024 SCMR 981',
          courtName: 'Supreme Court of Pakistan',
          summary:
            'Relevant precedents on independent-witness requirements during narcotics recovery. (Demo data)',
          verdict: 'Acquittal for procedural non-compliance.',
        },
      ],
      createdBy: 'demo_1',
      createdAt: new Date(now - 1000 * 60 * 60 * 26).toISOString(),
      keywords: ['narcotics', 'recovery', 'forensic', 'bypass'],
    },
    {
      _id: 'demo_seed_case_2',
      caseTitle: 'Zubair Textile Mills v. FBR (Sales Tax Refund Writ)',
      citation: '2025 PLC(CS) 77',
      courtName: 'Islamabad High Court',
      caseType: 'Constitutional Writ',
      summary:
        'A writ petition seeking direction to the Federal Board of Revenue to process pending sales tax refunds of Rs. 84 million. The court examined whether inaction beyond the statutory 90-day window amounted to infringement of the taxpayer’s fundamental right under Article 24. (Demo data — bypass mode)',
      facts:
        'The petitioner filed refund claims in January 2025. Despite statutory timelines, the FBR took no decision for over 8 months. The petitioner sought mandamus under Article 199. (Demo data — bypass mode)',
      keyFacts: [
        'Rs. 84M in refund claims remained unprocessed (demo)',
        'Statutory 90-day window was exceeded by 5 months (demo)',
        'FBR cited pending audit as justification (demo)',
      ],
      legalLaws: DEMO_LEGAL_FRAMEWORK,
      lawsApplied: DEMO_LEGAL_FRAMEWORK,
      verdict:
        'Petition allowed; FBR directed to decide refund claims within 30 days. (Demo — bypass mode)',
      pastCases: [],
      createdBy: 'demo_1',
      createdAt: new Date(now - 1000 * 60 * 60 * 12).toISOString(),
      keywords: ['sales tax', 'refund', 'fbr', 'writ', 'bypass'],
    }
  );
};

// Build an in-memory "created" workspace case from user text (+ optional AI analysis).
const createDemoCase = ({ sourceText = '', analysis = {}, createdBy }) => {
  seedDemoCases();
  const id = `demo_case_${caseCounter++}_${Date.now().toString(36)}`;
  const firstLine =
    String(sourceText)
      .split(/\n/)
      .map((line) => line.trim())
      .find(Boolean) || '';

  const legalLaws = Array.isArray(analysis.legalLaws)
    ? analysis.legalLaws
    : DEMO_LEGAL_FRAMEWORK;

  const newCase = {
    _id: id,
    caseTitle: firstLine.slice(0, 180) || `AI Workspace Demo Case #${caseCounter - 1}`,
    citation: `WORKSPACE-DEMO-${String(caseCounter - 1).padStart(4, '0')}`,
    courtName: 'Pakistan',
    caseType: 'AI Workspace',
    summary:
      String(analysis.summary || '').trim() ||
      `${String(sourceText).slice(0, 400)}` + `${String(sourceText).length > 400 ? '… (Demo data — bypass mode)' : ' (Demo data — bypass mode)'}`,
    fullText: String(sourceText),
    facts:
      String(analysis.facts || '').trim() ||
      `${String(sourceText).slice(0, 600)}\n(Demo data — bypass mode)`,
    keyFacts: [
      'Provided case text captured for analysis (demo)',
      'Demo mode: database connection is bypassed (demo)',
    ],
    timeline: ['Filed before the trial court (demo)', 'Bypass mode analysis generated (demo)'],
    caseLaws: DEMO_LEGAL_FRAMEWORK.join('; '),
    precedenceComparison: '',
    precedentComparison:
      'Compared against seeded demo precedents; procedural compliance is the decisive factor in the matched cases. (Demo — bypass mode)',
    supportingContradicting:
      'Supporting: documented timeline provided in the input. Contradicting: absence of independent verification in the record. (Demo — bypass mode)',
    opposingArguments:
      'Opposing counsel would argue that the procedural requirements were met and the analysis is premature. (Demo — bypass mode)',
    strengthsWeaknesses:
      'Strengths: clear factual narrative and statutory references. Weaknesses: no independent witnesses cited. (Demo — bypass mode)',
    legalLaws,
    lawsApplied: legalLaws,
    verdict: 'Pending analysis — demo workspace case. (Demo — bypass mode)',
    pastCases: [
      {
        id: 'demo_seed_related_1',
        caseTitle: 'Umar Khan v. The State (Recovery Procedure)',
        citation: '2024 SCMR 981',
        courtName: 'Supreme Court of Pakistan',
        summary:
          'Relevant precedent on procedural requirements referenced in this analysis. (Demo data)',
        verdict: 'Acquittal for procedural non-compliance.',
      },
    ],
    keywords: ['demo', 'workspace', 'bypass'],
    createdBy: createdBy || 'demo_1',
    createdAt: new Date().toISOString(),
  };

  demoCases.push(newCase);
  return newCase;
};

const getDemoCaseById = (caseId) => {
  seedDemoCases();
  return demoCases.find((c) => c._id === caseId) || null;
};

const listDemoCases = (userId) => {
  seedDemoCases();
  if (!userId) return [...demoCases];
  return demoCases.filter((c) => !c.createdBy || c.createdBy === userId);
};

const demoAnswer = (question, aCase) => {
  const q = String(question || 'the question').trim();
  const title = aCase?.caseTitle || 'the provided case file';
  return (
    `Demo Mode: A detailed analysis of "${q}" with respect to "${title}" would examine the facts, ` +
    `applicable statutes, and precedents recorded in the case workspace. ` +
    `Based on the case file, procedural compliance and documentary evidence are the decisive factors. ` +
    `(Database bypassed for this demo session.)`
  );
};

module.exports = {
  DEMO_BYPASS,
  buildDemoUser,
  seedDemoCases,
  createDemoCase,
  getDemoCaseById,
  demoAnswer,
  listDemoCases,
};
