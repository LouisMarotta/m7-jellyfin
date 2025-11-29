
<p align="center">
  <img src="assets/logo.png" alt="logo" title="jellyfin" height="45px" width="45px" />
</p>

# Movian Jellyfin

A Movian 7 plugin to stream your Jellyfin library

[![MIT License](https://img.shields.io/github/downloads/LouisMarotta/m7-jellyfin/jellyfin.zip?logo=github&label=Downloads)](https://choosealicense.com/licenses/mit/)
[![GPLv3 License](https://img.shields.io/badge/License-GPL%20v3-yellow.svg)](https://opensource.org/licenses/)
[![Ko-Fi](https://img.shields.io/badge/Ko--fi-F16061?&logo=ko-fi&logoColor=white)](https://ko-fi.com/louismarotta)

## Getting started

### Installing
Add the plugin by downloading the zip, and navigating to it from Movian.
Otherwise you can drop the zip into the `settings/installedplugins` folder, on PlayStation 3 it's in `/dev_hdd0/game/HTSS00003/USRDIR/settings/installedplugins/`.

In the plugin's settings, you can add the credentials to your Jellyfin's user.

## Building

```
npm install
npm run build
```

This will generate the zip into the `/dist` folder

## Roadmap

- [x] Subtitle support
- [ ] Resume from where you've left
- [ ] Music playback
- [ ] Scrobble playback
- [ ] Additional provider support (Emby)
- [ ] Multi profile support
- [ ] QuickLogin support
- [ ] Custom Movie/TV Series detailed view

## Support me
If you like my work, please consider buying me a coffee at https://ko-fi.com/louismarotta

## FAQ

### My streams are low quality
If you're streaming a H.264 title, be sure to have set `HLS Resolution Limit` to atleast 1080p in `Settings > Video playback`.

### Which devices are supported
This should work on every device supported by Movian, including PlayStation 3 and Raspberry Pi.

## Acknowledgements
 - [Movian Documentation](https://buksa.github.io/movian-docs/) ([Buksa](https://github.com/Buksa))
 - [Jellyfin Documentation](https://api.jellyfin.org/)

## License

[GNU General Public License v3.0 ©](https://choosealicense.com/licenses/gpl-3.0/)
