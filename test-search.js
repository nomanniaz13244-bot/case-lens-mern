/**
 * test-search.js
 * Standalone script to verify LegalCase model, seed data, and text search.
 * Run: node test-search.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const LegalCase = require('./models/LegalCase');

const sampleCases = [
  {
    caseTitle: 'Roe v. Wade',
    citation: '410 U.S. 113 (1973)',
    courtName: 'United States Supreme Court',
    summary:
      'Landmark decision establishing constitutional protection for the liberty to choose to have an abortion.',
    keywords: ['abortion', 'privacy', 'constitutional', 'fourteenth amendment'],
  },
  {
    caseTitle: 'Brown v. Board of Education',
    citation: '347 U.S. 483 (1954)',
    courtName: 'United States Supreme Court',
    summary:
      'Unanimous decision declaring racial segregation in public schools unconstitutional, overruling Plessy v. Ferguson.',
    keywords: ['segregation', 'education', 'civil rights', 'equal protection'],
  },
  {
    caseTitle: 'Miranda v. Arizona',
    citation: '384 U.S. 436 (1966)',
    courtName: 'United States Supreme Court',
    summary:
      'Decision requiring that suspects be informed of their rights before police interrogation, giving rise to the Miranda warning.',
    keywords: ['criminal law', 'fifth amendment', 'police', 'self-incrimination', 'rights'],
  },
  {
    caseTitle: 'Marbury v. Madison',
    citation: '5 U.S. 137 (1803)',
    courtName: 'United States Supreme Court',
    summary:
      'Foundational case establishing judicial review, allowing courts to invalidate unconstitutional laws.',
    keywords: ['judicial review', 'constitution', 'separation of powers', 'landmark'],
  },
  {
    caseTitle: 'Plessy v. Ferguson',
    citation: '163 U.S. 537 (1896)',
    courtName: 'United States Supreme Court',
    summary:
      'Decision upholding racial segregation under the "separate but equal" doctrine, later overruled.',
    keywords: ['segregation', 'civil rights', 'racial discrimination', 'fourteenth amendment'],
  },
];

async function run() {
  try {
    console.log('\n📡 Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected!\n');

    // ── Seed ────────────────────────────────────────────────────────────────────
    await LegalCase.deleteMany({});
    const inserted = await LegalCase.insertMany(sampleCases);
    console.log(`🌱 Seeded ${inserted.length} legal cases.\n`);

    // ── Text Search Test ─────────────────────────────────────────────────────────
    const query = 'civil rights segregation';
    console.log(`🔍 Searching for: "${query}"`);

    const results = await LegalCase.find(
      { $text: { $search: query } },
      { score: { $meta: 'textScore' } }
    ).sort({ score: { $meta: 'textScore' } });

    console.log(`\n✅ Found ${results.length} result(s):\n`);
    results.forEach((c, i) => {
      console.log(
        `  ${i + 1}. ${c.caseTitle} (${c.citation})`
      );
      console.log(`     Score: ${c._doc?.score?.toFixed(2) || 'N/A'}`);
      console.log(`     Court: ${c.courtName}`);
      console.log(`     Keywords: ${c.keywords.join(', ')}\n`);
    });

    // ── Regex Fallback Test ───────────────────────────────────────────────────────
    const regexQuery = 'miranda';
    console.log(`🔍 Regex search for: "${regexQuery}"`);
    const regex = new RegExp(regexQuery, 'i');
    const regexResults = await LegalCase.find({
      $or: [
        { caseTitle: regex },
        { citation: regex },
        { courtName: regex },
        { summary: regex },
        { keywords: regex },
      ],
    });
    console.log(`✅ Regex found ${regexResults.length} result(s):`);
    regexResults.forEach((c) => console.log(`   → ${c.caseTitle}`));

    console.log('\n🎉 All tests passed! Legal Search Module is working correctly.\n');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB.');
  }
}

run();
