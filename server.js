require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const dataAdapter = require('./dataAdapter');
const supabaseClient = require('./supabaseClient');

// Initialize database (Supabase or SQLite)
dataAdapter.init();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'library_app_secure_secret_token_2026';

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// JWT & Supabase Auth Middleware
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ error: 'Access denied: Please sign in to perform this action.' });
  }

  // 1. Try verifying standard internal JWT
  try {
    const decodedUser = jwt.verify(token, JWT_SECRET);
    const user = await dataAdapter.findUserById(decodedUser.id);
    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }
    req.user = user;
    return next();
  } catch (jwtErr) {
    // 2. If token verification failed, check if it is a Supabase Auth access token
    if (dataAdapter.isSupabase() && supabaseClient.supabase) {
      try {
        const { data: { user }, error } = await supabaseClient.supabase.auth.getUser(token);
        if (!error && user) {
          const profile = await dataAdapter.findUserById(user.id);
          req.user = profile || {
            id: user.id,
            name: user.user_metadata?.name || user.email.split('@')[0],
            email: user.email,
            member_id: user.user_metadata?.member_id || 'LIB-SUPA',
            role: user.user_metadata?.role || 'member',
            department: user.user_metadata?.department || 'General'
          };
          return next();
        }
      } catch (supaErr) {
        console.warn('Supabase token verification error:', supaErr.message);
      }
    }

    return res.status(403).json({ error: 'Invalid or expired session. Please log in again.' });
  }
}

// Optional Auth (for chatbot personalization)
async function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  req.user = null;

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = await dataAdapter.findUserById(decoded.id);
    } catch {
      if (dataAdapter.isSupabase() && supabaseClient.supabase) {
        try {
          const { data: { user } } = await supabaseClient.supabase.auth.getUser(token);
          if (user) {
            req.user = await dataAdapter.findUserById(user.id);
          }
        } catch {}
      }
    }
  }
  next();
}

function requireAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Administrative privileges required.' });
  }
}

// ==========================================
// SYSTEM & BACKEND STATUS
// ==========================================
app.get('/api/system/status', (req, res) => {
  res.json({
    backend: dataAdapter.isSupabase() ? 'supabase' : 'sqlite',
    database: dataAdapter.isSupabase() ? 'Supabase (PostgreSQL)' : 'Local SQLite',
    supabaseConfigured: dataAdapter.isSupabase(),
    status: 'online'
  });
});

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, department } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Full name, email address, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const result = await dataAdapter.registerUser(name, email, password, department);

    res.status(201).json({
      message: 'Account created successfully! Welcome to the library.',
      token: result.token,
      user: result.user
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(400).json({ error: 'Failed to create user account. ' + err.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Both email and password are required.' });
    }

    const result = await dataAdapter.loginUser(email, password);

    res.json({
      message: 'Login successful.',
      token: result.token,
      user: result.user
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(401).json({ error: 'Authentication failed. ' + err.message });
  }
});

// Current User Profile & Stats
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const records = await dataAdapter.getUserBorrowRecords(req.user.id);
    const activeLoans = records.filter(r => r.status === 'borrowed');
    const returnedLoans = records.filter(r => r.status === 'returned');

    const today = new Date().toISOString().split('T')[0];
    let finesDue = 0.00;
    activeLoans.forEach(loan => {
      if (loan.due_date < today) {
        const diffDays = Math.ceil((new Date(today) - new Date(loan.due_date)) / (1000 * 60 * 60 * 24));
        finesDue += diffDays * 0.50;
      }
    });

    const wallet = await dataAdapter.getUserWallet(req.user.id);

    res.json({
      user: {
        ...req.user,
        wallet_balance: wallet.balance
      },
      stats: {
        activeLoansCount: activeLoans.length,
        returnedLoansCount: returnedLoans.length,
        borrowingLimit: 5,
        finesDue: finesDue,
        walletBalance: wallet.balance
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user profile: ' + err.message });
  }
});

// ==========================================
// BOOKS CATALOG ROUTES
// ==========================================

// Get all books with optional search & filters
app.get('/api/books', async (req, res) => {
  try {
    const { search, category, availableOnly } = req.query;
    const books = await dataAdapter.getAllBooks({ search, category, availableOnly });
    res.json({ books, count: books.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve books catalog: ' + err.message });
  }
});

// Get single book
app.get('/api/books/:id', async (req, res) => {
  try {
    const book = await dataAdapter.getBookById(req.params.id);
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.json(book);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve book: ' + err.message });
  }
});

// Admin: Add new book
app.post('/api/books', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, author, isbn, category, total_copies, shelf_location, publication_year, description, cover_icon } = req.body;

    if (!title || !author || !isbn || !category) {
      return res.status(400).json({ error: 'Title, Author, ISBN, and Category are required.' });
    }

    const newBook = await dataAdapter.addBook({
      title,
      author,
      isbn,
      category,
      total_copies: total_copies || 1,
      shelf_location: shelf_location || 'General Shelf A',
      publication_year: publication_year || new Date().getFullYear(),
      description: description || 'No summary provided.',
      cover_icon: cover_icon || '📚'
    });

    res.status(201).json({ message: 'Book added to catalog successfully!', book: newBook });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add book: ' + err.message });
  }
});

// Admin: Delete book
app.delete('/api/books/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const bookId = req.params.id;
    const book = await dataAdapter.getBookById(bookId);
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    await dataAdapter.deleteBook(bookId);
    res.json({ message: `Book "${book.title}" was removed from the catalog.` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete book: ' + err.message });
  }
});

// ==========================================
// USER BORROWING & RETURNS
// ==========================================

// Get current user's loans (active and history)
app.get('/api/user/borrowed', authenticateToken, async (req, res) => {
  try {
    const records = await dataAdapter.getUserBorrowRecords(req.user.id);
    const today = new Date().toISOString().split('T')[0];

    const activeLoans = records
      .filter(r => r.status === 'borrowed')
      .map(r => {
        const isOverdue = r.due_date < today;
        const diffDays = Math.ceil((new Date(r.due_date) - new Date(today)) / (1000 * 60 * 60 * 24));
        return {
          ...r,
          isOverdue,
          daysRemaining: diffDays
        };
      });

    const history = records.filter(r => r.status === 'returned');

    res.json({
      activeLoans,
      history,
      activeCount: activeLoans.length,
      historyCount: history.length
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user loan records: ' + err.message });
  }
});

// Borrow a book
app.post('/api/user/borrow', authenticateToken, async (req, res) => {
  try {
    const { bookId } = req.body;
    if (!bookId) {
      return res.status(400).json({ error: 'bookId is required.' });
    }

    const result = await dataAdapter.borrowBook(req.user.id, bookId);
    const updatedBook = await dataAdapter.getBookById(bookId);

    res.json({
      message: `You have successfully borrowed "${result.book_title}"! Due date is ${result.due_date}.`,
      loan: result,
      book: updatedBook
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Return a book
app.post('/api/user/return', authenticateToken, async (req, res) => {
  try {
    const { recordId } = req.body;
    if (!recordId) {
      return res.status(400).json({ error: 'recordId is required.' });
    }

    const result = await dataAdapter.returnBook(req.user.id, recordId);
    const updatedBook = await dataAdapter.getBookById(result.book_id);

    res.json({
      message: 'Book returned successfully! Thank you for returning on time.',
      result,
      book: updatedBook
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// USER WALLET ROUTES
// ==========================================

// Get user wallet balance & transaction history
app.get('/api/user/wallet', authenticateToken, async (req, res) => {
  try {
    const wallet = await dataAdapter.getUserWallet(req.user.id);
    res.json(wallet);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch wallet information: ' + err.message });
  }
});

// Add funds (Top-up) to wallet
app.post('/api/user/wallet/topup', authenticateToken, async (req, res) => {
  try {
    const { amount, method } = req.body;
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'Please enter a valid top-up amount greater than $0.' });
    }

    const updatedWallet = await dataAdapter.topupWallet(req.user.id, numAmount, method || 'Campus Card');
    res.json({
      message: `Successfully deposited $${numAmount.toFixed(2)} to your library wallet!`,
      wallet: updatedWallet
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Pay overdue fine using wallet balance
app.post('/api/user/wallet/pay-fine', authenticateToken, async (req, res) => {
  try {
    const { amount, bookTitle } = req.body;
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'Invalid fine payment amount.' });
    }

    const updatedWallet = await dataAdapter.payFineWithWallet(req.user.id, numAmount, bookTitle);
    res.json({
      message: `Paid $${numAmount.toFixed(2)} late fee using wallet balance. Account is in good standing!`,
      wallet: updatedWallet
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// ADMIN DASHBOARD
// ==========================================

app.get('/api/admin/overview', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const stats = await dataAdapter.getAdminStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load administrative overview: ' + err.message });
  }
});

// ==========================================
// LIBRARY ASSISTANT CHATBOT ("Libby")
// ==========================================

app.post('/api/chat', optionalAuth, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message text is required.' });
    }

    const query = message.trim().toLowerCase();
    const userName = req.user ? req.user.name.split(' ')[0] : 'there';

    let reply = '';
    let suggestions = [];
    let bookRecommendations = [];

    // 1. Greetings
    if (query.match(/^(hi|hello|hey|good morning|good afternoon|good evening|greetings)/)) {
      reply = `Hello ${userName}! 👋 I'm Libby, your digital library concierge. How can I assist your reading or research today? You can ask me to find books, check library rules, or explain how borrowing works.`;
      suggestions = ['Show available books', 'How do I borrow a book?', 'Library hours & location', 'What are late fees?'];
    }
    // 2. How to borrow or return books
    else if (query.includes('how to borrow') || query.includes('how do i borrow') || query.includes('borrowing limit') || query.includes('how many books')) {
      reply = `📖 **How Borrowing Works:**\n• Each registered member can check out up to **5 books** simultaneously.\n• The loan period is **14 days**.\n• Simply browse the catalog, click the **"Borrow"** button on any available book card, and it will be added to your account instantly!\n• You can monitor your due dates and return books anytime in your **"My Account"** dashboard.`;
      suggestions = ['Where do I see my books?', 'What are late fees?', 'Browse catalog'];
    }
    // 3. How to return
    else if (query.includes('how to return') || query.includes('return a book') || query.includes('returning')) {
      reply = `🔄 **Returning Books:**\nTo return a borrowed book, click **"My Account"** in the top navigation, find the book under **"Currently Borrowed"**, and click the blue **"Return Book"** button. The book will immediately be marked as returned and placed back in circulation!`;
      suggestions = ['Go to My Account', 'Are there late fees?'];
    }
    // 4. Library hours & location
    else if (query.includes('hours') || query.includes('timings') || query.includes('opening') || query.includes('open') || query.includes('location') || query.includes('where is')) {
      reply = `🕒 **Library Hours & Location:**\n• **Monday – Friday:** 8:00 AM – 10:00 PM\n• **Saturday & Sunday:** 9:00 AM – 8:00 PM\n• **Location:** Central Atrium Campus, Building 4 (Main Stacks & Quiet Study Hub).\n• **Digital Services:** Available 24/7 online for browsing, borrowing, and renewals!`;
      suggestions = ['Find AI books', 'Study rooms available?'];
    }
    // 5. Late fees and fines
    else if (query.includes('fine') || query.includes('late fee') || query.includes('overdue') || query.includes('penalty')) {
      reply = `💰 **Overdue Policy:**\n• Books are on loan for **14 days**.\n• If a book is returned after its due date, a standard grace period of 24 hours applies, followed by **$0.50 per day**.\n• You can easily clear late fees using your **Library Wallet** in your dashboard with 1 click!`;
      suggestions = ['How does the wallet work?', 'How do I return a book?', 'Can I renew?'];
    }
    // 6. Library Digital Wallet & Top-up
    else if (query.includes('wallet') || query.includes('balance') || query.includes('top up') || query.includes('add money') || query.includes('add funds') || query.includes('payment')) {
      reply = `💳 **Library Digital Wallet:**\n• Each member has a personal prepaid wallet for paying overdue book fines, printing credits, and campus study services.\n• You can check your live balance in the top navigation bar or inside **"My Account"**.\n• Click **"+ Add Funds"** to top up anytime using your Student ID card, debit card, or net banking!`;
      suggestions = ['Go to My Account', 'What are late fees?', 'Recommend books'];
    }
    // 6. Study rooms / WiFi / Facilities
    else if (query.includes('study room') || query.includes('wifi') || query.includes('print') || query.includes('quiet')) {
      reply = `🏛️ **Facilities & Amenities:**\n• High-speed campus Wi-Fi (**"Library-Scholar"** network) is free for all members.\n• Quiet study pods are located on Floor 2 and Floor 3.\n• High-volume duplex printing & scanning is available on Floor 1 near the Information Desk.`;
      suggestions = ['Library hours', 'Recommend a book'];
    }
    // 7. Search or recommendations by topic/genre
    else if (query.includes('recommend') || query.includes('suggest') || query.includes('ai') || query.includes('code') || query.includes('tech') || query.includes('science') || query.includes('fiction') || query.includes('novel') || query.includes('history') || query.includes('philosophy') || query.includes('business')) {
      let category = 'Technology';
      if (query.includes('ai') || query.includes('artificial intelligence') || query.includes('data')) {
        category = 'AI & Data';
      } else if (query.includes('fiction') || query.includes('novel') || query.includes('classic') || query.includes('literature')) {
        category = 'Literature';
      } else if (query.includes('science') || query.includes('space') || query.includes('physics')) {
        category = 'Science';
      } else if (query.includes('business') || query.includes('startup') || query.includes('finance')) {
        category = 'Business';
      } else if (query.includes('philosophy') || query.includes('stoic')) {
        category = 'Philosophy';
      } else if (query.includes('habit') || query.includes('productivity')) {
        category = 'Productivity';
      } else if (query.includes('history')) {
        category = 'History';
      }

      const matchingBooks = await dataAdapter.getAllBooks({ category });
      bookRecommendations = matchingBooks.slice(0, 3).map(b => ({
        id: b.id,
        title: b.title,
        author: b.author,
        available_copies: b.available_copies,
        cover_icon: b.cover_icon,
        category: b.category
      }));

      reply = `✨ Here are top recommendations in **${category}** from our library collection:`;
      suggestions = ['Recommend Literature', 'Recommend Business', 'How do I borrow?'];
    }
    // 8. Specific title searches (e.g. "Do you have Clean Code?")
    else {
      const words = query.split(/\s+/).filter(w => w.length > 3 && !['have', 'find', 'book', 'about', 'need', 'search', 'what', 'does'].includes(w));
      let foundBooks = [];
      if (words.length > 0) {
        foundBooks = await dataAdapter.getAllBooks({ search: words[0] });
      }

      if (foundBooks.length > 0) {
        bookRecommendations = foundBooks.slice(0, 3).map(b => ({
          id: b.id,
          title: b.title,
          author: b.author,
          available_copies: b.available_copies,
          cover_icon: b.cover_icon,
          category: b.category
        }));
        reply = `📚 I found matching books in our catalog matching "${words[0]}":`;
        suggestions = ['How do I borrow?', 'Library hours'];
      } else {
        reply = `I can help you with anything related to our library! You can ask me:\n• To find or recommend books on coding, AI, science, literature, or business\n• How borrowing and returns work\n• Operating hours, study rooms, or late fee policies\n• How to manage your user account`;
        suggestions = ['Recommend AI books', 'How to borrow?', 'Library hours', 'Recommend Fiction'];
      }
    }

    res.json({
      reply,
      suggestions,
      recommendations: bookRecommendations
    });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Failed to process chat query.' });
  }
});

// Fallback to index.html for SPA navigation
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🏛️  Athenaeum Library System is running!`);
  console.log(`📍  URL: http://localhost:${PORT}`);
  console.log(`🗄️  Backend Database: ${dataAdapter.isSupabase() ? '⚡ Supabase (PostgreSQL)' : '📂 Local SQLite (Ready for Supabase)'}`);
  console.log(`✨  Ready for user registration & sign-in`);
  console.log(`====================================================`);
});
