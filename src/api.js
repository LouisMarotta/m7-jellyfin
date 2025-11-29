var http = require('movian/http');
var plugin = JSON.parse(Plugin.manifest);
var service = require('movian/service');
const Utils = require('./utils');
const utils = new Utils();

class Api {

  constructor(user = {}) {
    this.user = user;
  }

  setUser = function (user) {
    this.user = user;
  }

  getHeaders = function (authorization = false) {
    var deviceId = Core.deviceId;
    var header = `MediaBrowser Client="Movian", Device="${utils.getDevice()}", DeviceId="${deviceId}", Version="${plugin.version}"`;
    if (authorization) {
      header += `, Token="${service.access_token}"`;
    }

    return header;
  }

  getDefaultHeaders = function () {
    return {
      'Content-Type': 'application/json',
      'Authorization': this.getHeaders(true),
      'X-Emby-Token': service.access_token
    }
  }

  authenticate = function () {
    try {
      var url = `${service.host}/Users/AuthenticateByName`;
      var response = http.request(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Emby-Authorization': this.getHeaders()
        },
        postdata: JSON.stringify({
          Username: service.username,
          Pw: service.password
        })
      });
    } catch (e) {
      console.log(e);
    }


    // if (response.statuscode && response.statuscode !== 200) {
    // 	return page.error(i18n.ErrorUnknown);
    // }
    console.log(response);
    if (response.statuscode && response.statuscode == 200) {
      response = JSON.parse(response);
    }

    return response;
  }

  getLibraries = function () {
    var params = {
      IncludeItemTypes: 'Movie',
      Recursive: 'true',
      Fields: ['PrimaryImageAspectRatio', 'BasicSyncInfo', 'ChannelImage'].join(',')
    };

    var url = service.host + '/Items?request=' + JSON.stringify(params);

    // try {
    var response = http.request(url, {
      method: 'GET',
      headers: this.getDefaultHeaders()
    });
    // } catch (e) {
    //     console.log(e);
    // }

    if (response.statuscode && response.statuscode == 200) {
      response = JSON.parse(response);
    }

    return response;
  }

  getLibraryData = function (id) {
    var url = `${service.host}/Items/${id}`;

    // try {
    var response = http.request(url, {
      method: 'GET',
      headers: this.getDefaultHeaders()
    });
    // } catch (e) {
    //     console.log(e);
    // }

    if (response.statuscode && response.statuscode == 200) {
      response = JSON.parse(response);
    }

    return response;
  }

  getItemsData = function (id, offset = 0, limit = 100, sortBy = ['SortName', 'ProductionYear'], sortOrder = 'Ascending') {
    var params = {
      SortBy: sortBy.join(','),
      SortOrder: sortOrder,
      ParentId: id,
      StartIndex: offset,
      Limit: limit,
      IncludeItemTypes: ['Movie', 'Series', 'MusicAlbum'].join(','),
      Recursive: true,
      Fields: ["PrimaryImageAspectRatio", "MediaSourceCount", "Genres", "Overview"].join(','),
      ImageTypeLimit: 1,
      EnableImageTypes: ["Primary", "Backdrop", "Banner", "Thumb"].join(',')
    }
    params = utils.paramsToString(params);
    var url = `${service.host}/Users/${this.user.Id}/Items?${params}`;

    var response = http.request(url, {
      method: 'GET',
      headers: this.getDefaultHeaders()
    });

    if (response.statuscode && response.statuscode == 200) {
      response = JSON.parse(response);
    }

    return response;
  }

  getSeriesSeasons = function (id) {
    var params = {
      userId: this.user.Id,
      Fields: ['ItemCounts', 'PrimaryImageAspectRatio', 'MediaSourceCount'].join(',')
    };

    var url = `${service.host}/Shows/${id}/Seasons?${utils.paramsToString(params)}`;
    var response = http.request(url, {
      method: 'GET',
      headers: this.getDefaultHeaders()
    });

    if (response.statuscode && response.statuscode == 200) {
      response = JSON.parse(response);
    }

    return response;
  }

  getSeasonEpisodes = function (series, season) {
    var params = {
      seasonId: season,
      userId: this.user.Id,
      Fields: ['ItemCounts', 'PrimaryImageAspectRatio', 'MediaSourceCount', 'Overview'].join(',')
    };

    var url = `${service.host}/Shows/${series}/Episodes?${utils.paramsToString(params)}`;
    var response = http.request(url, {
      method: 'GET',
      headers: this.getDefaultHeaders()
    });

    if (response.statuscode && response.statuscode == 200) {
      response = JSON.parse(response);
    }

    return response;
  }

  getMediaLogo = function (id, quality = 90) {
    var params = {
      'quality': quality,
      'format': 'Png'
    }

    return `${service.host}/Items/${id}/Images/Logo?${utils.paramsToString(params)}`;
  }

  getItemImage = function (
    id,
    type,
    parameters = { fillHeight: 177, fillWidth: 315, quality: 96 }
  ) {
    if (['Primary', 'Thumb', 'Logo'].indexOf(type) === -1) {
      throw 'Invalid type';
    }

    parameters = utils.paramsToString(parameters);
    return `${service.host}/Items/${id}/Images/${type}?${parameters} `;
  }

  getItemData = function (id) {
    var url = `${service.host}/Users/${this.user.Id}/Items/${id}`;
    var response = http.request(url, {
      method: 'GET',
      headers: this.getDefaultHeaders()
    });

    if (response.statuscode && response.statuscode == 200) {
      response = JSON.parse(response);
    }

    return response;
  }

  getPlaybackInfo = function (id) {
    var url = `${service.host}/Items/${id}/PlaybackInfo`;
    var response = http.request(url, {
      method: 'GET',
      headers: this.getDefaultHeaders()
    });

    if (response.statuscode && response.statuscode == 200) {
      response = JSON.parse(response);
    }

    return response;
  }

  favoriteItem = function (item) {
    // POST TO /Users/{userId}/FavoriteItems/5bf7c2bd8ed30f8d6f96f4dc119260f6

    // DELETE TO SAME
  }

}

module.exports = Api;
