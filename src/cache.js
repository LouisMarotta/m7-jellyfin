var sqlite = require('movian/sqlite');
class Cache {
  db = null;
  constructor() {
    this.db = new sqlite.DB('cache.db');
    this.db.query(
      `CREATE TABLE IF NOT EXISTS cache (
        key TEXT PRIMARY KEY,
        value TEXT,
        timestamp INTEGER
      )`
    );
    this.db.query("CREATE INDEX IF NOT EXISTS idx_timestamp ON cache(timestamp)");
  }

  get = function (key) {
    this.db.query("SELECT value FROM cache WHERE key = ?", key);
    var row = this.db.step();

    if (row !== undefined) {
      return JSON.parse(row.value);
    }
    return null;
  }

  set = function (key, value) {
    this.db.query(
      "INSERT OR REPLACE INTO cache (key, value, timestamp) VALUES (?, ?, ?)",
      key, JSON.stringify(value), Date.now()
    );
  }

  remove = function (key) {
    this.db.query("DELETE FROM cache WHERE key = ?", key);
  }

  cleanup = function (maxAge = 7 * 24 * 60 * 60 * 1000) {
    var cutoff = Date.now() - maxAge;
    this.db.query("DELETE FROM cache WHERE timestamp < ?", cutoff);
    console.log("Cleaned up old cache entries");
  }

  clear = function () {
    this.db.query("DELETE FROM cache");
  }
}

module.exports = Cache;
