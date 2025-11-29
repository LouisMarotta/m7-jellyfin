var prop = require('movian/prop');

// TODO: Load the locales from storage
class I18n {
  constructor(languages, iso, fallback = 'en') {
    this.languages = typeof languages === 'string' ? JSON.parse(languages) : languages;
    this.iso = typeof this.languages[iso] !== 'undefined' ? iso : fallback;
    this.fallback = fallback;
  }

  static getSelectedLanguage() {
    try {
      return prop.global.i18n.iso639_1.toString();
    } catch (e) {
      console.log('Couldn\'t get language', e);
    }
    return 'en';
  }

  compile = (str, params = {}) => {
    str = typeof str !== 'string' ? str.toString() : str;
    return str.replace(/{{(.+?)}}/g, (_, g1) => params[g1] || g1);
  }

  l(key, params = {}) {
    try {
      let string = this.getKey(key);
      if (Object.keys(params).length > 0) {
        string = this.compile(string, params);
      }
      return string;
    } catch (e) { }
    return '';
  }

  getKey(key) {
    return (this.languages[this.iso][key] ?? this.languages[this.fallback][key]) || key;
  }
}

module.exports = I18n;
