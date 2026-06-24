// Using native global fetch available in Node v18+

// Local mock data templates for when no AI API keys are configured
const MOCK_CATEGORIES = [
  { keywords: ['uber', 'cab', 'taxi', 'train', 'flight', 'ola', 'rapido', 'bus', 'metro', 'petrol', 'fuel'], category: 'travel' },
  { keywords: ['food', 'grocery', 'swiggy', 'zomato', 'restaurant', 'cafe', 'starbucks', 'diner', 'pizza', 'burger', 'supermarket', 'walmart', 'mcdonald'], category: 'food' },
  { keywords: ['amazon', 'shopping', 'clothes', 'shoes', 'electronics', 'target', 'myntra', 'flipkart', 'mall'], category: 'shopping' },
  { keywords: ['netflix', 'movie', 'spotify', 'hulu', 'disney', 'game', 'arcade', 'concert', 'theater'], category: 'entertainment' },
  { keywords: ['rent', 'electricity', 'water', 'bill', 'mobile', 'internet', 'gas', 'insurance', 'recharge'], category: 'bills' },
  { keywords: ['doctor', 'hospital', 'pharmacy', 'medical', 'medicine', 'dentist', 'clinic'], category: 'health' },
  { keywords: ['book', 'school', 'course', 'udemy', 'coursera', 'college', 'tuition', 'class'], category: 'education' }
];

const LOCALIZED_TEMPLATES = {
  English: {
    overspent: "You have spent {total} which exceeds your budget of {budget} by {over}. Try tracking small expenses to stay on target.",
    underbudget: "Great job! You spent {total} out of your {budget} budget. You are on track to save {saved} this month.",
    insight: "Your spending on {topCategory} is changing. This month you spent ${currentVal}, which is {comparison} your trailing 3-month average of ${avgVal}. Action: Consider scaling back on {topCategory} by {suggestion}.",
    suggestions: {
      food: ["cooking at home more often", "limiting restaurant deliveries and using meal plans"],
      travel: ["using public transit where possible", "combining errands to reduce fuel consumption"],
      shopping: ["implementing a 48-hour wait rule before non-essential purchases", "looking for discount coupons and seasonal sales"],
      bills: ["checking subscriptions and cancelling unused ones", "optimizing utility usage to lower monthly charges"],
      entertainment: ["hosting game nights at home instead of expensive outings", "looking for free local community events"],
      health: ["using generic medications when approved", "comparing pharmacy prices before buying"],
      education: ["utilizing free online courses and library resources", "sharing book purchases with classmates"],
      other: ["reviewing miscellaneous costs", "monitoring cash withdrawals and categorizing them"]
    },
    goalPlanner: "To reach your goal '{name}' by {date}, you need to save ${weekly} weekly. Try reducing your {cutCategory} budget by cooking at home or canceling unused subscriptions.",
    report: "Total spend is ${total} vs ${budget} budget. Your highest category was {topCategory} at ${topAmt} ({share}% of total). This is ${diffType} than last month's total of ${prevTotal} by ${diffAmt}. Suggestions: 1. Try {sug1}. 2. Try {sug2}."
  },
  Hindi: {
    overspent: "आपने {total} खर्च किए हैं जो आपके {budget} के बजट से {over} अधिक है। लक्ष्य पर बने रहने के लिए छोटे खर्चों पर ध्यान दें।",
    underbudget: "बहुत बढ़िया! आपने अपने {budget} के बजट में से {total} खर्च किए। आप इस महीने {saved} बचाने की राह पर हैं।",
    insight: "आपके {topCategory} पर खर्च करने का तरीका बदल रहा है। इस महीने आपने ₹{currentVal} खर्च किए, जो आपके 3 महीने के औसत ₹{avgVal} से {comparison} है। सुझाव: {suggestion} द्वारा {topCategory} पर खर्च कम करने का प्रयास करें।",
    suggestions: {
      food: ["घर पर अधिक बार खाना बनाना", "बाहर से खाना मंगाने की सीमा तय करना"],
      travel: ["सार्वजनिक परिवहन का उपयोग करना", "पेट्रोल बचाने के लिए यात्राओं को मिलाना"],
      shopping: ["खरीदारी से पहले 48 घंटे का नियम लागू करना", "छूट और सेल का लाभ उठाना"],
      bills: ["सदस्यताओं की जांच करना और अनुपयोगी को बंद करना", "बिजली-पानी का विवेकपूर्ण उपयोग करना"],
      entertainment: ["घर पर गेम नाइट्स आयोजित करना", "मुफ़्त सामुदायिक आयोजनों में जाना"],
      health: ["सस्ती जेनरिक दवाओं का उपयोग करना", "दवाओं के दामों की तुलना करना"],
      education: ["मुफ़्त ऑनलाइन कोर्सेस का उपयोग करना", "पुस्तकालय से पुस्तकें लेना"],
      other: ["विविध खर्चों की समीक्षा करना", "नकद खर्चों को ट्रैक करना"]
    },
    goalPlanner: "लक्ष्य '{name}' को {date} तक पाने के लिए, आपको साप्ताहिक ₹{weekly} बचाने होंगे। अपने {cutCategory} खर्चों को कम करने का प्रयास करें।",
    report: "कुल खर्च ₹{total} है बनाम ₹{budget} का बजट। आपका सबसे बड़ा खर्च {topCategory} में ₹{topAmt} ({share}%) रहा। यह पिछले महीने के ₹{prevTotal} से ₹{diffAmt} {diffType} है। सुझाव: 1. {sug1} का प्रयास करें। 2. {sug2}।"
  },
  Tamil: {
    overspent: "நீங்கள் {total} செலவழித்துள்ளீர்கள், இது உங்கள் பட்ஜெட்டான {budget}-ஐ விட {over} அதிகம். பட்ஜெட்டுக்குள் இருக்க சிறிய செலவுகளை கண்காணியுங்கள்.",
    underbudget: "நன்று! உங்கள் பட்ஜெட்டான {budget}-ல் {total} மட்டுமே செலவழித்துள்ளீர்கள். இந்த மாதம் {saved}-ஐ சேமிக்க முடியும்.",
    insight: "உங்கள் {topCategory} செலவு முறை மாறுகிறது. இந்த மாதம் நீங்கள் {currentVal} செலவழித்துள்ளீர்கள், இது உங்கள் 3 மாத சராசரியான {avgVal}-ஐ விட {comparison} ஆகும். ஆலோசனைகள்: {suggestion} மூலம் {topCategory} செலவை குறையுங்கள்.",
    suggestions: {
      food: ["வீட்டில் சமைத்து சாப்பிடுவது", "ஹோட்டல் உணவுகளை ஆர்டர் செய்வதை குறைப்பது"],
      travel: ["பொது போக்குவரத்தைப் பயன்படுத்துவது", "பயணங்களை ஒருங்கிணைப்பது"],
      shopping: ["தேவையற்ற பொருட்களை வாங்குவதற்கு முன் 48 மணிநேரம் யோசிப்பது", "தள்ளுபடிகளை பயன்படுத்துவது"],
      bills: ["தேவையற்ற சந்தாக்களை ரத்து செய்வது", "மின்சார பயன்பாட்டை சேமிப்பது"],
      entertainment: ["வெளிநாடுகளில் செலவழிப்பதை விடுத்து வீட்டில் பொழுதுபோக்குவது", "இலவச உள்ளூர் நிகழ்வுகளில் பங்கேற்பது"],
      health: ["ஜெனரிக் மருந்துகளைப் பயன்படுத்துவது", "மருந்துகளின் விலையை ஒப்பிடுவது"],
      education: ["இலவச ஆன்லைன் கல்விப் பொருட்களைப் பயன்படுத்துவது", "புத்தகங்களை பகிர்ந்து படிப்பது"],
      other: ["இதர செலவுகளை மதிப்பீடு செய்வது", "சில்லறை செலவுகளைக் கண்காணிப்பது"]
    },
    goalPlanner: "உங்கள் இலக்கான '{name}'-ஐ {date}-க்குள் அடைய, வாரம் {weekly} சேமிக்க வேண்டும். {cutCategory}-ல் செலவைக் குறைக்க முயலுங்கள்.",
    report: "மொத்த செலவு {total} (பட்ஜெட் {budget}). அதிகபட்சமாக {topCategory}-ல் {topAmt} ({share}%) செலவாகியுள்ளது. இது சென்ற மாத செலவு {prevTotal}-ஐ விட {diffAmt} {diffType} ஆகும். பரிந்துரைகள்: 1. {sug1}. 2. {sug2}."
  },
  Telugu: {
    overspent: "మీరు {total} ఖర్చు చేశారు, ఇది మీ బడ్జెట్ {budget} కంటే {over} ఎక్కువ. బడ్జెట్‌లో ఉండటానికి చిన్న ఖర్చులను గమనించండి.",
    underbudget: "చాలా బాగుంది! మీ బడ్జెట్ {budget} లో {total} మాత్రమే ఖర్చు చేశారు. ఈ నెలలో మీరు {saved} ఆదా చేసే మార్గంలో ఉన్నారు.",
    insight: "మీ {topCategory} ఖర్చులు మారుతున్నాయి. ఈ నెలలో మీరు ఖర్చు చేసిన {currentVal}, మీ 3 నెలల సగటు {avgVal} తో పోలిస్తే {comparison}. సూచన: {suggestion} ద్వారా {topCategory} పై ఖర్చులు తగ్గించండి.",
    suggestions: {
      food: ["ఇంట్లోనే ఎక్కువగా వండుకోవడం", "హోటల్ ఆర్డర్లను పరిమితం చేయడం"],
      travel: ["వీలైనంత వరకు ప్రజా రవాణాను ఉపయోగించడం", "ఇంధన ఖర్చులను ఆదా చేయడం"],
      shopping: ["కొనుగోలు చేయడానికి ముందు 48 గంటలు వేచి ఉండటం", "డిస్కౌంట్ కూపన్లను ఉపయోగించడం"],
      bills: ["ఉపయోగించని సబ్‌స్క్రిప్షన్లను రద్దు చేయడం", "కరెంటు బిల్లులను తగ్గించడం"],
      entertainment: ["ఖరీదైన ప్రయాణాలకు బదులు ఇంట్లోనే సమయం గడపడం", "ఉచిత కార్యక్రమాలకు వెళ్లడం"],
      health: ["జెనరిక్ మందులను వాడటం", "మందుల ధరలను సరిపోల్చడం"],
      education: ["ఉచిత ఆన్‌లైన్ కోర్సులను ఉపయోగించడం", "పుస్తకాలను పంచుకోవడం"],
      other: ["ఇతర చిన్న ఖర్చులను సమీక్షించడం", "నగదు ఖర్చులను రాయడం"]
    },
    goalPlanner: "మీ లక్ష్యం '{name}' ను {date} నాటికి చేరడానికి, వారానికి {weekly} ఆదా చేయాలి. మీ {cutCategory} ఖర్చులను తగ్గించుకోవడానికి ప్రయత్నించండి.",
    report: "మొత్తం ఖర్చు {total} (బడ్జెట్ {budget}). అత్యధికంగా {topCategory} లో {topAmt} ({share}%) ఖర్చయింది. ఇది గత నెల మొత్తం {prevTotal} కంటే {diffAmt} {diffType}. సూచనలు: 1. {sug1}. 2. {sug2}."
  }
};

// Map categories to user-friendly translation labels
const CATEGORY_TRANSLATIONS = {
  English: { food: 'Food', travel: 'Travel', shopping: 'Shopping', bills: 'Bills', entertainment: 'Entertainment', health: 'Health', education: 'Education', other: 'Other' },
  Hindi: { food: 'भोजन', travel: 'यात्रा', shopping: 'खरीदारी', bills: 'बिल', entertainment: 'मनोरंजन', health: 'स्वास्थ्य', education: 'शिक्षा', other: 'अन्य' },
  Tamil: { food: 'உணவு', travel: 'பயணம்', shopping: 'ஷாப்பிங்', bills: 'பில்கள்', entertainment: 'பொழுதுபோக்கு', health: 'சுகாதாரம்', education: 'கல்வி', other: 'இதர' },
  Telugu: { food: 'ఆహారం', travel: 'ప్రయాణం', shopping: 'షాపింగ్', bills: 'బిల్లులు', entertainment: 'వినోదం', health: 'ఆరోగ్యం', education: 'విద్య', other: 'ఇతర' }
};

const COMPARE_TRANSLATIONS = {
  English: { higher: 'higher than', lower: 'lower than', increase: 'more', decrease: 'less' },
  Hindi: { higher: 'अधिक', lower: 'कम', increase: 'अधिक', decrease: 'कम' },
  Tamil: { higher: 'அதிகம்', lower: 'குறைவு', increase: 'அதிகம்', decrease: 'குறைவு' },
  Telugu: { higher: 'ఎక్కువ', lower: 'తక్కువ', increase: 'ఎక్కువ', decrease: 'తక్కువ' }
};

// Determine default category locally based on note text
function localCategorize(merchantOrNote, amount) {
  const note = (merchantOrNote || '').toLowerCase();
  for (const item of MOCK_CATEGORIES) {
    for (const keyword of item.keywords) {
      if (note.includes(keyword)) {
        return item.category;
      }
    }
  }
  return 'other';
}

// Call Gemini API directly via fetch
async function callGemini(prompt, jsonMode = false) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Gemini API key missing');

  // Using gemini-1.5-flash for speed and reliability
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      ...(jsonMode ? {
        generationConfig: {
          responseMimeType: "application/json"
        }
      } : {})
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API Error: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty response from Gemini API');
  return text.trim();
}

// Call OpenAI Chat Completion via fetch
async function callOpenAI(prompt, jsonMode = false) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OpenAI API key missing');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      ...(jsonMode ? { response_format: { type: "json_object" } } : {})
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI API Error: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim();
}

// Call Anthropic Claude Message API via fetch
async function callClaude(prompt) {
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) throw new Error('Claude API key missing');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Claude API Error: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text?.trim();
}

// Main helper to query active LLM or fall back
async function askAI(prompt, jsonMode = false) {
  // Priority: Gemini -> OpenAI -> Claude
  if (process.env.GEMINI_API_KEY) {
    try {
      return await callGemini(prompt, jsonMode);
    } catch (e) {
      console.warn('Gemini failed, trying backup...', e.message);
    }
  }
  if (process.env.OPENAI_API_KEY) {
    try {
      return await callOpenAI(prompt, jsonMode);
    } catch (e) {
      console.warn('OpenAI failed, trying backup...', e.message);
    }
  }
  if (process.env.CLAUDE_API_KEY) {
    try {
      return await callClaude(prompt);
    } catch (e) {
      console.warn('Claude failed...', e.message);
    }
  }
  throw new Error('No AI provider available or all attempts failed. Falling back to local mock API.');
}

module.exports = {
  // 1. Categorization API
  categorizeExpense: async (merchantOrNote, amount) => {
    const cleanNote = (merchantOrNote || '').trim();
    const prompt = `You are an expense categorizer. Given a merchant name or note and an amount, return ONLY a JSON object: {"category": "<one of: food, travel, shopping, bills, entertainment, health, education, other>"}.
Input: "${cleanNote}"
Amount: ${amount}`;

    try {
      const responseText = await askAI(prompt, true);
      const parsed = JSON.parse(responseText);
      if (parsed.category) return parsed;
      throw new Error('Invalid JSON format returned by AI');
    } catch (error) {
      console.log('AI categorization fallback engaged for:', cleanNote);
      return { category: localCategorize(cleanNote, amount) };
    }
  },

  // 2. Trend Insights API
  generateTrendInsights: async (trendJson, language = 'English') => {
    const lang = LOCALIZED_TEMPLATES[language] ? language : 'English';
    const prompt = `You are a friendly personal finance coach. Given this month's spending by category and the trailing 3-month average for each category, write a 2-3 sentence insight in ${lang} describing how the user's behavior is changing (not just current numbers). Mention one specific number and one actionable suggestion.

Data: ${JSON.stringify(trendJson)}`;

    try {
      return await askAI(prompt, false);
    } catch (error) {
      // Local Mock trend generator
      const templates = LOCALIZED_TEMPLATES[lang];
      const categoriesMap = CATEGORY_TRANSLATIONS[lang];
      const comparisonWord = lang === 'English' ? 'above' : (lang === 'Hindi' ? 'अधिक' : (lang === 'Tamil' ? 'விட அதிகம்' : 'కంటే ఎక్కువ'));
      
      // Calculate top spending category or difference
      let topCategory = 'food';
      let currentVal = 120;
      let avgVal = 100;
      
      try {
        const data = trendJson;
        if (data && data.length > 0) {
          // Sort by difference
          const sorted = [...data].sort((a,b) => (b.current - b.avg3Month) - (a.current - a.avg3Month));
          if (sorted[0]) {
            topCategory = sorted[0].category;
            currentVal = Math.round(sorted[0].current);
            avgVal = Math.round(sorted[0].avg3Month);
          }
        }
      } catch (e) {}
      
      const translatedCat = categoriesMap[topCategory] || topCategory;
      const suggestions = templates.suggestions[topCategory] || templates.suggestions.other;
      const suggestion = suggestions[0];
      
      let insightText = templates.insight
        .replace(/{topCategory}/g, translatedCat)
        .replace(/{currentVal}/g, currentVal)
        .replace(/{avgVal}/g, avgVal)
        .replace(/{comparison}/g, comparisonWord)
        .replace(/{suggestion}/g, suggestion);
        
      return insightText;
    }
  },

  // 3. Monthly Report API
  generateMonthlyReport: async (spendingJson, budget, language = 'English') => {
    const lang = LOCALIZED_TEMPLATES[language] ? language : 'English';
    const prompt = `You are a personal finance advisor. Given this month's spending data (grouped by category, with totals, and last month's totals for comparison), write a short report in ${lang}:
1. One sentence on total spend vs budget.
2. Identify the single highest-spending category and its % share.
3. Compare with last month (higher/lower, by how much).
4. Give 2 specific, practical suggestions to reduce spending — tied to the actual top category, not generic advice.
Keep it under 80 words, warm and non-judgmental in tone.

Budget: ${budget}
Data: ${JSON.stringify(spendingJson)}`;

    try {
      return await askAI(prompt, false);
    } catch (error) {
      // Local Mock report generator
      const templates = LOCALIZED_TEMPLATES[lang];
      const categoriesMap = CATEGORY_TRANSLATIONS[lang];
      const compareMap = COMPARE_TRANSLATIONS[lang];
      
      let total = 0;
      let prevTotal = 0;
      let topCategory = 'food';
      let topAmt = 0;
      
      try {
        total = Math.round(spendingJson.totalThisMonth || 0);
        prevTotal = Math.round(spendingJson.totalLastMonth || 0);
        
        const categories = spendingJson.categories || {};
        for (const cat in categories) {
          if (categories[cat] > topAmt) {
            topAmt = categories[cat];
            topCategory = cat;
          }
        }
      } catch (e) {}
      
      const share = total > 0 ? Math.round((topAmt / total) * 100) : 0;
      const diffAmt = Math.abs(total - prevTotal);
      const isHigher = total > prevTotal;
      const diffType = isHigher ? compareMap.higher : compareMap.lower;
      
      const transCategory = categoriesMap[topCategory] || topCategory;
      const suggestions = templates.suggestions[topCategory] || templates.suggestions.other;
      const sug1 = suggestions[0] || "cutting down";
      const sug2 = suggestions[1] || "creating alerts";
      
      let reportText = templates.report
        .replace(/{total}/g, total)
        .replace(/{budget}/g, budget)
        .replace(/{topCategory}/g, transCategory)
        .replace(/{topAmt}/g, Math.round(topAmt))
        .replace(/{share}/g, share)
        .replace(/{diffType}/g, diffType)
        .replace(/{prevTotal}/g, prevTotal)
        .replace(/{diffAmt}/g, diffAmt)
        .replace(/{sug1}/g, sug1)
        .replace(/{sug2}/g, sug2);
        
      return reportText;
    }
  },

  // 4. Savings Goal Planner API
  generateGoalSavingsAdvice: async (goalJson, spendingJson, language = 'English') => {
    const lang = LOCALIZED_TEMPLATES[language] ? language : 'English';
    const prompt = `Given a savings goal (target amount, target date) and the user's average monthly spending by category, suggest a realistic weekly saving amount and one specific category where they could cut back. Respond in ${lang}, under 40 words.

Goal: ${JSON.stringify(goalJson)}
Spending: ${JSON.stringify(spendingJson)}`;

    try {
      return await askAI(prompt, false);
    } catch (error) {
      // Local Mock goal planner
      const templates = LOCALIZED_TEMPLATES[lang];
      const categoriesMap = CATEGORY_TRANSLATIONS[lang];
      
      let name = goalJson.name || 'savings';
      let target = goalJson.target_amount || 1000;
      let date = goalJson.target_date || 'next year';
      
      // Calculate weeks until target date
      let weeks = 12;
      try {
        const tDate = new Date(date);
        const today = new Date();
        const diffTime = Math.abs(tDate - today);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        weeks = Math.ceil(diffDays / 7) || 12;
      } catch (e) {}
      
      const weekly = Math.round(target / weeks);
      
      // Pick a category to cut back based on spending
      let cutCategory = 'shopping';
      let maxAmt = 0;
      try {
        for (const item of (spendingJson || [])) {
          if (item.amount > maxAmt && item.category !== 'bills' && item.category !== 'health') {
            maxAmt = item.amount;
            cutCategory = item.category;
          }
        }
      } catch(e){}
      
      const transCategory = categoriesMap[cutCategory] || cutCategory;
      
      let plannerText = templates.goalPlanner
        .replace(/{name}/g, name)
        .replace(/{date}/g, date)
        .replace(/{weekly}/g, weekly)
        .replace(/{cutCategory}/g, transCategory);
        
      return plannerText;
    }
  },

  // 5. OCR Receipt Parser
  parseReceiptOcr: async (ocrText) => {
    const prompt = `You are a receipt parser. Given the following OCR text from a receipt, extract:
1. The merchant or store name.
2. The total amount spent (as a float).
3. The category (one of: food, travel, shopping, bills, entertainment, health, education, other).

Return ONLY a JSON object: {"merchant": "<name>", "amount": <amount>, "category": "<category>"}. If you cannot find any, make a best guess or leave default.

OCR Text:
"${ocrText}"`;

    try {
      const responseText = await askAI(prompt, true);
      const parsed = JSON.parse(responseText);
      return {
        merchant: parsed.merchant || 'Receipt Upload',
        amount: parseFloat(parsed.amount) || 0.0,
        category: parsed.category || 'other'
      };
    } catch (error) {
      console.log('AI receipt parsing failed, executing local fallback.');
      
      // Fallback: search for price decimal patterns
      let amount = 0.0;
      const matches = ocrText.match(/\b\d+\.\d{2}\b/g);
      if (matches) {
        amount = Math.max(...matches.map(Number));
      }
      
      // Fallback: guess merchant
      let merchant = "Receipt Upload";
      const lines = ocrText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length > 0) {
        merchant = lines[0].substring(0, 40);
      }
      
      // Fallback: categorize
      const category = localCategorize(ocrText, amount);
      
      return { merchant, amount, category };
    }
  }
};
