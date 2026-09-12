var settings = require('movian/settings');
var popup = require('movian/popup');
var nativePopup = require('native/popup');
var service = require('movian/service');

const prop = require('movian/prop');
const Navigator = require('./navigator');
const Utils = require('./utils');
const Api = require('./api');
const Auth = require('./auth');
const Cache = require('./cache');

class Settings {
  constructor(plugin) {
    this.id = plugin.id;
    this.title = plugin.title;
    this.logo = plugin.icon;
    this.synopsis = plugin.metadata.synopsis;
    this.trans = plugin.trans;
    this.navigator = new Navigator();

    this.options = {};
  }

  get prefix() {
    return this.id;
  }

  init() {
    settings.globalSettings(this.id, this.title, this.logo, this.synopsis);

    settings.createDivider(this.trans.l('setting.connection_settings'));
    settings.createBool('is_secure', this.trans.l('setting.ssl_enabled'), false, (value) => {
      service.is_secure = value;
    });

    settings.createString('host', this.trans.l('setting.host'), '', (value) => {
      service.host = value;
    });

    settings.createString('username', this.trans.l('setting.username'), '', (value) => {
      service.username = value;
    });

    settings.createString('password', this.trans.l('setting.password'), '', (value) => {
      service.password = value;
    });

    settings.createBool('ps3_compatibility', this.trans.l('setting.ps3_compatibility'), false, (value) => {
      service.ps3_compatibility = value;
    });

    settings.createAction('logout', 'Logout', () => {
      this.navigator.openUrl('settings:');
      service.username = '';
      service.password = '';
      service.access_token = '';
      popup.notify('Logged out successfully!', 3);
    });

    settings.createDivider(this.trans.l('setting.preferences'));

    let sortByOptions = [];
    Object.entries(Api.sortOptions).forEach(([key, value]) => {
      sortByOptions.push([value, this.trans.l('sort.' + key), service.default_sort_by === value]);
    });
    settings.createMultiOpt('default_sort_by', this.trans.l('setting.default_sort_by'), sortByOptions, function (value) {
      service.default_sort_by = value;
    });

    let sortOrderOptions = [
      ['asc', this.trans.l('sort.order_asc'), false],
      ['desc', this.trans.l('sort.order_desc'), false]
    ];
    sortOrderOptions.forEach((value, index) => {
      if (value[0] === service.default_sort_order) {
        sortOrderOptions[index][2] = true;
      }
    });
    settings.createMultiOpt('default_sort_order', this.trans.l('setting.default_sort_order'), sortOrderOptions, function (value) {
      service.default_sort_order = value;
    });

    let subtitleOptions = [
      ['SRT', this.trans.l('setting.subtitle_format_srt'), false],
      ['ASS', this.trans.l('setting.subtitle_format_ass'), false]
    ];
    subtitleOptions.forEach((value, index) => {
      if (value[0] === service.subtitle_format) {
        subtitleOptions[index][2] = true;
      }
    });
    settings.createMultiOpt('subtitle_format', this.trans.l('setting.subtitle_format'), subtitleOptions, function (value) {
      service.subtitle_format = value;
    });

    settings.createDivider('Plugin');

    settings.createBool('check_updates', this.trans.l('setting.check_updates'), true, (value) => {
      service.check_updates = value;
    });

    settings.createAction('update', this.trans.l('action.update', { plugin_name: this.title }), () => {
      popup.notify(this.trans.l('plugin.updating', { plugin_name: this.title }), 5);
      this.navigator.openUrl(Utils.getLatestPlugin());
    });

    settings.createAction('credits', this.trans.l('action.credits'), () => {
      this.navigator.openUrl(`${this.prefix}:credits`);
    });

    settings.createDivider(this.trans.l('setting.maintenance'));

    settings.createAction('clear_cache', this.trans.l('action.clear_cache'), () => {
      new Cache().clear();
      popup.notify(this.trans.l('action.clear_cache.done'), 3);
    });

    settings.createAction('clear_data', this.trans.l('action.clear_data'), () => {
      let confirmed = nativePopup.message(this.trans.l('action.clear_data.confirm'), true, true);

      if (!confirmed) {
        return;
      }

      new Auth().clearAll();
      new Cache().clear();
      service.username = '';
      service.password = '';
      service.access_token = '';
      popup.notify(this.trans.l('action.clear_data.done'), 3);
    });

  }
}

module.exports = Settings;
