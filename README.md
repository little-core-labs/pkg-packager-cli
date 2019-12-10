pkg-packager-cli
================

> Command line interface for the `pkg-packager` module.

## Installation

```sh
$ npm install pkg-packager-cli -g
```

## Status

> Documentation/Testing

## Usage

```sh
usage: pkg-packager [-hDV] [options] <input>
where options can be:

  -a, --asset <from[:to]>      Path to asset to copy into packaged resources
  -c, --config                 Path to JSON configuration
  -d, --directory <from[:to]>  Path to directory to copy into packaged resources
  -D, --debug                  Enable debug output
      --executable-name        The program executable name
  -h, --help                   Show this message
  -l, --symlink <from:to>      Symlink a file path
  -o, --output                 Output directory
  -p, --platform               The platform type (linux|macos|win) [default: linux]
      --product-file-name      The packaged product file name
      --product-name           The packaged product name
  -t, --type                   Packaged output type (appimage|dmg|zip)
  -V, --version                Output program version
```

## See Also

- [pkg-packager][pkg-packager]

## License

MIT

[pkg-packager]: https://github.com/little-core-labs/pkg-packager
