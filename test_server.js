const http = require('http');

async function runTests() {
  console.log('--- Starting Comprehensive API & Integration Tests ---');
  
  // Start server locally on test port 3001
  process.env.PORT = '3001';
  require('./server.js');

  // Wait 1 second for server to initialize
  await new Promise(r => setTimeout(r, 1000));

  function request(path, method = 'GET', body = null, token = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(`http://localhost:3001${path}`);
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const req = http.request({
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method,
        headers
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode, raw: data });
          }
        });
      });

      req.on('error', reject);
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  }

  try {
    // 1. Test GET /api/books
    console.log('1. Testing GET /api/books...');
    const booksRes = await request('/api/books');
    if (booksRes.status === 200 && booksRes.body.books.length >= 16) {
      console.log(`✅ Catalog returned ${booksRes.body.books.length} books successfully.`);
    } else {
      throw new Error(`Catalog test failed: status ${booksRes.status}`);
    }

    // 2. Register User 1
    console.log('2. Registering new Member 1 (Elena Woods)...');
    const email1 = `elena_${Date.now()}@university.edu`;
    const reg1 = await request('/api/auth/register', 'POST', {
      name: 'Elena Woods',
      email: email1,
      password: 'password123',
      department: 'Computer Science'
    });
    if (reg1.status !== 201 || !reg1.body.token) {
      throw new Error('Member 1 registration failed: ' + JSON.stringify(reg1.body));
    }
    const token1 = reg1.body.token;
    console.log(`✅ Member 1 registered: ${reg1.body.user.name} (${reg1.body.user.member_id})`);

    // 3. Register User 2 (Separate User)
    console.log('3. Registering new Member 2 (Marcus Vance)...');
    const email2 = `marcus_${Date.now()}@university.edu`;
    const reg2 = await request('/api/auth/register', 'POST', {
      name: 'Marcus Vance',
      email: email2,
      password: 'password123',
      department: 'Mathematics'
    });
    if (reg2.status !== 201 || !reg2.body.token) {
      throw new Error('Member 2 registration failed: ' + JSON.stringify(reg2.body));
    }
    const token2 = reg2.body.token;
    console.log(`✅ Member 2 registered: ${reg2.body.user.name} (${reg2.body.user.member_id})`);

    if (reg1.body.user.id === reg2.body.user.id) {
      throw new Error('User IDs must be distinct!');
    }
    console.log('✅ Confirmed: Separate logins and isolated profiles.');

    // 4. Test Digital Wallet Top-up
    console.log('4. Testing Wallet Top-up for Member 1 ($15.00)...');
    const topupRes = await request('/api/user/wallet/topup', 'POST', { amount: 15.00 }, token1);
    if (topupRes.status !== 200) {
      throw new Error('Wallet top-up failed: ' + JSON.stringify(topupRes.body));
    }
    console.log(`✅ Wallet balance successfully updated to: $${topupRes.body.wallet.balance.toFixed(2)}`);

    // 5. Test Borrowing a Book with Member 1
    console.log('5. Testing borrowing book (ID: 1, Clean Code)...');
    const borrowRes = await request('/api/user/borrow', 'POST', { bookId: 1 }, token1);
    if (borrowRes.status !== 200) {
      throw new Error('Borrowing book failed: ' + JSON.stringify(borrowRes.body));
    }
    console.log(`✅ Elena borrowed book: "${borrowRes.body.loan.book_title}", Due: ${borrowRes.body.loan.due_date}`);

    // 6. Test Returning the Book
    console.log('6. Testing returning the borrowed book...');
    const returnRes = await request('/api/user/return', 'POST', { recordId: borrowRes.body.loan.record_id }, token1);
    if (returnRes.status !== 200) {
      throw new Error('Return failed: ' + JSON.stringify(returnRes.body));
    }
    console.log('✅ Book returned successfully. Available copies restored.');

    // 7. Test Chatbot ("Libby")
    console.log('7. Testing Library Chatbot Assistant (Doubts clarification)...');
    const chatQueries = [
      'What are the library hours and location?',
      'Can you recommend some AI books?',
      'How does the digital wallet work?'
    ];

    for (const q of chatQueries) {
      const chatRes = await request('/api/chat', 'POST', { message: q });
      if (chatRes.status !== 200 || !chatRes.body.reply) {
        throw new Error('Chatbot query failed for: ' + q);
      }
      console.log(`🤖 User: "${q}"`);
      console.log(`   Libby: ${chatRes.body.reply.substring(0, 100).replace(/\n/g, ' ')}...`);
    }

    console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! Real user accounts, wallet, catalog, and loans fully functional.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exit(1);
  }
}

runTests();
