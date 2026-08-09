var http = require('movian/http');
var plugin = JSON.parse(Plugin.manifest);
var service = require('movian/service');
const Utils = require('./utils');
const utils = new Utils();

class Api {
  static defaultSorting = 'SortName';
  static sortOptions = {
    name: 'SortName',
    release_date: 'PremiereDate',
    date_added: 'DateCreated',
    last_played: 'DatePlayed'
  }
  static mediaMap = {
    'collectionfolder': '{{prefix}}:library:{{id}}',
    'manualplaylistsfolder': '{{prefix}}:library:{{id}}',
    'playlist': '{{prefix}}:library:{{id}}',
    'series': '{{prefix}}:series:{{id}}',
    'season': '{{prefix}}:series:{{id}}:season:{{season}}',
    'episode': '{{prefix}}:video:{{episode}}',
    'musicalbum': '{{prefix}}:album:{{id}}',
    'channel': '{{prefix}}:video:{{id}}'
  };

  constructor(user = {}) {
    this.user = user;
  }

  setUser = function (user) {
    this.user = user;
  }

  get host() {
    let url = service.host.trim();

    let hasHttpPrefix = new RegExp("^(http|https)://", "i");
    if (!hasHttpPrefix.test(url)) {
      url = `${service.is_secure ? 'https' : 'http'}://${url}`;
    }

    return url;
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
      var url = `${this.host}/Users/AuthenticateByName`;
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

    if (response.statuscode && response.statuscode == 200) {
      response = JSON.parse(response);
    }

    return response;
  }

  getLibraries = function () {
    let params = {
      IncludeItemTypes: 'Movie',
      Recursive: 'true',
      Fields: ['PrimaryImageAspectRatio', 'BasicSyncInfo', 'ChannelImage'].join(',')
    };

    var url = this.host + '/Items?request=' + JSON.stringify(params);

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
    var url = `${this.host}/Items/${id}`;

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

  getItemsData = function (id = null, offset = 0, limit = 100, sortBy = null, sortOrder = 'Ascending', extraParams = {}) {
    let sort = ['SortName', 'ProductionYear'];
    sortBy = sortBy ? sortBy : Api.defaultSorting;

    if (sort.indexOf(sortBy) === -1) {
      sort.unshift(sortBy);
    }

    sortOrder = typeof sortOrder === 'string' ? sortOrder : 'Ascending';
    switch (sortOrder.toLowerCase()) {
      case 'descending':
      case 'desc':
        sortOrder = 'Descending';
        break;
      case 'ascending':
      case 'asc':
      default:
        sortOrder = 'Ascending';
        break;
    }

    let params = {
      SortBy: typeof sort === 'array' ? sort.join(',') : sort,
      SortOrder: sortOrder,
      StartIndex: offset,
      Limit: limit,
      IncludeItemTypes: ['Movie', 'Series', 'MusicAlbum'].join(','),
      Recursive: true,
      Fields: ["PrimaryImageAspectRatio", "MediaSourceCount", "Genres", "Overview"].join(','),
      ImageTypeLimit: 1,
      EnableImageTypes: ["Primary", "Backdrop", "Banner", "Thumb"].join(',')
    }

    if (id) {
      params['ParentId'] = id;
    }

    params = {
      ...params,
      ...extraParams
    };

    params = utils.paramsToString(params);
    var url = `${this.host}/Users/${this.user.Id}/Items?${params}`;

    var response = http.request(url, {
      method: 'GET',
      headers: this.getDefaultHeaders()
    });

    if (response.statuscode && response.statuscode == 200) {
      response = JSON.parse(response);
    }

    return response;
  }

  /**
   * Get items from query
   * @param {string} query
   * @param {Number} limit
   * @returns Object
   */
  getItems = (query = '', limit = 100, itemTypes = {}) => {
    let types = {
      'movies': 'Movie',
      'tvseries': 'Series',
      'episodes': 'Episode',
      'music': 'MusicAlbum'
    }

    let includedItemTypes = [];
    Object.entries(itemTypes).forEach(([key, value]) => {
      if (typeof types[key] !== 'undefined' && value) {
        includedItemTypes.push(types[key]);
      }
    });

    let params = {
      userId: this.user.Id,
      limit: limit,
      searchTerm: query,
      includeItemTypes: includedItemTypes.join(','),
      recursive: true,
    }

    params = utils.paramsToString(params);
    let url = `${this.host}/Items?${params}`;

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
    let params = {
      userId: this.user.Id,
      Fields: ['ItemCounts', 'PrimaryImageAspectRatio', 'MediaSourceCount'].join(',')
    };

    var url = `${this.host}/Shows/${id}/Seasons?${utils.paramsToString(params)}`;
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
    let params = {
      seasonId: season,
      userId: this.user.Id,
      Fields: ['ItemCounts', 'PrimaryImageAspectRatio', 'MediaSourceCount', 'Overview'].join(',')
    };

    var url = `${this.host}/Shows/${series}/Episodes?${utils.paramsToString(params)}`;
    var response = http.request(url, {
      method: 'GET',
      headers: this.getDefaultHeaders()
    });

    if (response.statuscode && response.statuscode == 200) {
      response = JSON.parse(response);
    }

    return response;
  }

  getAlbumSongs = function (album) {
    let params = {
      ParentId: album,
      Fields: ['ItemCounts', 'PrimaryImageAspectRatio', 'MediaSourceCount', 'Overview'].join(','),
      SortBy: ['ParentIndexNumber', 'IndexNumber', 'SortName'].join(',')
    }

    var url = `${this.host}/Users/${this.user.Id}/Items?${utils.paramsToString(params)}`;
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
    let params = {
      'quality': quality,
      'format': 'Png'
    }

    let url = `${this.host}/Items/${id}/Images/Logo?${utils.paramsToString(params)}`;
    return url.trim();
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
    let url = `${this.host}/Items/${id}/Images/${type}?${parameters}`;
    return url.trim();
  }

  getItemData = function (id) {
    var url = `${this.host}/Users/${this.user.Id}/Items/${id}?Fields=MediaStreams`;
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
    var url = `${this.host}/Items/${id}/PlaybackInfo`;
    var response = http.request(url, {
      method: 'GET',
      headers: this.getDefaultHeaders()
    });

    if (response.statuscode && response.statuscode == 200) {
      response = JSON.parse(response);
    }

    return response;
  }

  getLiveTvChannels = function (offset = 0, limit = 100, sortBy = null, sortOrder = 'Ascending') {
    let params = {
      userId: this.user.Id,
      startIndex: offset,
      limit: limit,
      sortBy: sortBy ?? Api.defaultSorting,
      sortOrder: sortOrder,
      addCurrentProgram: true,
      enableFavoriteSorting: true,
      enableUserData: false,
      Fields: ['PrimaryImageAspectRatio', 'MediaSourceCount', 'ChannelImage'].join(','),
      ImageTypeLimit: 1,
      EnableImageTypes: ['Primary', 'Backdrop', 'Thumb'].join(',')
    };

    params = utils.paramsToString(params);
    var url = `${this.host}/LiveTv/Channels?${params}`;
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

  parseItem = function (item) {
    var mediaItem = {
      title: item.Name
    };

    let type = item.Type;
    let icon = null;
    switch (type) {
      case 'Episode':
        icon = this.getItemImage(item.Id, 'Primary', {
          fillWidth: 600,
          fillHeight: 600,
          quality: 90
        });
        break;
      case 'Channel':
        icon = this.getItemImage(item.Id, 'Primary', {
          fillHeight: 177,
          fillWidth: 315,
          quality: 96,
          format: 'Jpg'
        });
        break;
      case 'Audio':
      case 'MusicAlbum':
        icon = this.getItemImage(item.Id, 'Primary', {
          fillHeight: 175,
          fillWidth: 175,
          quality: 100,
          format: 'Jpg'
        });
        break;
      case 'Movie':
      default:
        icon = this.getItemImage(item.Id, 'Thumb', {
          fillHeight: 177,
          fillWidth: 315,
          quality: 96,
          format: 'Jpg'
        });
        break;
    }

    if (icon) {
      mediaItem.icon = icon;
    }

    if (['Series'].indexOf(item.Type) < 0) {
      let totalTicks = item.RunTimeTicks ?? 0;
      if (totalTicks > 0) {
        mediaItem.duration = utils.getTotalDuration(utils.ticksToDate(totalTicks));
      }
    }

    if (['Episode'].indexOf(item.Type)) {
      if (typeof item.IndexNumber !== 'undefined' && !isNaN(item.IndexNumber)) {
        mediaItem.title = item.IndexNumber + '. ' + mediaItem.title;
        mediaItem.episode = parseInt(item.IndexNumber);
      }
    }

    if (typeof item.ProductionYear !== 'undefined') {
      mediaItem.year = item.ProductionYear;
    }

    if (typeof item.CommunityRating !== 'undefined') {
      mediaItem.rating = Math.round(item.CommunityRating * 10);
    }

    if (typeof item.Genres !== 'undefined') {
      mediaItem.genres = item.Genres.join(', ');
    }

    if (typeof item.Overview !== 'undefined') {
      mediaItem.description = item.Overview;
    }

    if (['Channel'].indexOf(item.Type) > -1) {
      if (typeof item.CurrentProgram !== 'undefined' && item.CurrentProgram.Name) {
        mediaItem.description = item.CurrentProgram.Name;
      }
    }

    if (['Audio'].indexOf(item.Type) > -1) {
      mediaItem.artist = item.AlbumArtist;
      mediaItem.track = item.IndexNumber;
      mediaItem.album = item.Album;
      mediaItem.sources = [];
      mediaItem.sources.push({
        url: this.getSongUrl(item.Id),
        mimetype: "audio/mpeg"
      });
    }

    return mediaItem;
  }

  getSongUrl = function (id) {
    let params = {
      UserId: this.user.Id,
      MaxStreamingBitrate: 140000000,
      Container: 'opus,webm|opus,ts|mp3,mp3,aac,m4a|aac,m4b|aac,flac,webma,webm|webma,wav,ogg',
      TranscodingContainer: 'mp4',
      TranscodingProtocol: 'hls',
      ApiKey: service.access_token,
      AudioCodec: 'aac',
      EnableRedirection: true,
      EnableRemoteMedia: false,
      EnableAudioVbrEncoding: true
    }
    params = utils.paramsToString(params);
    return `${this.host}/Audio/${id}/universal?${params}`;
  }

  getMediaPath = function (item, context = {}) {
    let path = null;

    let id = item.Id ?? 0;
    let type = (item.Type).toLowerCase() ?? 'video';
    let mediaType = (item.MediaType).toLowerCase() ?? null;

    if (mediaType == 'video') {
      path = '{{prefix}}:video:{{id}}';
    }

    if (mediaType == 'audio') {
      path = this.getSongUrl(id);
    }

    if (!path && typeof Api.mediaMap[type] !== 'undefined') {
      path = Api.mediaMap[type];
    }

    context.id = id;
    if (path) {
      path = path.replace(/\{\{(\w+)\}\}/g, (match, placeholder) => {
        return typeof context[placeholder] !== 'undefined' ? context[placeholder] : match;
      });
    }

    let item = 'directory';
    if (['movie', 'episode', 'channel'].indexOf(type) > -1) {
      item = 'video';
    }
    if (['audio'].indexOf(type) > -1) {
      item = 'audio';
    }

    return { path, type: item };
  }
}

module.exports = Api;
