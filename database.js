const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'retai.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database at:', dbPath);
    db.serialize(() => {
      // Create Users Table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          monthly_income REAL DEFAULT 0.0,
          savings_goal REAL DEFAULT 0.0,
          preferred_language TEXT DEFAULT 'English',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create Expenses Table
      db.run(`
        CREATE TABLE IF NOT EXISTS expenses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          amount REAL NOT NULL,
          category TEXT NOT NULL,
          merchant_or_note TEXT NOT NULL,
          date TEXT NOT NULL,
          source TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // Create Goals Table
      db.run(`
        CREATE TABLE IF NOT EXISTS goals (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          target_amount REAL NOT NULL,
          target_date TEXT NOT NULL,
          progress REAL DEFAULT 0.0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // Create Monthly Reports Table
      db.run(`
        CREATE TABLE IF NOT EXISTS monthly_reports (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          month TEXT NOT NULL,
          report_text TEXT NOT NULL,
          language TEXT NOT NULL,
          generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE(user_id, month, language)
        )
      `);
      
      console.log('Database tables verified/created successfully.');
    });
  }
});

// Database wrapper utilities (Promise-based)
const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this); // exposes lastID and changes
    });
  });
};

const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

module.exports = {
  dbRun,
  dbGet,
  dbAll,
  // User functions
  createUser: async (username, hashedPassword) => {
    const sql = `INSERT INTO users (username, password) VALUES (?, ?)`;
    const result = await dbRun(sql, [username, hashedPassword]);
    return result.lastID;
  },
  getUserByUsername: async (username) => {
    const sql = `SELECT * FROM users WHERE username = ?`;
    return await dbGet(sql, [username]);
  },
  getUserById: async (id) => {
    const sql = `SELECT id, username, monthly_income, savings_goal, preferred_language FROM users WHERE id = ?`;
    return await dbGet(sql, [id]);
  },
  updateUserProfile: async (userId, monthlyIncome, savingsGoal, preferredLanguage) => {
    const sql = `
      UPDATE users 
      SET monthly_income = ?, savings_goal = ?, preferred_language = ? 
      WHERE id = ?
    `;
    await dbRun(sql, [monthlyIncome, savingsGoal, preferredLanguage, userId]);
  },

  // Expense functions (Enforce user isolation)
  getExpenses: async (userId) => {
    const sql = `SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC, id DESC`;
    return await dbAll(sql, [userId]);
  },
  getExpenseById: async (id, userId) => {
    const sql = `SELECT * FROM expenses WHERE id = ? AND user_id = ?`;
    return await dbGet(sql, [id, userId]);
  },
  addExpense: async (userId, amount, category, merchantOrNote, date, source) => {
    const sql = `
      INSERT INTO expenses (user_id, amount, category, merchant_or_note, date, source)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const result = await dbRun(sql, [userId, amount, category, merchantOrNote, date, source]);
    return result.lastID;
  },
  deleteExpense: async (id, userId) => {
    const sql = `DELETE FROM expenses WHERE id = ? AND user_id = ?`;
    const result = await dbRun(sql, [id, userId]);
    return result.changes > 0;
  },

  // Goal functions (Enforce user isolation)
  getGoals: async (userId) => {
    const sql = `SELECT * FROM goals WHERE user_id = ? ORDER BY target_date ASC`;
    return await dbAll(sql, [userId]);
  },
  addGoal: async (userId, name, targetAmount, targetDate) => {
    const sql = `
      INSERT INTO goals (user_id, name, target_amount, target_date, progress)
      VALUES (?, ?, ?, ?, 0.0)
    `;
    const result = await dbRun(sql, [userId, name, targetAmount, targetDate]);
    return result.lastID;
  },
  updateGoalProgress: async (id, userId, progress) => {
    const sql = `UPDATE goals SET progress = ? WHERE id = ? AND user_id = ?`;
    const result = await dbRun(sql, [progress, id, userId]);
    return result.changes > 0;
  },
  deleteGoal: async (id, userId) => {
    const sql = `DELETE FROM goals WHERE id = ? AND user_id = ?`;
    const result = await dbRun(sql, [id, userId]);
    return result.changes > 0;
  },

  // Monthly Report functions (Enforce user isolation)
  getCachedReport: async (userId, month, language) => {
    const sql = `SELECT * FROM monthly_reports WHERE user_id = ? AND month = ? AND language = ?`;
    return await dbGet(sql, [userId, month, language]);
  },
  cacheReport: async (userId, month, reportText, language) => {
    const sql = `
      INSERT INTO monthly_reports (user_id, month, report_text, language)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id, month, language) DO UPDATE SET report_text = excluded.report_text, generated_at = CURRENT_TIMESTAMP
    `;
    await dbRun(sql, [userId, month, reportText, language]);
  }
};
