// Examples for SQLite API usage in Movian plugins
// Updated with canonical URL and KVStore integration

/// <reference path="./sqlite.d.ts" />

// ============================================================================
// 1. BASIC SQLITE OPERATIONS
// ============================================================================

var sqlite = require('movian/sqlite');

// Create a new database
var db = new sqlite.DB('example.db');

// Create a table for content tracking
db.query('CREATE TABLE IF NOT EXISTS content (' +
          'id INTEGER PRIMARY KEY, ' +
          'canonical_url TEXT UNIQUE, ' +
          'title TEXT, ' +
          'type TEXT, ' +
          'season INTEGER, ' +
          'episode INTEGER, ' +
          'year INTEGER, ' +
          'last_watched INTEGER, ' +
          'watch_count INTEGER DEFAULT 0)');

// Insert sample data
db.query('INSERT INTO content (canonical_url, title, type, season, episode, year) VALUES (?, ?, ?, ?, ?, ?)', 
          'plugin:movie:123', 'Sample Movie', 'movie', null, null, 2023);
db.query('INSERT INTO content (canonical_url, title, type, season, episode, year) VALUES (?, ?, ?, ?, ?, ?)', 
          'plugin:episode:456:1:2', 'Sample Episode', 'episode', 1, 2, 2024);

// ============================================================================
// 2. CANONICAL URL QUERIES
// ============================================================================

/**
 * Query content by canonical URL
 */
function getContentByCanonicalUrl(canonicalUrl) {
    db.query('SELECT * FROM content WHERE canonical_url = ?', canonicalUrl);
    var row = db.step();
    if (row) {
        console.log('Found content:', {
            id: row.id,
            canonical_url: row.canonical_url,
            title: row.title,
            type: row.type,
            season: row.season,
            episode: row.episode,
            year: row.year,
            last_watched: row.last_watched,
            watch_count: row.watch_count
        });
        return row;
    } else {
        console.log('Content not found for:', canonicalUrl);
        return null;
    }
}

/**
 * Update watch history for canonical URL
 */
function updateWatchHistory(canonicalUrl) {
    var now = Math.floor(Date.now() / 1000); // Convert to seconds
    
    // Update last watched time
    db.query('UPDATE content SET last_watched = ? WHERE canonical_url = ?', now, canonicalUrl);
    
    // Increment watch count
    db.query('UPDATE content SET watch_count = watch_count + 1 WHERE canonical_url = ?', canonicalUrl);
    
    console.log('Updated watch history for:', canonicalUrl);
}

// Example usage
var movieRow = getContentByCanonicalUrl('plugin:movie:123');
if (movieRow) {
    updateWatchHistory('plugin:movie:123');
}

// ============================================================================
// 3. BATCH OPERATIONS WITH CANONICAL URLS
// ============================================================================

/**
 * Insert multiple content items with canonical URLs
 */
function batchInsertContent(items) {
    items.forEach(function(item) {
        var canonicalUrl = generateCanonicalUrl(item);
        
        db.query('INSERT OR REPLACE INTO content (canonical_url, title, type, season, episode, year) VALUES (?, ?, ?, ?, ?, ?)', 
                  canonicalUrl, item.title, item.type, item.season, item.episode, item.year);
        
        console.log('Inserted:', canonicalUrl);
    });
}

function generateCanonicalUrl(item) {
    var parts = ['plugin', item.type, item.id];
    if (item.type === 'episode') {
        parts.push(item.season || '0');
        parts.push(item.episode || '0');
    }
    return parts.join(':');
}

// Sample data
var sampleItems = [
    { id: 'movie001', type: 'movie', title: 'Movie 1', year: 2023 },
    { id: 'series001', type: 'episode', title: 'Episode 1', season: 1, episode: 1, year: 2024 },
    { id: 'series001', type: 'episode', title: 'Episode 2', season: 1, episode: 2, year: 2024 }
];

batchInsertContent(sampleItems);

// ============================================================================
// 4. INTEGRATION WITH KVSTORE
// ============================================================================

/**
 * Sync SQLite data with KVStore
 */
function syncWithKVStore(canonicalUrl) {
    var kvstore = require('native/kvstore');
    
    // Get content from SQLite
    var content = getContentByCanonicalUrl(canonicalUrl);
    if (content) {
        // Update watch count in KVStore
        var currentCount = kvstore.getInteger(canonicalUrl, 'plugin', 'watchCount', 0);
        var newCount = content.watch_count;
        
        if (newCount > currentCount) {
            kvstore.set(canonicalUrl, 'plugin', 'watchCount', newCount);
            kvstore.set(canonicalUrl, 'plugin', 'lastSync', new Date().toISOString());
            
            console.log('Synced watch count for', canonicalUrl, ':', currentCount, '->', newCount);
        }
        
        // Get user rating from KVStore
        var rating = kvstore.getInteger(canonicalUrl, 'plugin', 'userRating', 0);
        if (rating > 0) {
            // Update rating in SQLite
            db.query('UPDATE content SET rating = ? WHERE canonical_url = ?', rating, canonicalUrl);
            console.log('Updated rating for', canonicalUrl, ':', rating);
        }
    }
}

// ============================================================================
// 5. ADVANCED CANONICAL URL OPERATIONS
// ============================================================================

/**
 * Get watch statistics for content type
 */
function getWatchStats(contentType) {
    db.query('SELECT type, COUNT(*) as total, SUM(watch_count) as total_watches, ' +
              'MAX(last_watched) as last_watched FROM content WHERE type = ?', contentType);
    
    var stats = { type: contentType, items: [] };
    
    while (true) {
        var row = db.step();
        if (!row) break;
        stats.items.push(row);
    }
    
    if (stats.items.length > 0) {
        console.log('Watch stats for', contentType, ':', stats.items[0]);
    }
    
    return stats;
}

/**
 * Get recently watched content
 */
function getRecentlyWatched(limit = 10) {
    db.query('SELECT * FROM content WHERE last_watched > 0 ' +
              'ORDER BY last_watched DESC LIMIT ?', limit);
    
    var recent = [];
    while (true) {
        var row = db.step();
        if (!row) break;
        recent.push({
            canonical_url: row.canonical_url,
            title: row.title,
            type: row.type,
            last_watched: new Date(row.last_watched * 1000).toISOString()
        });
    }
    
    console.log('Recently watched content:', recent);
    return recent;
}

// ============================================================================
// 6. ERROR HANDLING
// ============================================================================

/**
 * Safe database operations with error handling
 */
function safeDatabaseOperations() {
    try {
        var safeDb = new sqlite.DB('safe_example.db');
        
        // Safe table creation
        safeDb.query('CREATE TABLE IF NOT EXISTS safe_content (' +
                   'canonical_url TEXT UNIQUE, ' +
                   'title TEXT, ' +
                   'created_at INTEGER DEFAULT (strftime(\'%s\', \'now\')))');
        
        // Safe insert
        safeDb.query('INSERT INTO safe_content (canonical_url, title) VALUES (?, ?)', 
                  'plugin:safe:123', 'Safe Content');
        
        // Safe query
        safeDb.query('SELECT * FROM safe_content');
        while (true) {
            var row = safeDb.step();
            if (!row) break;
            console.log('Safe content:', row);
        }
        
        safeDb.close();
        console.log('Safe database operations completed');
        
    } catch (e) {
        console.error('Database operation failed:', e);
        console.error('Error code:', sqlite.lastErrorCode);
        console.error('Error message:', sqlite.lastErrorString);
    }
}

// ============================================================================
// 7. PERFORMANCE OPTIMIZATION
// ============================================================================

/**
 * Optimized batch operations
 */
function optimizedBatchInsert(contentArray) {
    // Begin transaction for better performance
    db.query('BEGIN TRANSACTION');
    
    try {
        contentArray.forEach(function(content) {
            var canonicalUrl = generateCanonicalUrl(content);
            db.query('INSERT OR REPLACE INTO content (canonical_url, title, type) VALUES (?, ?, ?)', 
                      canonicalUrl, content.title, content.type);
        });
        
        // Commit transaction
        db.query('COMMIT');
        console.log('Batch insert completed for', contentArray.length, 'items');
        
    } catch (e) {
        // Rollback on error
        db.query('ROLLBACK');
        console.error('Batch insert failed, rolled back:', e);
    }
}

// ============================================================================
// 8. CLEANUP AND MAINTENANCE
// ============================================================================

/**
 * Clean up old content
 */
function cleanupOldContent(daysOld = 30) {
    var cutoffTime = Math.floor((Date.now() - (daysOld * 24 * 60 * 60 * 1000)) / 1000);
    
    db.query('DELETE FROM content WHERE last_watched > 0 AND last_watched < ?', cutoffTime);
    
    var changes = sqlite.changes();
    console.log('Cleaned up', changes, 'old content entries older than', daysOld, 'days');
}

/**
 * Vacuum database for optimization
 */
function optimizeDatabase() {
    try {
        db.query('VACUUM');
        console.log('Database vacuum completed');
    } catch (e) {
        console.error('Vacuum failed:', e);
    }
}

// ============================================================================
// 9. COMPLETE EXAMPLE
// ============================================================================

/**
 * Complete content management example
 */
function completeContentExample() {
    console.log('=== Complete Content Management Example ===');
    
    // Create tables
    db.query('CREATE TABLE IF NOT EXISTS content (' +
              'id INTEGER PRIMARY KEY, ' +
              'canonical_url TEXT UNIQUE, ' +
              'title TEXT, ' +
              'type TEXT, ' +
              'season INTEGER, ' +
              'episode INTEGER, ' +
              'year INTEGER, ' +
              'rating INTEGER DEFAULT 0, ' +
              'last_watched INTEGER, ' +
              'watch_count INTEGER DEFAULT 0, ' +
              'created_at INTEGER DEFAULT (strftime(\'%s\', \'now\')))');
    
    // Insert sample content
    batchInsertContent(sampleItems);
    
    // Get statistics
    var movieStats = getWatchStats('movie');
    var episodeStats = getWatchStats('episode');
    
    // Get recent content
    var recent = getRecentlyWatched(5);
    
    // Sync with KVStore
    sampleItems.forEach(function(item) {
        var canonicalUrl = generateCanonicalUrl(item);
        syncWithKVStore(canonicalUrl);
    });
    
    // Clean up old content
    cleanupOldContent(90);
    
    // Optimize database
    optimizeDatabase();
    
    console.log('Content management example completed');
}

// Run examples
console.log('SQLite API examples loaded!');
console.log('Available functions:');
console.log('- getContentByCanonicalUrl(canonicalUrl)');
console.log('- updateWatchHistory(canonicalUrl)');
console.log('- batchInsertContent(items)');
console.log('- syncWithKVStore(canonicalUrl)');
console.log('- getWatchStats(contentType)');
console.log('- getRecentlyWatched(limit)');
console.log('- safeDatabaseOperations()');
console.log('- optimizedBatchInsert(contentArray)');
console.log('- cleanupOldContent(daysOld)');
console.log('- optimizeDatabase()');
console.log('- completeContentExample()');

// Close the main database
db.close();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getContentByCanonicalUrl: getContentByCanonicalUrl,
        updateWatchHistory: updateWatchHistory,
        batchInsertContent: batchInsertContent,
        syncWithKVStore: syncWithKVStore,
        getWatchStats: getWatchStats,
        getRecentlyWatched: getRecentlyWatched,
        safeDatabaseOperations: safeDatabaseOperations,
        optimizedBatchInsert: optimizedBatchInsert,
        cleanupOldContent: cleanupOldContent,
        optimizeDatabase: optimizeDatabase,
        completeContentExample: completeContentExample
    };
}
