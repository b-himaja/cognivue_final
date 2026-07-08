require('dotenv').config();
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const express = require('express');
const cors = require('cors');
const natural = require('natural');
const nlp = require('compromise');
const path = require('path');
const { execFile } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

// ─── Dark pattern keyword lists ───────────────────────────────────────────────
const darkPatterns = {
  urgency: [
    // time pressure
    'limited time', 'hurry', 'act now', 'expires soon', 'only today',
    'last chance', "don't miss out", 'time is running out', 'urgent',
    'now or never', 'deadline', 'expires in', 'ends soon',
    'flash sale', 'today only', 'sale ends', 'offer ends', 'offer expires',
    "don't wait", 'while it lasts', 'limited period', 'selling out',
    'ends tonight', 'ends at midnight', 'ends in',
    // countdown-style
    '\\d+\\s*(hours?|hrs?|mins?|minutes?|seconds?|days?)\\s*(left|only|remaining)',
    'only\\s*\\d+\\s*(hours?|hrs?|mins?|days?)\\s*(left|remaining)',
  ],
  scarcity: [
    // stock warnings
    'only.*left', 'limited stock', 'almost sold out', 'few remaining',
    'running low', 'in high demand', 'limited quantity', 'limited availability',
    'while supplies last', 'only.*available', 'selling fast',
    'almost gone', 'going fast', 'low stock', 'last one', 'last few',
    '\\d+\\s*left in stock', '\\d+\\s*remaining',
    // social scarcity
    '\\d+\\s*people (are )?(viewing|watching|looking)',
    '\\d+\\s*(sold|bought) (in|within) (the )?(last|past)',
    '\\d+\\s*watching', 'popular item', 'high demand',
    'others are looking', 'in \\d+ carts?',
  ],
  confirmShaming: [
    "no thanks", "i don't want", 'skip this offer', 'maybe later',
    "i'll pass", 'not interested', 'continue without', 'decline',
    "i don't need", "no, i prefer", "i'm not ready",
    'no,? i.{0,30}(full price|more|without|miss)',
    "i don't want to save", "i'll miss out", 'no deal',
    'i prefer to pay more', 'no, i hate',
  ],
  defaultOptIns: [
    // manipulative pre-selection language
    'pre-?selected', 'automatically enrolled', 'already signed up',
    'opt out to cancel', 'uncheck to opt out', 'checked by default',
    'will be auto.{0,10}renew', 'auto-?renew', 'autorenewal',
    'unless you cancel', 'cancel anytime',
  ],
};

// ─── NLP setup ────────────────────────────────────────────────────────────────
const tokenizer = new natural.WordTokenizer();
const analyzer = new natural.SentimentAnalyzer('English', natural.PorterStemmer, 'afinn');

function getSentimentScore(text) {
  const tokens = tokenizer.tokenize(text || '');
  return analyzer.getSentiment(tokens);
}

// ─── Rule-based pattern detection ─────────────────────────────────────────────
function analyzeTextForPatterns(text) {
  const results = {
    urgency: [],
    scarcity: [],
    confirmShaming: [],
    defaultOptIns: [],
  };

  const lowerText = text.toLowerCase();

  Object.keys(darkPatterns).forEach(patternType => {
    const seen = new Set();
    darkPatterns[patternType].forEach(pattern => {
      const regex = new RegExp(pattern, 'gi');
      const matches = lowerText.match(regex);
      if (matches) {
        matches.forEach(m => {
          const key = m.toLowerCase();
          if (!seen.has(key)) {
            seen.add(key);
            results[patternType].push(m);
          }
        });
      }
    });
  });

  return results;
}

// ─── NLP persuasive language extraction ───────────────────────────────────────
function extractPersuasiveLanguage(text) {
  const doc = nlp(text);
  const emotionalWords = doc.match('#Adjective').out('array');
  const actionVerbs = doc.match('#Verb').out('array')
    .filter(v => ['buy', 'get', 'claim', 'grab', 'secure', 'order', 'purchase'].includes(v.toLowerCase()));
  const superlatives = doc.match('#Superlative').out('array');
  return { emotionalWords, actionVerbs, superlatives };
}

// ─── Bot-block detection ──────────────────────────────────────────────────────
const BLOCK_PAGE_PATTERNS = [
  /something went wrong/i,
  /please contact your administrator/i,
  /access denied/i,
  /access to this page has been denied/i,
  /are you a human/i,
  /unusual traffic/i,
  /verify you are a human/i,
  /captcha/i,
  /request blocked/i,
  /reference id/i,
];

function isBlockPage(text, domData) {
  const trimmed = (text || '').trim();
  if (trimmed.length < 500 && BLOCK_PAGE_PATTERNS.some(p => p.test(trimmed))) return true;
  if (trimmed.length < 100 && domData.buttons.length === 0 && domData.formElements.length === 0) return true;
  return false;
}

// ─── Scraping ─────────────────────────────────────────────────────────────────
async function scrapeAndAnalyze(url) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      ...(process.env.PUPPETEER_EXECUTABLE_PATH && { executablePath: process.env.PUPPETEER_EXECUTABLE_PATH }),
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process',
        '--ignore-certificate-errors',
        '--window-size=1920,1080',
      ],
    });

    const page = await browser.newPage();

    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    );
    await page.setViewport({ width: 1920, height: 1080 });

    // Extra headers to look like a real browser
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    });

    try {
      console.log(`Navigating to: ${url}`);
      await page.goto(url, { waitUntil: 'load', timeout: 120000 });
      await new Promise(resolve => setTimeout(resolve, 5000));
    } catch (err) {
      console.error('Navigation failed:', err.message);
      try {
        console.log('Retrying navigation...');
        await page.reload({ waitUntil: 'load', timeout: 60000 });
        await new Promise(resolve => setTimeout(resolve, 5000));
      } catch (retryErr) {
        throw new Error(`Navigation to ${url} failed: ${retryErr.message}`);
      }
    }

    const domData = await page.evaluate(() => {
      const textContent = document.body.innerText || '';

      // Buttons — broader selector set
      const buttons = Array.from(document.querySelectorAll(
        'button, input[type="submit"], input[type="button"], ' +
        '.btn, [role="button"], a.button, [class*="btn-"], [class*="-btn"], ' +
        '[class*="cta"], [class*="add-to-cart"], [class*="buy-now"], ' +
        '[class*="checkout"], [class*="purchase"]'
      )).map(el => el.innerText || el.value || el.getAttribute('aria-label') || '')
        .filter(t => t.trim());

      // Modals — broader + site-specific selectors
      const modals = Array.from(document.querySelectorAll(
        '[class*="modal"], [class*="popup"], [class*="overlay"], [role="dialog"], ' +
        '[class*="dialog"], [class*="lightbox"], [class*="toast"], ' +
        '#a-popover, [id*="modal"], [id*="popup"], [id*="dialog"], ' +
        '[class*="drawer"], [class*="sheet"]'
      )).map(el => el.innerText || '')
        .filter(t => t.trim());

      // Banners — broader + urgency/scarcity specific selectors
      const banners = Array.from(document.querySelectorAll(
        '[class*="banner"], [class*="promo"], [class*="offer"], [class*="deal"], ' +
        '[class*="notification"], [class*="alert"], [class*="ribbon"], ' +
        '[class*="badge"], [class*="sale"], [class*="flash"], ' +
        '[class*="countdown"], [class*="timer"], [class*="stock"], ' +
        '[class*="availability"], [class*="urgency"], [class*="scarcity"], ' +
        '[id*="banner"], [id*="promo"], [id*="countdown"], [id*="timer"]'
      )).map(el => el.innerText || '')
        .filter(t => t.trim());

      // High-signal short text nodes (prices, stock labels, badges)
      const shortLabels = Array.from(document.querySelectorAll(
        '[class*="price"], [class*="discount"], [class*="save"], ' +
        '[class*="label"], [class*="tag"], [class*="chip"], ' +
        '[class*="delivery"], [class*="shipping"], [class*="free"]'
      )).map(el => el.innerText || '')
        .filter(t => t.trim() && t.length < 200);

      const formElements = Array.from(document.querySelectorAll(
        'input[type="checkbox"], input[type="radio"]'
      )).map(input => ({
        type: input.type,
        checked: input.checked,
        label: input.labels?.[0]?.innerText || '',
        name: input.name || '',
        value: input.value || '',
      }));

      return {
        textContent,
        buttons,
        formElements,
        modals,
        banners,
        shortLabels,
        title: document.title,
        url: window.location.href,
      };
    });

    const allText = [
      domData.textContent,
      ...domData.buttons,
      ...domData.modals,
      ...domData.banners,
      ...domData.shortLabels,
    ].join(' ');

    console.log(`[SCRAPE] textLength=${allText.length} buttons=${domData.buttons.length} banners=${domData.banners.length} modals=${domData.modals.length} shortLabels=${domData.shortLabels.length}`);
    console.log(`[SCRAPE] textSample=${allText.slice(0, 300).replace(/\n/g, ' ')}`);

    if (isBlockPage(allText, domData)) {
      console.warn(`[SCRAPE] Detected bot-protection block page for ${url}`);
      throw new Error('BLOCKED_BY_SITE');
    }

    const darkPatternResults = analyzeTextForPatterns(allText);
    console.log(`[RULES] urgency=${darkPatternResults.urgency.length} scarcity=${darkPatternResults.scarcity.length} confirmShaming=${darkPatternResults.confirmShaming.length} defaultOptIns=${darkPatternResults.defaultOptIns.length}`);
    const persuasiveLanguage = extractPersuasiveLanguage(allText);
    const checkedByDefault = domData.formElements.filter(el => el.checked && el.type === 'checkbox').length;

    // patternScores used for UI display — defaultOptIns uses checkbox count
    const patternScores = {
      urgency: Math.min(darkPatternResults.urgency.length * 20, 100),
      scarcity: Math.min(darkPatternResults.scarcity.length * 25, 100),
      confirmShaming: Math.min(darkPatternResults.confirmShaming.length * 30, 100),
      defaultOptIns: Math.min(
        darkPatternResults.defaultOptIns.length * 25 + checkedByDefault * 40,
        100
      ),
    };

    const totalPatterns = Object.values(darkPatternResults).flat().length;

    const insights = buildInsights(darkPatternResults, checkedByDefault);

    return {
      url: domData.url,
      title: domData.title,
      overallScore: 0,
      riskLevel: 'undetermined',
      darkPatterns: darkPatternResults,
      persuasiveLanguage,
      patternScores,
      insights,
      domData: {
        textContent: domData.textContent,
        buttons: domData.buttons,
        formElements: domData.formElements,
        modals: domData.modals,
        banners: domData.banners,
        shortLabels: domData.shortLabels,
      },
      analysis: { totalPatterns, checkedByDefault, textLength: allText.length },
    };

  } catch (error) {
    console.error('Scraping error:', error);
    throw new Error(`Failed to analyze website: ${error.message}`);
  } finally {
    if (browser) await browser.close();
  }
}

// ─── ML helper ────────────────────────────────────────────────────────────────
function runMLPrediction(inputText) {
  const scriptPath = path.join(__dirname, 'ml', 'predict.py');
  return new Promise((resolve, reject) => {
    execFile('python3', [scriptPath, inputText], (error, stdout, stderr) => {
      if (error) {
        console.error('Python error:', stderr);
        return reject(new Error('ML prediction failed'));
      }
      try {
        resolve(JSON.parse(stdout));
      } catch (err) {
        console.error('JSON parse error:', stdout);
        reject(new Error('Invalid ML output'));
      }
    });
  });
}

// ─── Shared scoring logic ─────────────────────────────────────────────────────
function buildInsights(darkPatternResults, checkedByDefault) {
  const insights = [];
  if (darkPatternResults.urgency.length > 0)
    insights.push(`Found ${darkPatternResults.urgency.length} urgency-based phrases that may pressure users into quick decisions.`);
  if (darkPatternResults.scarcity.length > 0)
    insights.push(`Detected ${darkPatternResults.scarcity.length} scarcity indicators that may create a false sense of limited availability.`);
  if (darkPatternResults.confirmShaming.length > 0)
    insights.push(`Identified ${darkPatternResults.confirmShaming.length} instances of confirm shaming in decline options.`);
  if (checkedByDefault > 0)
    insights.push(`Found ${checkedByDefault} checkbox(es) pre-selected by default, potentially leading to unwanted subscriptions.`);
  if (darkPatternResults.defaultOptIns.length > 0)
    insights.push(`Detected ${darkPatternResults.defaultOptIns.length} auto-renewal or default opt-in phrase(s).`);
  return insights;
}

// ─── /api/analyze ─────────────────────────────────────────────────────────────
app.post('/api/analyze', async (req, res) => {
  try {
    const { url, text, textOnly } = req.body;
    const startTime = Date.now();

    let results;
    let inputText;

    if (textOnly && text && text.trim()) {
      // ── Text-only mode: skip scraping, analyse the provided text directly ──
      console.log('Text-only analysis mode');
      const darkPatternResults = analyzeTextForPatterns(text);
      console.log(`[RULES] urgency=${darkPatternResults.urgency.length} scarcity=${darkPatternResults.scarcity.length} confirmShaming=${darkPatternResults.confirmShaming.length} defaultOptIns=${darkPatternResults.defaultOptIns.length}`);
      const persuasiveLanguage = extractPersuasiveLanguage(text);
      const patternScores = {
        urgency:        Math.min(darkPatternResults.urgency.length * 20, 100),
        scarcity:       Math.min(darkPatternResults.scarcity.length * 25, 100),
        confirmShaming: Math.min(darkPatternResults.confirmShaming.length * 30, 100),
        defaultOptIns:  Math.min(darkPatternResults.defaultOptIns.length * 25, 100),
      };
      results = {
        url: url || 'text-analysis',
        title: 'Text Analysis',
        overallScore: 0,
        riskLevel: 'undetermined',
        darkPatterns: darkPatternResults,
        persuasiveLanguage,
        patternScores,
        insights: buildInsights(darkPatternResults, 0),
        domData: { textContent: text, buttons: [], formElements: [], modals: [], banners: [], shortLabels: [] },
        analysis: { totalPatterns: Object.values(darkPatternResults).flat().length, checkedByDefault: 0, textLength: text.length },
      };
      inputText = text.slice(0, 2000);
    } else {
      // ── Normal scraping mode ──────────────────────────────────────────────
      console.log('Analyzing:', url);
      results = await scrapeAndAnalyze(url);
      console.log(`[${new Date().toISOString()}] Scraping completed in ${Date.now() - startTime} ms`);

      const uiText = [
        ...results.domData.buttons,
        ...results.domData.banners,
        ...results.domData.modals,
        ...results.domData.shortLabels,
      ].filter(Boolean).join(' ');
      inputText = (text && text.trim()) ||
        (uiText.length > 0 ? uiText.slice(0, 2000) : results.domData.textContent.slice(0, 500));
    }

    try {
      if (!inputText || inputText.length === 0) {
        results.mlPrediction = { error: 'No text to analyze' };
      } else {
        console.log(`[ML] inputLength=${inputText.length} sample="${inputText.slice(0, 200).replace(/\n/g,' ')}"`);
        console.log('Sending text to ML model...');
        const mlStart = Date.now();
        const mlResult = await runMLPrediction(inputText);
        console.log(`[${new Date().toISOString()}] ML prediction finished in ${Date.now() - mlStart} ms`);
        console.log(`[ML] result=${JSON.stringify(mlResult?.mlPrediction?.detectedPatterns)}`);

        if (mlResult?.mlPrediction && Array.isArray(mlResult.mlPrediction.detectedPatterns)) {
          const detectedPatterns = mlResult.mlPrediction.detectedPatterns;
          results.mlPrediction = mlResult.mlPrediction;

          detectedPatterns.forEach(pattern => {
            const key = pattern.toLowerCase().replace(/\s+/g, '');
            if (!results.darkPatterns[key]) results.darkPatterns[key] = [];
            results.darkPatterns[key].push('ML-detected pattern');
            results.insights.push(`⚡ ML Model detected a "${pattern}" dark pattern.`);
            results.patternScores[key] = (results.patternScores[key] || 0) + 25;
          });

          results.analysis.totalPatterns = Object.values(results.darkPatterns)
            .reduce((sum, arr) => sum + arr.length, 0);
        } else {
          results.mlPrediction = { detectedPatterns: [] };
        }
      }
    } catch (mlErr) {
      console.error('ML prediction failed:', mlErr.message);
      results.mlPrediction = { error: 'Failed to classify' };
    }

    // ─── Scoring ──────────────────────────────────────────────────────────────
    // Weights for rule-based categories
    const weights = {
      urgency: 1.2,
      scarcity: 1.4,
      confirmShaming: 1.8,
      defaultOptIns: 1.6,
      // ML-detected categories
      socialproof: 1.1,
      misdirection: 1.5,
      obstruction: 1.7,
      sneaking: 1.9,
    };

    const totalWeightedPatterns = Object.entries(results.darkPatterns)
      .reduce((sum, [type, matches]) => {
        const weight = weights[type] || 1.0;
        return sum + matches.length * weight;
      }, 0);

    const normalizationFactor = Math.min(totalWeightedPatterns / 10, 1);

    // mlBoost only applies when ML actually detected dark patterns with confidence
    let mlBoost = 1.0;
    if (
      results.mlPrediction?.detectedPatterns?.length > 0 &&
      results.mlPrediction?.confidences
    ) {
      const detectedConfidences = results.mlPrediction.detectedPatterns
        .map(p => results.mlPrediction.confidences[p] || 0)
        .filter(c => c > 0);
      if (detectedConfidences.length > 0) {
        const avgConfidence = detectedConfidences.reduce((a, b) => a + b, 0) / detectedConfidences.length;
        mlBoost += Math.min(avgConfidence / 2, 0.5);
      }
    }

    results.overallScore = Math.max(1, Math.min(5, 5 - normalizationFactor * 4 * mlBoost));

    if (results.overallScore < 2) results.riskLevel = 'high';
    else if (results.overallScore < 3.5) results.riskLevel = 'medium';
    else results.riskLevel = 'low';

    console.log(`[${new Date().toISOString()}] Analysis finished in ${Date.now() - startTime} ms total.`);
    res.json({ success: true, data: results });

  } catch (error) {
    console.error('Error in /api/analyze:', error);
    if (error.message.includes('BLOCKED_BY_SITE')) {
      return res.status(200).json({
        success: false,
        error: 'This site appears to be blocking automated access (bot/WAF protection). Cognivue could not retrieve real page content to analyze.',
      });
    }
    res.status(500).json({ success: false, error: 'Analysis failed' });
  }
});

// ─── /api/predict ─────────────────────────────────────────────────────────────
app.post('/api/predict', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });
    const result = await runMLPrediction(text);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Dark Pattern Detection Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
