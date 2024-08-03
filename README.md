# c64engine

A game engine for the c64.

## Building

Dependencies:
* [acme](https://sourceforge.net/projects/acme-crossass/)
* [cc65](https://github.com/cc65/cc65)

The following dependencies are automatically dealt with by the `Makefile`:
* [Krill's loader](https://csdb.dk/release/?id=189130)
* [exomizer](https://github.com/exomiser/Exomiser) (using Krill's intree sources)
* [tinycrunch](https://csdb.dk/release/?id=168629) (using Krill's intree sources)

```bash
cp config.default.template config.default
vim config.default # edit
make
```

## Running

Before running in VICE, make sure _True drive emulation_ is enabled and _IEC-device_ is **disabled**.
```bash
make run
```

Use joystick in port 2 to run the demo.

## Features

* Bitmap scrolling using [AGSP](http://codebase64.org/doku.php?id=base:agsp_any_given_screen_position)

    This technique only requires 36 raster lines CPU time and 33 raster lines of screen space. All other screen space - including screen memory (used for colors ```%01``` and ```%10```) and color ram (color ```%11```) is moved around as well.

* Sprite-Multiplexer

    Multiplixing 24 x 2 sprites. This means 24 virtual multi-color sprites where each sprite is overlayed with a single-color sprite for more colors and better resolution.

* Tile-Data

    Use provided tooling for generating tile data, see README in tiles folder

* Map-loader (credits for the disk loader go to Krill)

## Useful Links

* [Spritemate](http://spritemate.com/)
* [Secret colours of the Commodore 64](http://www.aaronbell.com/secret-colours-of-the-commodore-64/)
* [Commodore VIC-II Color Analysis](http://unusedino.de/ec64/technical/misc/vic656x/colors/)
* [Commodore 64 memory map](http://sta.c64.org/cbm64mem.html)
