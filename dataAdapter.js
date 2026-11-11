require('dotenv').config();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const supabaseClient = require('./supabaseClient');
const sqliteDb = require('./database');

const JWT_SECRET = process.env.JWT_SECRET || 'library_app_secure_secret_token_2026';

function isSupabase() {
  return supabaseClient.isSupabaseConfigured();
}

function init() {
  if (isSupabase()) {
    console.log('⚡ Connected to Supabase backend.');
  } else {
    console.log('📂 Running in Local Database mode (SQLite). Configure SUPABASE_URL in .env to connect to Supabase.');
    sqliteDb.initDatabase();
  }
}

async function getAllBooks(options = {}) {
  if (isSupabase()) {
    return await supabaseClient.getAllBooks(options);
  }
  return sqliteDb.getAllBooks(options);
}

async function getBookById(id) {
  if (isSupabase()) {
    return await supabaseClient.getBookById(id);
  }
  return sqliteDb.getBookById(id);
}

async function addBook(bookData) {
  if (isSupabase()) {
    return await supabaseClient.addBook(bookData);
  }
  return sqliteDb.addBook(bookData);
}

async function deleteBook(id) {
  if (isSupabase()) {
    return await supabaseClient.deleteBook(id);
  }
  return sqliteDb.deleteBook(id);
}

async function findUserById(id) {
  if (isSupabase()) {
    return await supabaseClient.findUserById(id);
  }
  return sqliteDb.findUserById(id);
}

async function registerUser(name, email, password, department = 'General') {
  if (isSupabase()) {
    return await supabaseClient.registerUser(name, email, password, department);
  }

  const existing = sqliteDb.findUserByEmail(email);
  if (existing) {
    throw new Error('An account with this email address already exists.');
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);
  const newUser = sqliteDb.createUser(name.trim(), email.trim().toLowerCase(), passwordHash, department || 'General');

  const token = jwt.sign(
    { id: newUser.id, email: newUser.email, role: newUser.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return { user: newUser, token };
}

async function loginUser(email, password) {
  if (isSupabase()) {
    return await supabaseClient.loginUser(email, password);
  }

  const userWithPassword = sqliteDb.findUserByEmail(email);
  if (!userWithPassword) {
    throw new Error('Invalid email address or password.');
  }

  const validPassword = bcrypt.compareSync(password, userWithPassword.password_hash);
  if (!validPassword) {
    throw new Error('Invalid email address or password.');
  }

  const token = jwt.sign(
    { id: userWithPassword.id, email: userWithPassword.email, role: userWithPassword.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  const safeUser = sqliteDb.findUserById(userWithPassword.id);
  return { user: safeUser, token };
}

async function getUserBorrowRecords(userId) {
  if (isSupabase()) {
    return await supabaseClient.getUserBorrowRecords(userId);
  }
  return sqliteDb.getUserBorrowRecords(userId);
}

async function borrowBook(userId, bookId) {
  if (isSupabase()) {
    return await supabaseClient.borrowBook(userId, bookId);
  }
  return sqliteDb.borrowBook(userId, bookId);
}

async function returnBook(userId, recordId) {
  if (isSupabase()) {
    return await supabaseClient.returnBook(userId, recordId);
  }
  return sqliteDb.returnBook(userId, recordId);
}

async function getAdminStats() {
  if (isSupabase()) {
    return await supabaseClient.getAdminStats();
  }
  return sqliteDb.getAdminStats();
}

async function getUserWallet(userId) {
  if (isSupabase()) {
    return await supabaseClient.getUserWallet(userId);
  }
  return sqliteDb.getUserWallet(userId);
}

async function topupWallet(userId, amount, method) {
  if (isSupabase()) {
    return await supabaseClient.topupWallet(userId, amount, method);
  }
  return sqliteDb.topupWallet(userId, amount, method);
}

async function payFineWithWallet(userId, amount, bookTitle) {
  if (isSupabase()) {
    return await supabaseClient.payFineWithWallet(userId, amount, bookTitle);
  }
  return sqliteDb.payFineWithWallet(userId, amount, bookTitle);
}

module.exports = {
  isSupabase,
  init,
  getAllBooks,
  getBookById,
  addBook,
  deleteBook,
  findUserById,
  registerUser,
  loginUser,
  getUserBorrowRecords,
  borrowBook,
  returnBook,
  getAdminStats,
  getUserWallet,
  topupWallet,
  payFineWithWallet
};
