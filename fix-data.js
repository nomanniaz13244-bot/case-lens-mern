require('dotenv').config();

const mongoose = require('mongoose');
const LegalCase = require('./models/LegalCase');

const cleanText = (value) => String(value || '')
  .replace(/\u0000/g, '')
  .replace(/\s+/g, ' ')
  .trim();

const makeTitle = (legalCase, fullText) => {
  const citation = cleanText(legalCase.citation);
  const words = fullText.split(/\s+/).filter(Boolean).slice(0, 10).join(' ');

  if (/^Imported Case|Not available$/i.test(citation)) {
    return words ? `${words}${fullText.split(/\s+/).length > 10 ? '...' : ''}` : 'Untitled Legal Case';
  }

  return words ? `${citation} - ${words}${fullText.split(/\s+/).length > 10 ? '...' : ''}` : citation || 'Untitled Legal Case';
};

const main = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not configured in the backend .env file.');
  }

  await mongoose.connect(process.env.MONGO_URI);

  const cases = await LegalCase.find({
    fullText: { $exists: true, $nin: ['', null] },
  }).limit(20);

  let updated = 0;
  for (const legalCase of cases) {
    const fullText = cleanText(legalCase.fullText);
    if (!fullText) continue;

    const summary = fullText.slice(0, 500);
    const caseTitle = makeTitle(legalCase, fullText);

    await LegalCase.updateOne(
      { _id: legalCase._id },
      { $set: { caseTitle, summary, fullText } }
    );
    updated += 1;
  }

  console.log(`✅ Successfully updated ${updated} cases.`);
};

main()
  .catch((error) => {
    console.error('Data update failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
