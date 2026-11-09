// One-time seeding: a reference set of core Pakistani statute sections so the
// Legal Research "Statutes" tab has real, citable content on first use.
// These are short reference summaries of well-known public statutes — lawyers
// must still verify against the official gazette texts before relying on them.
require('dotenv').config();
const mongoose = require('mongoose');
const Statute = require('../models/Statute');

const STATUTES = [
  {
    sectionNumber: 'Section 299',
    actName: 'Pakistan Penal Code, 1860',
    title: 'Qatl and its kinds (murder defined)',
    category: 'Criminal Law',
    sectionText:
      'Whoever causes death of another person by any act done with intention of causing death, or with intention of causing bodily injury as is likely to cause death, or with knowledge that it is likely to cause death, commits the offence of qatl-i-amd (intentional killing). The Penal Code classifies illegal killing as qatl-i-amd, qatl-shibh-i-amd, qatl-i-khata, qatl-i-khata-bis-sabab and qatl-ul-arsh.',
    keywords: ['murder', 'death', 'killing', 'intention', 'homicide', 'qatl'],
  },
  {
    sectionNumber: 'Section 300',
    actName: 'Pakistan Penal Code, 1860',
    title: 'Qatl-i-amd defined',
    category: 'Criminal Law',
    sectionText:
      'Subject to the provisions of Section 301, culpable homicide is qatl-i-amd if the act by which the death is caused is done with the intention of causing death, or with the intention of causing bodily injury likely to cause death, or with the knowledge that the act is so imminently dangerous that it must in all probability cause death.',
    keywords: ['murder', 'culpable homicide', 'intention', 'death', 'qatl'],
  },
  {
    sectionNumber: 'Section 302',
    actName: 'Pakistan Penal Code, 1860',
    title: 'Punishment for qatl-i-amd',
    category: 'Criminal Law',
    sectionText:
      'Whoever commits qatl-i-amd shall, subject to the provisions of this Chapter, be punished with death as qisas or with imprisonment for life, and shall also be liable to fine as tazir. If the heirs of the victim pardon the offender or compound the offence, the punishment may be modified in accordance with the Islamic law provisions of the Code.',
    keywords: ['punishment', 'death sentence', 'life imprisonment', 'qisas', 'murder penalty', 'tazir'],
  },
  {
    sectionNumber: 'Section 320',
    actName: 'Pakistan Penal Code, 1860',
    title: 'Punishment for qatl-i-khata (negligent killing)',
    category: 'Criminal Law',
    sectionText:
      'Whoever commits qatl-i-khata (causing death without intention as a result of mistake of act or omission) shall be punished with imprisonment of either description for a term not exceeding three years as tazir, and shall also be liable to diyat or compensation, in addition to any liability under Arsh/Daman principles as the court may determine.',
    keywords: ['negligence', 'causing death by mistake', 'diyat', 'rash driving', 'accident'],
  },
  {
    sectionNumber: 'Section 161',
    actName: 'Code of Criminal Procedure, 1898',
    title: 'Examination of witnesses by police',
    category: 'Procedure',
    sectionText:
      'Any police officer making an investigation may examine orally any person supposed to be acquainted with the facts of the case. Such person shall be bound to answer all questions relating to that case put to him by the investigating officer, other than questions which have a tendency to expose him to criminal liability. Statements are recorded but statements recorded under this section are not substantive evidence; they may be used only to contradict the maker at trial.',
    keywords: ['police investigation', 'witness statement', 'examination', 'contradiction', 'statement under 161'],
  },
  {
    sectionNumber: 'Section 173',
    actName: 'Code of Criminal Procedure, 1898',
    title: 'Report of police officer on completion of investigation (challan)',
    category: 'Procedure',
    sectionText:
      'On completion of an investigation, the officer in charge of the police station shall forward to the Magistrate a report in the form prescribed, setting out the names of the parties, the nature of the information, the names of witnesses and whether the accused has been released on bond or taken into custody. This report is commonly called the challan and forms the basis of the trial.',
    keywords: ['challan', 'final report', 'police report', 'completion of investigation', 'magistrate'],
  },
  {
    sectionNumber: 'Section 497',
    actName: 'Code of Criminal Procedure, 1898',
    title: 'When bail may be taken in cases of non-bailable offence',
    category: 'Bail',
    sectionText:
      'When any person accused of a non-bailable offence is arrested or detained, he may be released on bail, but the person accused of an offence punishable with death or imprisonment for life shall not be so released if there appear reasonable grounds for believing that he has been guilty of that offence. Bail may nevertheless be granted if the person is under sixteen, a woman, or sick or infirm. A person may also be released if at any stage it appears there are not reasonable grounds for the belief of guilt — the famous provision for post-arrest bail where the case is weak or the evidence is insufficient.',
    keywords: ['bail', 'non-bailable offence', 'reasonable grounds', 'further inquiry', 'woman', 'juvenile', 'sick infirm'],
  },
  {
    sectionNumber: 'Section 498',
    actName: 'Code of Criminal Procedure, 1898',
    title: 'Anticipatory bail (pre-arrest bail)',
    category: 'Bail',
    sectionText:
      'Where the Court is satisfied that a person has reason to believe that he may be arrested for a non-bailable offence, it may grant him interim bail in anticipation of arrest upon such conditions as it thinks fit, having regard to the nature of the offence, the antecedents of the applicant and the likelihood of his absconding or tampering with evidence. Continuing presence and cooperation with the investigation is normally a condition.',
    keywords: ['pre-arrest bail', 'anticipatory bail', 'interim bail', 'join investigation', 'surrender'],
  },
  {
    sectionNumber: 'Article 9',
    actName: 'Constitution of Pakistan, 1973',
    title: 'Security of person (right to life and liberty)',
    category: 'Constitutional',
    sectionText:
      'No person shall be deprived of life or liberty save in accordance with law. Courts have read procedural fairness into this guarantee: any deprivation of liberty must follow a lawful, fair and just procedure. It anchors bail jurisprudence and detention challenges before the High Courts.',
    keywords: ['life liberty', 'due process', 'detention', 'fundamental right', 'fair trial', 'bail'],
  },
  {
    sectionNumber: 'Article 199',
    actName: 'Constitution of Pakistan, 1973',
    title: 'Jurisdiction of High Court (writ jurisdiction)',
    category: 'Constitutional',
    sectionText:
      'A High Court may, on the application of an aggrieved party, make an order for the enforcement of fundamental rights, or declare that a act done by a public authority was done without lawful authority and is of no legal effect. The High Court does not sit in appeal over findings of fact unless the impugned action is without jurisdiction, mala fide, or contrary to the fundamental principles of justice.',
    keywords: ['writ', 'high court', 'mandamus', 'certiorari', 'fundamental rights', 'lawful authority'],
  },
  {
    sectionNumber: 'Section 10',
    actName: 'Contract Act, 1872',
    title: 'What agreements are contracts',
    category: 'Commercial',
    sectionText:
      'All agreements are contracts if they are made by the free consent of parties competent to contract, for a lawful consideration and with a lawful object, and are not hereby expressly declared to be void. Consent is not free when caused by coercion, undue influence, fraud, misrepresentation or mistake.',
    keywords: ['contract', 'agreement', 'free consent', 'lawful consideration', 'voidable', 'competent parties'],
  },
  {
    sectionNumber: 'Section 117',
    actName: 'Qanun-e-Shahadat Order, 1984',
    title: 'Burden of proof on person who asserts',
    category: 'Evidence',
    sectionText:
      'Whoever alleges the existence of any fact shall prove its existence; whoever denies shall prove its non-existence. In civil proceedings the court may presume the existence of facts which commonly occur in the ordinary course of business unless disproved. A party bears the burden for its positive assertion; the standard is preponderance of probability.',
    keywords: ['burden of proof', 'evidence', 'allegation', 'prove', 'preponderance', 'civil trial'],
  },
];

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || process.env.DATABASE_URL, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log('✅ Connected to MongoDB Atlas');
    const count = await Statute.countDocuments();
    if (count > 0) {
      console.log(`ℹ️ Statute collection already has ${count} documents — nothing to seed`);
      process.exit(0);
    }
    await Statute.insertMany(STATUTES);
    console.log(`✅ Seeded ${STATUTES.length} Pakistani statute sections`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Statute seeding failed:', error.message);
    process.exit(1);
  }
})();
