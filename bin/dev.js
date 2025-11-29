#!/usr/bin/env node
var fs = require('fs');
const path = require('path')
const BASE_PATH = path.resolve(process.cwd());
const BUILD_PATH = `${BASE_PATH}/dist`;
const { spawn } = require('child_process');

(async () => {
  let source = BUILD_PATH + '/jellyfin.zip';
  let dest = process.env.HOME + '/.hts/showtime/installedplugins/jellyfin.zip';
  fs.copyFileSync(source, dest);
})();
