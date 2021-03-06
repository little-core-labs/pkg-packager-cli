const { version } = require('./package.json')
const prettyBytes = require('pretty-bytes')
const { system } = require('pkg-fetch')
const minimist = require('minimist')
const packager = require('pkg-packager')
const debug = require('debug')('pkg-packager')
const path = require('path')
const fs = require('fs')
const os = require('os')

const usage = `usage: pkg-packager [-hDV] [options] <input>
where options can be:

  -a, --asset <from[:to]>      Path to asset to copy into packaged resources
  -c, --config                 Path to JSON configuration
  -d, --directory <from[:to]>  Path to directory to copy into packaged resources
  -D, --debug                  Enable debug output
      --executable-name        The program executable name
  -h, --help                   Show this message
  -l, --symlink <from:to>      Symlink a file path
  -o, --output                 Output directory
  -p, --platform               The platform type (linux|macos|win) [default: ${system.hostPlatform}]
      --product-file-name      The packaged product file name
      --product-name           The packaged product name
  -t, --type                   Packager builder (appimage|appdmg|exe|zip)
  -V, --version                Output program version
`

const argv = minimist(process.argv.slice(2), {
  boolean: [
    'help',
    'debug',
    'version',
  ],

  string: [
    'executable-name',
    'platform',
    'product-name',
    'product-file-name',
    'type'
  ],

  array: [
    'asset',
    'directory',
    'symlink',
  ],

  alias: {
    a: 'asset',
    c: 'config',
    d: 'directory',
    D: 'debug',
    h: 'help',
    l: 'symlink',
    p: 'platform',
    o: 'output',
    t: 'type',
    V: 'version',
  },

  default: {
    output: 'build',

    get type() {
      if ('linux' === process.platform) {
        return 'appimage'
      }

      if ('darwin' === process.platform) {
        return 'appdmg'
      }

      if ('win32' === process.platform) {
        return 'exe'
      }

      return 'zip'
    }
  }
})

if (argv.help) {
  console.log(usage)
  process.exit(0)
}

if (argv.version) {
  console.log(version)
  process.exit(0)
}

if (argv.debug) {
  require('debug').enable('pkg-packager*')
}

if (0 === argv._.length) {
  console.log(usage)
  process.exit(1)
}

if (argv.directory && !Array.isArray(argv.directory)) {
  argv.directory = [argv.directory]
}

if (argv.symlink && !Array.isArray(argv.symlink)) {
  argv.symlink = [argv.symlink]
}

if (argv.asset && !Array.isArray(argv.asset)) {
  argv.asset = [argv.asset]
}

const opts = {
  type: argv.type,
  debug: argv.debug,
  output: argv.output,
  platform: argv.platform,
  icons: [{
    file: path.resolve(__dirname, 'assets', 'icon.ico'),
    size: 64
  }],

  assets: Array.from(argv.asset || []),
  symlinks: Array.from(argv.symlink || []),
  directories: Array.from(argv.directory || [])
}

if (argv.config && 'string' === typeof argv.config) {
  try {
    const config = JSON.parse(fs.readFileSync(argv.config))
    if (config.pkg && config.pkg.packager) {
      let { assets, symlinks, directories } = config.pkg.packager
      if (Array.isArray(assets)) {
        assets = opts.assets.concat(...assets)
      }

      if (Array.isArray(symlinks)) {
        symlinks = opts.symlinks.concat(...symlinks)
      }

      if (Array.isArray(directories)) {
        directories = opts.directories.concat(...directories)
      }

      Object.assign(opts, config.pkg.packager)

      if (Array.isArray(assets)) {
        Object.assign(opts, { assets })
      }

      if (Array.isArray(symlinks)) {
        Object.assign(opts, { symlinks })
      }

      if (Array.isArray(directories)) {
        Object.assign(opts, { directories })
      }
    }

    if (config.pkg && Array.isArray(config.pkg.assets)) {
      opts.assets = opts.assets.concat(...config.pkg.assets)
    }
  } catch (err) {
    debug(err)
    console.warn(' warn: Invalid JSON for %s', argv.config)
  }
}

let defaultProductName = null
for (let target of argv._) {
  try {
    target = require.resolve(target)
  } catch (err) {
    void err
  }

  if (!defaultProductName) {
    const extname = path.extname(target)
    const basename = path.basename(target)
    defaultProductName = basename.replace(extname, '')
  }

  // defaults
  Object.assign(opts, {
    productName: defaultProductName,
    executableName: defaultProductName,
    productFileName: defaultProductName,
    // just use `require()` for the `loadBuilder()` function
    loadBuilder: (builderPath) => require(builderPath)
  })

  if ('product-name' in argv) {
    opts.productName = argv['product-name']
    if (!opts.productFileName || defaultProductName === opts.productFileName) {
      opts.productFileName = opts.productName
    }
  }

  if ('executable-name' in argv) {
    opts.executableName = argv['executable-name']
  }

  if ('product-file-name' in argv) {
    opts.productFileName = argv['product-file-name']
  }

  packager.target(target, opts)
}

packager.package({ config: argv.config }, (err, results) => {
  if (err) {
    debug(err.stack || err)
    console.error('error:', err.message)
    return process.nextTick(process.exit, 1)
  }

  for (const result of results) {
    if (!result) { continue }
    console.log('> wrote: %s (%s) sha512:%s',
      result.name.replace(process.cwd(), '.'),
      prettyBytes(result.size),
      result.sha512)
  }
})
