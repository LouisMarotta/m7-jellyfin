var settings = require('movian/settings');
var popup = require('movian/popup');
var service = require('movian/service');

class Settings {
  constructor(plugin) {
    this.id = plugin.id;
    this.title = plugin.title;
    this.logo = plugin.icon;
    this.synopsis = plugin.metadata.synopsis;
    this.trans = plugin.trans;
  }

  init() {
    settings.globalSettings(this.id, this.title, this.logo, this.synopsis);
    settings.createString('host', this.trans.l('setting.host'), '', function (v) {
      service.host = v;
    });

    settings.createString('username', this.trans.l('setting.username'), '', function (v) {
      service.username = v;
    });

    settings.createString('password', this.trans.l('setting.password'), '', function (v) {
      service.password = v;
    });

    settings.createBool('ps3_compatibility', this.trans.l('setting.ps3_compatibility'), '', function (v) {
      service.ps3_compatibility = v;
    });

    settings.createAction('logout', 'Logout', function () {
      page.redirect('settings:');
      service.username = '';
      service.password = '';
      service.access_token = '';
      popup.notify('Logged out successfully!', 3);
    });
  }
}

module.exports = Settings;
