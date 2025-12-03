var service = require('movian/service');

class Utils {
  paramsToString = function (obj) {
    var pairs = [];
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        var value = obj[key];
        if (Array.isArray(value)) {
          for (var i = 0; i < value.length; i++) {
            pairs.push(encodeURIComponent(key) + '=' + encodeURIComponent(value[i]));
          }
        } else {
          pairs.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
        }
      }
    }
    return pairs.join('&');
  }

  joinString = function (array, separator = ',') {
    var O = Object(array);
    var len = O.length >>> 0;

    if (len === 0) {
      return '';
    }

    var result = [];
    for (var k = 0; k < len; k++) {
      if (k in O) {
        result.push(String(O[k]));
      }
    }
    return result.join(separator);
  }

  getDevice = function () {
    var device = 'Movian';
    if (service.ps3_compatibility) {
      device = 'Sony Playstation 3';
    }

    return device;
  }

  getOptimalBitrate = function (maxBitrate) {

  }

  // TODO: Handle releasese from Ko-fi
  static getLatestPlugin() {
    return 'https://github.com/LouisMarotta/m7-jellyfin/releases/latest/download/jellyfin.zip';
  }

  ticksToDate(input = 0) {
    var epochTicks = 621355968000000000;
    var ticksPerMillisecond = 10000;
    var jsTicks = (input - epochTicks) / ticksPerMillisecond;
    return new Date(jsTicks);
  }

  getTotalDuration(date) {
    let hours = date.getUTCHours();
    let minutes = date.getUTCMinutes();
    let seconds = date.getUTCSeconds();

    return (hours * 3600) + (minutes * 60) + seconds;
  }
}

module.exports = Utils;
