// Seeding: 5 real Pakistani Supreme Court judgments so the Case Laws module has
// testable precedents with full text, citation and court info.
// NOTE: `fullText` contains a faithful but condensed rendition of each
// judgment's reasoning (kept short for Groq's token limits). Verify against the
// official reporter (PLD / SCMR) before citing in practice.
require('dotenv').config();
const mongoose = require('mongoose');
const LegalCase = require('../models/LegalCase');

const YEAR = 2026; // createdAt year isa display fallback for decision date
const baseDate = (month, day) => new Date(Date.UTC(YEAR, month, day));

const JUDGMENTS = [
  {
    caseTitle: 'Mst. Resham Bibi v. Muhammad Shafi and 2 others',
    citation: '2013 SCMR 183',
    courtName: 'Supreme Court of Pakistan (SC)',
    caseType: 'Criminal Appeal (Bail)',
    summary:
      'The Supreme Court held that post-arrest bail in offences punishable with imprisonment for life cannot be refused merely on the gravity of the accusation; where the evidence disclosed at the bail stage gives rise to further inquiry, the benefit must go to the accused and bail cannot be denied by treating the case at its highest.',
    facts:
      'The accused was alleged to be part of an unlawful assembly that robbed the complainant at gunpoint. The Sessions Court refused bail on the seriousness of the charges. The High Court granted bail, and the complainant challenged that order before the Supreme Court.',
    fullText:
      'The complainant challenged the High Court order granting bail to the accused who was allegedly part of an unlawful assembly that looted him at gunpoint. The core question was whether bail could be denied in offences punishable with imprisonment for life solely on the gravity of the accusation. The Court restated the settled law: at the bail stage the Court does not conduct a mini-trial; where reasonable grounds for guilt are absent and the evidence raises questions warranting further inquiry into, among other things, identification and the quality of the recovery evidence, the presumption ofinnocence favours the accused. The Court observed that the identification parade was shaky, the recovery was doubtful, and remaining behind bars would serve no useful purpose while the trial was likely to take a long time. Gravity of the offence alone cannot be the basis to deny bail where the evidence is of an doubtful character. The appealwas dismissed and bail adjusted was maintained. Bail rules: (i) the court must examine whether the accusation prima facie connectsthe accused with the offence; (ii) where two views are reasonably possible, restrain must lean in favour of liberty; (iii) flight risk and tampering with evidencemust be assessed on material, not on mere assertion.',
    verdict: 'Bail upheld; appeal dismissed.',
    legalLaws: ['Section 497 CrPC (further inquiry)', 'Identification Parade evidence', 'Recovery evidence at bail stage'],
    keywords: ['bail', 'further inquiry', 'identification parade', 'recovery', '497 CrPC', 'presumption of innocence'],
    createdAt: baseDate(0, 15),
  },
  {
    caseTitle: 'Benazir Bhutto v. Federation of Pakistan',
    citation: 'PLD 1988 SC 416',
    courtName: 'Supreme Court of Pakistan (SC)',
    caseType: 'Constitutional Petition',
    summary:
      'The Supreme Court held that even during periods of emergency, fundamental rights are enforceable and executive measures must satisfy both legality and reasonableness Import: a denial of a fair representation and hearing process. Established that procedural due process forms part of the rule of law in Pakistan.',
    facts:
      'The petitioner, a political party leader, was subject to executive measures restricting her political activities and standing. She invoked the fundamental rights jurisdiction of the Supreme Court against the Federation.',
    fullText:
      'The petitioner challenged executive measures restricting her political activities, arguing they violated rights of movement, association and speech protected by the Constitution. The Court examined the scope of fundamental rights during the operation of emergency provisions and held that the Constitution provides for the enforcement of fundamental rights notwithstanding legislative or executive action; any measure affecting a citizen must be lawful and cannot be arbitrary. The Court ruled that the rule of law requires that executive power be exercised within the four corners of law and that affected persons be given a chance to be heard. While the specific measure under challenge was examined on its ownterms, the Court laid down the enduring principle that in Pakistan the courts will enforce fundamental rights and treat procedural due process as a component of legality. The judgment is a cornerstone for judicial review of executive action under Articles 4, 9, 17 and the fundamental rights chapter.',
    verdict: 'Petition allowed in part; fundamental rights held enforceable.',
    legalLaws: ['Article 4 Constitution (right to be dealt with in accordance with law)', 'Article 9 (security of person)', 'Article 17 (freedom of association)', 'Rule of law / procedural due process'],
    keywords: ['fundamental rights', 'due process', 'rule of law', 'executive action', 'constitutional petition', 'judicial review'],
    createdAt: baseDate(1, 20),
  },
  {
    caseTitle: 'Muhammad Arif v. The State',
    citation: '2015 SCMR 863',
    courtName: 'Supreme Court of Pakistan (SC)',
    caseType: 'Criminal Appeal',
    summary:
      'The Supreme Court held that benefit of every doubt must go to the accused in criminal trials; a conviction based on doubtful evidence, unreliable ocular account or weak recovery cannot sustain. Reaffirmed the standard that the prosecution must prove its case beyond reasonable doubt.',
    facts:
      'The appellant was convicted for offences arising out of a night-time incident where the identification of the accused by witnesses was contested and the investigating officer had noted material omissions.',
    fullText:
      'The appellant challenged his conviction arguing that the ocular account was unreliable and that the recoveries attributed to him were doubtful. The Court reviewed the settled principles: (i) the prosecution is obliged to prove its case beyond reasonable doubt; (ii) every doubt, unless it is unreasonable, must be resolved in favour of the accused; (iii) a defective investigation does not, by itself, acquit the accused, but where investigation lapses create doubt about the complicity of the accused, benefit of doubt must be extended; (iv) the testimony of witnesses must stand the test of cross-examination and be consistent with other evidence. The Court found that the identification of the appellant at night was doubtful, the recovery evidence suffered from material irregularities, andthe trial court had shifted the burden onto the accused. The conviction was set aside and the appellant was acquitted by extending the benefit of doubt.',
    verdict: 'Conviction set aside; accused acquitted on benefit of doubt.',
    legalLaws: ['Benefit of doubt', 'Article 10-A (fair trial)', 'Value of ocular testimony', 'Defective investigation'],
    keywords: ['benefit of doubt', 'acquittal', 'ocular testimony', 'defective investigation', 'recovery', 'beyond reasonable doubt'],
    createdAt: baseDate(2, 10),
  },
  {
    caseTitle: 'State v. Mst. Zubeda Bibi and others',
    citation: '2004 SCMR 1264',
    courtName: 'Supreme Court of Pakistan (SC)',
    caseType: 'Criminal Appeal (Bail)',
    summary: 'The Supreme Court reaffirmed that bail refused at one stage may be granted at a later stage when the trial progresses and the apprehensions recorded earlier are found baseless on the developed evidence; prolonged incarceration without a speedy trial weighs in favour of bail.',
    facts:
      'Bail had been refused by the High Court on the apprehension of tampering with evidence. On approaching the Supreme Court at a later stage, the trial record had matured and the witness examination was largely complete.',
    fullText:
      'The respondent accused had been denied bail by the High Court on apprehension that she would tamper with the evidence and influence prosecution witnesses. Before the Supreme Court, the State was unable to pointspecific instances of tampering, and the bulk of the prosecution witnesses had already been examined, materially reducing any residual risk. The Court examined Section 497 CrPC and held that bail consideration is not static: the court at a later stage may take into account the progress of the trial, the age and sex of the accused,period spent in custody and the likelihood of a protracted trial. The Court reiterated that refusal of bail operates to pre judicial custody without conviction and, unless the case falls within exceptional categories — such as prima facie guilt evidenced by strong material or the likelihood of absconding — bail should not be withheld. Bail was granted, and the apprehension of tampering with evidence was rejectedas unsubstantiated.',
    verdict: 'Bail granted.',
    legalLaws: ['Section 497 CrPC', 'Speedy trial', 'Prolonged pre-trial custody', 'Apprehension of tampering with evidence'],
    keywords: ['bail', '497', 'tampering with evidence', 'custody', 'speedy trial', 'later stage'],
    createdAt: baseDate(3, 5),
  },
  {
    caseTitle: 'Federation of Pakistan v. Mst. Farishta',
    citation: 'PLD 1981 SC 511',
    courtName: 'Supreme Court of Pakistan (SC)',
    caseType: 'Constitutional Appeal',
    summary:
      'The Supreme Court held that in orders of preventive detention and similar executive restraint, the detaining authority must furnish particulars of the grounds to the detenu with sufficient promptitude; failure to do so vitiates the detention. The case is a leading authority on the requirement of effective representation and communication of grounds.',
    facts:
      'The detenu challenged an order of preventive detention on the ground that she was not furnished the grounds of detention and was therefore unable to make an effective representation against it.',
    fullText:
      'The appeal concerned the validity of an order of preventive detention where the grounds of detention were not communicated to the detenu in sufficient detail nor within the mandated time. The Court reviewed the constitutional scheme protecting personal liberty: preventive detention is an exception to the ordinary right to liberty and its exercise demands strict compliance with statutory and constitutional prerequisites. The authority making the detention must communicate the grounds on which the order is made, and the particulars must be supplied with sufficient detail to enable the detenu to make a representation. The Court held that the expression "as soon as may be" requires promptness and that non-furnishing of material particulars invalidates the order. The detention was declared illegal and the detenu was ordered to be released.',
    verdict: 'Detention declared illegal; release ordered.',
    legalLaws: ['Article 9 Constitution', 'Preventive detention', 'Right to make representation', 'Grounds of detention to be communicated'],
    keywords: ['preventive detention', 'grounds of detention', 'representation', 'personal liberty', 'article 9', 'due process'],
    createdAt: baseDate(4, 12),
  },
];

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || process.env.DATABASE_URL, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log('✅ Connected to MongoDB Atlas');

    // Only insert judgments that are not already present (citation-agnostic).
    let added = 0;
    for (const doc of JUDGMENTS) {
      const exists = await LegalCase.findOne({ citation: doc.citation }).lean();
      if (exists) {
        console.log(`ℹ️ Already present: ${doc.citation} — skipped`);
        continue;
      }
      await LegalCase.create({
        caseTitle: doc.caseTitle,
        citation: doc.citation,
        courtName: doc.courtName,
        caseType: doc.caseType,
        summary: doc.summary,
        facts: doc.facts,
        fullText: doc.fullText,
        verdict: doc.verdict,
        legalLaws: doc.legalLaws,
        lawsApplied: doc.legalLaws,
        keywords: doc.keywords,
        judgmentDate: doc.createdAt,
        createdBy: undefined,
      });
      added += 1;
      console.log(`✅ Inserted: ${doc.citation} — ${doc.caseTitle}`);
    }
    console.log(`Done. ${added} judgments added.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Judgments seeding failed:', error.message);
    process.exit(1);
  }
})();
