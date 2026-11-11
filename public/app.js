/**
 * ATHENAEUM LIBRARY MANAGEMENT PORTAL
 * Client Application Logic
 */

// Application State
const state = {
  currentUser: null,
  token: localStorage.getItem('athenaeum_token') || null,
  books: [],
  activeCategory: 'All',
  searchQuery: '',
  availableOnly: false,
  userLoans: {
    activeLoans: [],
    history: []
  },
  wallet: {
    balance: 25.00,
    transactions: []
  },
  finesDue: 0.00,
  selectedBookForModal: null
};

// DOM Elements
const DOM = {
  // Navigation & Header
  navLinks: document.querySelectorAll('.nav-link, .footer-link'),
  sections: document.querySelectorAll('.content-section'),
  guestControls: document.getElementById('guestControls'),
  userControls: document.getElementById('userControls'),
  headerWalletPill: document.getElementById('headerWalletPill'),
  headerWalletAmount: document.getElementById('headerWalletAmount'),
  openAuthModalBtn: document.getElementById('openAuthModalBtn'),
  logoutBtn: document.getElementById('logoutBtn'),
  headerUserName: document.getElementById('headerUserName'),
  headerUserAvatar: document.getElementById('headerUserAvatar'),
  headerUserRole: document.getElementById('headerUserRole'),
  navAdminBtn: document.getElementById('navAdminBtn'),
  navDashboardBtn: document.getElementById('navDashboardBtn'),
  brandHomeLink: document.getElementById('brandHomeLink'),

  // Hero Metrics
  metricTotalTitles: document.getElementById('metricTotalTitles'),
  metricAvailableCopies: document.getElementById('metricAvailableCopies'),

  // Catalog Section
  bookSearchInput: document.getElementById('bookSearchInput'),
  searchClearBtn: document.getElementById('searchClearBtn'),
  filterAvailableOnly: document.getElementById('filterAvailableOnly'),
  categoryChips: document.querySelectorAll('.category-chip'),
  booksGrid: document.getElementById('booksGrid'),
  resultsCount: document.getElementById('resultsCount'),
  noBooksState: document.getElementById('noBooksState'),
  resetSearchBtn: document.getElementById('resetSearchBtn'),

  // Dashboard Section
  dashboardGuestBanner: document.getElementById('dashboardGuestBanner'),
  dashboardUserContent: document.getElementById('dashboardUserContent'),
  dashboardSignInBtn: document.getElementById('dashboardSignInBtn'),
  dashUserName: document.getElementById('dashUserName'),
  dashUserEmail: document.getElementById('dashUserEmail'),
  dashUserDept: document.getElementById('dashUserDept'),
  dashMemberId: document.getElementById('dashMemberId'),
  dashUserRole: document.getElementById('dashUserRole'),
  dashUserAvatar: document.getElementById('dashUserAvatar'),
  dashWalletBalance: document.getElementById('dashWalletBalance'),
  statActiveLoans: document.getElementById('statActiveLoans'),
  statReturnedLoans: document.getElementById('statReturnedLoans'),
  statDueSoon: document.getElementById('statDueSoon'),
  statWalletBalance: document.getElementById('statWalletBalance'),
  statFinesDue: document.getElementById('statFinesDue'),
  payFineBtn: document.getElementById('payFineBtn'),
  finesHintText: document.getElementById('finesHintText'),
  topupFromTileBtn: document.getElementById('topupFromTileBtn'),
  dashPanelWalletAmount: document.getElementById('dashPanelWalletAmount'),
  openWalletModalBtn: document.getElementById('openWalletModalBtn'),
  walletTransactionsTableBody: document.getElementById('walletTransactionsTableBody'),
  emptyWalletTxMsg: document.getElementById('emptyWalletTxMsg'),
  activeLoansContainer: document.getElementById('activeLoansContainer'),
  historyTableBody: document.getElementById('historyTableBody'),
  emptyHistoryMsg: document.getElementById('emptyHistoryMsg'),
  browseMoreFromDashBtn: document.getElementById('browseMoreFromDashBtn'),

  // Admin Section
  adminTotalTitles: document.getElementById('adminTotalTitles'),
  adminTotalCopies: document.getElementById('adminTotalCopies'),
  adminActiveLoans: document.getElementById('adminActiveLoans'),
  adminRegisteredUsers: document.getElementById('adminRegisteredUsers'),
  adminLoansTableBody: document.getElementById('adminLoansTableBody'),
  openAddBookModalBtn: document.getElementById('openAddBookModalBtn'),
  refreshAdminDataBtn: document.getElementById('refreshAdminDataBtn'),

  // Auth Dialog
  authDialog: document.getElementById('authDialog'),
  closeAuthDialogBtn: document.getElementById('closeAuthDialogBtn'),
  tabSignInBtn: document.getElementById('tabSignInBtn'),
  tabRegisterBtn: document.getElementById('tabRegisterBtn'),
  signInForm: document.getElementById('signInForm'),
  registerForm: document.getElementById('registerForm'),
  loginEmail: document.getElementById('loginEmail'),
  loginPassword: document.getElementById('loginPassword'),
  loginErrorMsg: document.getElementById('loginErrorMsg'),
  regName: document.getElementById('regName'),
  regEmail: document.getElementById('regEmail'),
  regDept: document.getElementById('regDept'),
  regPassword: document.getElementById('regPassword'),
  regErrorMsg: document.getElementById('regErrorMsg'),
  toggleLoginPasswordBtn: document.getElementById('toggleLoginPasswordBtn'),
  toggleRegPasswordBtn: document.getElementById('toggleRegPasswordBtn'),

  // Book Details Dialog
  bookDetailsDialog: document.getElementById('bookDetailsDialog'),
  closeDetailDialogBtn: document.getElementById('closeDetailDialogBtn'),
  closeDetailFooterBtn: document.getElementById('closeDetailFooterBtn'),
  detailCoverIcon: document.getElementById('detailCoverIcon'),
  detailBookTitle: document.getElementById('detailBookTitle'),
  detailBookAuthor: document.getElementById('detailBookAuthor'),
  detailCategory: document.getElementById('detailCategory'),
  detailRating: document.getElementById('detailRating'),
  detailAvailabilityBadge: document.getElementById('detailAvailabilityBadge'),
  detailDescription: document.getElementById('detailDescription'),
  detailShelf: document.getElementById('detailShelf'),
  detailIsbn: document.getElementById('detailIsbn'),
  detailYear: document.getElementById('detailYear'),
  detailInventory: document.getElementById('detailInventory'),
  detailBorrowBtn: document.getElementById('detailBorrowBtn'),

  // Add Book Dialog (Admin)
  addBookDialog: document.getElementById('addBookDialog'),
  closeAddBookDialogBtn: document.getElementById('closeAddBookDialogBtn'),
  cancelAddBookBtn: document.getElementById('cancelAddBookBtn'),
  addBookForm: document.getElementById('addBookForm'),

  // Wallet Dialog
  walletTopupDialog: document.getElementById('walletTopupDialog'),
  closeWalletDialogBtn: document.getElementById('closeWalletDialogBtn'),
  cancelWalletDialogBtn: document.getElementById('cancelWalletDialogBtn'),
  walletTopupForm: document.getElementById('walletTopupForm'),
  modalWalletCurrentBalance: document.getElementById('modalWalletCurrentBalance'),
  customTopupAmount: document.getElementById('customTopupAmount'),
  topupMethod: document.getElementById('topupMethod'),

  // Chatbot Widget
  chatLauncherBtn: document.getElementById('chatLauncherBtn'),
  chatWindow: document.getElementById('chatWindow'),
  chatCloseBtn: document.getElementById('chatCloseBtn'),
  chatMessages: document.getElementById('chatMessages'),
  chatSuggestions: document.getElementById('chatSuggestions'),
  chatForm: document.getElementById('chatForm'),
  chatInput: document.getElementById('chatInput'),

  // Toasts
  toastContainer: document.getElementById('toastContainer')
};

// ===================================================================
// UTILITY FUNCTIONS: TOASTS & API WRAPPERS
// ===================================================================

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const iconMap = {
    success: '✅',
    error: '⚠️',
    info: 'ℹ️'
  };

  toast.innerHTML = `
    <span class="toast-icon">${iconMap[type] || 'ℹ️'}</span>
    <span class="toast-message">${escapeHtml(message)}</span>
    <button type="button" class="toast-close" aria-label="Dismiss">&times;</button>
  `;

  toast.querySelector('.toast-close').addEventListener('click', () => {
    toast.remove();
  });

  DOM.toastContainer.appendChild(toast);

  setTimeout(() => {
    if (toast.parentElement) {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(30px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }
  }, 4000);
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

async function apiRequest(endpoint, method = 'GET', body = null) {
  const headers = {
    'Content-Type': 'application/json'
  };

  if (state.token) {
    headers['Authorization'] = `Bearer ${state.token}`;
  }

  const options = { method, headers };
  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(endpoint, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Server request failed');
  }

  return data;
}

// Dialog backdrop click helper (Light Dismiss adhering to Modern Web Guidance)
function setupDialogLightDismiss(dialog) {
  if (!dialog) return;
  dialog.addEventListener('click', (event) => {
    const rect = dialog.getBoundingClientRect();
    const isInDialog = (
      rect.top <= event.clientY &&
      event.clientY <= rect.top + rect.height &&
      rect.left <= event.clientX &&
      event.clientX <= rect.left + rect.width
    );
    if (!isInDialog) {
      dialog.close();
    }
  });
}

// ===================================================================
// AUTHENTICATION & SESSION MANAGEMENT
// ===================================================================

async function checkAuthSession() {
  if (!state.token) {
    updateAuthUI();
    return;
  }

  try {
    const data = await apiRequest('/api/auth/me');
    state.currentUser = data.user;
    updateAuthUI();
    loadUserLoans();
  } catch (err) {
    console.warn('Session expired or invalid:', err.message);
    logout(false);
  }
}

function updateAuthUI() {
  const isAuth = !!state.currentUser;

  if (isAuth) {
    DOM.guestControls.classList.add('hidden');
    DOM.userControls.classList.remove('hidden');

    DOM.headerUserName.textContent = state.currentUser.name;
    DOM.headerUserAvatar.textContent = getInitials(state.currentUser.name);
    DOM.headerUserRole.textContent = state.currentUser.role === 'admin' ? 'Head Librarian (Admin)' : (state.currentUser.department || 'Member');

    if (state.currentUser.role === 'admin') {
      DOM.navAdminBtn.classList.remove('hidden');
    } else {
      DOM.navAdminBtn.classList.add('hidden');
    }

    // Dashboard Banner vs Content
    DOM.dashboardGuestBanner.classList.add('hidden');
    DOM.dashboardUserContent.classList.remove('hidden');

    // Populate Member Digital ID Card
    DOM.dashUserName.textContent = state.currentUser.name;
    DOM.dashUserEmail.textContent = state.currentUser.email;
    DOM.dashUserDept.textContent = state.currentUser.department || 'General Academic';
    DOM.dashMemberId.textContent = state.currentUser.member_id;
    DOM.dashUserRole.textContent = state.currentUser.role === 'admin' ? 'Administrator' : 'Student / Member';
    DOM.dashUserAvatar.textContent = getInitials(state.currentUser.name);

    if (state.currentUser.wallet_balance !== undefined) {
      const balStr = `$${Number(state.currentUser.wallet_balance).toFixed(2)}`;
      if (DOM.headerWalletAmount) DOM.headerWalletAmount.textContent = balStr;
      if (DOM.dashWalletBalance) DOM.dashWalletBalance.textContent = balStr;
      if (DOM.statWalletBalance) DOM.statWalletBalance.textContent = balStr;
      if (DOM.dashPanelWalletAmount) DOM.dashPanelWalletAmount.textContent = balStr;
    }

  } else {
    DOM.guestControls.classList.remove('hidden');
    DOM.userControls.classList.add('hidden');
    DOM.navAdminBtn.classList.add('hidden');

    DOM.dashboardGuestBanner.classList.remove('hidden');
    DOM.dashboardUserContent.classList.add('hidden');
  }

  // Re-render books so borrow button states reflect current user status
  renderBooksGrid();
}

function getInitials(name) {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0].substring(0, 2).toUpperCase();
}

function logout(notify = true, reload = true) {
  state.currentUser = null;
  state.token = null;
  localStorage.removeItem('athenaeum_token');
  state.userLoans = { activeLoans: [], history: [] };

  if (reload) {
    if (notify) {
      sessionStorage.setItem('flash_toast', JSON.stringify({
        message: 'You have signed out of your library account.',
        type: 'info'
      }));
    }
    sessionStorage.setItem('active_tab', 'catalog');
    window.location.reload();
    return;
  }

  updateAuthUI();
  switchTab('catalog');

  if (notify) {
    showToast('You have signed out of your library account.', 'info');
  }
}

// Switch between Sign In and Register tabs
function switchAuthTab(tab) {
  DOM.loginErrorMsg.classList.add('hidden');
  DOM.regErrorMsg.classList.add('hidden');

  if (tab === 'signIn') {
    DOM.tabSignInBtn.classList.add('active');
    DOM.tabSignInBtn.setAttribute('aria-selected', 'true');
    DOM.tabRegisterBtn.classList.remove('active');
    DOM.tabRegisterBtn.setAttribute('aria-selected', 'false');

    DOM.signInForm.classList.remove('hidden');
    DOM.registerForm.classList.add('hidden');
  } else {
    DOM.tabRegisterBtn.classList.add('active');
    DOM.tabRegisterBtn.setAttribute('aria-selected', 'true');
    DOM.tabSignInBtn.classList.remove('active');
    DOM.tabSignInBtn.setAttribute('aria-selected', 'false');

    DOM.registerForm.classList.remove('hidden');
    DOM.signInForm.classList.add('hidden');
  }
}

// Password toggle helper
function setupPasswordToggle(btn, input) {
  btn.addEventListener('click', () => {
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    btn.setAttribute('aria-pressed', isPassword ? 'true' : 'false');
    btn.textContent = isPassword ? '🙈' : '👁️';
  });
}

// ===================================================================
// NAVIGATION & TAB SWITCHING
// ===================================================================

function switchTab(tabId) {
  // Update nav buttons
  DOM.navLinks.forEach(link => {
    if (link.dataset.tab === tabId) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Update content sections
  DOM.sections.forEach(sec => {
    if (sec.id === `${tabId}Section`) {
      sec.classList.add('active');
    } else {
      sec.classList.remove('active');
    }
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Load specific data on demand
  if (tabId === 'dashboard' && state.currentUser) {
    loadUserLoans();
  } else if (tabId === 'admin' && state.currentUser?.role === 'admin') {
    loadAdminData();
  }
}

// ===================================================================
// CATALOG & BOOKS DATA
// ===================================================================

async function loadBooks() {
  try {
    let url = `/api/books?category=${encodeURIComponent(state.activeCategory)}`;
    if (state.searchQuery) {
      url += `&search=${encodeURIComponent(state.searchQuery)}`;
    }
    if (state.availableOnly) {
      url += `&availableOnly=true`;
    }

    const data = await apiRequest(url);
    state.books = data.books;

    // Update hero counters
    const totalCopies = state.books.reduce((sum, b) => sum + b.total_copies, 0);
    const availableCopies = state.books.reduce((sum, b) => sum + b.available_copies, 0);

    if (DOM.metricTotalTitles) DOM.metricTotalTitles.textContent = state.books.length;
    if (DOM.metricAvailableCopies) DOM.metricAvailableCopies.textContent = availableCopies;

    renderBooksGrid();
  } catch (err) {
    console.error('Failed to load books:', err);
    showToast('Failed to load catalog books: ' + err.message, 'error');
  }
}

function renderBooksGrid() {
  DOM.booksGrid.innerHTML = '';

  if (state.books.length === 0) {
    DOM.booksGrid.classList.add('hidden');
    DOM.noBooksState.classList.remove('hidden');
    DOM.resultsCount.textContent = '0 books found';
    return;
  }

  DOM.booksGrid.classList.remove('hidden');
  DOM.noBooksState.classList.add('hidden');
  DOM.resultsCount.textContent = `Showing ${state.books.length} book${state.books.length === 1 ? '' : 's'}`;

  // Check which books currently logged in user has borrowed
  const userBorrowedBookIds = new Set(
    state.userLoans.activeLoans.map(loan => loan.book_id)
  );

  state.books.forEach(book => {
    const isAvailable = book.available_copies > 0;
    const isAlreadyBorrowed = userBorrowedBookIds.has(book.id);

    const card = document.createElement('article');
    card.className = 'book-card';

    // Status Badge
    let statusBadgeHtml = '';
    if (isAlreadyBorrowed) {
      statusBadgeHtml = `<span class="book-status-badge available" style="background:#dbeafe; color:#1d4ed8;">📌 In Your Active Loans</span>`;
    } else if (isAvailable) {
      statusBadgeHtml = `<span class="book-status-badge available">✓ Available (${book.available_copies} of ${book.total_copies} copies)</span>`;
    } else {
      statusBadgeHtml = `<span class="book-status-badge unavailable">✕ All Copies Checked Out</span>`;
    }

    // Action button logic
    let actionBtnHtml = '';
    if (isAlreadyBorrowed) {
      actionBtnHtml = `<button type="button" class="btn btn-outline btn-sm" disabled>Checked Out by You</button>`;
    } else if (!isAvailable) {
      actionBtnHtml = `<button type="button" class="btn btn-outline btn-sm" disabled>Unavailable</button>`;
    } else {
      actionBtnHtml = `<button type="button" class="btn btn-primary btn-sm btn-borrow" data-id="${book.id}">Borrow Book</button>`;
    }

    card.innerHTML = `
      <div class="book-card-top">
        <div class="book-icon-box" title="${escapeHtml(book.category)}">
          ${book.cover_icon || '📚'}
        </div>
        <div class="book-title-group">
          <span class="book-category-tag">${escapeHtml(book.category)}</span>
          <h3 class="book-title" title="${escapeHtml(book.title)}">${escapeHtml(book.title)}</h3>
          <p class="book-author">by ${escapeHtml(book.author)}</p>
        </div>
      </div>

      <p class="book-description">${escapeHtml(book.description)}</p>

      <div class="book-meta-row">
        <span class="book-shelf">📍 ${escapeHtml(book.shelf_location)}</span>
        <span class="book-rating">★ ${book.rating.toFixed(1)}</span>
      </div>

      ${statusBadgeHtml}

      <div class="book-actions">
        <button type="button" class="btn btn-outline btn-sm btn-details" data-id="${book.id}">Details</button>
        ${actionBtnHtml}
      </div>
    `;

    // Event listeners
    const borrowBtn = card.querySelector('.btn-borrow');
    if (borrowBtn) {
      borrowBtn.addEventListener('click', () => handleBorrowBook(book.id));
    }

    const detailsBtn = card.querySelector('.btn-details');
    if (detailsBtn) {
      detailsBtn.addEventListener('click', () => openBookDetails(book));
    }

    DOM.booksGrid.appendChild(card);
  });
}

function openBookDetails(book) {
  state.selectedBookForModal = book;

  DOM.detailCoverIcon.textContent = book.cover_icon || '📚';
  DOM.detailBookTitle.textContent = book.title;
  DOM.detailBookAuthor.textContent = `by ${book.author}`;
  DOM.detailCategory.textContent = book.category;
  DOM.detailRating.textContent = `★ ${book.rating.toFixed(1)} / 5.0`;
  DOM.detailDescription.textContent = book.description;
  DOM.detailShelf.textContent = book.shelf_location;
  DOM.detailIsbn.textContent = book.isbn;
  DOM.detailYear.textContent = book.publication_year;
  DOM.detailInventory.textContent = `${book.available_copies} of ${book.total_copies} Copies Available`;

  const isAvailable = book.available_copies > 0;
  const isAlreadyBorrowed = state.userLoans.activeLoans.some(l => l.book_id === book.id);

  if (isAlreadyBorrowed) {
    DOM.detailAvailabilityBadge.className = 'badge';
    DOM.detailAvailabilityBadge.style.background = '#dbeafe';
    DOM.detailAvailabilityBadge.style.color = '#1d4ed8';
    DOM.detailAvailabilityBadge.textContent = 'In Your Active Loans';
    DOM.detailBorrowBtn.disabled = true;
    DOM.detailBorrowBtn.textContent = 'Already Borrowed';
  } else if (isAvailable) {
    DOM.detailAvailabilityBadge.className = 'badge';
    DOM.detailAvailabilityBadge.style.background = 'var(--success-bg)';
    DOM.detailAvailabilityBadge.style.color = 'var(--success)';
    DOM.detailAvailabilityBadge.textContent = 'Available Now';
    DOM.detailBorrowBtn.disabled = false;
    DOM.detailBorrowBtn.textContent = 'Borrow This Book';
  } else {
    DOM.detailAvailabilityBadge.className = 'badge';
    DOM.detailAvailabilityBadge.style.background = 'var(--danger-bg)';
    DOM.detailAvailabilityBadge.style.color = 'var(--danger)';
    DOM.detailAvailabilityBadge.textContent = 'All Copies Checked Out';
    DOM.detailBorrowBtn.disabled = true;
    DOM.detailBorrowBtn.textContent = 'Unavailable';
  }

  DOM.bookDetailsDialog.showModal();
}

// ===================================================================
// USER LOANS: BORROWING & RETURNS
// ===================================================================

async function loadUserLoans() {
  if (!state.currentUser) return;

  try {
    const data = await apiRequest('/api/user/borrowed');
    state.userLoans = data;

    // Update stat counters
    DOM.statActiveLoans.textContent = `${data.activeCount} / 5`;
    DOM.statReturnedLoans.textContent = data.historyCount;

    // Calculate due soon (due within 7 days or overdue)
    const dueSoonCount = data.activeLoans.filter(l => l.daysRemaining <= 7).length;
    DOM.statDueSoon.textContent = dueSoonCount;

    renderActiveLoans();
    renderHistoryTable();
    await loadWalletData();
    renderBooksGrid(); // Refresh catalog borrow button status
  } catch (err) {
    console.error('Failed to load user loans:', err);
  }
}

function renderActiveLoans() {
  DOM.activeLoansContainer.innerHTML = '';

  if (state.userLoans.activeLoans.length === 0) {
    DOM.activeLoansContainer.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1; padding: 2.5rem 1rem;">
        <div class="empty-icon">📖</div>
        <h3>No books currently checked out</h3>
        <p>You can check out up to 5 books at a time. Browse our catalog and start reading!</p>
        <button type="button" class="btn btn-primary btn-sm" id="emptyBrowseBtn">Browse Catalog</button>
      </div>
    `;
    const btn = document.getElementById('emptyBrowseBtn');
    if (btn) btn.addEventListener('click', () => switchTab('catalog'));
    return;
  }

  state.userLoans.activeLoans.forEach(loan => {
    const card = document.createElement('div');
    card.className = `active-loan-card ${loan.isOverdue ? 'overdue' : ''}`;

    let countdownClass = 'good';
    let countdownText = `${loan.daysRemaining} days left`;

    if (loan.isOverdue) {
      countdownClass = 'danger';
      countdownText = `⚠️ Overdue by ${Math.abs(loan.daysRemaining)} day${Math.abs(loan.daysRemaining) === 1 ? '' : 's'}`;
    } else if (loan.daysRemaining <= 3) {
      countdownClass = 'warning';
      countdownText = `⏰ Due soon (${loan.daysRemaining} days left)`;
    }

    card.innerHTML = `
      <div class="loan-card-top">
        <div class="loan-cover-icon">${loan.cover_icon || '📚'}</div>
        <div class="loan-info-group">
          <h4 class="loan-book-title">${escapeHtml(loan.title)}</h4>
          <p class="loan-book-author">by ${escapeHtml(loan.author)}</p>
          <span style="font-size:0.75rem; color:var(--text-muted);">📍 ${escapeHtml(loan.shelf_location)}</span>
        </div>
      </div>

      <div class="loan-dates-box">
        <div class="loan-date-row">
          <span class="loan-date-label">Borrowed on:</span>
          <span class="loan-date-val">${loan.borrow_date}</span>
        </div>
        <div class="loan-date-row">
          <span class="loan-date-label">Due Date:</span>
          <span class="loan-date-val">${loan.due_date}</span>
        </div>
        <div class="loan-date-row" style="margin-top:0.25rem;">
          <span class="loan-date-label">Loan Status:</span>
          <span class="due-countdown-badge ${countdownClass}">${countdownText}</span>
        </div>
      </div>

      <button type="button" class="btn btn-outline btn-block btn-return" data-record-id="${loan.record_id}" data-title="${escapeHtml(loan.title)}">
        🔄 Return Book
      </button>
    `;

    card.querySelector('.btn-return').addEventListener('click', () => {
      handleReturnBook(loan.record_id, loan.title);
    });

    DOM.activeLoansContainer.appendChild(card);
  });
}

function renderHistoryTable() {
  DOM.historyTableBody.innerHTML = '';

  if (state.userLoans.history.length === 0) {
    DOM.emptyHistoryMsg.classList.remove('hidden');
    return;
  }

  DOM.emptyHistoryMsg.classList.add('hidden');

  state.userLoans.history.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <strong>${escapeHtml(item.title)}</strong><br>
        <small style="color:var(--text-muted);">${escapeHtml(item.author)}</small>
      </td>
      <td><span class="badge badge-category">${escapeHtml(item.category)}</span></td>
      <td>${item.borrow_date}</td>
      <td>${item.return_date || '-'}</td>
      <td><span class="due-countdown-badge good">Returned ✓</span></td>
    `;
    DOM.historyTableBody.appendChild(tr);
  });
}

async function handleBorrowBook(bookId) {
  if (!state.currentUser) {
    showToast('Please sign in or register to borrow books.', 'info');
    DOM.authDialog.showModal();
    return;
  }

  try {
    const data = await apiRequest('/api/user/borrow', 'POST', { bookId });
    showToast(data.message, 'success');

    // Close details dialog if open
    if (DOM.bookDetailsDialog.open) {
      DOM.bookDetailsDialog.close();
    }

    // Refresh state
    await loadBooks();
    await loadUserLoans();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function handleReturnBook(recordId, bookTitle) {
  try {
    const data = await apiRequest('/api/user/return', 'POST', { recordId });
    showToast(`"${bookTitle}" returned successfully!`, 'success');

    await loadBooks();
    await loadUserLoans();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ===================================================================
// USER WALLET OPERATIONS
// ===================================================================

async function loadWalletData() {
  if (!state.currentUser) return;
  try {
    const wallet = await apiRequest('/api/user/wallet');
    state.wallet = wallet;

    // Calculate overdue fines from active loans
    const today = new Date().toISOString().split('T')[0];
    let totalFines = 0.00;
    let overdueBookTitle = '';
    (state.userLoans?.activeLoans || []).forEach(loan => {
      if (loan.due_date < today) {
        const diffDays = Math.ceil((new Date(today) - new Date(loan.due_date)) / (1000 * 60 * 60 * 24));
        totalFines += diffDays * 0.50;
        overdueBookTitle = loan.title;
      }
    });
    state.finesDue = totalFines;

    // Update Header Pill
    if (DOM.headerWalletAmount) DOM.headerWalletAmount.textContent = `$${wallet.balance.toFixed(2)}`;

    // Update Digital Card
    if (DOM.dashWalletBalance) DOM.dashWalletBalance.textContent = `$${wallet.balance.toFixed(2)}`;

    // Update Dashboard Panel
    if (DOM.dashPanelWalletAmount) DOM.dashPanelWalletAmount.textContent = `$${wallet.balance.toFixed(2)}`;

    // Update Modal current balance
    if (DOM.modalWalletCurrentBalance) DOM.modalWalletCurrentBalance.textContent = `$${wallet.balance.toFixed(2)}`;

    // Update Stat Tiles
    if (DOM.statWalletBalance) DOM.statWalletBalance.textContent = `$${wallet.balance.toFixed(2)}`;
    if (DOM.statFinesDue) DOM.statFinesDue.textContent = `$${totalFines.toFixed(2)}`;

    if (totalFines > 0) {
      if (DOM.finesHintText) DOM.finesHintText.textContent = `Overdue fines accrued ($0.50/day)`;
      if (DOM.payFineBtn) {
        DOM.payFineBtn.classList.remove('hidden');
        DOM.payFineBtn.textContent = `Pay $${totalFines.toFixed(2)} with Wallet`;
        DOM.payFineBtn.onclick = () => handlePayFine(totalFines, overdueBookTitle);
      }
    } else {
      if (DOM.finesHintText) DOM.finesHintText.textContent = `No fees pending`;
      if (DOM.payFineBtn) DOM.payFineBtn.classList.add('hidden');
    }

    renderWalletTransactions();
  } catch (err) {
    console.error('Failed to load wallet data:', err);
  }
}

function renderWalletTransactions() {
  if (!DOM.walletTransactionsTableBody) return;
  DOM.walletTransactionsTableBody.innerHTML = '';

  const txs = state.wallet.transactions || [];
  if (txs.length === 0) {
    if (DOM.emptyWalletTxMsg) DOM.emptyWalletTxMsg.classList.remove('hidden');
    return;
  }

  if (DOM.emptyWalletTxMsg) DOM.emptyWalletTxMsg.classList.add('hidden');

  txs.forEach(tx => {
    const isTopup = tx.amount > 0;
    const badgeClass = isTopup ? 'topup' : 'fine';
    const amtClass = isTopup ? 'positive' : 'negative';
    const sign = isTopup ? '+' : '';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(tx.created_at)}</td>
      <td><span class="tx-badge ${badgeClass}">${escapeHtml(tx.type.replace('_', ' '))}</span></td>
      <td><strong>${escapeHtml(tx.description)}</strong></td>
      <td class="tx-amount ${amtClass}">${sign}$${Math.abs(tx.amount).toFixed(2)}</td>
      <td><span class="due-countdown-badge good">Completed ✓</span></td>
    `;
    DOM.walletTransactionsTableBody.appendChild(tr);
  });
}

async function handleTopup(amount, method = 'Campus Student ID Card') {
  try {
    const data = await apiRequest('/api/user/wallet/topup', 'POST', { amount, method });
    showToast(data.message, 'success');
    if (DOM.walletTopupDialog.open) DOM.walletTopupDialog.close();
    await loadWalletData();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function handlePayFine(amount, bookTitle) {
  try {
    const data = await apiRequest('/api/user/wallet/pay-fine', 'POST', { amount, bookTitle });
    showToast(data.message, 'success');
    await loadWalletData();
    await loadUserLoans();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ===================================================================
// ADMIN CONSOLE DATA & ADD BOOK
// ===================================================================

async function loadAdminData() {
  if (!state.currentUser || state.currentUser.role !== 'admin') return;

  try {
    const data = await apiRequest('/api/admin/overview');
    DOM.adminTotalTitles.textContent = data.totalBooks;
    DOM.adminTotalCopies.textContent = data.totalCopies;
    DOM.adminActiveLoans.textContent = data.activeLoans;
    DOM.adminRegisteredUsers.textContent = data.totalUsers;

    DOM.adminLoansTableBody.innerHTML = '';
    if (data.allActiveLoans.length === 0) {
      DOM.adminLoansTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:1.5rem; color:var(--text-muted);">No active loans in the library right now.</td></tr>`;
      return;
    }

    data.allActiveLoans.forEach(loan => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <strong>${escapeHtml(loan.user_name)}</strong><br>
          <small style="color:var(--text-muted);">${escapeHtml(loan.user_email)}</small>
        </td>
        <td><code>${escapeHtml(loan.member_id)}</code></td>
        <td><strong>${escapeHtml(loan.book_title)}</strong></td>
        <td><small>${escapeHtml(loan.isbn)}</small></td>
        <td>${loan.borrow_date}</td>
        <td><span class="due-countdown-badge good">${loan.due_date}</span></td>
      `;
      DOM.adminLoansTableBody.appendChild(tr);
    });
  } catch (err) {
    showToast('Failed to load admin circulation data: ' + err.message, 'error');
  }
}

// ===================================================================
// CHATBOT ASSISTANT ("Libby")
// ===================================================================

function toggleChat() {
  const isHidden = DOM.chatWindow.classList.contains('hidden');
  if (isHidden) {
    DOM.chatWindow.classList.remove('hidden');
    DOM.chatLauncherBtn.setAttribute('aria-expanded', 'true');
    DOM.chatInput.focus();
  } else {
    DOM.chatWindow.classList.add('hidden');
    DOM.chatLauncherBtn.setAttribute('aria-expanded', 'false');
  }
}

async function sendChatMessage(messageText) {
  const text = (messageText || DOM.chatInput.value).trim();
  if (!text) return;

  DOM.chatInput.value = '';

  // Append user message
  appendChatMessage(text, 'user');

  // Add temporary typing indicator
  const typingBubble = document.createElement('div');
  typingBubble.className = 'chat-message bot typing';
  typingBubble.innerHTML = `<div class="msg-bubble"><em>Libby is searching...</em></div>`;
  DOM.chatMessages.appendChild(typingBubble);
  DOM.chatMessages.scrollTop = DOM.chatMessages.scrollHeight;

  try {
    const data = await apiRequest('/api/chat', 'POST', { message: text });
    typingBubble.remove();

    appendChatMessage(data.reply, 'bot', data.recommendations);

    // Update suggestions if provided
    if (data.suggestions && data.suggestions.length > 0) {
      renderChatSuggestions(data.suggestions);
    }
  } catch (err) {
    typingBubble.remove();
    appendChatMessage('Sorry, I encountered an issue connecting to the library catalog. Please try again.', 'bot');
  }
}

function appendChatMessage(text, sender, recommendations = []) {
  const msgWrapper = document.createElement('div');
  msgWrapper.className = `chat-message ${sender}`;

  // Format basic bold and markdown lists
  let formattedText = escapeHtml(text)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n•/g, '<br>•')
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>');

  let recsHtml = '';
  if (recommendations && recommendations.length > 0) {
    recsHtml = '<div class="chat-recs-container">';
    recommendations.forEach(rec => {
      recsHtml += `
        <div class="chat-rec-card">
          <div class="chat-rec-left">
            <span>${rec.cover_icon || '📖'}</span>
            <div>
              <div class="chat-rec-title" title="${escapeHtml(rec.title)}">${escapeHtml(rec.title)}</div>
              <div class="chat-rec-author">by ${escapeHtml(rec.author)}</div>
            </div>
          </div>
          <button type="button" class="btn btn-sm btn-outline chat-view-book-btn" data-id="${rec.id}">
            View
          </button>
        </div>
      `;
    });
    recsHtml += '</div>';
  }

  msgWrapper.innerHTML = `
    <div class="msg-bubble">
      ${formattedText}
      ${recsHtml}
    </div>
  `;

  // Attach view book listeners
  msgWrapper.querySelectorAll('.chat-view-book-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const bookId = btn.dataset.id;
      try {
        const book = await apiRequest(`/api/books/${bookId}`);
        openBookDetails(book);
      } catch (e) {
        showToast('Could not load book details.', 'error');
      }
    });
  });

  DOM.chatMessages.appendChild(msgWrapper);
  DOM.chatMessages.scrollTop = DOM.chatMessages.scrollHeight;
}

function renderChatSuggestions(suggestions) {
  DOM.chatSuggestions.innerHTML = '';
  suggestions.forEach(sug => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chat-chip';
    chip.textContent = sug;
    chip.addEventListener('click', () => sendChatMessage(sug));
    DOM.chatSuggestions.appendChild(chip);
  });
}

// ===================================================================
// EVENT LISTENERS INITIALIZATION
// ===================================================================

function setupEventListeners() {
  // Setup light dismiss on all dialogs
  setupDialogLightDismiss(DOM.authDialog);
  setupDialogLightDismiss(DOM.bookDetailsDialog);
  setupDialogLightDismiss(DOM.addBookDialog);
  setupDialogLightDismiss(DOM.walletTopupDialog);

  // Navigation tab clicks
  DOM.navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetTab = link.dataset.tab;
      if (targetTab) switchTab(targetTab);
    });
  });

  DOM.brandHomeLink.addEventListener('click', (e) => {
    e.preventDefault();
    switchTab('catalog');
  });

  // Auth Dialog Triggers
  DOM.openAuthModalBtn.addEventListener('click', () => {
    switchAuthTab('signIn');
    DOM.authDialog.showModal();
  });

  DOM.dashboardSignInBtn.addEventListener('click', () => {
    switchAuthTab('signIn');
    DOM.authDialog.showModal();
  });

  DOM.closeAuthDialogBtn.addEventListener('click', () => DOM.authDialog.close());

  DOM.tabSignInBtn.addEventListener('click', () => switchAuthTab('signIn'));
  DOM.tabRegisterBtn.addEventListener('click', () => switchAuthTab('register'));

  // Password Toggles
  setupPasswordToggle(DOM.toggleLoginPasswordBtn, DOM.loginPassword);
  setupPasswordToggle(DOM.toggleRegPasswordBtn, DOM.regPassword);

  // Sign In Form Submit
  DOM.signInForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    DOM.loginErrorMsg.classList.add('hidden');

    try {
      const data = await apiRequest('/api/auth/login', 'POST', {
        email: DOM.loginEmail.value,
        password: DOM.loginPassword.value
      });

      localStorage.setItem('athenaeum_token', data.token);
      sessionStorage.setItem('flash_toast', JSON.stringify({
        message: `Welcome back, ${data.user.name}!`,
        type: 'success'
      }));
      sessionStorage.setItem('active_tab', 'dashboard');

      DOM.authDialog.close();
      DOM.signInForm.reset();

      // Refresh the page every time on sign in
      window.location.reload();
    } catch (err) {
      DOM.loginErrorMsg.textContent = err.message;
      DOM.loginErrorMsg.classList.remove('hidden');
    }
  });

  // Register Form Submit
  DOM.registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    DOM.regErrorMsg.classList.add('hidden');

    try {
      const data = await apiRequest('/api/auth/register', 'POST', {
        name: DOM.regName.value,
        email: DOM.regEmail.value,
        password: DOM.regPassword.value,
        department: DOM.regDept.value
      });

      localStorage.setItem('athenaeum_token', data.token);
      sessionStorage.setItem('flash_toast', JSON.stringify({
        message: `Welcome to Athenaeum Library, ${data.user.name}! Your card ID is ${data.user.member_id}.`,
        type: 'success'
      }));
      sessionStorage.setItem('active_tab', 'dashboard');

      DOM.authDialog.close();
      DOM.registerForm.reset();

      // Refresh the page every time on sign in/registration
      window.location.reload();
    } catch (err) {
      DOM.regErrorMsg.textContent = err.message;
      DOM.regErrorMsg.classList.remove('hidden');
    }
  });

  // Logout
  DOM.logoutBtn.addEventListener('click', () => logout(true));

  // Category Filter Chips
  DOM.categoryChips.forEach(chip => {
    chip.addEventListener('click', () => {
      DOM.categoryChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.activeCategory = chip.dataset.category;
      loadBooks();
    });
  });

  // Search Input with Debounce & Clear
  let debounceTimer;
  DOM.bookSearchInput.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    if (val) {
      DOM.searchClearBtn.classList.remove('hidden');
    } else {
      DOM.searchClearBtn.classList.add('hidden');
    }

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      state.searchQuery = val;
      loadBooks();
    }, 250);
  });

  DOM.searchClearBtn.addEventListener('click', () => {
    DOM.bookSearchInput.value = '';
    DOM.searchClearBtn.classList.add('hidden');
    state.searchQuery = '';
    loadBooks();
  });

  DOM.filterAvailableOnly.addEventListener('change', (e) => {
    state.availableOnly = e.target.checked;
    loadBooks();
  });

  DOM.resetSearchBtn.addEventListener('click', () => {
    DOM.bookSearchInput.value = '';
    DOM.searchClearBtn.classList.add('hidden');
    state.searchQuery = '';
    state.availableOnly = false;
    DOM.filterAvailableOnly.checked = false;
    state.activeCategory = 'All';
    DOM.categoryChips.forEach(c => c.classList.toggle('active', c.dataset.category === 'All'));
    loadBooks();
  });

  // Book Details Dialog buttons
  DOM.closeDetailDialogBtn.addEventListener('click', () => DOM.bookDetailsDialog.close());
  DOM.closeDetailFooterBtn.addEventListener('click', () => DOM.bookDetailsDialog.close());
  DOM.detailBorrowBtn.addEventListener('click', () => {
    if (state.selectedBookForModal) {
      handleBorrowBook(state.selectedBookForModal.id);
    }
  });

  // Admin Add Book Dialog
  DOM.openAddBookModalBtn.addEventListener('click', () => DOM.addBookDialog.showModal());
  DOM.closeAddBookDialogBtn.addEventListener('click', () => DOM.addBookDialog.close());
  DOM.cancelAddBookBtn.addEventListener('click', () => DOM.addBookDialog.close());

  DOM.addBookForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const newBookData = {
        title: document.getElementById('newBookTitle').value,
        author: document.getElementById('newBookAuthor').value,
        isbn: document.getElementById('newBookIsbn').value,
        category: document.getElementById('newBookCategory').value,
        total_copies: document.getElementById('newBookCopies').value,
        publication_year: document.getElementById('newBookYear').value,
        cover_icon: document.getElementById('newBookIcon').value,
        shelf_location: document.getElementById('newBookShelf').value,
        description: document.getElementById('newBookDesc').value
      };

      await apiRequest('/api/books', 'POST', newBookData);

      showToast(`"${newBookData.title}" added to library catalog!`, 'success');
      DOM.addBookDialog.close();
      DOM.addBookForm.reset();

      await loadBooks();
      await loadAdminData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  DOM.refreshAdminDataBtn.addEventListener('click', () => {
    loadAdminData();
    showToast('Circulation data refreshed', 'info');
  });

  if (DOM.browseMoreFromDashBtn) {
    DOM.browseMoreFromDashBtn.addEventListener('click', () => switchTab('catalog'));
  }

  // Wallet Modal & Deposit Event Listeners
  function openWalletModal() {
    if (!state.currentUser) {
      showToast('Please sign in to access your library wallet.', 'info');
      DOM.authDialog.showModal();
      return;
    }
    if (DOM.modalWalletCurrentBalance) {
      DOM.modalWalletCurrentBalance.textContent = `$${(state.wallet?.balance || 25.00).toFixed(2)}`;
    }
    DOM.walletTopupDialog.showModal();
  }

  if (DOM.headerWalletPill) DOM.headerWalletPill.addEventListener('click', openWalletModal);
  if (DOM.topupFromTileBtn) DOM.topupFromTileBtn.addEventListener('click', openWalletModal);
  if (DOM.openWalletModalBtn) DOM.openWalletModalBtn.addEventListener('click', openWalletModal);
  if (DOM.closeWalletDialogBtn) DOM.closeWalletDialogBtn.addEventListener('click', () => DOM.walletTopupDialog.close());
  if (DOM.cancelWalletDialogBtn) DOM.cancelWalletDialogBtn.addEventListener('click', () => DOM.walletTopupDialog.close());

  // Quick preset buttons inside wallet topup dialog
  document.querySelectorAll('.wallet-preset-grid .preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.wallet-preset-grid .preset-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      DOM.customTopupAmount.value = btn.dataset.amt;
    });
  });

  // Quick deposit buttons in dashboard panel
  document.querySelectorAll('.quick-topup-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const amt = Number(btn.dataset.amt);
      handleTopup(amt, 'Quick Campus Deposit');
    });
  });

  // Wallet topup form submit
  if (DOM.walletTopupForm) {
    DOM.walletTopupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const amt = Number(DOM.customTopupAmount.value);
      const method = DOM.topupMethod.value;
      await handleTopup(amt, method);
    });
  }

  // Chatbot Event Listeners
  DOM.chatLauncherBtn.addEventListener('click', toggleChat);
  DOM.chatCloseBtn.addEventListener('click', toggleChat);

  // IME safe Enter key submission adhering to Modern Web Guidance
  DOM.chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      sendChatMessage();
    }
  });

  DOM.chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    sendChatMessage();
  });

  // Default suggestions chips click
  DOM.chatSuggestions.querySelectorAll('.chat-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      sendChatMessage(chip.dataset.msg);
    });
  });
}

// ===================================================================
// APP INITIALIZATION
// ===================================================================

async function initApp() {
  setupEventListeners();

  // Show flash notification if page was just reloaded from sign-in/sign-out
  const flashToast = sessionStorage.getItem('flash_toast');
  if (flashToast) {
    try {
      const { message, type } = JSON.parse(flashToast);
      showToast(message, type);
    } catch (e) {}
    sessionStorage.removeItem('flash_toast');
  }

  const savedTab = sessionStorage.getItem('active_tab');
  if (savedTab) {
    switchTab(savedTab);
    sessionStorage.removeItem('active_tab');
  }

  await checkAuthSession();
  await loadBooks();

  // Check backend & database status
  try {
    const sys = await apiRequest('/api/system/status');
    const dbStatusText = document.getElementById('dbStatusText');
    if (dbStatusText) {
      if (sys.supabaseConfigured) {
        dbStatusText.textContent = 'Backend: ⚡ Connected to Supabase (PostgreSQL)';
      } else {
        dbStatusText.textContent = 'Backend: Supabase-Ready (Local SQLite)';
      }
    }
  } catch {}
}

// Boot up once DOM is ready
document.addEventListener('DOMContentLoaded', initApp);
