const bcrypt = require('bcryptjs');

async function run() {
  try {
    const password = '123456';
    const hash = await bcrypt.hash(password, 10);
    console.log('hash =', hash);
  } catch (error) {
    console.error('error =', error);
  }
}

run();
