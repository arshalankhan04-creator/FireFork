const { config } = require('./config');

console.log('DB_PASSWORD type:', typeof process.env.DB_PASSWORD);
console.log('DB_PASSWORD value:', process.env.DB_PASSWORD);

console.log('\nConfig password type:', typeof config.db.password);
console.log('Config password value:', config.db.password);

