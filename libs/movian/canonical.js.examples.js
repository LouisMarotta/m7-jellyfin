/**
 * Examples for canonical URL usage in Movian plugins
 * Based on canonical_url_developer_guide.md and Movian sources
 */

// ============================================================================
// 1. BASIC CANONICAL URL PATTERNS
// ============================================================================

/**
 * API-based pattern - when you have stable IDs from API
 */
function getCanonicalUrl_API(content) {
    return 'api:' + content.service + ':' + content.type + ':' + content.id;
}

// Example: 'api:netflix:movie:12345'
console.log('API pattern:', getCanonicalUrl_API({
    service: 'netflix',
    type: 'movie', 
    id: '12345'
}));

/**
 * Web-scraping pattern - when parsing HTML and extracting IDs
 */
function getCanonicalUrl_Scraped(content) {
    var id = content.url.match(/\/video\/(\d+)/)[1];
    return 'scraped:' + content.domain + ':' + content.type + ':' + id;
}

// Example: 'scraped:youtube:video:abc123'
console.log('Scraped pattern:', getCanonicalUrl_Scraped({
    domain: 'youtube',
    type: 'video',
    url: 'https://youtube.com/watch?v=abc123'
}));

/**
 * Hierarchical pattern - for TV shows with seasons/episodes
 */
function getCanonicalUrl_Hierarchical(content) {
    var parts = ['plugin', content.type, content.id];
    if (content.type === 'serial') {
        parts.push(content.season || '0');
        parts.push(content.episode || '0');
    }
    return parts.join(':');
}

// Example: 'plugin:serial:show123:2:5'
console.log('Hierarchical pattern:', getCanonicalUrl_Hierarchical({
    type: 'serial',
    id: 'show123',
    season: 2,
    episode: 5
}));

// ============================================================================
// 2. BINDING HISTORY WITH METADATA API
// ============================================================================

/**
 * Correct way to bind history immediately after appendItem
 */
function appendVideoWithHistory(page, video) {
    var canonicalUrl = getCanonicalUrl_API(video);
    
    var meta = {
        title: video.title,
        icon: video.poster,
        canonical_url: canonicalUrl  // For display purposes
    };
    
    var item = page.appendItem('play:' + video.id, 'video', meta);
    
    // ✅ CORRECT: Bind immediately after appendItem
    try {
        require('native/metadata').bindPlayInfo(item.root, canonicalUrl);
    } catch (e) {
        console.error('Failed to bind history:', e);
        // Module unavailable or type doesn't support binding
    }
}

// Example usage
appendVideoWithHistory(page, {
    id: 'movie123',
    title: 'Example Movie',
    poster: 'https://example.com/poster.jpg',
    service: 'myservice',
    type: 'movie'
});

// ============================================================================
// 3. VIDEO PLAYBACK WITH CANONICAL URL
// ============================================================================

/**
 * Play video using videoparams with canonical URL
 */
function playVideo(page, video) {
    var canonicalUrl = getCanonicalUrl_API(video);
    
    var vParams = {
        canonicalUrl: canonicalUrl,  // ✅ IMPORTANT: Required for history
        sources: [{ 
            url: video.streamUrl,
            // Optional: bitrate, mimetype, etc.
        }],
        title: video.title,
        year: video.year || 0,
        season: video.season,
        episode: video.episode
    };
    
    // Movian automatically extracts canonicalUrl from videoparams
    page.appendItem('videoparams:' + JSON.stringify(vParams), 'video', {
        title: video.title
    });
}

// Example usage
playVideo(page, {
    id: 'movie456',
    title: 'Another Movie',
    streamUrl: 'https://example.com/stream.mp4',
    year: 2023,
    service: 'myservice',
    type: 'movie'
});

// ============================================================================
// 4. TV SHOWS WITH SEASONS/EPISODES
// ============================================================================

/**
 * Append TV series episode with full metadata
 */
function appendEpisode(page, series, episode) {
    var canonicalUrl = getCanonicalUrl_Hierarchical({
        type: 'episode',
        id: series.id,
        season: episode.season,
        episode: episode.number
    });
    
    var meta = {
        title: 'S' + episode.season + 'E' + episode.number + ': ' + episode.title,
        icon: episode.still,
        canonical_url: canonicalUrl,
        vtype: 'tvseries',
        episode: {
            title: episode.title,
            number: parseInt(episode.number)
        },
        season: {
            number: parseInt(episode.season)
        }
    };
    
    var item = page.appendItem('play:' + series.id + ':' + episode.season + ':' + episode.number, 'video', meta);
    
    try {
        require('native/metadata').bindPlayInfo(item.root, canonicalUrl);
    } catch (e) {
        console.error('Failed to bind episode history:', e);
    }
}

// Example usage
appendEpisode(page, {
    id: 'series789'
}, {
    season: '2',
    number: '5',
    title: 'Episode Title',
    still: 'https://example.com/episode.jpg'
});

// ============================================================================
// 5. KVSTORE INTEGRATION
// ============================================================================

/**
 * Using KVStore with canonical URL as key
 * Based on Movian source: src/ecmascript/es_kvstore.c
 */
function managePluginData(canonicalUrl) {
    var kvstore = require('native/kvstore');
    
    // ✅ CORRECT: Only use 'plugin' domain from plugins
    var rating = kvstore.getInteger(canonicalUrl, 'plugin', 'rating', 0);
    var lastWatched = kvstore.getString(canonicalUrl, 'plugin', 'lastWatched', null);
    var isFavorite = kvstore.getBoolean(canonicalUrl, 'plugin', 'favorite', false);
    
    console.log('Plugin data for', canonicalUrl, {
        rating: rating,
        lastWatched: lastWatched,
        favorite: isFavorite
    });
    
    // Update data
    kvstore.set(canonicalUrl, 'plugin', 'rating', 8);
    kvstore.set(canonicalUrl, 'plugin', 'lastWatched', new Date().toISOString());
    kvstore.set(canonicalUrl, 'plugin', 'favorite', true);
    
    // ❌ INCORRECT: sys domain not accessible from plugins
    // var playcount = kvstore.getInteger(canonicalUrl, 'sys', 'playcount', 0); // ERROR!
}

// Example usage
managePluginData('plugin:movie:movie123');

// ============================================================================
// 6. ERROR HANDLING
// ============================================================================

/**
 * Safe metadata binding with error handling
 */
function safeBindHistory(item, canonicalUrl) {
    try {
        require('native/metadata').bindPlayInfo(item.root, canonicalUrl);
        console.log('History bound successfully for:', canonicalUrl);
    } catch (e) {
        console.error('Failed to bind history:', e);
        // Common causes:
        // - Module not available
        // - Item type doesn't support binding
        // - Invalid canonicalUrl format
    }
}

/**
 * Safe KVStore operations
 */
function safeKVStoreOperation(canonicalUrl) {
    var kvstore = require('native/kvstore');
    
    try {
        var value = kvstore.getString(canonicalUrl, 'plugin', 'nonexistent', 'default');
        console.log('KVStore value:', value);
    } catch (e) {
        console.error('KVStore operation failed:', e);
    }
}

// ============================================================================
// 7. COMPLETE PLUGIN EXAMPLE
// ============================================================================

/**
 * Complete movie plugin example
 */
function moviePluginExample(page, movies) {
    movies.forEach(function(movie) {
        var canonicalUrl = getCanonicalUrl_API(movie);
        
        // Append to listing
        var meta = {
            title: movie.title,
            icon: movie.poster,
            description: movie.description,
            year: movie.year,
            canonical_url: canonicalUrl
        };
        
        var item = page.appendItem('play:' + movie.id, 'video', meta);
        
        // Bind history
        safeBindHistory(item, canonicalUrl);
        
        // Store plugin-specific data
        var kvstore = require('native/kvstore');
        kvstore.set(canonicalUrl, 'plugin', 'userRating', movie.userRating);
    });
}

// Example data
var sampleMovies = [
    {
        id: 'movie001',
        title: 'Sample Movie 1',
        poster: 'https://example.com/poster1.jpg',
        description: 'First sample movie',
        year: 2023,
        userRating: 8,
        service: 'myservice',
        type: 'movie'
    },
    {
        id: 'movie002', 
        title: 'Sample Movie 2',
        poster: 'https://example.com/poster2.jpg',
        description: 'Second sample movie',
        year: 2024,
        userRating: 7,
        service: 'myservice',
        type: 'movie'
    }
];

// Run the example
// moviePluginExample(page, sampleMovies);

console.log('Canonical URL examples loaded successfully!');
console.log('Available functions:');
console.log('- getCanonicalUrl_API(content)');
console.log('- getCanonicalUrl_Scraped(content)');
console.log('- getCanonicalUrl_Hierarchical(content)');
console.log('- appendVideoWithHistory(page, video)');
console.log('- playVideo(page, video)');
console.log('- appendEpisode(page, series, episode)');
console.log('- managePluginData(canonicalUrl)');
console.log('- safeBindHistory(item, canonicalUrl)');
console.log('- safeKVStoreOperation(canonicalUrl)');
console.log('- moviePluginExample(page, movies)');
