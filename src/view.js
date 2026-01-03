var page = require('movian/page');
var service = require('movian/service');
var popup = require('movian/popup');
var prop = require('movian/prop');
const Utils = require('./utils');
const Api = require('./api');

var utils = new Utils();

class View {
  constructor(plugin) {
    this.plugin = plugin;
    this.trans = plugin.trans;
    this.cache = plugin.cache;
    this.routes = [
      {
        path: `start`,
        view: this.showDebug
        // view: this.showHome
      },
      {
        path: `search:(.*)`,
        view: this.showSearch
      },
      {
        path: `library:(.*)`,
        view: this.showLibrary
      },
      {
        path: `series:(.*)`,
        view: this.showSeries
      },
      {
        path: `series:(.*):season:(.*)`,
        view: this.showSeason
      },
      {
        path: 'album:(.*)',
        view: this.showAlbum
      },
      {
        path: `video:(.*)`,
        view: this.showVideo
      },
      {
        path: 'credits',
        view: this.showCredits
      }
    ];

    this.api = new Api();
    this.user = {};

    this.sort_by = service.default_sort_by ?? null;
    this.sort_order = service.default_sort_order ?? null;
  }

  get prefix() {
    return this.plugin.id;
  }

  routing() {
    this.routes.forEach((route) => {
      new page.Route(`${this.prefix}:${route.path}`, route.view.bind(this));
    });
  }

  showHome(page) {
    page.options.createAction('update', this.trans.l('action.update', { plugin_name: this.plugin.title }), () => {
      popup.notify(this.trans.l('plugin.updating', { plugin_name: this.plugin.title }), 5);
      page.redirect(Utils.getLatestPlugin());
    });

    page.options.createAction('credits', this.trans.l('action.credits'), () => {
      page.redirect(`${this.prefix}:credits`);
    });

    this.setPageHeader(page, this.trans.l('plugin.loading'));
    page.model.contents = 'home';
    page.contents = 'home';
    page.type = 'home';

    if (!service.host || !service.username || !service.password) {
      page.metadata.name = this.trans.l('auth.missing_credentials.title');
      page.error(this.trans.l('auth.missing_credentials', { provider_name: "Jellyfin" }));
      return;
    }

    if (!service.access_token) {
      var authentication = this.api.authenticate();
      if (typeof authentication.User !== 'undefined') {
        this.user = authentication.User;
        this.api.setUser(this.user);
      }
      if (typeof authentication.AccessToken !== 'undefined') {
        service.access_token = authentication.AccessToken;
      }
    }

    var libraries = this.api.getLibraries();
    this.setPageHeader(page, service.host);
    page.appendItem(`${this.prefix}:search:`, 'search', { title: this.trans.l('') });

    var items = libraries.Items ?? [];
    if (items.length > 0) {
      page.appendItem('', 'separator', { title: this.trans.l('home.libraries') });
    items.forEach(item => {
      page.appendItem(`${this.prefix}:library:${item.Id}`, 'directory', {
        title: item.Name,
        icon: this.api.getItemImage(item.Id, 'Primary')
      });
      this.cache.set(`library:${item.Id}`, item);
    });
    }

    page.appendItem('', 'separator', '');
    page.loading = false;
  }

  showSearch = (page, query) => {
    this.setPageHeader(page, this.trans.l('plugin.loading'));

    page.model.contents = 'grid';
    page.contents = 'list';
    page.metadata.title = this.trans.l('search.title', { query: query });

  }

  showLibrary = (page, id) => {
    this.setPageHeader(page, this.trans.l('plugin.loading'));

    let title = '';
    try {
      let pageData = this.cache.get(`library:${id}`);
      title = pageData.Name;
    } catch (e) { }

    page.model.contents = 'grid';
    page.contents = 'list';
    page.metadata.title = title;

    var offset = 0;
    var limit = 20;
    var hasMore = true;

    var mediaTypes = {
      'Series': {
        'path': this.prefix + ':series:'
      },
      'Movie': {
        'path': this.prefix + ':video:'
      }
    };

    function browse() {
      if (!hasMore) return;

      setTimeout(() => {
        var data = this.api.getItemsData(id, offset, limit, this.sort_by, this.sort_order);

        // popup.notify(JSON.stringify(data), 3);
        let items = data.Items ?? [];
        items.forEach((item) => {
          let mediaItem = this.api.parseItem(item);
          let path = this.api.getPath(this.prefix, item.Id, item.Type);
          let pageItem = page.appendItem(path, 'video', mediaItem);

          if (item.Id && mediaItem) {
            this.cache.set(`item:${item.Id}`, mediaItem);
          }
        });

        offset += items.length;
        let totalEntries = data.TotalRecordCount;
        hasMore = offset < totalEntries;
        page.entries = totalEntries;
        page.haveMore(hasMore);
        page.loading = false;
      }, 125);
    }

    this.setSorting(page, () => {
      offset = 0;
      hasMore = true;
      browse.bind(this)();
    });

    page.asyncPaginator = browse.bind(this);
    browse.bind(this)();
  }

  showSeries = (page, series) => {
    this.setPageHeader(page, this.trans.l('plugin.loading'));

    let title = '';
    try {
      let pageData = this.cache.get(`item:${series}`);
      title = pageData.title;
    } catch (e) { }

    page.model.contents = 'grid';
    page.contents = 'list';
    page.metadata.title = title;

    var response = this.api.getSeriesSeasons(series);
    var seasons = response.Items ?? [];

    seasons.forEach((season) => {
      this.cache.set(`series:${series}:season:${season.Id}`, season);
      var mediaItem = {
        title: season.Name,
        icon: this.api.getItemImage(season.Id, 'Primary', {
          fillHeight: 319,
          fillWidth: 221,
          quality: 96
        })
      }

      var path = `${this.prefix}:series:${series}:season:${season.Id}`;
      page.appendItem(path, 'directory', mediaItem);
    });

    page.loading = false;
  }

  showSeason = (page, series, season) => {
    this.setPageHeader(page, this.trans.l('plugin.loading'));

    let title = '';
    try {
      let pageData = this.cache.get(`series:${series}:season:${season}`);
      title = pageData.Name;
    } catch (e) { }

    page.model.contents = 'grid';
    page.contents = 'grid';
    page.metadata.title = title;

    var response = this.api.getSeasonEpisodes(series, season);
    var episodes = response.Items ?? [];

    episodes.forEach((episode) => {
      var mediaItem = this.api.parseItem(episode);
      var path = this.api.getPath(this.prefix, episode.Id, episode.Type);
      let pageItem = page.appendItem(path, 'video', mediaItem)
    });

    page.loading = false;
  }

  showAlbum = (page, album) => {
    this.setPageHeader(page, this.trans.l('plugin.loading'));

    let title = '';
    try {
      let pageData = this.cache.get(`item:${album}`);
      title = pageData.Name;
    } catch (e) { }

    page.model.contents = 'list';
    page.contents = 'list';
    page.metadata.title = title;

    let songs = this.api.getAlbumSongs(album)['Items'] ?? [];
    songs.forEach((song) => {
      var mediaItem = this.api.parseItem(song);
      var path = this.api.getSongUrl(song.Id);
      let pageItem = page.appendItem(path, 'audio', mediaItem)
    });

    page.loading = false;
  }

  showVideo = (page, id) => {
    page.type = 'video';
    this.setPageHeader(page, this.trans.l('plugin.loading'));
    var media = this.api.getItemData(id);

    page.options.createAction('update', this.trans.l('action.update', { plugin_name: this.plugin.title }), () => {
      popup.notify(this.trans.l('plugin.updating', { plugin_name: this.plugin.title }), 5);
      page.redirect(Utils.getLatestPlugin());
    });

    page.options.createAction('credits', this.trans.l('action.credits'), () => {
      page.redirect(`${this.prefix}:credits`);
    });

    var bitrate = 5616000; // 1080p
    var defaultSubtitleSource = 'Jellyfin';
    var subtitles = [];

    var sources = media.MediaSources ?? [];
    sources.forEach((source) => {
      if (source.VideoType == "VideoFile") {
        bitrate = source.Bitrate;

        var streams = source.MediaStreams ?? [];
        streams.forEach((stream, j) => {
          if (stream.Type === 'Subtitle') {
            subtitles.push({
              title: stream.DisplayTitle || stream.Title,
              url: `${service.host}/Videos/${id}/${source.Id}/Subtitles/${j}/Stream.srt`,
              language: stream.Language,
              source: defaultSubtitleSource,
            });
          }
        });
      }
    });

    // popup.notify(JSON.stringify(media), 3);


    var url = `${service.host}/Videos/${id}/master.m3u8`;
    var params = utils.paramsToString({
      api_key: service.access_token,
      static: false,
      VideoCodec: ['h264'].join(','),
      // VideoCodec: 'av1,h264,vp9',
      // VideoCodec: 'mkv',
      // VideoCodec: 'mp4',

      VideoBitrate: bitrate,
      AudioCodec: ['aac', 'opus', 'flac'].join(','),
      // AudioCodec: 'mp3',
      MediaSourceId: id,
      RequireAvc: false,
      EnableAudioVbrEncoding: false,
      TranscodingMaxAudioChannels: 2,
      AudioStreamIndex: 1,
      // SegmentContainer: 'mp4',
      MinSegments: 1,
      BreakOnNonKeyFrames: true,
      'hevc-level': 120,
      'hevc-videobitdepth': 8,
      'h264-profile': ['high', 'main', 'baseline', 'constrainedbaseline'].join(','),
      'h264-rangetype': 'SDR',
      'h264-level': 52,
      'h264-deinterlace': true
    });

    url = url + '?' + params;
    // popup.notify(url, 3);

    var videoParams = {
      title: media.Name,
      icon: this.api.getMediaLogo(id),
      canonicalUrl: url,
      sources: [{
        url: url,
        // mimetype: 'mkv'
        extension: 'm3u8',
        mimetype: 'hls',
        mime: 'hls'
      }],
      no_subtitle_scan: true,
      no_fs_scan: true,
      subtitles: subtitles,
    }
    if (typeof media.ProviderIds.Imdb !== 'undefined') {
      videoParams.imdbid = media.ProviderIds.Imbd;
    }

    var source = 'videoparams:' + JSON.stringify(videoParams);
    page.type = 'video';
    // page.redirect('videoparams:' + JSON.stringify(videoParams));
    // console.log(source);
    // page.redirect(source);
    // page.type = 'video';

    page.source = source;
    page.loading = false;
  }

  showCredits = (page) => {
    this.setPageHeader(page, "Credits");
    page.contents = 'list';
    page.type = 'directory';
    page.model.contents = 'grid';

    page.loading = false;
    page.appendPassiveItem(
      'directory',
      { 'url': '' },
      {
        'title': this.trans.l('credits.github'),
        'icon': Plugin.path + 'assets/github.png'
      },
    );
    page.appendPassiveItem(
      'directory',
      { 'url': '' },
      {
        'title': this.trans.l('credits.kofi'),
        'icon': Plugin.path + 'assets/kofi.png'
      },
    );
  }

  showDebug = (page) => {
    this.setPageHeader(page, "Debug");
    page.loading = true;

    var profiles = [
      { name: "Add new profile", avatar: this.plugin.path + "assets/add_circle.svg" },
    ];

    let i = 0;
    while (i < 3) {
      profiles.push({ name: "Profile " + i, avatar: `${service.host}/Users/f115ca98da1e48e1b110f4f3eac99ca4/Images/Primary?tag=5f87fc5a7a357d05cfc2c5424f683f7a&quality=90` });
      i++;
    }

    console.log(profiles);

    page.metadata.profiles = profiles;

    page.metadata.glwview = this.plugin.path + "views/profiles.view";
    page.type = 'raw';
    page.loading = false;
  }

  setPageHeader(page, title) {
    if (page.metadata) {
      page.metadata.title = title;
      page.metadata.icon = this.plugin.logo;
      page.metadata.background = this.plugin.path + "assets/jellyfin_bg.png";
    }
    page.type = "directory";
    page.contents = "items";
    page.entries = 0;
    page.loading = true;
  }

  setSorting(page, callback = false) {
    let sortByOpts = [];
    let sortOrderOpts = [
      ['asc', this.trans.l('sort.order_asc'), false],
      ['desc', this.trans.l('sort.order_desc'), false]
    ];

    Object.entries(Api.sortOptions).forEach(([key, value]) => {
      sortByOpts.push([value, this.trans.l('sort.' + key), false]);
    });

    sortByOpts.forEach((opt, index) => {
      if (opt[0] == this.sort_by) {
        sortByOpts[index][2] = true;
      }
    });

    sortOrderOpts.forEach((opt, index) => {
      if (opt[0] == this.sort_order) {
        sortOrderOpts[index][2] = true;
      }
    });

    let optionChanged = (value, type) => {
      this[type] = value;
      page.flush();
      if (typeof callback === 'function') {
        callback(value);
      }
    };

    page.options.createMultiOpt('sort_by', this.trans.l('page.sort_by'), sortByOpts, (value) => {
      optionChanged(value, 'sort_by');
    });

    page.options.createMultiOpt('sort_order', this.trans.l('page.sort_order'), sortOrderOpts, (value) => {
      optionChanged(value, 'sort_order');
    });
  }

}

module.exports = View;
