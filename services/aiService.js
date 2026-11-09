const Groq = require('groq-sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');

const getAIProvider = () => String(process.env.AI_PROVIDER || 'kie').trim().toLowerCase();

const generateAIResponse = async (prompt, context, options = {}) => {
  // Callers may pin a provider (e.g. Legal Drafting prefers Groq when a
  // GROQ_API_KEY is present) without changing the global AI_PROVIDER.
  const provider = String(options.provider || getAIProvider()).trim().toLowerCase();

  // ==========================================
  // 1. GEMINI PROVIDER
  // ==========================================
  if (provider === 'gemini') {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured.');
    }

    const apiKey = process.env.GEMINI_API_KEY.trim();
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: options.temperature ?? 0.2,
        maxOutputTokens: options.maxTokens ?? 1000,
      },
    });
    
    const userQuestion = options.userPrompt || 'Please summarize the context.';
    
    const result = await model.generateContent(
      `System Instruction: ${prompt}\n\nContext:\n${context || ''}\n\nUser Question: ${userQuestion}\n\nAnswer based only on the provided context.`
    );
    const text = result.response?.text?.().trim();
    if (!text) throw new Error('Gemini returned an empty completion.');
    return text;
  }

  // ==========================================
  // 2. GROQ PROVIDER
  // ==========================================
  if (provider === 'groq') {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is not configured.');
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const messages = [
      {
        role: 'system',
        content: `${prompt}\n\nContext:\n${String(context || '').trim()}`,
      },
      { role: 'user', content: String(options.userPrompt || '').trim() || String(context || '').trim() },
    ];

    const completion = await groq.chat.completions.create({
      model: options.model || 'openai/gpt-oss-120b',
      temperature: options.temperature ?? 0.2,
      max_tokens: options.maxTokens ?? 1000,
      messages,
    });
    const text = completion.choices[0]?.message?.content?.trim();
    if (!text) throw new Error('Groq returned an empty completion.');
    return text;
  }

  // ==========================================
  // 3. KIE.AI PROVIDER
  // ==========================================
  if (provider === 'kie') {
    if (!process.env.KIE_API_KEY) {
      throw new Error('KIE_API_KEY is not configured.');
    }

    const kie = new OpenAI({
      apiKey: process.env.KIE_API_KEY,
      baseURL: process.env.KIE_BASE_URL || 'https://api.kie.ai/v1',
    });
    
    const messages = [
      {
        role: 'system',
        content: `${prompt}\n\nContext:\n${context || ''}`,
      },
      { role: 'user', content: String(options.userPrompt || context || prompt) },
    ];

    try {
      const completion = await kie.chat.completions.create({
        model: options.model || process.env.KIE_MODEL || 'gpt-4o', 
        temperature: options.temperature ?? 0.2,
        max_tokens: options.maxTokens ?? 1000,
        messages,
      });

      if (!completion || !completion.choices || !completion.choices[0]) {
        console.error("Kie.ai Raw Response:", JSON.stringify(completion));
        throw new Error('Kie.ai returned an unexpected response format.');
      }

      const text = completion.choices[0].message?.content?.trim();
      if (!text) throw new Error('Kie.ai returned an empty completion.');
      return text;

    } catch (error) {
      console.error("Kie.ai API Error Details:", error.response ? error.response.data : error.message);
      throw new Error(`Kie.ai Error: ${error.message}`);
    }
  }

  throw new Error(`Unsupported AI_PROVIDER "${provider}". Use "gemini", "groq", or "kie".`);
};

module.exports = { generateAIResponse, getAIProvider };