class Tracking {
  constructor() {
    var videoscrobbler = require('movian/videoscrobbler');
    var vs = new videoscrobbler.VideoScrobbler();
  }

  static canScrobble() {
    return !(Core.currentVersionInt < 50000241);
  }
}
