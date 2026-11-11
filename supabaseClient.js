require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

let supabase = null;

if (supabaseUrl && supabaseKey && supabaseUrl.startsWith('https://')) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    console.log('⚡ Supabase Client initialized successfully with URL:', supabaseUrl);
  } catch (err) {
    console.warn('⚠️ Failed to initialize Supabase client:', err.message);
  }
}

function isSupabaseConfigured() {
  return !!supabase;
}

// -------------------------------------------------------------
// BOOKS
// -------------------------------------------------------------
async function getAllBooks(options = {}) {
  const { search, category, availableOnly } = options;
  let query = supabase.from('books').select('*');

  if (category && category !== 'All') {
    query = query.eq('category', category);
  }

  if (availableOnly === 'true' || availableOnly === true) {
    query = query.gt('available_copies', 0);
  }

  if (search && search.trim()) {
    const term = search.trim();
    query = query.or(`title.ilike.%${term}%,author.ilike.%${term}%,isbn.ilike.%${term}%,description.ilike.%${term}%`);
  }

  query = query.order('title', { ascending: true });

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}

async function getBookById(id) {
  const { data, error } = await supabase.from('books').select('*').eq('id', id).single();
  if (error) return null;
  return data;
}

async function addBook(bookData) {
  const { data, error } = await supabase.from('books').insert([{
    title: bookData.title,
    author: bookData.author,
    isbn: bookData.isbn,
    category: bookData.category,
    total_copies: Number(bookData.total_copies) || 1,
    available_copies: Number(bookData.total_copies) || 1,
    shelf_location: bookData.shelf_location || 'General Stacks',
    publication_year: Number(bookData.publication_year) || new Date().getFullYear(),
    description: bookData.description || '',
    cover_icon: bookData.cover_icon || '📚',
    rating: 4.8
  }]).select().single();

  if (error) throw new Error(error.message);
  return data;
}

async function deleteBook(id) {
  const { error } = await supabase.from('books').delete().eq('id', id);
  if (error) throw new Error(error.message);
  return true;
}

// -------------------------------------------------------------
// AUTH & USERS
// -------------------------------------------------------------
async function registerUser(name, email, password, department = 'General') {
  // Sign up via Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        department,
        role: 'member'
      }
    }
  });

  if (error) throw new Error(error.message);

  const userId = data.user.id;

  // Fetch or ensure profile
  let { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (!profile) {
    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const memberId = `LIB-${year}-${randomSuffix}`;

    const { data: createdProfile, error: profileErr } = await supabase.from('profiles').insert([{
      id: userId,
      name,
      email,
      member_id: memberId,
      role: 'member',
      department
    }]).select().single();

    if (profileErr) throw new Error(profileErr.message);
    profile = createdProfile;
  }

  return {
    user: profile,
    token: data.session ? data.session.access_token : null
  };
}

async function loginUser(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw new Error(error.message);

  const userId = data.user.id;
  let { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();

  if (!profile) {
    // If profile didn't exist yet, populate from user metadata
    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const memberId = `LIB-${year}-${randomSuffix}`;

    const { data: createdProfile } = await supabase.from('profiles').insert([{
      id: userId,
      name: data.user.user_metadata?.name || email.split('@')[0],
      email: data.user.email,
      member_id: memberId,
      role: data.user.user_metadata?.role || 'member',
      department: data.user.user_metadata?.department || 'General'
    }]).select().single();
    profile = createdProfile;
  }

  return {
    user: profile,
    token: data.session.access_token
  };
}

async function findUserById(id) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
  if (error) return null;
  return data;
}

// -------------------------------------------------------------
// BORROWING & RETURNS
// -------------------------------------------------------------
async function getUserBorrowRecords(userId) {
  const { data, error } = await supabase
    .from('borrow_records')
    .select(`
      id,
      borrow_date,
      due_date,
      return_date,
      status,
      book_id,
      books (
        id,
        title,
        author,
        isbn,
        category,
        cover_icon,
        shelf_location
      )
    `)
    .eq('user_id', userId)
    .order('id', { ascending: false });

  if (error) throw new Error(error.message);

  return (data || []).map(r => ({
    record_id: r.id,
    borrow_date: r.borrow_date,
    due_date: r.due_date,
    return_date: r.return_date,
    status: r.status,
    book_id: r.book_id,
    title: r.books?.title || 'Unknown',
    author: r.books?.author || 'Unknown',
    isbn: r.books?.isbn || '',
    category: r.books?.category || 'General',
    cover_icon: r.books?.cover_icon || '📚',
    shelf_location: r.books?.shelf_location || ''
  }));
}

async function borrowBook(userId, bookId) {
  // Use RPC stored procedure if available, else standard transaction
  const { data: rpcResult, error: rpcError } = await supabase.rpc('borrow_book', {
    p_book_id: Number(bookId),
    p_user_id: userId
  });

  if (!rpcError && rpcResult) {
    return rpcResult;
  }

  // Fallback direct logic if stored procedure was not yet executed
  const book = await getBookById(bookId);
  if (!book) throw new Error('Book not found');
  if (book.available_copies <= 0) throw new Error('No copies currently available to borrow');

  const { count } = await supabase
    .from('borrow_records')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'borrowed');

  if (count >= 5) {
    throw new Error('Borrowing limit reached: Maximum 5 books can be checked out concurrently');
  }

  const today = new Date().toISOString().split('T')[0];
  const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  await supabase.from('books').update({ available_copies: book.available_copies - 1 }).eq('id', bookId);

  const { data: newLoan, error: loanErr } = await supabase.from('borrow_records').insert([{
    user_id: userId,
    book_id: bookId,
    borrow_date: today,
    due_date: dueDate,
    status: 'borrowed'
  }]).select().single();

  if (loanErr) throw new Error(loanErr.message);

  return {
    record_id: newLoan.id,
    book_id: bookId,
    book_title: book.title,
    borrow_date: today,
    due_date: dueDate
  };
}

async function returnBook(userId, recordId) {
  const { data: rpcResult, error: rpcError } = await supabase.rpc('return_book', {
    p_record_id: Number(recordId),
    p_user_id: userId
  });

  if (!rpcError && rpcResult) {
    return rpcResult;
  }

  // Fallback direct return
  const { data: record, error: recErr } = await supabase
    .from('borrow_records')
    .select('*')
    .eq('id', recordId)
    .eq('user_id', userId)
    .single();

  if (recErr || !record) throw new Error('Loan record not found');
  if (record.status === 'returned') throw new Error('This book has already been returned');

  const today = new Date().toISOString().split('T')[0];

  await supabase.from('borrow_records').update({ return_date: today, status: 'returned' }).eq('id', recordId);
  const book = await getBookById(record.book_id);
  if (book) {
    await supabase.from('books').update({ available_copies: book.available_copies + 1 }).eq('id', record.book_id);
  }

  return { success: true, return_date: today, book_id: record.book_id };
}

// -------------------------------------------------------------
// ADMIN STATS
// -------------------------------------------------------------
async function getAdminStats() {
  const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'member');
  const { count: totalBooks } = await supabase.from('books').select('*', { count: 'exact', head: true });
  const { data: books } = await supabase.from('books').select('total_copies, available_copies');
  const { count: activeLoans } = await supabase.from('borrow_records').select('*', { count: 'exact', head: true }).eq('status', 'borrowed');

  const totalCopies = (books || []).reduce((sum, b) => sum + (b.total_copies || 0), 0);
  const availableCopies = (books || []).reduce((sum, b) => sum + (b.available_copies || 0), 0);

  const { data: allActiveLoans } = await supabase
    .from('borrow_records')
    .select(`
      id,
      borrow_date,
      due_date,
      profiles (name, email, member_id),
      books (title, isbn)
    `)
    .eq('status', 'borrowed')
    .order('due_date', { ascending: true });

  const formattedLoans = (allActiveLoans || []).map(l => ({
    record_id: l.id,
    borrow_date: l.borrow_date,
    due_date: l.due_date,
    user_name: l.profiles?.name || 'Unknown',
    user_email: l.profiles?.email || '',
    member_id: l.profiles?.member_id || '',
    book_title: l.books?.title || 'Unknown',
    isbn: l.books?.isbn || ''
  }));

  return {
    totalUsers: totalUsers || 0,
    totalBooks: totalBooks || 0,
    totalCopies,
    availableCopies,
    activeLoans: activeLoans || 0,
    allActiveLoans: formattedLoans
  };
}

// -------------------------------------------------------------
// WALLET OPERATIONS
// -------------------------------------------------------------
async function getUserWallet(userId) {
  const { data: profile } = await supabase.from('profiles').select('wallet_balance').eq('id', userId).single();
  const { data: transactions } = await supabase
    .from('wallet_transactions')
    .select('id, amount, type, description, created_at')
    .eq('user_id', userId)
    .order('id', { ascending: false });

  return {
    balance: Number(profile?.wallet_balance || 25.00),
    transactions: transactions || []
  };
}

async function topupWallet(userId, amount, method = 'Campus ID Card') {
  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 0) throw new Error('Please enter a valid amount');

  const { data: profile } = await supabase.from('profiles').select('wallet_balance').eq('id', userId).single();
  const newBalance = (Number(profile?.wallet_balance) || 0) + numAmount;

  await supabase.from('profiles').update({ wallet_balance: newBalance }).eq('id', userId);
  await supabase.from('wallet_transactions').insert([{
    user_id: userId,
    amount: numAmount,
    type: 'topup',
    description: `Wallet Top-Up via ${method}`
  }]);

  return getUserWallet(userId);
}

async function payFineWithWallet(userId, amount, bookTitle) {
  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 0) throw new Error('Invalid fine amount');

  const { data: profile } = await supabase.from('profiles').select('wallet_balance').eq('id', userId).single();
  const current = Number(profile?.wallet_balance) || 0;
  if (current < numAmount) {
    throw new Error(`Insufficient wallet balance ($${current.toFixed(2)}). Please top up.`);
  }

  const newBalance = current - numAmount;
  await supabase.from('profiles').update({ wallet_balance: newBalance }).eq('id', userId);
  await supabase.from('wallet_transactions').insert([{
    user_id: userId,
    amount: -numAmount,
    type: 'fine_payment',
    description: `Late Fee Clearance: ${bookTitle || 'Library Overdue Book'}`
  }]);

  return getUserWallet(userId);
}

module.exports = {
  supabase,
  isSupabaseConfigured,
  getAllBooks,
  getBookById,
  addBook,
  deleteBook,
  registerUser,
  loginUser,
  findUserById,
  getUserBorrowRecords,
  borrowBook,
  returnBook,
  getAdminStats,
  getUserWallet,
  topupWallet,
  payFineWithWallet
};
