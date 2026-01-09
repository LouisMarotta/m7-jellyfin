var prop = require('movian/prop');
var Api = require('./api');

class Tracking {
  distance = 20 * 1000; // Ticks every 20 seconds

  constructor(api = null) {
    this.api = api ?? new Api();

    this.itemId = '';
    this.timerId = null;
    this.listeners = {};

    this.paused = false;
    this.tickCount = 0;

    this.listeners.playStatus = prop.subscribe(
      prop.global.media.current.playstatus,
      this.handlePlayStatusChange.bind(this),
      {
        immediate: true
      }
    );
  }

  static canScrobble() {
    return !(Core.currentVersionInt < 50000241);
  }

  destroy() {
    this.stopTracking();
    this.removeListeners();
  }

  normalizeVolume(value, min = -75, max = 12) {
    return ((value - min) / (max - min)) * 100;
  }

  get canSeek() {
    let canSeek = true;
    try {
      canSeek = prop.global.media.current.canSeek.getBool();
    } catch (e) { };

    return canSeek;
  }

  get muted() {
    let muted = false;
    try {
      muted = prop.global.audio.mastermute.getBool();
    } catch (e) { }

    return muted;
  }

  get volume() {
    let volume = 12;
    try {
      volume = prop.global.audio.mastervolume.toString();
    } catch (e) { };

    return this.normalizeVolume(volume);
  }

  setListeners() { }

  handlePlayStatusChange(action, value) {
    if (['start'].indexOf(value)) {
      this.paused = false;
      // this.setListeners();

      if (!this.timerId) {
        this.startTracking();
      }
    }

    if (['pause'].indexOf(value)) {
      console.log('paused');
      this.paused = true;
    }

    if (null == value) {
      // this.removeListeners(['playStatus']);
      this.stopTracking();
    }
  }

  startTracking() {
    const execute = () => {
      if (this.tickCount == 0) {
        this.api.setTrackingPlaying(this.itemId, this.paused, this.canSeek, this.volume);
      } else {
        this.api.setTrackingProgress(this.itemId, this.paused, this.canSeek, this.volume);
      }

      this.timerId = setTimeout(execute, this.distance);
      this.tickCount++;
    };

    execute();
  }

  stopTracking() {
    this.tickCount = 0;
    clearTimeout(this.timerId);
    this.timerId = null;
  }

  removeListeners(exclusions = []) {
    if (typeof exclusions !== 'array') {
      exclusions = [exclusions];
    }

    Object.entries(this.listeners).forEach(([key, value]) => {
      if (exclusions.indexOf(key)) {
        return;
      }

      prop.destroy(value);
    });
  }


}


module.exports = Tracking;
