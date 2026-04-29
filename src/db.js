const path = require('path');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '..', 'data', 'app.db');
const db = new Database(dbPath);

function initializeDatabase() {
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');
  db.pragma('synchronous = NORMAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      price REAL NOT NULL CHECK (price >= 0),
      stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const userCount = db.prepare('SELECT COUNT(*) AS total FROM users').get().total;

  if (userCount === 0) {
    const passwordHash = bcrypt.hashSync('admin123', 10);

    db.prepare(
      'INSERT INTO users (username, password_hash) VALUES (?, ?)'
    ).run('admin', passwordHash);
  }
}

function findUserByUsername(username) {
  return db
    .prepare('SELECT id, username, password_hash FROM users WHERE username = ?')
    .get(username);
}

function findUserById(id) {
  return db.prepare('SELECT id, username FROM users WHERE id = ?').get(id);
}

function verifyUserCredentials(username, password) {
  const user = findUserByUsername(username);

  if (!user) {
    return null;
  }

  const isValid = bcrypt.compareSync(password, user.password_hash);

  if (!isValid) {
    return null;
  }

  return { id: user.id, username: user.username };
}

function listProducts() {
  return db
    .prepare(
      `
      SELECT id, name, description, price, stock, created_at, updated_at
      FROM products
      ORDER BY id DESC
      `
    )
    .all();
}

function getProductById(id) {
  return db
    .prepare(
      `
      SELECT id, name, description, price, stock, created_at, updated_at
      FROM products
      WHERE id = ?
      `
    )
    .get(id);
}

function createProduct(product) {
  const result = db
    .prepare(
      `
      INSERT INTO products (name, description, price, stock)
      VALUES (?, ?, ?, ?)
      `
    )
    .run(product.name, product.description, product.price, product.stock);

  return getProductById(result.lastInsertRowid);
}

function updateProduct(id, product) {
  const result = db
    .prepare(
      `
      UPDATE products
      SET
        name = ?,
        description = ?,
        price = ?,
        stock = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `
    )
    .run(product.name, product.description, product.price, product.stock, id);

  if (result.changes === 0) {
    return null;
  }

  return getProductById(id);
}

function deleteProduct(id) {
  const result = db.prepare('DELETE FROM products WHERE id = ?').run(id);
  return result.changes > 0;
}

module.exports = {
  db,
  dbPath,
  initializeDatabase,
  findUserById,
  findUserByUsername,
  verifyUserCredentials,
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};
