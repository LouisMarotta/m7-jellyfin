var http = require('movian/http');
var plugin = JSON.parse(Plugin.manifest);
var service = require('movian/service');
var sqlite = require('movian/sqlite');
const Utils = require('./utils');
const utils = new Utils();

class Auth {
  constructor(hostProvider = null) {
    this._hostProvider = hostProvider;
    this.db = new sqlite.DB('auth.db');
    this.initSchema();
  }

  initSchema = function () {
    this.db.query("PRAGMA foreign_keys = ON");

    this.db.query(
      `CREATE TABLE IF NOT EXISTS servers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url TEXT UNIQUE,
        name TEXT,
        created_at INTEGER
      )`
    );

    this.db.query(
      `CREATE TABLE IF NOT EXISTS profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        server_id INTEGER NOT NULL,
        user_id TEXT,
        username TEXT,
        access_token TEXT,
        created_at INTEGER,
        UNIQUE(server_id, user_id),
        FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
      )`
    );

    this.db.query(
      `CREATE TABLE IF NOT EXISTS meta (
        key TEXT PRIMARY KEY,
        value TEXT
      )`
    );

    this.cleanupServers();
  }

  get host() {
    if (typeof this._hostProvider === 'function') {
      return this._hostProvider();
    }

    let url = service.host.trim();

    let hasHttpPrefix = new RegExp("^(http|https)://", "i");
    if (!hasHttpPrefix.test(url)) {
      url = `${service.is_secure ? 'https' : 'http'}://${url}`;
    }

    return url;
  }

  getHeaders = function (authorization = false) {
    var deviceId = Core.deviceId;
    var header = `MediaBrowser Client="Movian", Device="${utils.getDevice()}", DeviceId="${deviceId}", Version="${plugin.version}"`;
    if (authorization && service.access_token) {
      header += `, Token="${service.access_token}"`;
    }

    return header;
  }

  getDefaultHeaders = function () {
    var headers = {
      'Content-Type': 'application/json',
      'Authorization': this.getHeaders(true)
    };

    // Legacy headers for older Jellyfin servers.
    if (service.access_token) {
      headers['X-Emby-Authorization'] = this.getHeaders(true);
      headers['X-Emby-Token'] = service.access_token;
    }

    return headers;
  }

  getServerVersion = function () {
    var url = `${this.host}/System/Info/Public`;

    var response;
    try {
      response = http.request(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (e) {
      return null;
    }

    if (!response || response.statuscode !== 200) {
      return null;
    }

    try {
      var data = JSON.parse(response);
      return data.Version ?? null;
    } catch (e) {
      return null;
    }
  }

  getOrCreateServer = function (url) {
    if (typeof url !== 'string' || !url) {
      return null;
    }

    try {
      this.db.query("SELECT id FROM servers WHERE url = ?", url);
      var row = this.db.step();
      if (row !== undefined && row !== null) {
        return row.id;
      }

      this.db.query(
        "INSERT INTO servers (url, name, created_at) VALUES (?, ?, ?)",
        url, url, Date.now()
      );
      return this.db.lastRowId();
    } catch (e) {
      return null;
    }
  }

  deleteServer = function (serverId) {
    if (serverId === null || typeof serverId === 'undefined') {
      return;
    }

    try {
      var activeServerId = this.getMeta('active_server_id');
      if (activeServerId !== null && String(activeServerId) === String(serverId)) {
        this.db.query("DELETE FROM meta WHERE key = 'active_profile_id'");
        this.db.query("DELETE FROM meta WHERE key = 'active_server_id'");
      }

      this.db.query("DELETE FROM servers WHERE id = ?", serverId);
    } catch (e) { }
  }

  // Remove server rows whose url is not a valid http(s) URL. Guards against
  // corrupted rows written by older buggy versions.
  cleanupServers = function () {
    try {
      this.db.query("SELECT id, url FROM servers");
      var row;
      var invalid = [];
      while ((row = this.db.step()) !== undefined && row !== null) {
        if (typeof row.url !== 'string' || !/^https?:\/\//i.test(row.url)) {
          invalid.push(row.id);
        }
      }

      invalid.forEach((id) => this.deleteServer(id));
    } catch (e) { }
  }

  saveToken = function (token, userId, username = null) {
    if (!token) {
      return;
    }

    try {
      var serverId = this.getOrCreateServer(this.host);
      if (serverId === null) {
        return;
      }

      username = username ?? service.username ?? null;

      this.db.query(
        `INSERT OR REPLACE INTO profiles
          (id, server_id, user_id, username, access_token, created_at)
         VALUES (
          (SELECT id FROM profiles WHERE server_id = ? AND user_id = ?),
          ?, ?, ?, ?, ?
         )`,
        serverId, userId, serverId, userId, username, token, Date.now()
      );

      var profileId = this.db.lastRowId();
      this.setActiveProfile(serverId, profileId);
    } catch (e) { }
  }

  setActiveProfile = function (serverId, profileId) {
    try {
      this.db.query(
        "INSERT OR REPLACE INTO meta (key, value) VALUES ('active_server_id', ?)",
        String(serverId)
      );
      this.db.query(
        "INSERT OR REPLACE INTO meta (key, value) VALUES ('active_profile_id', ?)",
        String(profileId)
      );
    } catch (e) { }
  }

  getMeta = function (key) {
    try {
      this.db.query("SELECT value FROM meta WHERE key = ?", key);
      var row = this.db.step();
      if (row !== undefined && row !== null) {
        return row.value;
      }
    } catch (e) { }
    return null;
  }

  loadToken = function () {
    var profile = this.loadActiveProfile();
    return profile ? profile.access_token : null;
  }

  loadUserId = function () {
    var profile = this.loadActiveProfile();
    return profile ? profile.user_id : null;
  }

  loadActiveProfile = function () {
    try {
      var profileId = this.getMeta('active_profile_id');
      if (profileId) {
        this.db.query("SELECT * FROM profiles WHERE id = ?", profileId);
        var row = this.db.step();
        if (row !== undefined && row !== null) {
          return row;
        }
      }

      var serverId = this.getOrCreateServer(this.host);
      if (serverId === null) {
        return null;
      }

      this.db.query(
        "SELECT * FROM profiles WHERE server_id = ? ORDER BY created_at DESC LIMIT 1",
        serverId
      );
      var fallback = this.db.step();
      if (fallback !== undefined && fallback !== null) {
        return fallback;
      }
    } catch (e) { }
    return null;
  }

  clearToken = function () {
    try {
      var profileId = this.getMeta('active_profile_id');
      if (profileId) {
        this.db.query("DELETE FROM profiles WHERE id = ?", profileId);
      }
      this.db.query("DELETE FROM meta WHERE key = 'active_profile_id'");
    } catch (e) { }
  }

  // Wipe all stored servers, profiles and meta data.
  clearAll = function () {
    try {
      this.db.query("DELETE FROM profiles");
      this.db.query("DELETE FROM servers");
      this.db.query("DELETE FROM meta");
    } catch (e) { }
  }

  validateToken = function (token) {
    if (!token) {
      return { valid: false, statuscode: 0 };
    }

    var url = `${this.host}/Users/Me`;
    var response;

    try {
      response = http.request(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `MediaBrowser Client="Movian", Device="${utils.getDevice()}", DeviceId="${Core.deviceId}", Version="${plugin.version}", Token="${token}"`,
          'X-Emby-Authorization': `MediaBrowser Client="Movian", Device="${utils.getDevice()}", DeviceId="${Core.deviceId}", Version="${plugin.version}", Token="${token}"`,
          'X-Emby-Token': token
        }
      });
    } catch (e) {
      return { valid: false, statuscode: 0 };
    }

    if (!response || typeof response.statuscode === 'undefined') {
      return { valid: false, statuscode: 0 };
    }

    if (response.statuscode === 200) {
      try {
        return {
          valid: true,
          user: JSON.parse(response),
          statuscode: 200
        };
      } catch (e) {
        return { valid: false, statuscode: 200 };
      }
    }

    return { valid: false, statuscode: response.statuscode };
  }

  requestAuthentication = function (headers) {
    var url = `${this.host}/Users/AuthenticateByName`;

    try {
      return http.request(url, {
        method: 'POST',
        headers: headers,
        postdata: JSON.stringify({
          Username: service.username,
          Pw: service.password
        })
      });
    } catch (e) {
      return undefined;
    }
  }

  authenticate = function () {
    // Jellyfin 12 requires the standard Authorization header; the legacy
    // X-Emby-Authorization header is sent too for older servers.
    var response = this.requestAuthentication({
      'Content-Type': 'application/json',
      'Authorization': this.getHeaders(),
      'X-Emby-Authorization': this.getHeaders()
    });

    if (!response || typeof response.statuscode === 'undefined') {
      return {
        success: false,
        error: 'auth.error.connection',
        statuscode: 0,
        serverVersion: null
      };
    }

    var statuscode = response.statuscode;

    // Retry with the legacy header only, for older servers.
    if (statuscode === 400 || statuscode === 401 || statuscode === 403) {
      var legacyResponse = this.requestAuthentication({
        'Content-Type': 'application/json',
        'X-Emby-Authorization': this.getHeaders()
      });

      if (legacyResponse && legacyResponse.statuscode === 200) {
        response = legacyResponse;
        statuscode = 200;
      }
    }

    if (statuscode === 200) {
      var data;
      try {
        data = JSON.parse(response);
      } catch (e) {
        return {
          success: false,
          error: 'auth.error.invalid_response',
          statuscode: statuscode,
          serverVersion: this.getServerVersion()
        };
      }

      this.saveToken(data.AccessToken, data.User?.Id, data.User?.Name);

      return {
        success: true,
        user: data.User,
        accessToken: data.AccessToken,
        // Legacy aliases.
        User: data.User,
        AccessToken: data.AccessToken,
        statuscode: statuscode,
        serverVersion: this.getServerVersion()
      };
    }

    var serverVersion = this.getServerVersion();

    if (statuscode === 401 || statuscode === 403) {
      return {
        success: false,
        error: 'auth.error.invalid_credentials',
        statuscode: statuscode,
        serverVersion: serverVersion
      };
    }

    if (statuscode === 404) {
      return {
        success: false,
        error: 'auth.error.not_found',
        statuscode: statuscode,
        serverVersion: serverVersion
      };
    }

    return {
      success: false,
      error: 'auth.error.server',
      statuscode: statuscode,
      serverVersion: serverVersion
    };
  }
}

module.exports = Auth;
