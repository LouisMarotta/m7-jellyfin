// Examples for Property API usage in Movian plugins
// Updated with canonical URL and KVStore integration

/// <reference path="./prop.d.ts" />

// ============================================================================
// 1. BASIC PROPERTY OPERATIONS
// ============================================================================

var prop = require('movian/prop');

// Create a root property
var rootProp = prop.createRoot('MyApp');

// Set property values
prop.setString(rootProp, 'title', 'My Application');
prop.setInt(rootProp, 'version', 1);
prop.setBool(rootProp, 'enabled', true);

// Get property values
console.log('Title:', prop.getString(rootProp, 'title'));
console.log('Version:', prop.getInt(rootProp, 'version'));
console.log('Enabled:', prop.getBool(rootProp, 'enabled'));

// ============================================================================
// 2. CANONICAL URL PROPERTIES
// ============================================================================

/**
 * Store canonical URL in item properties
 */
function setCanonicalUrlProperty(item, canonicalUrl) {
    // Store canonical URL in item metadata
    prop.setString(item.root, 'canonical_url', canonicalUrl);
    console.log('Canonical URL set:', canonicalUrl);
}

/**
 * Get canonical URL from item properties
 */
function getCanonicalUrlProperty(item) {
    var canonicalUrl = prop.getString(item.root, 'canonical_url');
    console.log('Retrieved canonical URL:', canonicalUrl);
    return canonicalUrl;
}

// ============================================================================
// 3. SUBSCRIBING TO PROPERTY CHANGES
// ============================================================================

// Subscribe to property changes
prop.subscribeValue(rootProp, 'title', function(newValue) {
    console.log('Title changed to:', newValue);
});

// Subscribe to canonical URL changes
function subscribeToCanonicalUrlChanges(item) {
    prop.subscribeValue(item.root, 'canonical_url', function(newCanonicalUrl) {
        console.log('Canonical URL changed:', newCanonicalUrl);
        // Re-bind history when canonical URL changes
        if (newCanonicalUrl) {
            try {
                require('native/metadata').bindPlayInfo(item.root, newCanonicalUrl);
            } catch (e) {
                console.error('Failed to re-bind history:', e);
            }
        }
    });
}

// ============================================================================
// 4. WORKING WITH NESTED PROPERTIES
// ============================================================================

// Create nested properties
var userProp = prop.create(rootProp, 'user');
prop.setString(userProp, 'name', 'John Doe');
prop.setInt(userProp, 'age', 30);

// Create playback state property
var playbackProp = prop.create(rootProp, 'playback');
prop.setString(playbackProp, 'currentCanonicalUrl', '');
prop.setInt(playbackProp, 'position', 0);
prop.setBool(playbackProp, 'isPlaying', false);

console.log('User name:', prop.getString(userProp, 'name'));
console.log('User age:', prop.getInt(userProp, 'age'));
console.log('Current canonical URL:', prop.getString(playbackProp, 'currentCanonicalUrl'));
console.log('Playback position:', prop.getInt(playbackProp, 'position'));
console.log('Is playing:', prop.getBool(playbackProp, 'isPlaying'));

// ============================================================================
// 5. INTEGRATION WITH KVSTORE
// ============================================================================

/**
 * Sync properties with KVStore
 */
function syncPropertiesWithKVStore(canonicalUrl) {
    var kvstore = require('native/kvstore');
    
    // Get user rating from KVStore
    var rating = kvstore.getInteger(canonicalUrl, 'plugin', 'rating', 0);
    
    // Set rating in properties
    prop.setInt(rootProp, 'userRating', rating);
    
    // Store last sync timestamp
    prop.setString(rootProp, 'lastSync', new Date().toISOString());
    
    console.log('Synced properties for:', canonicalUrl, {
        rating: rating,
        lastSync: prop.getString(rootProp, 'lastSync')
    });
}

// ============================================================================
// 6. ERROR HANDLING
// ============================================================================

/**
 * Safe property operations with error handling
 */
function safePropertyOperations() {
    try {
        var safeProp = prop.createRoot('SafeApp');
        
        // Safe property access
        var value = prop.getString(safeProp, 'nonexistent', 'default');
        console.log('Safe property access:', value);
        
        // Safe property setting
        prop.setString(safeProp, 'test', 'value');
        
        // Safe subscription
        prop.subscribeValue(safeProp, 'test', function(newValue) {
            console.log('Test property changed:', newValue);
        });
        
        return safeProp;
        
    } catch (e) {
        console.error('Property operation failed:', e);
        return null;
    }
}

// ============================================================================
// 7. ADVANCED PROPERTY PATTERNS
// ============================================================================

/**
 * Create property hierarchy for complex data
 */
function createPropertyHierarchy() {
    var appProp = prop.createRoot('Application');
    
    // Configuration section
    var configProp = prop.create(appProp, 'config');
    prop.setString(configProp, 'apiUrl', 'https://api.example.com');
    prop.setInt(configProp, 'timeout', 30000);
    prop.setBool(configProp, 'debugMode', false);
    
    // User preferences section
    var prefsProp = prop.create(appProp, 'preferences');
    prop.setString(prefsProp, 'language', 'en');
    prop.setString(prefsProp, 'quality', '1080p');
    prop.setBool(prefsProp, 'autoPlay', true);
    
    // Cache section
    var cacheProp = prop.create(appProp, 'cache');
    prop.setString(cacheProp, 'lastUpdate', '2026-01-10T00:00:00Z');
    prop.setInt(cacheProp, 'cachedItems', 150);
    
    console.log('Property hierarchy created');
    console.log('Config API URL:', prop.getString(configProp, 'apiUrl'));
    console.log('User language:', prop.getString(prefsProp, 'language'));
    console.log('Cache items:', prop.getInt(cacheProp, 'cachedItems'));
}

// ============================================================================
// 8. COMPLETE EXAMPLE
// ============================================================================

/**
 * Complete property management example
 */
function completePropertyExample(item, canonicalUrl) {
    // Set canonical URL in properties
    setCanonicalUrlProperty(item, canonicalUrl);
    
    // Subscribe to changes
    subscribeToCanonicalUrlChanges(item);
    
    // Sync with KVStore
    syncPropertiesWithKVStore(canonicalUrl);
    
    // Create playback tracking
    var playbackProp = prop.createRootProp(item.root, 'playback');
    prop.setString(playbackProp, 'canonicalUrl', canonicalUrl);
    prop.setInt(playbackProp, 'watchTime', 0);
    prop.setBool(playbackProp, 'isCompleted', false);
    
    // Subscribe to playback events
    prop.subscribeValue(playbackProp, 'watchTime', function(newTime) {
        console.log('Watch time updated:', newTime);
        
        // Mark as completed if watched for more than 30 seconds
        if (newTime > 30000) {
            prop.setBool(playbackProp, 'isCompleted', true);
        }
    });
    
    console.log('Complete property example setup for:', canonicalUrl);
}

// ============================================================================
// 9. CLEANUP
// ============================================================================

/**
 * Clean up properties and subscriptions
 */
function cleanupProperties() {
    try {
        // Destroy specific properties
        prop.destroy(userProp);
        prop.destroy(playbackProp);
        
        // Destroy root property (cleans up everything)
        prop.destroy(rootProp);
        
        console.log('Properties cleaned up successfully');
        
    } catch (e) {
        console.error('Cleanup failed:', e);
    }
}

// Run examples
console.log('Property API examples loaded!');
console.log('Available functions:');
console.log('- setCanonicalUrlProperty(item, canonicalUrl)');
console.log('- getCanonicalUrlProperty(item)');
console.log('- subscribeToCanonicalUrlChanges(item)');
console.log('- syncPropertiesWithKVStore(canonicalUrl)');
console.log('- safePropertyOperations()');
console.log('- createPropertyHierarchy()');
console.log('- completePropertyExample(item, canonicalUrl)');
console.log('- cleanupProperties()');

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        setCanonicalUrlProperty: setCanonicalUrlProperty,
        getCanonicalUrlProperty: getCanonicalUrlProperty,
        subscribeToCanonicalUrlChanges: subscribeToCanonicalUrlChanges,
        syncPropertiesWithKVStore: syncPropertiesWithKVStore,
        safePropertyOperations: safePropertyOperations,
        createPropertyHierarchy: createPropertyHierarchy,
        completePropertyExample: completePropertyExample,
        cleanupProperties: cleanupProperties
    };
}
