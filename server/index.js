const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');
const natural = require('natural');
const nlp = require('compromise');
const fs = require('fs').promises;
const path = require('path');
const { spawn } = require("child_process");


const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
// app.use('/screenshots', express.static(path.join(__dirname, 'screenshots')));

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

// Dark pattern detection patterns
const darkPatterns = {
  urgency: [
    'limited time', 'hurry', 'act now', 'expires soon', 'only today',
    'last chance', 'don\'t miss out', 'time is running out', 'urgent',
    'immediate', 'now or never', 'deadline', 'expires in', 'ends soon'
  ],
  scarcity: [
    'only.*left', 'limited stock', 'almost sold out', 'few remaining',
    'running low', 'in high demand', 'limited quantity', 'exclusive',
    'rare opportunity', 'limited availability', 'while supplies last',
    'only.*available', 'selling fast'
  ],
  confirmShaming: [
    'no thanks', 'i don\'t want', 'skip this offer', 'maybe later',
    'i\'ll pass', 'not interested', 'continue without', 'decline',
    'i don\'t need', 'no, i prefer', 'i\'m not ready'
  ],
  defaultOptIns: [
    'subscribe', 'newsletter', 'updates', 'promotional', 'marketing',
    'special offers', 'notifications', 'alerts', 'emails'
  ]
};

// NLP sentiment analyzer
// Tokenizer and NLP sentiment analyzer (use 'afinn' lexicon)
const tokenizer = new natural.WordTokenizer();
const analyzer = new natural.SentimentAnalyzer('English', natural.PorterStemmer, 'afinn');

// Optional: helper to compute sentiment when needed
function getSentimentScore(text) {
  const tokens = tokenizer.tokenize(text || '');
  return analyzer.getSentiment(tokens);
}

// Screenshot directory
// const screenshotDir = path.join(__dirname, 'screenshots');

// // Ensure screenshot directory exists
// async function ensureScreenshotDir() {
//   try {
//     await fs.access(screenshotDir);
//   } catch {
//     await fs.mkdir(screenshotDir, { recursive: true });
//   }
// }

// Analyze text for dark patterns
function analyzeTextForPatterns(text) {
  const results = {
    urgency: [],
    scarcity: [],
    confirmShaming: [],
    defaultOptIns: []
  };

  const lowerText = text.toLowerCase();

  // Check for each pattern type
  Object.keys(darkPatterns).forEach(patternType => {
    darkPatterns[patternType].forEach(pattern => {
      const regex = new RegExp(pattern, 'gi');
      const matches = lowerText.match(regex);
      if (matches) {
        results[patternType].push(...matches);
      }
    });
  });

  return results;
}

// Extract persuasive language using NLP
function extractPersuasiveLanguage(text) {
  const doc = nlp(text);
  
  // Extract emotional words
  const emotionalWords = doc.match('#Adjective').out('array');

  // Extract action verbs (call-to-action indicators)
  const actionVerbs = doc.match('#Verb').out('array')
    .filter(verb => ['buy', 'get', 'claim', 'grab', 'secure', 'order', 'purchase'].includes(verb.toLowerCase()));

  // Extract superlatives
  const superlatives = doc.match('#Superlative').out('array');

  return {
    emotionalWords,
    actionVerbs,
    superlatives
  };
}

// Main scraping and analysis function
async function scrapeAndAnalyze(url) {
  let browser;
  try {
    // await ensureScreenshotDir();
    
browser = await puppeteer.launch({
  headless: 'new', //  run in visible mode to bypass bot detection
  executablePath: '/usr/bin/google-chrome',
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-blink-features=AutomationControlled',
    '--disable-features=IsolateOrigins,site-per-process',
    '--ignore-certificate-errors',
    '--window-size=1920,1080'
  ]
});

    
    const page = await browser.newPage();
    // Anti-bot evasion setup
await page.evaluateOnNewDocument(() => {
  Object.defineProperty(navigator, 'webdriver', { get: () => false });
  Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
  Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
  Object.defineProperty(navigator, 'platform', { get: () => 'Win32' });
});

await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');

await page.setViewport({ width: 1920, height: 1080 });

try {
  console.log(`Navigating to: ${url}`);
  await page.goto(url, {
    waitUntil: 'load', // Better for dynamic sites
    timeout: 120000
  });

  // Wait a few seconds for dynamic content
  await new Promise(resolve => setTimeout(resolve, 5000));
} catch (err) {
  console.error('Navigation failed:', err.message);

  // Retry once if the first attempt fails
  try {
    console.log('Retrying navigation...');
    await page.reload({ waitUntil: 'load', timeout: 60000 });
    await new Promise(resolve => setTimeout(resolve, 5000));
  } catch (retryErr) {
    throw new Error(`Navigation to ${url} failed: ${retryErr.message}`);
  }
}
    
    // Navigate to the URL
    // await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Take screenshot
    // const timestamp = Date.now();
    // const screenshotPath = path.join(screenshotDir, `screenshot-${timestamp}.png`);
    // await page.screenshot({ path: screenshotPath, fullPage: true });
    
    // Extract DOM content
    const domData = await page.evaluate(() => {
      // Get all text content
      const textContent = document.body.innerText || '';
      
      // Get all button texts
      const buttons = Array.from(document.querySelectorAll('button, input[type="submit"], input[type="button"], .btn, [role="button"]'))
        .map(btn => btn.innerText || btn.value || btn.getAttribute('aria-label') || '')
        .filter(text => text.trim());
      
      // Get form elements (for default opt-ins detection)
      const formElements = Array.from(document.querySelectorAll('input[type="checkbox"], input[type="radio"]'))
        .map(input => ({
          type: input.type,
          checked: input.checked,
          label: input.labels?.[0]?.innerText || '',
          name: input.name || '',
          value: input.value || ''
        }));
      
      // Get modal/popup content
      const modals = Array.from(document.querySelectorAll('[class*="modal"], [class*="popup"], [class*="overlay"], [role="dialog"]'))
        .map(modal => modal.innerText || '')
        .filter(text => text.trim());
      
      // Get promotional banners
      const banners = Array.from(document.querySelectorAll('[class*="banner"], [class*="promo"], [class*="offer"], [class*="deal"]'))
        .map(banner => banner.innerText || '')
        .filter(text => text.trim());
      
      return {
        textContent,
        buttons,
        formElements,
        modals,
        banners,
        title: document.title,
        url: window.location.href
      };
    });
    
    // Combine all text for analysis
    const allText = [
      domData.textContent,
      ...domData.buttons,
      ...domData.modals,
      ...domData.banners
    ].join(' ');
    
    // Analyze for dark patterns
    const darkPatternResults = analyzeTextForPatterns(allText);
    
    // Extract persuasive language
    const persuasiveLanguage = extractPersuasiveLanguage(allText);
    
    // Calculate scores
    const patternScores = {
      urgency: Math.min(darkPatternResults.urgency.length * 20, 100),
      scarcity: Math.min(darkPatternResults.scarcity.length * 25, 100),
      confirmShaming: Math.min(darkPatternResults.confirmShaming.length * 30, 100),
      defaultOptIns: domData.formElements.filter(el => el.checked && el.type === 'checkbox').length * 40
    };
    
    // Calculate overall risk score
    const totalPatterns = Object.values(darkPatternResults).flat().length;
    const checkedByDefault = domData.formElements.filter(el => el.checked && el.type === 'checkbox').length;
    
let riskLevel = 'undetermined';
let overallScore = 0; // will be updated later after ML scoring

    
    // Generate insights
    const insights = [];
    if (darkPatternResults.urgency.length > 0) {
      insights.push(`Found ${darkPatternResults.urgency.length} urgency-based phrases that may pressure users into quick decisions.`);
    }
    if (darkPatternResults.scarcity.length > 0) {
      insights.push(`Detected ${darkPatternResults.scarcity.length} scarcity indicators that may create false sense of limited availability.`);
    }
    if (darkPatternResults.confirmShaming.length > 0) {
      insights.push(`Identified ${darkPatternResults.confirmShaming.length} instances of confirm shaming in decline options.`);
    }
    if (checkedByDefault > 0) {
      insights.push(`Found ${checkedByDefault} checkboxes pre-selected by default, potentially leading to unwanted subscriptions.`);
    }
    
return {
  url: domData.url,
  title: domData.title,
  overallScore,
  riskLevel,
  darkPatterns: darkPatternResults,
  persuasiveLanguage,
  patternScores,
  insights,
  domData: {
    textContent: domData.textContent,
    buttons: domData.buttons,
    formElements: domData.formElements,
    modals: domData.modals,
    banners: domData.banners
  },
  analysis: {
    totalPatterns,
    checkedByDefault,
    textLength: allText.length
  }
};

    
  } catch (error) {
    console.error('Scraping error:', error);
    throw new Error(`Failed to analyze website: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// API endpoint for website analysis
app.post("/api/analyze", async (req, res) => {
  try {
    const { url, text } = req.body;
    console.log("Analyzing:", url);

   console.log(`[${new Date().toISOString()}] Starting analysis for:`, url);
   const startTime = Date.now();
 
    // Perform scraping and rule-based analysis
    const results = await scrapeAndAnalyze(url);

    console.log(`[${new Date().toISOString()}] Scraping completed in ${Date.now() - startTime} ms`);


// === Integrate Python Multi-Pattern ML Model ===
try {
  const { exec } = require("child_process");
  const scriptPath = path.join(__dirname, "ml", "predict.py");

  const inputText =
    (text && text.trim()) ||
    (results.domData && results.domData.textContent
      ? results.domData.textContent.slice(0, 2000)
      : "");

  if (!inputText || inputText.length === 0) {
    results.mlPrediction = { error: "No text to analyze" };
  } else {
    const command = `python3 "${scriptPath}" "${inputText.replace(/"/g, '\\"')}"`;
    console.log("Sending text to ML model...");
    const mlStart = Date.now();
    const mlResult = await new Promise((resolve, reject) => {


      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error("Python error:", stderr);
          return reject(new Error("ML prediction failed"));
        }
        try {
          const parsed = JSON.parse(stdout);
          resolve(parsed);
        } catch (err) {
          console.error("JSON parse error:", stdout);
          reject(new Error("Invalid ML output"));
        }
      });
    });

    console.log(`[${new Date().toISOString()}] ML prediction finished in ${Date.now() - mlStart} ms`);


    // === Handle multi-label predictions ===
    if (
      mlResult &&
      mlResult.mlPrediction &&
      Array.isArray(mlResult.mlPrediction.detectedPatterns)
    ) {
      const detectedPatterns = mlResult.mlPrediction.detectedPatterns;
      results.mlPrediction = mlResult.mlPrediction;

      detectedPatterns.forEach((pattern) => {
        const key = pattern.toLowerCase().replace(/\s+/g, "");
        if (!results.darkPatterns[key]) results.darkPatterns[key] = [];
        results.darkPatterns[key].push("ML-detected pattern");

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
  console.error("ML prediction failed:", mlErr.message);
  results.mlPrediction = { error: "Failed to classify" };
}


    // === Dynamic overall scoring ===
const weights = {
  urgency: 1.2,           // Moderate manipulation
  scarcity: 1.4,          // Creates false limitation
  confirmShaming: 1.8,    // Strong coercion
  defaultOptIns: 1.6      // Violates consent
};

// Calculate total weighted risk based on pattern count
const totalPatterns = Object.entries(results.darkPatterns)
  .reduce((sum, [type, matches]) => {
    const weight = weights[type] || 1;
    return sum + matches.length * weight;
  }, 0);

// Normalization factor (more patterns = lower trust score)
const normalizationFactor = Math.min(totalPatterns / 10, 1); // capped at 1 for ≥10 patterns

// ML confidence boost (if available)
let mlBoost = 1.0;
if (results.mlPrediction && results.mlPrediction.confidence) {
  mlBoost += Math.min(results.mlPrediction.confidence / 2, 0.5); // up to +0.5 boost
}

// Adjusted text complexity (less text = stronger impact)
const textFactor = Math.max(0.7, 1 - results.analysis.textLength / 8000);

//Final overall trust score (1–5)
results.overallScore = Math.max(
  1,
  Math.min(
    5,
    5 - (normalizationFactor * 4 * mlBoost * textFactor)
  )
);

//Risk level classification
if (results.overallScore < 2) {
  results.riskLevel = "high";
} else if (results.overallScore < 3.5) {
  results.riskLevel = "medium";
} else {
  results.riskLevel = "low";
}

console.log(`[${new Date().toISOString()}] Analysis finished in ${Date.now() - startTime} ms total.`);

    // === Final API Response ===
    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("Error in /api/analyze:", error);
    res.status(500).json({ success: false, error: "Analysis failed" });
  }
});



const { execFile } = require('child_process');

// === Python ML Prediction Integration ===

// === Python ML helper function ===
// Helper: call Python predict.py for ML classification
function getMLPrediction(text) {
  const scriptPath = path.join(__dirname, 'ml', 'predict.py');

  return new Promise((resolve, reject) => {
    execFile('python3', [scriptPath, text], (error, stdout, stderr) => {
      if (error) {
        console.error('Python error:', stderr || error.message);
        return reject(new Error('ML prediction failed'));
      }
      try {
        const result = JSON.parse(stdout);
        resolve(result);
      } catch (err) {
        console.error('JSON parse error from Python:', stdout);
        reject(new Error('Invalid response from Python script'));
      }
    });
  });
}


// === ML Prediction API ===
app.post("/api/predict", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    // Run the Python prediction script
    const { exec } = require("child_process");
    const path = require("path");

    const scriptPath = path.join(__dirname, "ml", "predict.py");
    const command = `python3 "${scriptPath}" "${text.replace(/"/g, '\\"')}"`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error("Python error:", stderr);
        return res.status(500).json({ error: "Prediction failed" });
      }
      try {
        const result = JSON.parse(stdout);
        res.json(result);
      } catch (parseError) {
        console.error("Parse error:", parseError);
        res.status(500).json({ error: "Invalid Python output" });
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Dark Pattern Detection Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});



module.exports = app;


