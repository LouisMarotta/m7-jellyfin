#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const BASE_PATH = path.resolve(process.cwd());

const archiver = require('archiver');
const {
  movian,
  version,
  description,
  author,
  main
} = require(`${BASE_PATH}/package.json`);

const IGNORE_LIST_FILENAME = '.gitattributes';

const BUILD_PATH = `${BASE_PATH}/dist`;
const ASSETS_PATH = `${BASE_PATH}/assets`;
const VIEWS_PATH = `${BASE_PATH}/views`;
const LOCALE_PATH = `${BASE_PATH}/locales`;
const CURRENT_PATH = `${BUILD_PATH}/src`;

let plugin = {
  ...movian,
  ...{
    description,
    version,
    author,
    file: main
  }
};


(async () => {
  async function readFiles(dirname, onFileContent, onError) {
    return new Promise((resolve, reject) => {
      fs.readdir(dirname, function (err, filenames) {
        if (err) {
          onError(err);
          return resolve(); // Also resolve on error
        }

        if (filenames.length === 0) {
          return resolve(); // Resolve immediately if no files
        }

        let pending = filenames.length;

        filenames.forEach(function (filename) {
          fs.readFile(dirname + '/' + filename, 'utf-8', function (err, content) {
            if (err) {
              onError(err);
            } else {
              onFileContent(filename, content);
            }

            // Decrement counter and resolve when all files are processed
            pending--;
            if (pending === 0) {
              resolve();
            }
          });
        });
      });
    });
  }

  const loadIgnoreFile = () => {
    try {
      const fileList = fs.readFileSync(CURRENT_PATH + `/${IGNORE_LIST_FILENAME}`).toString().split('\n');
      // .replace(/^(?=\n)$|^\s*|\s*$|\n\n+/gm, "")
      const result = [];
      fileList.forEach(f => {
        if (f.indexOf(' export-ignore') > 0) {
          const patterns = f.split(' ');
          result.push(patterns[0].trim());
        }
      })

      return result;
    } catch (err) {
      return [];
    }
  }

  const archive = archiver('zip', {
    zlib: {
      level: 9
    }
  });
  const outFile = BUILD_PATH + '/' + movian.id + '.zip';

  if (fs.existsSync(outFile)) {
    fs.unlinkSync(outFile);
  }
  console.time(`${outFile} zipped in`);

  const output = fs.createWriteStream(outFile);
  const ignoreList = loadIgnoreFile();
  ignoreList.push(outFile);

  output.on('close', function () {
    console.log('>', (archive.pointer() / 1000000) + ' megabytes');
  });

  output.on('end', function () {
    console.log('Data has been drained');
  });
  output.on('finish', () => console.timeEnd(`${outFile} zipped in`));
  archive.on('entry', function (entry) {
    console.log('adding', entry.name);
  })

  archive.on('warning', function (err) {
    if (err.code === 'ENOENT') {
      console.log('WARNING', err);
    } else {
      throw err;
    }
  });

  archive.on('error', function (err) {
    throw err
  });

  // Handle translations
  var i18n = {};
  await readFiles(LOCALE_PATH + '/', function (filename, content) {
    let iso = path.parse(filename).name;
    try {
      i18n[iso] = JSON.parse(content);
    } catch (e) { console.log(`Malformed ${iso} locale file`) };
  }, function (err) {
    throw err;
  });
  plugin.i18n = i18n;

  archive.pipe(output);
  let archivePaths = [
    { path: CURRENT_PATH, prefix: null },
    { path: ASSETS_PATH, prefix: 'assets' },
    { path: VIEWS_PATH, prefix: 'views' }
  ];
  try {
    archive.append(
      JSON.stringify(plugin, null, 2),
      {
        name: 'plugin.json'
      }
    );

    archivePaths.forEach((archivePath) => {
      archive.glob('**/*',
        {
          expand: true,
          cwd: archivePath.path,
          ignore: ignoreList,
          dot: true
        },
        {
          prefix: archivePath.prefix
        }
      );
    });
  } catch (e) {
    console.log(e);
  }

  archive.finalize();
})();
