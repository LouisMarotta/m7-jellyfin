const kvstore = require('native/kvstore');
const http = require('movian/http');

class Upgrader {
  constructor() {
    this.author = 'LouisMarotta';
    this.repo = 'm7-jellyfin';
    this.endpoint = `https://api.github.com/repos/${this.author}/${this.repo}/releases/latest`;
    this.kvurl = 'jellyfin:upgrader';
  }

  get shouldCheck() {
    let date = this.lastCheck;

    if (date === null) {
      return true;
    }

    try {
      date = new Date(date);
    } catch (e) {
      this.lastCheck = new Date();
      return false;
    }

    // Check if atleast a day has passed
    return (Date.now() - date) > (24 * 60 * 60 * 1000);
  }

  get lastCheck() {
    try {
      return kvstore.getString(this.kvurl, 'plugin', 'last_check');
    } catch (e) {
      return null;
    }
  }

  set lastCheck(date = new Date()) {
    kvstore.set(this.kvurl, 'plugin', 'last_check', date);
  }

  checkUpdate() {
    let response = http.request(this.endpoint, {
      method: 'GET',
    });

    if (response.statuscode && response.statuscode == 200) {
      response = JSON.parse(response);
    }

    return response;
  }
}

module.exports = Upgrader;
