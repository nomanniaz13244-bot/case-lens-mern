const BAIL_CASES = [
  {
    caseTitle: 'Pre-Arrest Bail under Section 498 Cr.P.C.',
    citation: 'PLD 2021 SC 892',
    courtName: 'Supreme Court of Pakistan',
    summary:
      'Anticipatory bail is an extraordinary relief requiring proof of mala fides, absence of prima facie inculpation, and no need for custodial interrogation.',
  },
];

const CONSTITUTIONAL_CASES = [
  {
    caseTitle: 'Federation of Pakistan vs. Gulzar Ahmed',
    citation: 'PLD 2024 SC 182',
    courtName: 'Supreme Court of Pakistan',
    summary:
      'Constitutional writ relief remains available where alternate remedies are illusory and fundamental rights are clearly infringed.',
  },
  {
    caseTitle: 'Constitutional Writ Jurisdiction',
    citation: '2022 SCMR 134',
    courtName: 'Supreme Court of Pakistan',
    summary:
      'A petitioner under Article 199 must establish an adequate alternate remedy is unavailable and a direct infringement of a legal right.',
  },
];

const CONTRACT_CASES = [
  {
    caseTitle: 'Contract Act, 1872 - Sections 73 and 74',
    citation: 'Contract Act, 1872',
    courtName: 'Statutory Authority',
    summary:
      'Compensation is limited to losses naturally arising from the breach, while liquidated damages are capped at reasonable compensation proved on record.',
  },
];

const EVIDENCE_CASES = [
  {
    caseTitle: 'Admissibility of Digital Evidence',
    citation: 'QSO 1984',
    courtName: 'Statutory Authority',
    summary:
      'Electronic evidence must satisfy the prescribed authenticity and certification requirements before it can be relied upon.',
  },
];

const DEFAULT_CASES = [
  {
    caseTitle: 'Marbury v. Madison',
    citation: '5 U.S. 137 (1803)',
    courtName: 'United States Supreme Court',
    summary:
      'Establishes judicial review, allowing courts to invalidate laws that conflict with the constitution.',
  },
  {
    caseTitle: 'Brown v. Board of Education',
    citation: '347 U.S. 483 (1954)',
    courtName: 'United States Supreme Court',
    summary:
      'Holds that racial segregation in public schools violates the constitutional guarantee of equal protection.',
  },
];

const buildAnswer = (message) => {
  const query = message.toLowerCase();

  if (/(bail|498|497|arrest|remand)/.test(query)) {
    return {
      answer: `Legal Analysis: Pre-Arrest Bail under Section 498 Cr.P.C.

1. Statutory Framework
Section 498 read with Section 497 Cr.P.C. governs bail before arrest. It is an extraordinary relief intended to protect against unwarranted arrest and humiliation.

2. Judicial Criteria
- Mala fides or ulterior motive on the part of the complainant must be shown.
- Custodial interrogation must not be required for the investigation.
- There must be no prima facie material establishing guilt of a non-bailable offence.

3. Recommended Strategy
Annex documentary evidence showing personal enmity, delay, or a purely civil dispute to substantiate the plea of mala fides.`,
      citedCases: BAIL_CASES,
    };
  }

  if (/(writ|199|184|constitution|fundamental right)/.test(query)) {
    return {
      answer: `Constitutional Law Analysis: Article 199 Jurisdiction

1. Prerequisites
- No adequate alternate remedy may be available, or the remedy must be illusory or onerous.
- The petitioner must have a direct and recognizable interest in the right asserted.

2. Available Writs
- Certiorari: to quash orders passed without or in excess of jurisdiction.
- Mandamus: to compel performance of a statutory duty.
- Prohibition: to restrain a forum from exceeding its jurisdiction.

3. Practical Note
Plead specific facts showing infringement of a fundamental right and explain why the alternate statutory remedy is ineffective.`,
      citedCases: CONSTITUTIONAL_CASES,
    };
  }

  if (/(contract|damages|breach|73|74)/.test(query)) {
    return {
      answer: `Commercial Law Analysis: Breach of Contract and Damages

1. Governing Provisions
Sections 73 and 74 of the Contract Act, 1872 govern compensation for breach of contract.

2. Key Principles
- Only loss naturally arising in the usual course of things is recoverable.
- The aggrieved party must take reasonable steps to mitigate the loss.
- Where a penalty is stipulated, the court awards reasonable compensation not exceeding that amount, based on proved loss.

3. Recommended Steps
Document the breach date, actual loss, mitigation efforts, and any stipulated penalty clause before filing the claim.`,
      citedCases: CONTRACT_CASES,
    };
  }

  if (/(evidence|digital|electronic|qso|forensic)/.test(query)) {
    return {
      answer: `Evidence Analysis: Admissibility of Digital Material

1. Foundational Requirements
Electronic evidence must be authenticated and accompanied by the certification required under the applicable electronic evidence rules.

2. Chain of Custody
Maintain a clear chain of custody from seizure or extraction through forensic analysis and production in court.

3. Practical Steps
Preserve the original device or image, record hash values, and produce the forensic report alongside the certified copy.`,
      citedCases: EVIDENCE_CASES,
    };
  }

  return {
    answer: `Legal Research Summary

Thank you for your query regarding: "${message}"

1. Legal Framework
The issue should be assessed under the applicable substantive and procedural statutes, read together with binding precedent from the relevant court.

2. Analysis
- Identify the statutory threshold that governs the relief sought.
- Verify limitation periods and any mandatory procedural prerequisites.
- Support every material assertion with contemporaneous documentary evidence.

3. Recommended Next Steps
1. Confirm the applicable limitation period.
2. Collect certified copies of the relevant public records.
3. Frame specific and distinct reliefs in the prayer.

You can also run a repository search for the exact citation or keyword to retrieve matching judgments.`,
    citedCases: DEFAULT_CASES,
  };
};

const chatWithAI = async (req, res) => {
  try {
    const raw =
      req.body?.message ??
      req.body?.question ??
      req.body?.prompt ??
      req.body?.query ??
      '';
    const message = String(raw).trim();

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'A message is required to process the AI request.',
      });
    }

    if (message.length > 4000) {
      return res.status(400).json({
        success: false,
        message: 'The message is too long. Please limit it to 4000 characters.',
      });
    }

    const { answer, citedCases } = buildAnswer(message);

    return res.status(200).json({
      success: true,
      data: {
        question: message,
        answer,
        citedCases,
      },
    });
  } catch (error) {
    console.error('chatWithAI error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error while processing the AI request.',
    });
  }
};

module.exports = { chatWithAI };
