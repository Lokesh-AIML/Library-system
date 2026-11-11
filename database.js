const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const dbPath = path.join(__dirname, 'library.db');
const db = new DatabaseSync(dbPath);

// Enable foreign keys and initialize schema
function initDatabase() {
  db.exec('PRAGMA foreign_keys = ON;');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      member_id TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      department TEXT DEFAULT 'General',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      isbn TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL,
      total_copies INTEGER NOT NULL DEFAULT 1,
      available_copies INTEGER NOT NULL DEFAULT 1,
      shelf_location TEXT NOT NULL,
      publication_year INTEGER NOT NULL,
      description TEXT NOT NULL,
      cover_icon TEXT NOT NULL DEFAULT '📚',
      rating REAL NOT NULL DEFAULT 4.5
    );

    CREATE TABLE IF NOT EXISTS borrow_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      book_id INTEGER NOT NULL,
      borrow_date TEXT NOT NULL,
      due_date TEXT NOT NULL,
      return_date TEXT DEFAULT NULL,
      status TEXT NOT NULL DEFAULT 'borrowed',
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS wallet_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  try {
    db.exec('ALTER TABLE users ADD COLUMN wallet_balance REAL NOT NULL DEFAULT 25.00;');
  } catch (e) {
    // Column already exists
  }

  seedDataIfNeeded();
}

function seedDataIfNeeded() {
  const bookCount = db.prepare('SELECT COUNT(*) as count FROM books').get().count;

  if (bookCount === 0) {
    console.log('Seeding initial library catalog books...');

    // Seed Books
    const insertBook = db.prepare(`
      INSERT INTO books (title, author, isbn, category, total_copies, available_copies, shelf_location, publication_year, description, cover_icon, rating)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const books = [
      {
        title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
        author: 'Robert C. Martin',
        isbn: '978-0132350884',
        category: 'Technology',
        total_copies: 5,
        available_copies: 5,
        shelf_location: 'Floor 2, Shelf Tech-A01',
        publication_year: 2008,
        description: 'Even bad code can function. But if code isn\'t clean, it can bring a development organization to its knees. A timeless guide to writing readable, maintainable software.',
        cover_icon: '💻',
        rating: 4.8
      },
      {
        title: 'Designing Data-Intensive Applications',
        author: 'Martin Kleppmann',
        isbn: '978-1449373320',
        category: 'Technology',
        total_copies: 4,
        available_copies: 4,
        shelf_location: 'Floor 2, Shelf Tech-B04',
        publication_year: 2017,
        description: 'The definitive guide to the architecture of modern data systems, storage engines, distributed consensus, transactions, and stream processing.',
        cover_icon: '⚡',
        rating: 4.9
      },
      {
        title: 'Artificial Intelligence: A Modern Approach',
        author: 'Stuart Russell & Peter Norvig',
        isbn: '978-0136042594',
        category: 'AI & Data',
        total_copies: 4,
        available_copies: 4,
        shelf_location: 'Floor 2, Shelf AI-101',
        publication_year: 2020,
        description: 'The comprehensive global standard textbook introducing modern artificial intelligence concepts, probabilistic reasoning, machine learning, and ethics.',
        cover_icon: '🤖',
        rating: 4.9
      },
      {
        title: 'Deep Learning',
        author: 'Ian Goodfellow, Yoshua Bengio, Aaron Courville',
        isbn: '978-0262035613',
        category: 'AI & Data',
        total_copies: 3,
        available_copies: 3,
        shelf_location: 'Floor 2, Shelf AI-105',
        publication_year: 2016,
        description: 'An authoritative mathematical and conceptual introduction to neural networks, convolutional architectures, sequence models, and deep generative models.',
        cover_icon: '🧠',
        rating: 4.7
      },
      {
        title: 'The Pragmatic Programmer: Your Journey to Mastery',
        author: 'David Thomas & Andrew Hunt',
        isbn: '978-0135957059',
        category: 'Technology',
        total_copies: 4,
        available_copies: 4,
        shelf_location: 'Floor 2, Shelf Tech-A03',
        publication_year: 2019,
        description: 'Cut through the increasing specialization and technicalities of modern software development to examine the core process of crafting resilient code.',
        cover_icon: '🛠️',
        rating: 4.8
      },
      {
        title: 'To Kill a Mockingbird',
        author: 'Harper Lee',
        isbn: '978-0060935467',
        category: 'Literature',
        total_copies: 6,
        available_copies: 6,
        shelf_location: 'Floor 1, Shelf Classic-L12',
        publication_year: 1960,
        description: 'A Pulitzer Prize-winning masterpiece exploring empathy, conscience, and justice in the American South through the eyes of young Scout Finch.',
        cover_icon: '📖',
        rating: 4.9
      },
      {
        title: '1984',
        author: 'George Orwell',
        isbn: '978-0451524935',
        category: 'Literature',
        total_copies: 5,
        available_copies: 5,
        shelf_location: 'Floor 1, Shelf Classic-O02',
        publication_year: 1949,
        description: 'The chilling classic dystopian novel depicting totalitarianism, pervasive surveillance by Big Brother, psychological manipulation, and linguistic control.',
        cover_icon: '👁️',
        rating: 4.8
      },
      {
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        isbn: '978-0743273565',
        category: 'Literature',
        total_copies: 4,
        available_copies: 4,
        shelf_location: 'Floor 1, Shelf Classic-F08',
        publication_year: 1925,
        description: 'An exquisite portrait of Jazz Age opulence, elusive love, ambition, and disillusionment centered around the enigmatic Jay Gatsby.',
        cover_icon: '🍸',
        rating: 4.6
      },
      {
        title: 'A Brief History of Time',
        author: 'Stephen Hawking',
        isbn: '978-0553380163',
        category: 'Science',
        total_copies: 4,
        available_copies: 4,
        shelf_location: 'Floor 3, Shelf Sci-A14',
        publication_year: 1988,
        description: 'A landmark exploration of cosmology, black holes, the Big Bang, quantum mechanics, and our ongoing quest for a unified theory of everything.',
        cover_icon: '🌌',
        rating: 4.8
      },
      {
        title: 'Cosmos',
        author: 'Carl Sagan',
        isbn: '978-0345539434',
        category: 'Science',
        total_copies: 3,
        available_copies: 3,
        shelf_location: 'Floor 3, Shelf Sci-A19',
        publication_year: 1980,
        description: 'A poetic celebration of cosmic evolution, scientific discovery, human courage, and the marvels of our planet suspended in the cosmic ocean.',
        cover_icon: '🪐',
        rating: 4.9
      },
      {
        title: 'Sapiens: A Brief History of Humankind',
        author: 'Yuval Noah Harari',
        isbn: '978-0062316097',
        category: 'History',
        total_copies: 5,
        available_copies: 5,
        shelf_location: 'Floor 1, Shelf Hist-H05',
        publication_year: 2014,
        description: 'How an insignificant ape became the master of planet Earth: from the Cognitive Revolution to the Agricultural and Scientific eras.',
        cover_icon: '🏛️',
        rating: 4.7
      },
      {
        title: 'Zero to One: Notes on Startups',
        author: 'Peter Thiel with Blake Masters',
        isbn: '978-0804139298',
        category: 'Business',
        total_copies: 4,
        available_copies: 4,
        shelf_location: 'Floor 3, Shelf Biz-T01',
        publication_year: 2014,
        description: 'The secret to building the future: creating brand new things rather than copying what already exists, cultivating true technological breakthrough.',
        cover_icon: '🚀',
        rating: 4.6
      },
      {
        title: 'Thinking, Fast and Slow',
        author: 'Daniel Kahneman',
        isbn: '978-0374533557',
        category: 'Psychology',
        total_copies: 5,
        available_copies: 5,
        shelf_location: 'Floor 2, Shelf Psych-K10',
        publication_year: 2011,
        description: 'Nobel laureate Daniel Kahneman explains the two cognitive systems that drive the way we think, decide, judge probabilities, and make choices.',
        cover_icon: '💡',
        rating: 4.7
      },
      {
        title: 'Atomic Habits',
        author: 'James Clear',
        isbn: '978-0735211292',
        category: 'Productivity',
        total_copies: 6,
        available_copies: 6,
        shelf_location: 'Floor 2, Shelf Prod-C04',
        publication_year: 2018,
        description: 'An easy and proven way to build good habits and break bad ones through tiny 1% compound improvements in everyday systems.',
        cover_icon: '🎯',
        rating: 4.9
      },
      {
        title: 'Meditations',
        author: 'Marcus Aurelius',
        isbn: '978-0812968255',
        category: 'Philosophy',
        total_copies: 4,
        available_copies: 4,
        shelf_location: 'Floor 1, Shelf Phil-M03',
        publication_year: 2002,
        description: 'Personal reflections by the Roman Emperor on Stoic philosophy, self-discipline, mortality, inner peace, and the nature of duty.',
        cover_icon: '⚖️',
        rating: 4.8
      },
      {
        title: 'The Design of Everyday Things',
        author: 'Don Norman',
        isbn: '978-0465050659',
        category: 'Design & UX',
        total_copies: 4,
        available_copies: 4,
        shelf_location: 'Floor 2, Shelf Des-N01',
        publication_year: 2013,
        description: 'The fundamental guide to human-centered design, affordances, signifiers, and why bad product design makes users feel foolish.',
        cover_icon: '🎨',
        rating: 4.7
      }
    ];

    for (const b of books) {
      insertBook.run(
        b.title,
        b.author,
        b.isbn,
        b.category,
        b.total_copies,
        b.available_copies,
        b.shelf_location,
        b.publication_year,
        b.description,
        b.cover_icon,
        b.rating
      );
    }

    console.log('Database initialized and catalog seeded successfully.');
  }
}

// User helper methods
function findUserByEmail(email) {
  return db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email);
}

function findUserById(id) {
  return db.prepare('SELECT id, name, email, member_id, role, department, created_at, COALESCE(wallet_balance, 25.00) as wallet_balance FROM users WHERE id = ?').get(id);
}

function createUser(name, email, passwordHash, department = 'General') {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  const memberId = `LIB-${year}-${randomSuffix}`;
  const createdAt = new Date().toISOString().split('T')[0];

  const stmt = db.prepare(`
    INSERT INTO users (name, email, password_hash, member_id, role, department, created_at, wallet_balance)
    VALUES (?, ?, ?, ?, 'member', ?, ?, 25.00)
  `);

  const result = stmt.run(name, email, passwordHash, memberId, department, createdAt);
  const newUserId = result.lastInsertRowid;

  // Insert initial signup welcome credit
  db.prepare(`
    INSERT INTO wallet_transactions (user_id, amount, type, description, created_at)
    VALUES (?, 25.00, 'topup', 'Welcome Signup Credit', ?)
  `).run(newUserId, new Date().toISOString().replace('T', ' ').substring(0, 19));

  return findUserById(newUserId);
}

// Books helper methods
function getAllBooks(options = {}) {
  const { search, category, availableOnly } = options;
  let sql = 'SELECT * FROM books WHERE 1=1';
  const params = [];

  if (category && category !== 'All') {
    sql += ' AND category = ?';
    params.push(category);
  }

  if (availableOnly === 'true' || availableOnly === true) {
    sql += ' AND available_copies > 0';
  }

  if (search && search.trim()) {
    sql += ' AND (title LIKE ? OR author LIKE ? OR isbn LIKE ? OR description LIKE ?)';
    const term = `%${search.trim()}%`;
    params.push(term, term, term, term);
  }

  sql += ' ORDER BY title ASC';
  return db.prepare(sql).all(...params);
}

function getBookById(id) {
  return db.prepare('SELECT * FROM books WHERE id = ?').get(id);
}

function addBook(bookData) {
  const {
    title,
    author,
    isbn,
    category,
    total_copies = 1,
    shelf_location = 'General Stacks',
    publication_year = new Date().getFullYear(),
    description = '',
    cover_icon = '📚'
  } = bookData;

  const stmt = db.prepare(`
    INSERT INTO books (title, author, isbn, category, total_copies, available_copies, shelf_location, publication_year, description, cover_icon, rating)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 4.8)
  `);

  const result = stmt.run(
    title,
    author,
    isbn,
    category,
    Number(total_copies),
    Number(total_copies),
    shelf_location,
    Number(publication_year),
    description,
    cover_icon
  );
  return getBookById(result.lastInsertRowid);
}

function deleteBook(id) {
  const stmt = db.prepare('DELETE FROM books WHERE id = ?');
  return stmt.run(id);
}

// Borrowing helpers
function getUserBorrowRecords(userId) {
  const query = db.prepare(`
    SELECT 
      br.id as record_id,
      br.borrow_date,
      br.due_date,
      br.return_date,
      br.status,
      b.id as book_id,
      b.title,
      b.author,
      b.isbn,
      b.category,
      b.cover_icon,
      b.shelf_location
    FROM borrow_records br
    JOIN books b ON br.book_id = b.id
    WHERE br.user_id = ?
    ORDER BY br.id DESC
  `);
  return query.all(userId);
}

function borrowBook(userId, bookId) {
  // Check if book exists and is available
  const book = getBookById(bookId);
  if (!book) {
    throw new Error('Book not found');
  }

  if (book.available_copies <= 0) {
    throw new Error('No copies currently available to borrow');
  }

  // Check if user already has an active loan of this book
  const existingActive = db.prepare(`
    SELECT id FROM borrow_records 
    WHERE user_id = ? AND book_id = ? AND status = 'borrowed'
  `).get(userId, bookId);

  if (existingActive) {
    throw new Error('You already have an active loan for this book');
  }

  // Check active loan limit (max 5 books per user)
  const activeCount = db.prepare(`
    SELECT COUNT(*) as count FROM borrow_records
    WHERE user_id = ? AND status = 'borrowed'
  `).get(userId).count;

  if (activeCount >= 5) {
    throw new Error('Borrowing limit reached: Maximum 5 books can be checked out concurrently');
  }

  const today = new Date();
  const borrowDate = today.toISOString().split('T')[0];
  const dueDateObj = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000); // 14-day loan
  const dueDate = dueDateObj.toISOString().split('T')[0];

  // Perform transaction: decrement available copies and insert record
  db.exec('BEGIN TRANSACTION;');
  try {
    db.prepare('UPDATE books SET available_copies = available_copies - 1 WHERE id = ?').run(bookId);
    
    const insert = db.prepare(`
      INSERT INTO borrow_records (user_id, book_id, borrow_date, due_date, status)
      VALUES (?, ?, ?, ?, 'borrowed')
    `);
    const result = insert.run(userId, bookId, borrowDate, dueDate);
    db.exec('COMMIT;');

    return {
      record_id: result.lastInsertRowid,
      book_id: bookId,
      book_title: book.title,
      borrow_date: borrowDate,
      due_date: dueDate
    };
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}

function returnBook(userId, recordId) {
  const record = db.prepare(`
    SELECT * FROM borrow_records WHERE id = ? AND user_id = ?
  `).get(recordId, userId);

  if (!record) {
    throw new Error('Loan record not found or does not belong to user');
  }

  if (record.status === 'returned') {
    throw new Error('This book has already been returned');
  }

  const returnDate = new Date().toISOString().split('T')[0];

  db.exec('BEGIN TRANSACTION;');
  try {
    db.prepare(`
      UPDATE borrow_records 
      SET return_date = ?, status = 'returned' 
      WHERE id = ?
    `).run(returnDate, recordId);

    db.prepare(`
      UPDATE books 
      SET available_copies = available_copies + 1 
      WHERE id = ?
    `).run(record.book_id);

    db.exec('COMMIT;');
    return { success: true, return_date: returnDate, book_id: record.book_id };
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}

// Admin stats
function getAdminStats() {
  const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'member'").get().count;
  const totalBooks = db.prepare('SELECT COUNT(*) as count FROM books').get().count;
  const totalCopies = db.prepare('SELECT SUM(total_copies) as sum FROM books').get().sum || 0;
  const availableCopies = db.prepare('SELECT SUM(available_copies) as sum FROM books').get().sum || 0;
  const activeLoans = db.prepare("SELECT COUNT(*) as count FROM borrow_records WHERE status = 'borrowed'").get().count;

  const allActiveLoans = db.prepare(`
    SELECT 
      br.id as record_id,
      br.borrow_date,
      br.due_date,
      u.name as user_name,
      u.email as user_email,
      u.member_id,
      b.title as book_title,
      b.isbn
    FROM borrow_records br
    JOIN users u ON br.user_id = u.id
    JOIN books b ON br.book_id = b.id
    WHERE br.status = 'borrowed'
    ORDER BY br.due_date ASC
  `).all();

  return {
    totalUsers,
    totalBooks,
    totalCopies,
    availableCopies,
    activeLoans,
    allActiveLoans
  };
}

// ==========================================
// WALLET OPERATIONS
// ==========================================
function getUserWallet(userId) {
  const user = db.prepare('SELECT COALESCE(wallet_balance, 25.00) as wallet_balance FROM users WHERE id = ?').get(userId);
  if (!user) throw new Error('User account not found');

  const transactions = db.prepare(`
    SELECT id, amount, type, description, created_at
    FROM wallet_transactions
    WHERE user_id = ?
    ORDER BY id DESC
  `).all(userId);

  return {
    balance: Number(user.wallet_balance),
    transactions: transactions || []
  };
}

function topupWallet(userId, amount, method = 'Campus ID Card') {
  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    throw new Error('Please enter a valid amount greater than $0');
  }

  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

  db.exec('BEGIN TRANSACTION;');
  try {
    db.prepare('UPDATE users SET wallet_balance = COALESCE(wallet_balance, 0) + ? WHERE id = ?').run(numAmount, userId);
    db.prepare(`
      INSERT INTO wallet_transactions (user_id, amount, type, description, created_at)
      VALUES (?, ?, 'topup', ?, ?)
    `).run(userId, numAmount, `Wallet Top-Up via ${method}`, now);
    db.exec('COMMIT;');

    return getUserWallet(userId);
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}

function payFineWithWallet(userId, amount, bookTitle) {
  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    throw new Error('Invalid fine amount');
  }

  const user = db.prepare('SELECT COALESCE(wallet_balance, 0) as wallet_balance FROM users WHERE id = ?').get(userId);
  if (!user || user.wallet_balance < numAmount) {
    throw new Error(`Insufficient wallet balance ($${(user?.wallet_balance || 0).toFixed(2)}). Please top up your wallet.`);
  }

  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

  db.exec('BEGIN TRANSACTION;');
  try {
    db.prepare('UPDATE users SET wallet_balance = wallet_balance - ? WHERE id = ?').run(numAmount, userId);
    db.prepare(`
      INSERT INTO wallet_transactions (user_id, amount, type, description, created_at)
      VALUES (?, ?, 'fine_payment', ?, ?)
    `).run(userId, -numAmount, `Late Fee Clearance: ${bookTitle || 'Overdue Library Book'}`, now);
    db.exec('COMMIT;');

    return getUserWallet(userId);
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}

module.exports = {
  db,
  initDatabase,
  findUserByEmail,
  findUserById,
  createUser,
  getAllBooks,
  getBookById,
  addBook,
  deleteBook,
  getUserBorrowRecords,
  borrowBook,
  returnBook,
  getAdminStats,
  getUserWallet,
  topupWallet,
  payFineWithWallet
};
