const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const db = require('./database');
const auth = require('./auth');
const ai = require('./ai');

const app = express();
const PORT = process.env.PORT || 5000;

// Serve static files dynamically based on available path configuration
let distPath = path.resolve(__dirname, 'dist');
if (!fs.existsSync(path.join(distPath, 'index.html'))) {
  if (fs.existsSync(path.resolve(__dirname, '../dist/index.html'))) {
    distPath = path.resolve(__dirname, '../dist');
  } else if (fs.existsSync(path.resolve(__dirname, '../frontend/dist/index.html'))) {
    distPath = path.resolve(__dirname, '../frontend/dist');
  }
}

app.use(express.static(distPath));

// Middleware
app.use(cors());
app.use(express.json());

// Public Auth Routes
app.post('/api/auth/signup', auth.signup);
app.post('/api/auth/login', auth.login);

// Protected Profile Routes
app.get('/api/user/profile', auth.authenticateToken, async (req, res) => {
  try {
    const user = await db.getUserById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

app.post('/api/user/profile', auth.authenticateToken, async (req, res) => {
  try {
    const { monthly_income, savings_goal, preferred_language } = req.body;
    await db.updateUserProfile(req.user.id, monthly_income, savings_goal, preferred_language);
    const updated = await db.getUserById(req.user.id);
    res.json({ message: 'Profile updated successfully', user: updated });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

// Protected Expense CRUD (Enforcing Isolation via req.user.id)
app.get('/api/expenses', auth.authenticateToken, async (req, res) => {
  try {
    const expenses = await db.getExpenses(req.user.id);
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

app.post('/api/expenses', auth.authenticateToken, async (req, res) => {
  try {
    let { amount, category, merchant_or_note, date, source } = req.body;
    if (!amount || !merchant_or_note || !date) {
      return res.status(400).json({ error: 'Amount, note, and date are required' });
    }

    if (!category || category === 'auto' || category === '') {
      const aiResult = await ai.categorizeExpense(merchant_or_note, amount);
      category = aiResult.category || 'other';
    }

    const expenseId = await db.addExpense(
      req.user.id,
      parseFloat(amount),
      category,
      merchant_or_note,
      date,
      source || 'manual'
    );

    const newExpense = await db.getExpenseById(expenseId, req.user.id);
    res.status(201).json({ message: 'Expense added successfully', expense: newExpense });
  } catch (error) {
    console.error('Error adding expense:', error);
    res.status(500).json({ error: 'Failed to add expense' });
  }
});

app.post('/api/expenses/categorize', auth.authenticateToken, async (req, res) => {
  try {
    const { merchant_or_note, amount } = req.body;
    if (!merchant_or_note || !amount) {
      return res.status(400).json({ error: 'merchant_or_note and amount are required' });
    }
    const result = await ai.categorizeExpense(merchant_or_note, amount);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to categorize note' });
  }
});

app.post('/api/expenses/ocr-parse', auth.authenticateToken, async (req, res) => {
  try {
    const { ocrText } = req.body;
    if (!ocrText) {
      return res.status(400).json({ error: 'ocrText is required' });
    }
    const result = await ai.parseReceiptOcr(ocrText);
    res.json(result);
  } catch (error) {
    console.error('OCR parsing route error:', error);
    res.status(500).json({ error: 'Failed to parse receipt text' });
  }
});

app.delete('/api/expenses/:id', auth.authenticateToken, async (req, res) => {
  try {
    const deleted = await db.deleteExpense(req.params.id, req.user.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Expense not found or unauthorized' });
    }
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

// Protected Savings Goals API
app.get('/api/goals', auth.authenticateToken, async (req, res) => {
  try {
    const goals = await db.getGoals(req.user.id);
    res.json(goals);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

app.post('/api/goals', auth.authenticateToken, async (req, res) => {
  try {
    const { name, target_amount, target_date } = req.body;
    if (!name || !target_amount || !target_date) {
      return res.status(400).json({ error: 'Name, target amount, and target date are required' });
    }

    const goalId = await db.addGoal(req.user.id, name, parseFloat(target_amount), target_date);
    res.status(201).json({ message: 'Goal added successfully', goalId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add goal' });
  }
});

app.put('/api/goals/:id/progress', auth.authenticateToken, async (req, res) => {
  try {
    const { progress } = req.body;
    const updated = await db.updateGoalProgress(req.params.id, req.user.id, parseFloat(progress));
    if (!updated) {
      return res.status(404).json({ error: 'Goal not found or unauthorized' });
    }
    res.json({ message: 'Goal progress updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update goal progress' });
  }
});

app.delete('/api/goals/:id', auth.authenticateToken, async (req, res) => {
  try {
    const deleted = await db.deleteGoal(req.params.id, req.user.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Goal not found or unauthorized' });
    }
    res.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

// Get AI Savings Advice for a goal
app.post('/api/goals/advice', auth.authenticateToken, async (req, res) => {
  try {
    const { name, target_amount, target_date } = req.body;
    const expenses = await db.getExpenses(req.user.id);
    const user = await db.getUserById(req.user.id);
    const language = user ? user.preferred_language : 'English';

    const categoryTotals = {};
    expenses.forEach(e => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });

    const categoryAverages = Object.keys(categoryTotals).map(cat => ({
      category: cat,
      amount: categoryTotals[cat] / 3
    }));

    const advice = await ai.generateGoalSavingsAdvice(
      { name, target_amount, target_date },
      categoryAverages,
      language
    );

    res.json({ advice });
  } catch (error) {
    console.error('Goal advice error:', error);
    res.status(500).json({ error: 'Failed to generate goal savings advice' });
  }
});

// Get Behavior Trends & Chart Data
app.get('/api/insights/trends', auth.authenticateToken, async (req, res) => {
  try {
    const expenses = await db.getExpenses(req.user.id);
    const user = await db.getUserById(req.user.id);
    const language = user ? user.preferred_language : 'English';

    const getYearMonth = (dateStr) => dateStr.substring(0, 7);

    const monthlyData = {};
    const monthsSet = new Set();
    const categories = ['food', 'travel', 'shopping', 'bills', 'entertainment', 'health', 'education', 'other'];

    expenses.forEach(e => {
      const ym = getYearMonth(e.date);
      monthsSet.add(ym);
      if (!monthlyData[ym]) {
        monthlyData[ym] = {};
        categories.forEach(c => monthlyData[ym][c] = 0);
      }
      if (categories.includes(e.category)) {
        monthlyData[ym][e.category] += e.amount;
      } else {
        monthlyData[ym]['other'] += e.amount;
      }
    });

    const sortedMonths = Array.from(monthsSet).sort();
    const today = new Date();
    const currentYM = today.toISOString().substring(0, 7);
    
    const getTrailingMonths = (ymStr, count = 3) => {
      const list = [];
      let [year, month] = ymStr.split('-').map(Number);
      for (let i = 1; i <= count; i++) {
        month--;
        if (month === 0) {
          month = 12;
          year--;
        }
        const mStr = month < 10 ? `0${month}` : `${month}`;
        list.push(`${year}-${mStr}`);
      }
      return list;
    };

    const trailingMonths = getTrailingMonths(currentYM, 3);

    const trendComparison = categories.map(cat => {
      const currentVal = monthlyData[currentYM]?.[cat] || 0;
      let sumAvg = 0;
      trailingMonths.forEach(m => {
        sumAvg += monthlyData[m]?.[cat] || 0;
      });
      const avgVal = sumAvg / 3;

      return {
        category: cat,
        current: currentVal,
        avg3Month: avgVal
      };
    });

    const aiInsight = await ai.generateTrendInsights(trendComparison, language);

    const chartMonths = [];
    let [year, month] = currentYM.split('-').map(Number);
    for (let i = 0; i < 6; i++) {
      const mStr = month < 10 ? `0${month}` : `${month}`;
      chartMonths.unshift(`${year}-${mStr}`);
      month--;
      if (month === 0) {
        month = 12;
        year--;
      }
    }

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const chartData = chartMonths.map(ym => {
      const [y, m] = ym.split('-');
      const mName = monthNames[parseInt(m) - 1] + " " + y.substring(2);
      const dataPoint = { month: mName, name: ym };
      
      let total = 0;
      categories.forEach(cat => {
        const val = monthlyData[ym]?.[cat] || 0;
        dataPoint[cat] = Math.round(val);
        total += val;
      });
      dataPoint.total = Math.round(total);
      return dataPoint;
    });

    res.json({
      insight: aiInsight,
      trends: trendComparison,
      chartData
    });
  } catch (error) {
    console.error('Trends error:', error);
    res.status(500).json({ error: 'Failed to fetch insights and trends' });
  }
});

// Get/Generate Monthly Report
app.get('/api/insights/report', auth.authenticateToken, async (req, res) => {
  try {
    const user = await db.getUserById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const language = user.preferred_language || 'English';
    const budget = user.monthly_income || 0;

    const today = new Date();
    const currentYM = today.toISOString().substring(0, 7);
    
    const cached = await db.getCachedReport(req.user.id, currentYM, language);
    if (cached) {
      return res.json({ report: cached.report_text, month: currentYM });
    }

    const expenses = await db.getExpenses(req.user.id);
    const getYearMonth = (dateStr) => dateStr.substring(0, 7);

    const currentMonthExpenses = expenses.filter(e => getYearMonth(e.date) === currentYM);
    
    let [year, month] = currentYM.split('-').map(Number);
    month--;
    if (month === 0) {
      month = 12;
      year--;
    }
    const lastYM = `${year}-${month < 10 ? '0' + month : month}`;
    const lastMonthExpenses = expenses.filter(e => getYearMonth(e.date) === lastYM);

    const totalThisMonth = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalLastMonth = lastMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

    const categoryTotals = {};
    currentMonthExpenses.forEach(e => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });

    const reportData = {
      totalThisMonth,
      totalLastMonth,
      categories: categoryTotals
    };

    const reportText = await ai.generateMonthlyReport(reportData, budget, language);

    await db.cacheReport(req.user.id, currentYM, reportText, language);

    res.json({ report: reportText, month: currentYM });
  } catch (error) {
    console.error('Report error:', error);
    res.status(500).json({ error: 'Failed to generate monthly report' });
  }
});

// Fallback route to serve frontend index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.resolve(distPath, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`RET AI backend server listening on port ${PORT}`);
});
