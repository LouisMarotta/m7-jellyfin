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

  // getTimeFromTicks: function(ticks) {
  // let ticksToMicrotime = ticks / 10000;
  // let epochMicrotimeDiff = Math.abs(new Date(0, 0, 1).setFullYear(1));
  // let tickDate = new Date(ticksToMicrotime - epochMicrotimeDiff);

  // let date = tickDate.getDate();
  // let month = tickDate.getMonth()+1; //Be careful! January is 0 not 1
  // let year = tickDate.getFullYear();
  // let hours=tickDate.getHours();
  // let minutes=tickDate.getMinutes();
  // let seconds=tickDate.getSeconds();

  //     return {
  //     date:date,
  //     month:month,
  //     year:year,
  //     hours:hours,
  //     minutes:minutes,
  //     seconds:seconds
  //     }
  // }


  // TODO: Handle releasese from Ko-fi
  static getLatestPlugin() {
    return 'https://github.com/LouisMarotta/m7-jellyfin/releases/latest/download/jellyfin.zip';
  }
}

module.exports = Utils;
