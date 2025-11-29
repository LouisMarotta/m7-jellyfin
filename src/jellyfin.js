var service = require('movian/service');

const I18n = require('./i18n');
const View = require('./view');
const Settings = require('./settings');

class Jellyfin {
  constructor(path = '', manifest = {}) {
    this.path = path;
    this.metadata = typeof manifest === 'string'
      ? JSON.parse(manifest)
      : manifest;

    this.trans = new I18n(
      this.metadata.i18n,
      I18n.getSelectedLanguage()
    );
  }

  get title() {
    return this.metadata.title ?? '';
  }

  get id() {
    return this.metadata.id ?? '';
  }

  get icon() {
    return this.path + this.metadata.icon ?? '';
  }

  init() {
    service.create(this.title, `${this.id}:start`, 'video', true, this.icon);

    var settings = new Settings(this);
    var view = new View(this);

    settings.init();
    view.routing();
  }
}

var jellyfin = new Jellyfin(Plugin.path, Plugin.manifest);
jellyfin.init();



function getVideoStream(id) {
  // https://api.jellyfin.org/#tag/Videos/operation/GetVideoStreamByContainer
  // https://gist.github.com/EthanArmbrust/efd561585722647ba3310fa9016e4b8a#file-sony-playstation-3-movian-xml
  // var url = service.host '/Videos/' + id + '/stream.'
}
