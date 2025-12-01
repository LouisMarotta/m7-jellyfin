var http = require('movian/http');
var page = require('movian/page');
var service = require('movian/service');
const Utils = require('./utils');
const Api = require('./api');

var utils = new Utils();

class View {
  constructor(plugin) {
    this.plugin = plugin;
    this.trans = plugin.trans;
    this.routes = [
      {
        path: `start`,
        // view: this.showDebug
        view: this.showHome
      },
      {
        path: `searchresults:(.*)`,
        view: this.showSearch
      },
      {
        path: `folder:(.*)`,
        view: this.showFolder
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
    page.appendItem(`${this.prefix}:searchresults:`, 'search', { title: this.trans.l('') });

    page.appendItem('', 'separator', '');
    var items = libraries.Items ?? [];
    items.forEach(item => {
      page.appendItem(`${this.prefix}:folder:${item.Id}`, 'directory', {
        title: item.Name,
        icon: this.api.getItemImage(item.Id, 'Primary')
      });
    });

    page.appendItem('', 'separator', '');
    page.loading = false;
  }

  showSearch = (page, query) => {

  }

  showFolder = (page, id) => {
    this.setPageHeader(page, this.trans.l('plugin.loading'));

    // page.name = 'xd'
    // page.metadata.name = 'xd'

    // page.metadata.glwview = Plugin.path + "views/details.view";
    // page.type = 'raw';

    // return false;
    //

    page.model.contents = 'grid';
    page.contents = 'list';
    page.metadata.title = 'Movies';
    // page.options.createAction('sort_by', 'Sort By', static(prova) {

    // });

    // page.options.createOptAction

    // console.log(page.options);
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
        var data = this.api.getItemsData(id, offset, limit);

        // popup.notify(JSON.stringify(data), 3);
        let items = data.Items ?? [];
        items.forEach((item) => {
          var mediaItem = {
            title: item.Name,
            icon: item.Type === 'MusicAlbum'
              ? this.api.getItemImage(item.Id, 'Primary', { fillHeight: 175, fillWidth: 175, quality: 100, format: 'Jpg' })
              : this.api.getItemImage(item.Id, 'Thumb', { fillHeight: 177, fillWidth: 315, quality: 96, format: 'Jpg' }),
          };

          let totalTicks = item.RunTimeTicks ?? 0;
          if (totalTicks > 0) {
            mediaItem.duration = utils.getTotalDuration(utils.ticksToDate(totalTicks));
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

          var path = `${this.prefix}:video:${item.Id}`;
          if (typeof mediaTypes[item.Type] !== 'undefined') {
            path = mediaTypes[item.Type]['path'] + item.Id;
          }
          page.appendItem(path, 'video', mediaItem);
        });

        offset += items.length;
        hasMore = offset < data.TotalRecordCount;
        page.haveMore(hasMore);
        page.loading = false;
      }, 125);
    }

    page.asyncPaginator = browse.bind(this);
    browse.bind(this)();
  }

  showSeries = (page, series) => {
    this.setPageHeader(page, this.trans.l('plugin.loading'));

    page.model.contents = 'grid';
    page.contents = 'list';
    page.metadata.title = 'Movies';


    var response = this.api.getSeriesSeasons(series);
    var seasons = response.Items ?? [];

    seasons.forEach((season) => {
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

    page.model.contents = 'grid';
    page.contents = 'grid';
    page.metadata.title = 'Movies';

    var response = this.api.getSeasonEpisodes(series, season);
    var episodes = response.Items ?? [];

    episodes.forEach((episode) => {
      var mediaItem = {
        title: episode.Name,
        icon: this.api.getItemImage(episode.Id, 'Primary', {
          fillWidth: 600,
          fillHeight: 600,
          quality: 90
        })
      };

      let totalTicks = episode.RunTimeTicks ?? 0;
      if (totalTicks > 0) {
        mediaItem.duration = utils.getTotalDuration(utils.ticksToDate(totalTicks));
      }

      if (typeof episode.IndexNumber !== 'undefined' && !isNaN(episode.IndexNumber)) {
        mediaItem.title = episode.IndexNumber + '. ' + mediaItem.title;
        mediaItem.episode = parseInt(episode.IndexNumber);
      }

      if (typeof episode.Overview !== 'undefined') {
        mediaItem.description = episode.Overview;
      }

      var path = this.prefix + ':video:' + episode.Id;
      page.appendItem(path, 'video', mediaItem)
    });

    page.loading = false;
  }

  showVideo = (page, id) => {
    page.loading = true;
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
    page.metadata.glwview = Plugin.path + "views/loading.view";
    page.type = 'raw';
    page.loading = false;

    page.model.metadata.progress = 10;
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

}

module.exports = View;
