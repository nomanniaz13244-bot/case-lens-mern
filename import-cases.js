require('dotenv').config();

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const csv = require('csv-parser');
const LegalCase = require('./models/LegalCase');

const CSV_FILE = path.join(__dirname, 'pak_cases.csv');
const BATCH_SIZE = 500;

const cleanText = (value) => String(value || '').replace(/\0/g, '').trim();

const splitKeywords = (value) => {
  const keywords = cleanText(value).split(/[,;|]/);
  return [...new Set(keywords.map((keyword) => keyword.trim()).filter(Boolean))];
};

const readCsv = () => new Promise((resolve, reject) => {
  const rows = [];

  fs.createReadStream(CSV_FILE)
    .pipe(csv())
    .on('data', (row) => rows.push(row))
    .on('end', () => resolve(rows))
    .on('error', reject);
});

const main = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not configured in the backend .env file.');
  }

  if (!fs.existsSync(CSV_FILE)) {
    throw new Error(`CSV file not found: ${CSV_FILE}`);
  }

  await mongoose.connect(process.env.MONGO_URI);
  const rows = await readCsv();
  const citationCounts = new Map();
  const cases = [];
  let skipped = 0;

  rows.forEach((row, index) => {
    const caseTitle = cleanText(row.caseTitle || row['Case Title']);
    const courtName = cleanText(row.courtName || row['Court Name']) || 'Supreme Court of Pakistan';
    const summary = cleanText(row.summary || row['Summary'] || row.fullText || row['Full Text']);

    if (!caseTitle || !summary) {
      skipped += 1;
      return;
    }

    let citation = cleanText(row.citation || row.Citation);
    if (!citation) {
      citation = `Imported Case ${index + 1}`;
    }

    const count = citationCounts.get(citation) || 0;
    citationCounts.set(citation, count + 1);
    if (count > 0) {
      citation = `${citation} (${count + 1})`;
    }

    cases.push({
      caseTitle,
      citation,
      courtName,
      summary,
      fullText: cleanText(row.fullText || row['Full Text']),
      keywords: splitKeywords(row.keywords || row.Keywords),
      caseType: cleanText(row.caseType || row['Case Type']) || 'General',
      verdict: cleanText(row.verdict || row.Verdict),
    });
  });

  let imported = 0;
  for (let offset = 0; offset < cases.length; offset += BATCH_SIZE) {
    const batch = cases.slice(offset, offset + BATCH_SIZE);
    try {
      const result = await LegalCase.insertMany(batch, { ordered: false });
      imported += result.length;
    } catch (error) {
      if (error.insertedDocs) {
        imported += error.insertedDocs.length;
      } else if (typeof error.insertedCount === 'number') {
        imported += error.insertedCount;
      }
      console.error(`Batch ${Math.floor(offset / BATCH_SIZE) + 1} had errors:`, error.message);
    }
  }

  console.log(`✅ Successfully imported ${imported} cases.`);
  if (skipped > 0) {
    console.log(`Skipped ${skipped} invalid rows without a case title or summary.`);
  }
};

main()
  .catch((error) => {
    console.error('Import failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
