// ─── Legal Dictionary Seed Script ─────────────────────────────────────────────
// Usage:
//   node scripts/seedDictionary.js            → wipe & reseed the dictionary
//
// The project uses an in-memory MongoDB (see config/db.js), so a standalone run
// only seeds that throwaway instance. server.js also calls seedDictionary()
// on boot (onlyIfEmpty) so the dictionary is always populated for the demo.
//
// All definitions are written for Pakistani law: PPC, CrPC, CPC, the
// Constitution of Pakistan, PECA, Qanun-e-Shahadat and other local statutes.
// ─────────────────────────────────────────────────────────────────────────────

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const LegalTerm = require('../models/LegalTerm');

const LEGAL_TERMS = [
  {
    term: 'Bail',
    englishDefinition:
      'The release of an accused person from custody, with or without surety, while investigation or trial is pending. In Pakistan bail is governed by sections 496, 497 and 498 Cr.P.C.; section 497 restricts bail in non-bailable offences such as murder under section 302 PPC, where the court must consider the risk of absconding and tampering with evidence.',
    urduExplanation:
      'ضمانت سے مراد ملزم کو تفتیش یا مقدمے کی سماعت کے دوران حراست سے رہا کرنا ہے۔ پاکستان میں ضمانت سیکشن 496، 497 اور 498 ضابطہ فوجداری کے تحت دی جاتی ہے۔ ناقابلِ ضمانت جرم (مثلاً سیکشن 302 پاکستان پینل کوڈ) میں عدالت فرار ہونے یا گواہوں کو متاثر کرنے کے خطرے کو دیکھ کر ضمانت دیتی ہے۔ ضمانت کے لیے ضمانتی مچلکہ اور ضامن درکار ہوتے ہیں۔',
    example:
      'An accused charged under section 302 PPC applies for bail after the prosecution produces its main evidence; the sessions court weighs the evidence and the risk of absconding under section 497 Cr.P.C.',
    category: 'Criminal',
    relatedTerms: ['Remand', 'Acquittal', 'FIR', 'Custody'],
  },
  {
    term: 'Precedent',
    englishDefinition:
      'A previously decided case that a lower court must follow when the facts and legal issues are substantially the same. Under Articles 189 and 201 of the Constitution of Pakistan, Supreme Court decisions bind all courts and High Court decisions bind subordinate courts.',
    urduExplanation:
      'سابقہ فیصلہ (نظیر) سے مراد ایسا مقدمہ ہے جس کا فیصلہ پہلے ہو چکا ہو اور زیرِ سماعت مقدمے کے حقائق اسی نوعیت کے ہوں۔ پاکستان میں سپریم کورٹ کے فیصلے تمام عدالتوں کے لیے پابند ہوتے ہیں (آرٹیکل 189)، جبکہ ہائی کورٹ کے فیصلے ماتحت عدالتوں پر لاگو ہوتے ہیں (آرٹیکل 201)۔',
    example:
      'If the Supreme Court has held that a confession recorded without a magistrate is inadmissible, a sessions court must apply that precedent to a similar case.',
    category: 'Constitutional',
    relatedTerms: ['Res Judicata', 'Jurisdiction', 'Suo Motu'],
  },
  {
    term: 'Affidavit',
    englishDefinition:
      'A written statement of facts sworn or affirmed on oath before a person authorised to administer an oath. In Pakistan affidavits are commonly filed under the Oaths Act, 1873 and Order XIX of the Civil Procedure Code, 1908; a false affidavit can attract prosecution.',
    urduExplanation:
      'حلف نامہ ایک تحریری بیان ہے جس میں بیان کرنے والا اپنے حقائق کی درستگی کی قسم کھاتا ہے۔ یہ عام طور پر oath commissioner یا عدالت کے سامنے پیش کیا جاتا ہے۔ پاکستان میں حلف نامہ Oaths Act 1873 اور سول پروسیجر کوڈ کے آرڈر 19 کے تحت استعمال ہوتا ہے اور جھوٹا حلف نامہ دینے پر قانونی کارروائی ہو سکتی ہے۔',
    example:
      'The petitioner filed an affidavit stating that she is the lawful owner of the property and that the documents annexed are true copies.',
    category: 'General',
    relatedTerms: ['Evidence', 'Plaint', 'Power of Attorney'],
  },
  {
    term: 'Jurisdiction',
    englishDefinition:
      'The legal authority of a court to hear and decide a particular case, determined by territory, subject matter or value. In Pakistan civil jurisdiction is set by the Civil Procedure Code, 1908 and criminal jurisdiction by the Cr.P.C. and the court hierarchy; a decision without jurisdiction is a nullity.',
    urduExplanation:
      'دائرہ اختیار سے مراد عدالت کا یہ قانونی اختیار ہے کہ وہ کسی مخصوص مقدمے کی سماعت اور فیصلہ کر سکے۔ یہ علاقائی حدود، نوعیتِ مقدمہ اور مالیت کے مطابق طے ہوتا ہے۔ پاکستان میں سول دائرہ اختیار سول پروسیجر کوڈ 1908 اور فوجداری دائرہ اختیار ضابطہ فوجداری سے طے ہوتا ہے۔ اگر عدالت کا دائرہ اختیار نہ ہو تو فیصلہ کالعدم قرار پا سکتا ہے۔',
    example:
      'A suit for possession of property worth Rs. 5 million must be filed before the civil court having pecuniary jurisdiction over that amount.',
    category: 'Constitutional',
    relatedTerms: ['Plaint', 'Writ Petition', 'Res Judicata'],
  },
  {
    term: 'Injunction',
    englishDefinition:
      'A court order restraining a person from doing an act, or requiring an act to be done, to prevent irreparable harm. Temporary injunctions in Pakistan are granted under Order XXXIX, Rules 1 and 2 of the Civil Procedure Code, 1908; permanent injunctions are governed by the Specific Relief Act, 1877.',
    urduExplanation:
      'حکمِ امتناعی (انجنکشن) عدالت کا وہ حکم ہے جس کے ذریعے کسی شخص کو کوئی کام کرنے سے روکا جاتا ہے یا کوئی کام کرنے کا کہا جاتا ہے تاکہ ناقابلِ تلافی نقصان سے بچا جا سکے۔ سول پروسیجر کوڈ کے آرڈر 39 رول 1 اور 2 کے تحت عارضی حکم امتناعی دیا جاتا ہے، جبکہ مستقل حکم امتناعی Specific Relief Act 1877 کے تحت آتا ہے۔',
    example:
      'The plaintiff sought a temporary injunction under Order XXXIX CPC to stop the defendant from demolishing the boundary wall until the suit is decided.',
    category: 'Civil',
    relatedTerms: ['Stay Order', 'Plaint', 'Decree'],
  },
  {
    term: 'Habeas Corpus',
    englishDefinition:
      'A constitutional remedy requiring a person detaining another to produce the detained person before the court and justify the detention. In Pakistan it is sought from a High Court under Article 199 of the Constitution and is the primary safeguard against unlawful detention.',
    urduExplanation:
      'حبیس کارپس ایک آئینی رٹ ہے جس کا مطلب ہے "تم اپنا جسم پیش کرو"۔ اس کے ذریعے عدالت کسی حراست میں رکھے گئے شخص کو پیش کرنے اور حراست کی قانونی وجہ بتانے کا حکم دیتی ہے۔ پاکستان میں یہ ہائی کورٹ سے آرٹیکل 199 کے تحت حاصل کی جاتی ہے اور غیر قانونی حراست کے خلاف موثر علاج ہے۔',
    example:
      'A father filed a habeas corpus petition alleging that his daughter was being unlawfully confined by her in-laws.',
    category: 'Constitutional',
    relatedTerms: ['Writ Petition', 'Suo Motu', 'Remand', 'Custody'],
  },
  {
    term: 'Plaint',
    englishDefinition:
      'The formal written statement by which a plaintiff institutes a civil suit, setting out facts, cause of action and relief claimed. Order VII of the Civil Procedure Code, 1908 prescribes its contents, and Order VI governs the pleading rules.',
    urduExplanation:
      'فردِ دعویٰ (پلینٹ) وہ تحریری دستاویز ہے جس کے ذریعے مدعی سول مقدمہ دائر کرتا ہے۔ اس میں حقائق، وجہِ دعویٰ اور مطلوبہ راحت درج کی جاتی ہے۔ سول پروسیجر کوڈ کا آرڈر 7 فردِ دعویٰ کے تقاضے بیان کرتا ہے جبکہ آرڈر 6 میں pleading کے اصول درج ہیں۔',
    example:
      "The plaint must state the parties' names, the facts giving rise to the dispute, the court's jurisdiction and the precise relief sought.",
    category: 'Civil',
    relatedTerms: ['Decree', 'Injunction', 'Jurisdiction'],
  },
  {
    term: 'FIR',
    englishDefinition:
      'First Information Report — the first written record of information about a cognizable offence, entered by police under section 154 Cr.P.C. It sets the investigation in motion; refusal to register an FIR can be challenged before a magistrate under section 22-A Cr.P.C. and the police rules.',
    urduExplanation:
      'ایف آئی آر سے مراد قابلِ دست اندازی جرم کی پہلی اطلاع ہے جو پولیس تھانے میں تحریری طور پر درج کی جاتی ہے۔ یہ ضابطہ فوجداری کے سیکشن 154 کے تحت درج ہوتی ہے اور تفتیش کا آغاز کرتی ہے۔ ایف آئی آر درج نہ کرنے پر مجسٹریٹ کے سامنے سیکشن 22-A کے تحت درخواست دی جا سکتی ہے۔',
    example:
      'The complainant lodged an FIR at the local police station after his motorcycle was stolen, giving the engine and chassis numbers.',
    category: 'Criminal',
    relatedTerms: ['Bail', 'Remand', 'Acquittal', 'Crime'],
  },
  {
    term: 'Writ Petition',
    englishDefinition:
      'A petition filed in a High Court under Article 199 (or the Supreme Court under Article 184) seeking enforcement of a fundamental right or correction of an administrative action. The five writs available are certiorari, mandamus, prohibition, quo warranto and habeas corpus.',
    urduExplanation:
      'رٹ پٹیشن ہائی کورٹ میں آرٹیکل 199 کے تحت دائر کی جاتی ہے تاکہ بنیادی حقوق کا تحفظ یا سرکاری ادارے کے غیر قانونی اقدام کے خلاف راحت حاصل کی جا سکے۔ سپریم کورٹ میں آرٹیکل 184(3) کے تحت عوامی اہمیت کے معاملات میں رٹ دائر ہو سکتی ہے۔ پانچ رٹس میں certiorari، mandamus، prohibition، quo warranto اور habeas corpus شامل ہیں۔',
    example:
      'A taxpayer filed a writ petition challenging the cancellation of his sales tax registration without a hearing.',
    category: 'Constitutional',
    relatedTerms: ['Habeas Corpus', 'Suo Motu', 'Jurisdiction', 'Judicial Review'],
  },
  {
    term: 'Res Judicata',
    englishDefinition:
      'The principle that a matter already finally decided by a competent court cannot be litigated again between the same parties. It is codified in section 11 of the Civil Procedure Code, 1908 and prevents multiplicity of suits and abuse of process.',
    urduExplanation:
      'ریس جوڈیکیٹا کا اصول یہ ہے کہ جس معاملے کا فیصلہ مجاز عدالت حتمی طور پر کر چکی ہو، اسے وہی فریق دوبارہ عدالت میں نہیں اٹھا سکتے۔ یہ اصول سول پروسیجر کوڈ کے سیکشن 11 میں درج ہے اور مقدمات کی تکرار اور عدالتی وقت کے ضیاع کو روکتا ہے۔',
    example:
      "The defendant's second suit over the same sale agreement was dismissed as barred by res judicata because the first suit had been decided on the merits.",
    category: 'Civil',
    relatedTerms: ['Decree', 'Precedent', 'Limitation'],
  },
  {
    term: 'Limitation',
    englishDefinition:
      'The statutory time limit within which a legal remedy must be sought; a suit filed after the period is generally time-barred. In Pakistan the periods are set by the Limitation Act, 1908, and section 5 of that Act allows condonation of delay only in appeals and applications, not suits.',
    urduExplanation:
      'حدِ مدت سے مراد وہ قانونی وقت ہے جس کے اندر مقدمہ یا درخواست دائر کرنا ضروری ہوتا ہے۔ اگر مقررہ مدت گزر جائے تو دعویٰ عام طور پر ساقط ہو جاتا ہے۔ پاکستان میں مختلف دعووں کے لیے Limitation Act 1908 میں الگ الگ مدتیں مقرر ہیں، اور سیکشن 5 صرف اپیلوں اور درخواستوں میں تاخیر معاف کرتا ہے۔',
    example:
      'A suit for recovery of money based on a written contract must ordinarily be filed within three years of the cause of action arising.',
    category: 'Civil',
    relatedTerms: ['Plaint', 'Res Judicata', 'Jurisdiction'],
  },
  {
    term: 'Power of Attorney',
    englishDefinition:
      'A written instrument by which one person authorises another to act on his or her behalf in legal or financial matters. In Pakistan it is executed and usually authenticated under the Powers of Attorney Act, 1882, and must be stamped and, for use abroad, attested by the relevant consulate.',
    urduExplanation:
      'وکیل نامہ (پاور آف اٹارنی) ایک تحریری دستاویز ہے جس کے ذریعے ایک شخص دوسرے کو اپنی طرف سے قانونی یا مالی معاملات انجام دینے کا اختیار دیتا ہے۔ پاکستان میں یہ Powers of Attorney Act 1882 کے تحت بنایا جاتا ہے اور اس پر اسٹامپ ڈیوٹی لازم ہوتی ہے۔ یہ عدالت میں پیشی، جائیداد کی منتقلی یا بینک کے کاموں کے لیے استعمال ہوتا ہے۔',
    example:
      'The overseas Pakistani executed a special power of attorney in favour of his brother to sell the family plot.',
    category: 'General',
    relatedTerms: ['Affidavit', 'Plaint', 'Decree'],
  },
  {
    term: 'Caveat',
    englishDefinition:
      'A notice filed by a person asking the court not to pass an order in a matter without first hearing that person. Section 148-A of the Civil Procedure Code, 1908 governs caveats, and the caveator must be given notice of any application filed in the matter.',
    urduExplanation:
      'کیویٹ ایک نوٹس ہے جو کوئی شخص عدالت میں دائر کرتا ہے تاکہ اس کے خلاف کسی درخواست پر اسے سنے بغیر حکم نہ دیا جائے۔ یہ سول پروسیجر کوڈ کے سیکشن 148-A کے تحت دائر ہوتا ہے اور اب caveator کو اس معاملے کی کسی بھی درخواست کی اطلاع دی جانی چاہیے۔',
    example:
      "The bank filed a caveat before the High Court to ensure it would be heard before any interim order was passed in the borrower's petition.",
    category: 'Civil',
    relatedTerms: ['Injunction', 'Stay Order', 'Writ Petition'],
  },
  {
    term: 'Remand',
    englishDefinition:
      'The sending of an accused person back to police or judicial custody while investigation or trial continues. Under section 167 Cr.P.C. a magistrate may authorise detention, ordinarily for up to 14 days in the whole, on production of the accused and the investigation record.',
    urduExplanation:
      'ریمانڈ سے مراد ملزم کو تفتیش یا مقدمے کی سماعت کے دوران دوبارہ پولیس یا عدالت کی حراست میں بھیجنا ہے۔ ضابطہ فوجداری کے سیکشن 167 کے تحت مجسٹریٹ ملزم اور تفتیشی ریکارڈ کی موجودگی میں حراست کی اجازت دیتا ہے، عام طور پر مجموعی طور پر 14 دن تک۔',
    example:
      'The investigating officer produced the accused before the magistrate and sought a seven-day physical remand to complete the forensic report.',
    category: 'Criminal',
    relatedTerms: ['Bail', 'FIR', 'Habeas Corpus', 'Custody'],
  },
  {
    term: 'Acquittal',
    englishDefinition:
      'A formal court judgment declaring an accused person not guilty of the charge. In Pakistan acquittal is recorded under section 265-K or at the conclusion of trial under the Cr.P.C.; the prosecution may appeal an acquittal under section 417 Cr.P.C.',
    urduExplanation:
      'بریت سے مراد عدالت کا وہ فیصلہ ہے جس میں ملزم کو الزام سے بری کر دیا جاتا ہے۔ پاکستان میں بریت سیکشن 265-K کے تحت یا مقدمے کی سماعت کے اختتام پر ضابطہ فوجداری کے مطابق دی جاتی ہے۔ استغاثہ سیکشن 417 کے تحت بریت کے خلاف اپیل کر سکتا ہے۔',
    example:
      'The accused was acquitted because the prosecution failed to prove the recovery of the weapon beyond reasonable doubt.',
    category: 'Criminal',
    relatedTerms: ['Bail', 'FIR', 'Conviction', 'Appeal'],
  },
  {
    term: 'Conviction',
    englishDefinition:
      'A formal court finding that an accused person is guilty of the offence charged, followed by sentence. In Pakistan conviction must rest on proof beyond reasonable doubt under the Qanun-e-Shahadat Order, 1984, and is appealable under the Cr.P.C.',
    urduExplanation:
      'سزا (کنوکشن) سے مراد عدالت کا یہ فیصلہ ہے کہ ملزم الزام کا مرتکب ثابت ہوا ہے، جس کے بعد سزا سنائی جاتی ہے۔ پاکستان میں سزا Qanun-e-Shahadat Order 1984 کے تحت شک کے بغیر ثبوت پر مبنی ہوتی ہے اور اس کے خلاف ضابطہ فوجداری کے تحت اپیل کی جا سکتی ہے۔',
    example:
      "After recording the evidence of five prosecution witnesses, the trial court convicted the accused under section 379 PPC and sentenced him to two years' imprisonment.",
    category: 'Criminal',
    relatedTerms: ['Acquittal', 'Bail', 'Precedent', 'Appeal'],
  },
  {
    term: 'Contempt of Court',
    englishDefinition:
      'Conduct that scandalises, obstructs or interferes with the administration of justice or the authority of a court. In Pakistan contempt is punishable under Article 204 of the Constitution and the Contempt of Court Ordinance, 2003, and may be civil or criminal.',
    urduExplanation:
      'توہینِ عدالت سے مراد ایسا عمل یا بیان ہے جو عدلیہ کی عزت کو مجروح کرے، انصاف کی فراہمی میں رکاوٹ ڈالے یا عدالت کے حکم کی خلاف ورزی کرے۔ پاکستان میں یہ آرٹیکل 204 اور Contempt of Court Ordinance 2003 کے تحت قابلِ سزا ہے اور دیوانی یا فوجداری نوعیت کی ہو سکتی ہے۔',
    example:
      'A litigant who publicly threatened a witness was proceeded against for contempt of court.',
    category: 'Constitutional',
    relatedTerms: ['Suo Motu', 'Stay Order', 'Jurisdiction'],
  },
  {
    term: 'Suo Motu',
    englishDefinition:
      'An action taken by a court on its own motion, without a formal petition by a party, usually on a matter of public importance. In Pakistan the Supreme Court exercises this power under Article 184(3) and High Courts under Article 199 read with their original jurisdiction.',
    urduExplanation:
      'سو موٹو کا مطلب ہے "اپنی تحریک پر"۔ اس میں عدالت کسی فریق کی درخواست کے بغیر، عام طور پر عوامی اہمیت کے معاملے پر، خود کارروائی شروع کرتی ہے۔ پاکستان میں سپریم کورٹ آرٹیکل 184(3) کے تحت اور ہائی کورٹس آرٹیکل 199 کے تحت یہ اختیار رکھتی ہیں۔',
    example:
      'The Supreme Court took suo motu notice of the deaths caused by contaminated drinking water in the city.',
    category: 'Constitutional',
    relatedTerms: ['Writ Petition', 'Contempt of Court', 'Habeas Corpus'],
  },
  {
    term: 'Stay Order',
    englishDefinition:
      'An order suspending further proceedings or the operation of a decision until a higher court decides the matter. In Pakistan a stay is commonly granted under Order XLI Rule 5 CPC in appeals and under the court\'s inherent powers, and disobedience can amount to contempt.',
    urduExplanation:
      'حکمِ تعطل (اسٹے آرڈر) سے مراد عدالت کا وہ حکم ہے جس کے تحت کسی کارروائی یا فیصلے پر عمل درآمد اس وقت تک روک دیا جاتا ہے جب تک اعلیٰ عدالت معاملے کا فیصلہ نہ کر دے۔ پاکستان میں یہ عام طور پر اپیل میں آرڈر 41 رول 5 کے تحت دیا جاتا ہے اور اس کی خلاف ورزی توہینِ عدالت ہو سکتی ہے۔',
    example:
      'The appellate court granted a stay order against the execution of the decree pending the decision of the appeal.',
    category: 'Civil',
    relatedTerms: ['Injunction', 'Caveat', 'Decree'],
  },
  {
    term: 'Decree',
    englishDefinition:
      'The formal expression of an adjudication by a civil court that conclusively determines the rights of the parties in a suit. Section 2(2) of the Civil Procedure Code, 1908 defines a decree; it may be preliminary or final and is enforced through execution proceedings.',
    urduExplanation:
      'ڈگری سے مراد سول عدالت کے فیصلے کا رسمی اظہار ہے جو مقدمے میں فریقین کے حقوق کا حتمی تعین کرتا ہے۔ یہ سول پروسیجر کوڈ کے سیکشن 2(2) میں بیان کی گئی ہے۔ ڈگری ابتدائی یا حتمی ہو سکتی ہے اور اس پر عمل درآمد (تنفیذ) کے ذریعے کیا جاتا ہے۔',
    example:
      'The court passed a decree for possession in favour of the plaintiff and directed the defendant to vacate the premises within two months.',
    category: 'Civil',
    relatedTerms: ['Plaint', 'Res Judicata', 'Stay Order'],
  },
  {
    term: 'Arbitration',
    englishDefinition:
      'A method of resolving disputes outside court through an independent arbitrator whose award is usually binding. In Pakistan domestic arbitration is governed by the Arbitration Act, 1940, while foreign awards are enforced under the Recognition and Enforcement (Arbitration Agreements and Foreign Arbitral Awards) Act, 2011.',
    urduExplanation:
      'ثالثی سے مراد عدالت سے باہر کسی غیر جانبدار ثالث کے ذریعے تنازع حل کرنا ہے۔ ثالث کا فیصلہ (ایوارڈ) عام طور پر فریقین کے لیے پابند ہوتا ہے۔ پاکستان میں ملکی ثالثی Arbitration Act 1940 کے تحت اور غیر ملکی ایوارڈز 2011 کے ایکٹ کے تحت نافذ ہوتے ہیں۔',
    example:
      'The construction contract required disputes to be referred to arbitration before either party could file a suit.',
    category: 'Civil',
    relatedTerms: ['Jurisdiction', 'Decree', 'Affidavit'],
  },
  {
    term: 'Maintenance',
    englishDefinition:
      'Financial support ordered by a court for a spouse, child or dependent unable to support themselves. In Pakistan maintenance is claimed under the Muslim Family Laws Ordinance, 1961, the Family Courts Act, 1964 and section 488 Cr.P.C. for destitute persons.',
    urduExplanation:
      'نان نفقہ سے مراد عدالت کا وہ حکم ہے جس کے تحت شوہر یا رشتہ دار کو بیوی، بچوں یا منحصر افراد کی مالی کفالت کرنی ہوتی ہے۔ پاکستان میں یہ Muslim Family Laws Ordinance 1961، Family Courts Act 1964 اور بے سہارا افراد کے لیے سیکشن 488 ضابطہ فوجداری کے تحت حاصل کیا جاتا ہے۔',
    example:
      'The family court ordered the husband to pay monthly maintenance for his two minor children until they attain majority.',
    category: 'Family',
    relatedTerms: ['Dower', 'Khula', 'Affidavit'],
  },
  {
    term: 'Dower',
    englishDefinition:
      'The amount or property promised by the husband to the wife as part of the marriage contract, payable on demand or on dissolution. In Pakistan dower (mehr) is a wife\'s legal right under Islamic law and the Muslim Family Laws Ordinance, 1961 requires it to be recorded in the nikah-nama.',
    urduExplanation:
      'مہر وہ رقم یا جائیداد ہے جو نکاح کے وقت شوہر بیوی کو دینے کا وعدہ کرتا ہے۔ یہ عورت کا قانونی حق ہے اور اس کی وصولی کے لیے عدالت میں دعویٰ کیا جا سکتا ہے۔ پاکستان میں Muslim Family Laws Ordinance 1961 کے تحت مہر نکاح نامے میں درج کرنا لازمی ہے اور یہ معجل یا مؤجل ہو سکتا ہے۔',
    example:
      'The wife filed a suit for recovery of her unpaid dower after the marriage ended in divorce.',
    category: 'Family',
    relatedTerms: ['Maintenance', 'Affidavit', 'Khula'],
  },
  {
    term: 'Khula',
    englishDefinition:
      'A divorce initiated by the wife by returning or foregoing her dower, subject to the court\'s decree. In Pakistan khula is granted by a family court under the Family Courts Act, 1964 read with the Muslim Family Laws Ordinance, 1961, and the wife need not prove fault.',
    urduExplanation:
      'خلع وہ طریقہ ہے جس میں بیوی اپنے حقِ مہر کو چھوڑ کر یا واپس کر کے نکاح ختم کرنے کی درخواست دیتی ہے۔ پاکستان میں فیملی کورٹ Family Courts Act 1964 اور Muslim Family Laws Ordinance 1961 کے تحت خلع کی ڈگری جاری کرتی ہے اور بیوی کو کسی خاص قصور کا ثبوت دینا ضروری نہیں ہوتا۔',
    example:
      'The wife sought khula on the ground that the marriage had irretrievably broken down and she was willing to forgo her dower.',
    category: 'Family',
    relatedTerms: ['Dower', 'Maintenance', 'Affidavit'],
  },
  {
    term: 'Evidence',
    englishDefinition:
      'Information, documents or testimony presented before a court to prove or disprove a fact in issue. In Pakistan the law of evidence is codified in the Qanun-e-Shahadat Order, 1984, which governs oral, documentary and circumstantial evidence as well as the competency of witnesses.',
    urduExplanation:
      'شہادت (ایویڈنس) سے مراد وہ معلومات، دستاویزات یا گواہی ہے جو عدالت کے سامنے کسی حقیقت کو ثابت یا رد کرنے کے لیے پیش کی جائے۔ پاکستان میں شہادت کا قانون Qanun-e-Shahadat Order 1984 میں بیان کیا گیا ہے جو زبانی، دستاویزی اور حالات کی شہادت اور گواہوں کی اہلیت کو کنٹرول کرتا ہے۔',
    example:
      'The prosecution relied on the eyewitness testimony and the forensic report as evidence of the accused\'s presence at the scene.',
    category: 'General',
    relatedTerms: ['Affidavit', 'FIR', 'Conviction', 'Witness'],
  },
  {
    term: 'Murder',
    englishDefinition:
      'Unlawful intentional killing of a human being, called qatl-e-amd in Pakistani law and punishable under section 302 of the Pakistan Penal Code, 1860. The court may impose death, imprisonment for life or imprisonment up to 25 years, and may also order compensation (diyat/arsh) under section 544-A Cr.P.C.; the offence is non-bailable and compoundable only with the court\'s permission in the cases allowed by law.',
    urduExplanation:
      'قتلِ عمد سے مراد کسی انسان کو ناحق جان بوجھ کر قتل کرنا ہے۔ پاکستان میں یہ پاکستان پینل کوڈ کے سیکشن 302 کے تحت قابلِ سزا جرم ہے۔ عدالت سزائے موت، عمر قید یا 25 سال تک قید کی سزا دے سکتی ہے اور سیکشن 544-A ضابطہ فوجداری کے تحت دیت/ارش کا حکم بھی دے سکتی ہے۔ یہ ناقابلِ ضمانت جرم ہے۔',
    example:
      'The accused was charged with murder under section 302 PPC after the post-mortem confirmed that the deceased died from firearm injuries; the trial court awarded life imprisonment and diyat to the legal heirs.',
    category: 'Criminal',
    relatedTerms: ['Crime', 'Bail', 'Acquittal', 'Conviction', 'Hurt'],
  },
  {
    term: 'Crime',
    englishDefinition:
      'An act or omission forbidden and punishable by law. In Pakistan crimes are defined mainly by the Pakistan Penal Code, 1860 and other special statutes such as PECA, 2016, the Anti-Terrorism Act, 1997 and the Control of Narcotic Substances Act, 1997, and are tried under the Cr.P.C.',
    urduExplanation:
      'جرم سے مراد ایسا فعل یا کوتاہی ہے جسے قانون نے منع کیا ہو اور اس پر سزا مقرر کی ہو۔ پاکستان میں جرائم بنیادی طور پر پاکستان پینل کوڈ 1860 اور خصوصی قوانین جیسے PECA 2016، انسدادِ دہشت گردی ایکٹ 1997 اور نارکوٹکس ایکٹ 1997 میں بیان کیے گئے ہیں اور ان کی سماعت ضابطہ فوجداری کے تحت ہوتی ہے۔',
    example:
      'Theft under section 379 PPC is a crime triable by a magistrate, while murder under section 302 PPC is triable by a sessions court.',
    category: 'Criminal',
    relatedTerms: ['Murder', 'FIR', 'Conviction', 'Acquittal'],
  },
  {
    term: 'Article',
    englishDefinition:
      'A numbered provision of the Constitution of Pakistan, 1973. Articles 8 to 28 contain fundamental rights, Article 199 confers writ jurisdiction on High Courts, Article 184 gives the Supreme Court original jurisdiction and Article 239 sets out the procedure for constitutional amendment.',
    urduExplanation:
      'آرٹیکل سے مراد آئینِ پاکستان 1973 کی ایک شمار شدہ دفعہ ہے۔ آرٹیکل 8 سے 28 تک بنیادی حقوق درج ہیں، آرٹیکل 199 ہائی کورٹ کو رٹ کا اختیار دیتا ہے، آرٹیکل 184 سپریم کورٹ کو اصل دائرہ اختیار دیتا ہے اور آرٹیکل 239 آئینی ترمیم کا طریقہ کار بیان کرتا ہے۔',
    example:
      'A citizen whose right to life under Article 9 was violated filed a writ petition in the High Court under Article 199 of the Constitution.',
    category: 'Constitutional',
    relatedTerms: ['Fundamental Rights', 'Writ Petition', 'Judicial Review'],
  },
  {
    term: 'Contract',
    englishDefinition:
      'An agreement enforceable by law, made by free consent of competent parties for a lawful object and consideration. In Pakistan contracts are governed by the Contract Act, 1872, which defines offer, acceptance, consideration and the remedies for breach.',
    urduExplanation:
      'معاہدہ (کنٹریکٹ) وہ اتفاق ہے جسے قانون نافذ کر سکتا ہو اور جو اہل فریقین کی آزاد رضامندی سے قانونی مقصد اور عوض کے لیے ہو۔ پاکستان میں معاہدات Contract Act 1872 کے تحت آتے ہیں جو ایجاب، قبولیت، عوض اور خلاف ورزی کے علاج کو بیان کرتا ہے۔',
    example:
      'The parties signed a contract for the supply of 1,000 cement bags at a fixed price; when the supplier failed to deliver, the buyer sued for damages under the Contract Act, 1872.',
    category: 'Civil',
    relatedTerms: ['Tort', 'Arbitration', 'Specific Performance'],
  },
  {
    term: 'Tort',
    englishDefinition:
      'A civil wrong, independent of contract, that causes harm and gives the injured person a right to compensation. Pakistani tort law is largely based on English common law and judicial precedent, covering negligence, nuisance, defamation, trespass and vicarious liability.',
    urduExplanation:
      'ٹارٹ سے مراد معاہدے سے الگ ایک دیوانی غلطی ہے جس سے نقصان ہوتا ہے اور متاثرہ شخص کو معاوضے کا حق ملتا ہے۔ پاکستان میں ٹارٹ کا قانون زیادہ تر انگریزی common law اور عدالتی نظائر پر مبنی ہے اور اس میں غفلت، nuisance، ہتکِ عزت، trespass اور vicarious liability شامل ہیں۔',
    example:
      'A pedestrian injured by a speeding company van sued the company in tort for negligence and claimed medical expenses and loss of earnings.',
    category: 'Civil',
    relatedTerms: ['Contract', 'Defamation', 'Jurisdiction'],
  },
  {
    term: 'Witness',
    englishDefinition:
      'A person who gives evidence before a court or whose statement is recorded during investigation. In Pakistan the competency and number of witnesses are governed by the Qanun-e-Shahadat Order, 1984; article 17 requires the court to consider the quantity and quality of evidence in criminal cases.',
    urduExplanation:
      'گواہ وہ شخص ہے جو عدالت کے سامنے شہادت دیتا ہے یا جس کا بیان تفتیش کے دوران ریکارڈ کیا جاتا ہے۔ پاکستان میں گواہوں کی اہلیت اور تعداد Qanun-e-Shahadat Order 1984 کے تحت آتی ہے۔ آرٹیکل 17 کے تحت فوجداری مقدمات میں عدالت شہادت کی مقدار اور معیار دونوں کو دیکھتی ہے۔',
    example:
      'The eyewitness was examined in chief by the prosecution and cross-examined by the defence under the Qanun-e-Shahadat Order, 1984.',
    category: 'Criminal',
    relatedTerms: ['Evidence', 'FIR', 'Conviction'],
  },
  {
    term: 'Appeal',
    englishDefinition:
      'A statutory right to have a decision reviewed by a higher court. In Pakistan criminal appeals are governed by Chapter XXXI of the Cr.P.C. (for example section 404 for convictions by magistrates and section 410 for sessions court convictions), while civil appeals follow sections 96 to 106 CPC.',
    urduExplanation:
      'اپیل سے مراد اعلیٰ عدالت سے فیصلے کی نظرثانی کا قانونی حق ہے۔ پاکستان میں فوجداری اپیلیں ضابطہ فوجداری کے باب 31 کے تحت آتی ہیں (مثلاً مجسٹریٹ کی سزا کے لیے سیکشن 404 اور سیشن کورٹ کی سزا کے لیے سیکشن 410)، جبکہ دیوانی اپیلیں سول پروسیجر کوڈ کے سیکشن 96 تا 106 کے تحت ہوتی ہیں۔',
    example:
      'The accused convicted under section 302 PPC filed an appeal before the High Court within the limitation period prescribed by the Limitation Act, 1908.',
    category: 'Criminal',
    relatedTerms: ['Conviction', 'Acquittal', 'Stay Order', 'Precedent'],
  },
  {
    term: 'Custody',
    englishDefinition:
      'Lawful detention of a person by police or prison authorities, or the care and control of a child in family matters. In Pakistan police custody and judicial custody are regulated by the Cr.P.C., and the custody of children is decided by family courts on the welfare of the child principle.',
    urduExplanation:
      'حراست سے مراد پولیس یا جیل حکام کے ذریعے کسی شخص کی قانونی تحویل، یا خاندانی معاملات میں بچے کی نگہداشت ہے۔ پاکستان میں پولیس اور عدالتی حراست ضابطہ فوجداری کے تحت طے ہوتی ہے، جبکہ بچوں کی custody فیملی کورٹ بچے کی بہبود کے اصول پر طے کرتی ہے۔',
    example:
      'The magistrate remanded the accused to judicial custody, while the family court granted interim custody of the minor to the mother.',
    category: 'Criminal',
    relatedTerms: ['Remand', 'Bail', 'Habeas Corpus'],
  },
  {
    term: 'Warrant',
    englishDefinition:
      'A written order issued by a court authorising police to arrest a person, search premises or seize property. In Pakistan arrest warrants are issued under sections 75 to 81 Cr.P.C. and search warrants under sections 96 to 100 Cr.P.C.; a warrant must be executed according to law.',
    urduExplanation:
      'وارنٹ عدالت کا تحریری حکم ہے جس کے تحت پولیس کو کسی شخص کی گرفتاری، جگہ کی تلاشی یا جائیداد کی ضبطی کا اختیار ملتا ہے۔ پاکستان میں گرفتاری کے وارنٹ سیکشن 75 تا 81 ضابطہ فوجداری کے تحت اور تلاشی کے وارنٹ سیکشن 96 تا 100 کے تحت جاری ہوتے ہیں۔ وارنٹ قانون کے مطابق تعمیل کا تقاضا کرتا ہے۔',
    example:
      'After the accused failed to appear despite service of summons, the court issued a non-bailable warrant of arrest under section 75 Cr.P.C.',
    category: 'Criminal',
    relatedTerms: ['Summons', 'FIR', 'Custody'],
  },
  {
    term: 'Summons',
    englishDefinition:
      'A formal notice requiring a person to appear before a court or to produce documents. In Pakistan criminal summons are issued under sections 68 to 74 Cr.P.C. and civil summons under Order V of the Civil Procedure Code, 1908; proper service is essential for a valid trial.',
    urduExplanation:
      'سمن عدالت کا باقاعدہ نوٹس ہے جس کے تحت کسی شخص کو عدالت میں پیش ہونے یا دستاویزات پیش کرنے کا پابند کیا جاتا ہے۔ پاکستان میں فوجداری سمندر سیکشن 68 تا 74 ضابطہ فوجداری کے تحت اور دیوانی سمندر سول پروسیجر کوڈ کے آرڈر 5 کے تحت جاری ہوتے ہیں۔ درست تعمیل کے بغیر کارروائی متاثر ہو سکتی ہے۔',
    example:
      'The court issued summons to the defendant to appear on the next date of hearing along with the original sale deed.',
    category: 'Criminal',
    relatedTerms: ['Warrant', 'Plaint', 'Jurisdiction'],
  },
  {
    term: 'Hurt',
    englishDefinition:
      'Bodily pain, disease or infirmity caused to a person. In Pakistan hurt is defined in section 332 PPC and is divided into simple hurt (section 337), hurt by dangerous weapons (section 337-A) and grievous hurt; the punishment depends on the nature and extent of the injury.',
    urduExplanation:
      'زخمی کرنا (ہرٹ) سے مراد کسی شخص کو جسمانی درد، بیماری یا کمزوری پہنچانا ہے۔ پاکستان میں یہ پاکستان پینل کوڈ کے سیکشن 332 میں بیان کیا گیا ہے اور اس کی اقسام سادہ زخم (سیکشن 337)، خطرناک ہتھیار سے زخم (سیکشن 337-A) اور سنگین زخم ہیں۔ سزا زخم کی نوعیت اور حد پر منحصر ہے۔',
    example:
      'The accused was convicted under section 337-A PPC for causing hurt with a sharp-edged weapon during a street fight.',
    category: 'Criminal',
    relatedTerms: ['Murder', 'Crime', 'Evidence'],
  },
  {
    term: 'Theft',
    englishDefinition:
      'Dishonestly taking movable property out of the possession of another without consent. In Pakistan theft is defined in section 378 PPC and punished under section 379 PPC with imprisonment up to three years, or with fine, or both; aggravated forms are punished under section 380 and 381 PPC.',
    urduExplanation:
      'چوری سے مراد کسی دوسرے کی منقولہ جائیداد کو اس کی رضامندی کے بغیر بدنیتی سے لے لینا ہے۔ پاکستان میں چوری سیکشن 378 پاکستان پینل کوڈ میں بیان کی گئی ہے اور سیکشن 379 کے تحت اس پر تین سال تک قید یا جرمانہ یا دونوں کی سزا ہو سکتی ہے۔ سنگین صورتوں پر سیکشن 380 اور 381 لاگو ہوتے ہیں۔',
    example:
      'The shopkeeper lodged an FIR after his mobile phone was stolen, and the accused was convicted under section 379 PPC.',
    category: 'Criminal',
    relatedTerms: ['Robbery', 'Dacoity', 'FIR', 'Crime'],
  },
  {
    term: 'Robbery',
    englishDefinition:
      'Theft or extortion committed with force or the threat of instant death, hurt or wrongful restraint. In Pakistan robbery is defined in section 390 PPC and punished under section 392 PPC; if committed on a highway the punishment is enhanced.',
    urduExplanation:
      'ڈاکہ/رابری سے مراد چوری یا بھتہ خوری جو طاقت یا فوری موت، زخم یا غیر قانونی روک تھام کی دھمکی کے ساتھ کی جائے۔ پاکستان میں رابری سیکشن 390 پاکستان پینل کوڈ میں بیان کی گئی ہے اور سیکشن 392 کے تحت سزا دی جاتی ہے۔ شاہراہ پر کی گئی رابری کی سزا زیادہ ہے۔',
    example:
      'The accused snatched the victim\'s purse at gunpoint and was charged with robbery under section 392 PPC.',
    category: 'Criminal',
    relatedTerms: ['Theft', 'Dacoity', 'Crime'],
  },
  {
    term: 'Dacoity',
    englishDefinition:
      'Robbery committed by five or more persons acting together. In Pakistan dacoity is defined in section 391 PPC and punished under section 395 PPC with imprisonment for life or up to ten years; dacoity with murder is punished under section 396 PPC.',
    urduExplanation:
      'ڈکیتی سے مراد پانچ یا زیادہ افراد کے مل کر کی گئی رابری ہے۔ پاکستان میں ڈکیتی سیکشن 391 پاکستان پینل کوڈ میں بیان کی گئی ہے اور سیکشن 395 کے تحت عمر قید یا دس سال تک قید کی سزا ہو سکتی ہے۔ قتل کے ساتھ ڈکیتی پر سیکشن 396 لاگو ہوتا ہے۔',
    example:
      'Six armed men looted a jewellery shop, and all were charged with dacoity under section 395 PPC.',
    category: 'Criminal',
    relatedTerms: ['Robbery', 'Theft', 'Murder'],
  },
  {
    term: 'Kidnapping',
    englishDefinition:
      'Unlawfully taking or enticing away a person, or confining a person, against their will. In Pakistan kidnapping is defined in sections 359 to 363 PPC; kidnapping for ransom is punished under section 365-A PPC, which carries life imprisonment or death.',
    urduExplanation:
      'اغوا سے مراد کسی شخص کو غیر قانونی طور پر لے جانا، ورغلانا یا اس کی مرضی کے خلاف قید کرنا ہے۔ پاکستان میں اغوا سیکشن 359 تا 363 پاکستان پینل کوڈ میں بیان کیا گیا ہے۔ تاوان کے لیے اغوا پر سیکشن 365-A کے تحت عمر قید یا سزائے موت دی جا سکتی ہے۔',
    example:
      'The police recovered the businessman and arrested three accused who had kidnapped him for ransom under section 365-A PPC.',
    category: 'Criminal',
    relatedTerms: ['Custody', 'Crime', 'Murder'],
  },
  {
    term: 'Defamation',
    englishDefinition:
      'Making or publishing a false statement that harms a person\'s reputation. In Pakistan defamation is defined in section 499 PPC and punished under section 500 PPC; civil remedies for defamation are also available, and truth published in the public good is a defence.',
    urduExplanation:
      'ہتکِ عزت سے مراد ایسا جھوٹا بیان بنانا یا شائع کرنا ہے جو کسی شخص کی عزت کو نقصان پہنچائے۔ پاکستان میں ہتکِ عزت سیکشن 499 پاکستان پینل کوڈ میں بیان کی گئی ہے اور سیکشن 500 کے تحت سزا دی جاتی ہے۔ اس کے لیے دیوانی دعویٰ بھی ممکن ہے اور عوامی مفاد میں سچ بیان کرنا دفاع ہو سکتا ہے۔',
    example:
      'The politician sued a newspaper for defamation after it published a false report alleging corruption, citing section 499 PPC and claiming damages.',
    category: 'Criminal',
    relatedTerms: ['Tort', 'Crime', 'Evidence'],
  },
  {
    term: 'Cheating',
    englishDefinition:
      'Dishonestly inducing a person to deliver property or consent to a transaction by deception. In Pakistan cheating is defined in section 415 PPC and punished under section 417 PPC; cheating and dishonestly inducing delivery of property is punished under section 420 PPC with up to seven years imprisonment and fine.',
    urduExplanation:
      'دھوکہ دہی سے مراد بدنیتی سے کسی شخص کو فریب دے کر جائیداد حوالے کرنے یا کسی معاملے پر رضامند کرنے پر آمادہ کرنا ہے۔ پاکستان میں یہ سیکشن 415 پاکستان پینل کوڈ میں بیان کی گئی ہے اور سیکشن 417 کے تحت سزا ہوتی ہے۔ سیکشن 420 کے تحت جائیداد حوالے کرانے والی دھوکہ دہی پر سات سال تک قید اور جرمانہ ہو سکتا ہے۔',
    example:
      'The accused took Rs. 2 million from the complainant on the promise of a plot that did not exist and was charged under section 420 PPC.',
    category: 'Criminal',
    relatedTerms: ['Crime', 'Theft', 'Contract'],
  },
  {
    term: 'Cybercrime',
    englishDefinition:
      'Offences committed through or against information systems, such as hacking, identity theft, online harassment, cyberstalking and dissemination of obscene material. In Pakistan cybercrime is prosecuted under the Prevention of Electronic Crimes Act, 2016 (PECA) before the relevant tribunal and special courts.',
    urduExplanation:
      'سائبر کرائم سے مراد معلوماتی نظام کے ذریعے یا اس کے خلاف کیے گئے جرائم ہیں، جیسے ہیکنگ، شناخت کی چوری، آن لائن ہراسانی، سائبر اسٹاکنگ اور فحش مواد پھیلانا۔ پاکستان میں ان جرائم پر Prevention of Electronic Crimes Act 2016 (PECA) کے تحت مخصوص ٹریبونل اور خصوصی عدالتوں میں کارروائی ہوتی ہے۔',
    example:
      'The accused was booked under PECA, 2016 for creating a fake social media profile to harass the complainant.',
    category: 'Criminal',
    relatedTerms: ['Crime', 'Defamation', 'Money Laundering'],
  },
  {
    term: 'Money Laundering',
    englishDefinition:
      'The process of concealing the origin of money obtained from crime so that it appears legitimate. In Pakistan money laundering is an offence under the Anti-Money Laundering Act, 2010, investigated by the FIA and prosecuted before special courts, with the Financial Monitoring Unit receiving suspicious transaction reports.',
    urduExplanation:
      'منی لانڈرنگ سے مراد مجرمانہ ذرائع سے حاصل شدہ رقم کی اصلیت چھپا کر اسے قانونی دکھانا ہے۔ پاکستان میں یہ Anti-Money Laundering Act 2010 کے تحت جرم ہے، جس کی تفتیش FIA کرتی ہے اور خصوصی عدالتیں سماعت کرتی ہیں۔ Financial Monitoring Unit مشکوک لین دین کی رپورٹس وصول کرتی ہے۔',
    example:
      'The FIA froze the bank accounts of a trader accused of laundering proceeds of smuggling under the Anti-Money Laundering Act, 2010.',
    category: 'Criminal',
    relatedTerms: ['Corruption', 'Cybercrime', 'Crime'],
  },
  {
    term: 'Corruption',
    englishDefinition:
      'Abuse of public office or entrusted power for private gain, including bribery, embezzlement and misuse of authority. In Pakistan corruption is prosecuted under the National Accountability Ordinance, 1999 and the Prevention of Corruption Act, 1947, with NAB and anti-corruption establishments as investigating agencies.',
    urduExplanation:
      'بدعنوانی سے مراد سرکاری عہدے یا سپرد اختیار کا ذاتی فائدے کے لیے غلط استعمال ہے، جس میں رشوت، خیانت اور اختیار کا ناجائز استعمال شامل ہیں۔ پاکستان میں بدعنوانی پر National Accountability Ordinance 1999 اور Prevention of Corruption Act 1947 کے تحت کارروائی ہوتی ہے اور NAB اور انسدادِ بدعنوانی ادارے تفتیش کرتے ہیں۔',
    example:
      'A government officer was arrested by NAB for accepting a bribe to approve a construction contract, an offence under the National Accountability Ordinance, 1999.',
    category: 'Criminal',
    relatedTerms: ['Money Laundering', 'Crime', 'Judicial Review'],
  },
  {
    term: 'Anti-Terrorism',
    englishDefinition:
      'The legal regime for offences involving terrorism, sectarian violence, targeted killings and attacks on law enforcement. In Pakistan it is governed by the Anti-Terrorism Act, 1997, with cases tried by Anti-Terrorism Courts and appeals to the High Court; the Act also provides for preventive detention and forfeiture of property.',
    urduExplanation:
      'انسدادِ دہشت گردی سے مراد دہشت گردی، فرقہ وارانہ تشدد، ٹارگٹ کلنگ اور قانون نافذ کرنے والے اداروں پر حملوں سے متعلق جرائم کا قانونی نظام ہے۔ پاکستان میں یہ Anti-Terrorism Act 1997 کے تحت آتا ہے، مقدمات انسدادِ دہشت گردی عدالتوں میں چلتے ہیں اور اپیل ہائی کورٹ میں ہوتی ہے۔ اس ایکٹ میں حفاظتی حراست اور جائیداد کی ضبطی کی گنجائش بھی ہے۔',
    example:
      'The accused were tried by an Anti-Terrorism Court under the Anti-Terrorism Act, 1997 for attacking a police checkpoint.',
    category: 'Criminal',
    relatedTerms: ['Crime', 'Preventive Detention', 'Appeal'],
  },
  {
    term: 'Fundamental Rights',
    englishDefinition:
      'The basic rights guaranteed to every citizen by Articles 8 to 28 of the Constitution of Pakistan, 1973, including equality, life and liberty, fair trial, freedom of speech, religion and movement. Any law inconsistent with these rights is void under Article 8, and they are enforced through writ petitions.',
    urduExplanation:
      'بنیادی حقوق سے مراد آئینِ پاکستان 1973 کے آرٹیکل 8 سے 28 تک ہر شہری کو دیے گئے بنیادی حقوق ہیں، جن میں مساوات، حیات و آزادی، منصفانہ مقدمہ، اظہارِ رائے، مذہب اور نقل و حرکت کی آزادی شامل ہیں۔ آرٹیکل 8 کے تحت ان حقوق سے متصادم قانون کالعدم ہوتا ہے اور ان کے نفاذ کے لیے رٹ پٹیشن دائر کی جاتی ہے۔',
    example:
      'The High Court struck down a rule that denied admission to a school on the basis of religion, holding it inconsistent with the fundamental rights guaranteed by the Constitution.',
    category: 'Constitutional',
    relatedTerms: ['Article', 'Writ Petition', 'Right to Life', 'Equality before Law'],
  },
  {
    term: 'Judicial Review',
    englishDefinition:
      'The power of courts to examine the legality and constitutionality of legislative and executive action. In Pakistan judicial review is exercised by High Courts under Article 199 and by the Supreme Court under Articles 184 and 185, and is a basic feature of the Constitution.',
    urduExplanation:
      'عدالتی نظرثانی سے مراد عدالتوں کا یہ اختیار ہے کہ وہ قانون سازی اور انتظامی اقدامات کی قانونی حیثیت اور آئینی مطابقت کا جائزہ لیں۔ پاکستان میں یہ اختیار ہائی کورٹ آرٹیکل 199 کے تحت اور سپریم کورٹ آرٹیکل 184 اور 185 کے تحت استعمال کرتی ہے۔ یہ آئین کی بنیادی خصوصیت ہے۔',
    example:
      'The Supreme Court exercised judicial review and declared the administrative notification invalid because it violated the Constitution.',
    category: 'Constitutional',
    relatedTerms: ['Writ Petition', 'Fundamental Rights', 'Article'],
  },
  {
    term: 'Right to Fair Trial',
    englishDefinition:
      'The right of every person to a fair and public hearing by a competent, independent and impartial court, including the right to be presumed innocent, to know the charge, to be represented and to cross-examine witnesses. It is guaranteed by Article 10-A of the Constitution of Pakistan, inserted by the 18th Amendment in 2010.',
    urduExplanation:
      'منصفانہ مقدمے کا حق ہر شخص کو یہ حق دیتا ہے کہ اس کا مقدمہ مجاز، آزاد اور غیر جانبدار عدالت میں منصفانہ اور کھلے طریقے سے سناجائے، جس میں بے گناہی کا مفروضہ، الزام کا علم، وکیل اور گواہوں سے جرح کا حق شامل ہے۔ یہ آرٹیکل 10-A آئینِ پاکستان میں 2010 کی 18ویں ترمیم کے ذریعے شامل کیا گیا۔',
    example:
      'The High Court set aside the conviction because the accused was not provided a lawyer, violating his right to fair trial under Article 10-A.',
    category: 'Constitutional',
    relatedTerms: ['Fundamental Rights', 'Article', 'Witness', 'Judicial Review'],
  },
  {
    term: 'Freedom of Speech',
    englishDefinition:
      'The right to freedom of expression and the press, guaranteed by Article 19 of the Constitution of Pakistan, subject to reasonable restrictions imposed by law in the interest of the glory of Islam, national security, public order, decency and morality. Article 19-A guarantees freedom of information.',
    urduExplanation:
      'اظہارِ رائے کی آزادی سے مراد تقریر اور پریس کی آزادی ہے جو آئینِ پاکستان کے آرٹیکل 19 میں ضمانت شدہ ہے، تاہم اسلام کی شان، قومی سلامتی، امنِ عامہ، اخلاق اور شائستگی کے مفاد میں قانونی معقول پابندیاں لگائی جا سکتی ہیں۔ آرٹیکل 19-A معلومات تک رسائی کی آزادی دیتا ہے۔',
    example:
      'A journalist challenged a ban on publishing a news report as a violation of freedom of speech under Article 19.',
    category: 'Constitutional',
    relatedTerms: ['Fundamental Rights', 'Article', 'Defamation'],
  },
  {
    term: 'Right to Life',
    englishDefinition:
      'The right to life and liberty guaranteed by Article 9 of the Constitution of Pakistan, interpreted by Pakistani courts to include the right to a healthy environment, clean water, dignity and basic necessities of life. Deprivation of life or liberty must be in accordance with law.',
    urduExplanation:
      'حقِ حیات سے مراد آرٹیکل 9 آئینِ پاکستان میں ضمانت شدہ زندگی اور آزادی کا حق ہے، جسے پاکستانی عدالتوں نے صحت مند ماحول، صاف پانی، عزتِ نفس اور زندگی کی بنیادی ضروریات تک پھیلایا ہے۔ زندگی یا آزادی سے محرومی صرف قانون کے مطابق ہو سکتی ہے۔',
    example:
      'The Supreme Court relied on Article 9 to order the supply of clean drinking water, holding that the right to life includes the right to a healthy environment.',
    category: 'Constitutional',
    relatedTerms: ['Fundamental Rights', 'Article', 'Habeas Corpus'],
  },
  {
    term: 'Preventive Detention',
    englishDefinition:
      'Detention of a person without trial to prevent a threat to public order or security. In Pakistan preventive detention is regulated by Article 10 of the Constitution, which requires that a detenu be informed of the grounds and produced before a review board within a prescribed period, and by special laws such as the Maintenance of Public Order Ordinance.',
    urduExplanation:
      'حفاظتی حراست سے مراد عوام کے امن یا سلامتی کو خطرے سے بچانے کے لیے بغیر مقدمہ کسی شخص کو حراست میں رکھنا ہے۔ پاکستان میں یہ آرٹیکل 10 آئین کے تحت طے ہوتی ہے جس کے مطابق حراست میں لیے گئے شخص کو وجوہات بتانا اور مقررہ مدت میں ریویو بورڈ کے سامنے پیش کرنا لازم ہے۔ اس کے علاوہ Maintenance of Public Order Ordinance جیسے قوانین بھی لاگو ہوتے ہیں۔',
    example:
      'The detenu challenged his detention under Article 10 on the ground that he was not informed of the grounds within the prescribed period.',
    category: 'Constitutional',
    relatedTerms: ['Habeas Corpus', 'Fundamental Rights', 'Anti-Terrorism'],
  },
  {
    term: 'Double Jeopardy',
    englishDefinition:
      'The protection against being prosecuted and punished twice for the same offence. Article 13 of the Constitution of Pakistan guarantees that no person shall be prosecuted or punished for an offence of which he has already been acquitted or convicted by a competent court.',
    urduExplanation:
      'دوہری سزا کے خلاف تحفظ سے مراد یہ ہے کہ کسی شخص کو ایک ہی جرم پر دو بار مقدمے یا سزا کا سامنا نہ کرنا پڑے۔ آرٹیکل 13 آئینِ پاکستان کی ضمانت ہے کہ جس جرم سے کوئی شخص مجاز عدالت سے بری یا سزا یافتہ ہو چکا ہو، اس پر دوبارہ کارروائی نہیں ہو سکتی۔',
    example:
      'The second FIR on the same facts was quashed because it violated the protection against double jeopardy under Article 13.',
    category: 'Constitutional',
    relatedTerms: ['Acquittal', 'Conviction', 'Fundamental Rights'],
  },
  {
    term: 'Writ of Mandamus',
    englishDefinition:
      'A writ commanding a public authority to perform a legal duty that it has refused or failed to perform. In Pakistan it is issued by a High Court under Article 199 of the Constitution and is available only where a clear legal duty exists and no other adequate remedy is available.',
    urduExplanation:
      'رٹ آف مینڈیمس ایک حکم ہے جس کے تحت کسی سرکاری ادارے کو اس کا قانونی فرض ادا کرنے کا کہا جاتا ہے جسے اس نے کرنے سے انکار کیا ہو یا نہ کیا ہو۔ پاکستان میں یہ ہائی کورٹ آرٹیکل 199 کے تحت جاری کرتی ہے اور یہ صرف اس وقت دستیاب ہے جب واضح قانونی فرض موجود ہو اور کوئی اور موثر علاج نہ ہو۔',
    example:
      'The High Court issued a writ of mandamus directing the municipal authority to repair the road after it ignored repeated requests.',
    category: 'Constitutional',
    relatedTerms: ['Writ Petition', 'Judicial Review', 'Jurisdiction'],
  },
  {
    term: 'Specific Performance',
    englishDefinition:
      'A decree requiring a party to perform its contractual obligation as agreed, rather than pay damages. In Pakistan specific performance is governed by the Specific Relief Act, 1877 and is discretionary; it is refused where damages are an adequate remedy or the contract is not capable of enforcement.',
    urduExplanation:
      'مخصوص تعمیل سے مراد عدالت کا ایسا حکم ہے جس میں فریق کو معاوضے کے بجائے معاہدے کے مطابق اپنی ذمہ داری پوری کرنے کا کہا جاتا ہے۔ پاکستان میں یہ Specific Relief Act 1877 کے تحت آتا ہے اور عدالت کی صوابدید پر منحصر ہے۔ جہاں معاوضہ کافی ہو یا معاہدہ نافذ کرنے کے قابل نہ ہو وہاں یہ حکم نہیں دیا جاتا۔',
    example:
      'The buyer sued for specific performance of an agreement to sell a plot after the seller refused to execute the sale deed.',
    category: 'Civil',
    relatedTerms: ['Contract', 'Decree', 'Injunction'],
  },
  {
    term: 'Mortgage',
    englishDefinition:
      'A transfer of an interest in immovable property as security for a loan or debt. In Pakistan mortgages are governed by the Transfer of Property Act, 1882 and the Registration Act, 1908; failure to pay may lead to sale of the mortgaged property through court proceedings.',
    urduExplanation:
      'رہن سے مراد قرض یا واجب الادا رقم کی ضمانت کے طور پر ناقابلِ منقول جائیداد میں حصہ منتقل کرنا ہے۔ پاکستان میں رہن Transfer of Property Act 1882 اور Registration Act 1908 کے تحت آتا ہے۔ رقم ادا نہ کرنے پر عدالتی کارروائی کے ذریعے رہن شدہ جائیداد فروخت کی جا سکتی ہے۔',
    example:
      'The bank granted a housing loan secured by a mortgage of the property, registered under the Registration Act, 1908.',
    category: 'Civil',
    relatedTerms: ['Contract', 'Decree', 'Jurisdiction'],
  },
  {
    term: 'Cheque Dishonour',
    englishDefinition:
      'The refusal of a bank to honour a cheque, usually for insufficient funds or a stop-payment instruction. In Pakistan dishonour of a cheque is a criminal offence under section 489-F PPC, punishable with imprisonment up to three years, or fine, or both, in addition to civil recovery of the amount.',
    urduExplanation:
      'چیک کے مسترد ہونے سے مراد بینک کا چیک کی ادائیگی سے انکار ہے، عام طور پر رقم ناکافی ہونے یا ادائیگی روکنے کی ہدایت کی وجہ سے۔ پاکستان میں چیک مسترد ہونا سیکشن 489-F پاکستان پینل کوڈ کے تحت مجرمانہ جرم ہے جس پر تین سال تک قید یا جرمانہ یا دونوں کی سزا ہو سکتی ہے، اس کے علاوہ رقم کی دیوانی وصولی بھی ممکن ہے۔',
    example:
      'The complainant filed an FIR under section 489-F PPC after the accused\'s cheque for Rs. 500,000 was dishonoured for insufficient funds.',
    category: 'Criminal',
    relatedTerms: ['Cheating', 'Contract', 'Crime'],
  },
  {
    term: 'Partnership',
    englishDefinition:
      'A relationship between two or more persons who agree to carry on a business and share its profits. In Pakistan partnerships are governed by the Partnership Act, 1932, which regulates the rights, duties and liabilities of partners and the dissolution of the firm.',
    urduExplanation:
      'شراکت داری سے مراد دو یا زیادہ افراد کے درمیان ایسا تعلق ہے جنہوں نے مل کر کاروبار کرنے اور منافع بانٹنے پر اتفاق کیا ہو۔ پاکستان میں شراکت داری Partnership Act 1932 کے تحت آتی ہے جو شراکت داروں کے حقوق، فرائض، ذمہ داریوں اور فرم کی تحلیل کو کنٹرول کرتا ہے۔',
    example:
      'The two brothers registered a partnership deed under the Partnership Act, 1932 to run their hardware business.',
    category: 'Civil',
    relatedTerms: ['Contract', 'Mortgage', 'Jurisdiction'],
  },
  {
    term: 'Will',
    englishDefinition:
      'A legal declaration by which a person provides for the distribution of his property after death. In Pakistan wills are governed by the Succession Act, 1925 for non-Muslims and by Islamic law for Muslims, under which a will (wasiyat) may dispose of at most one-third of the estate without the heirs\' consent.',
    urduExplanation:
      'وصیت سے مراد وہ قانونی اعلان ہے جس کے ذریعے کوئی شخص اپنی وفات کے بعد جائیداد کی تقسیم کا انتظام کرتا ہے۔ پاکستان میں غیر مسلموں کے لیے Succession Act 1925 اور مسلمانوں کے لیے اسلامی قانون لاگو ہے، جس کے مطابق وصیت وارثوں کی رضامندی کے بغیر زیادہ سے زیادہ ایک تہائی جائیداد میں کی جا سکتی ہے۔',
    example:
      'The deceased left a registered will bequeathing one-third of his property to a charity, which was given effect after his death.',
    category: 'Family',
    relatedTerms: ['Inheritance', 'Affidavit', 'Dower'],
  },
  {
    term: 'Inheritance',
    englishDefinition:
      'The devolution of a deceased person\'s property upon his legal heirs according to law. In Pakistan Muslim inheritance is governed by the Islamic law of succession, while non-Muslims are governed by the Succession Act, 1925; a succession certificate is often obtained to collect debts and securities.',
    urduExplanation:
      'وراثت سے مراد میت کی جائیداد کا قانون کے مطابق اس کے قانونی وارثوں میں منتقل ہونا ہے۔ پاکستان میں مسلمانوں کی وراثت اسلامی قانونِ وراثت کے تحت اور غیر مسلموں کی Succession Act 1925 کے تحت ہوتی ہے۔ قرضوں اور سیکیورٹیز کی وصولی کے لیے عموماً succession certificate حاصل کیا جاتا ہے۔',
    example:
      'After the father\'s death, the family obtained a succession certificate to transfer the bank deposits to the legal heirs.',
    category: 'Family',
    relatedTerms: ['Will', 'Dower', 'Maintenance'],
  },
];

/**
 * Seed the Legal Dictionary.
 * @param {{ onlyIfEmpty?: boolean }} options
 * @returns {Promise<{ seeded: number, skipped: boolean, total: number }>}
 */
const seedDictionary = async ({ onlyIfEmpty = false } = {}) => {
  const existing = await LegalTerm.countDocuments();

  if (onlyIfEmpty && existing > 0) {
    return { seeded: 0, skipped: true, total: existing };
  }

  await LegalTerm.deleteMany({});
  const inserted = await LegalTerm.insertMany(LEGAL_TERMS, { ordered: false });

  return { seeded: inserted.length, skipped: false, total: inserted.length };
};

const runStandalone = async () => {
  try {
    await connectDB();
    const result = await seedDictionary();
    console.log(`✅ Legal dictionary seeded with ${result.seeded} terms.`);
    await mongoose.connection.close();
    await require('../config/db').stopDB();
    process.exit(0);
  } catch (error) {
    console.error(`❌ Dictionary seeding failed: ${error.message}`);
    process.exit(1);
  }
};

if (require.main === module) {
  runStandalone();
}

module.exports = { LEGAL_TERMS, seedDictionary };
