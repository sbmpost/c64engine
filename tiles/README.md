# platforms
A side-project on tilemap based games.

# Tileset extractor
This app takes an existing tilemap and tries to extract the tiles that were used to built it.
[Example](http://andremichelle.github.io/platforms/tools/html/tileset-extractor/tileset-extractor.html)

# Modified by sbmpost for the c64

* Load tileset extractor in browser via file:///....../tiles/tileset-extractor.html
* Click browse and load provided png map. Take note of detected background color.
* Download pixels.bin, screen.bin, colors.bin
* Download map.json and generate map.bin as follows:

    cat map.json | tr -s '[' '\n' | tr -s ',' '\n' | tr -s ']' '\n' | \\
    grep -v "\\"" | xargs printf "%02x\n" | tr -d '\n' | xxd -p -r > map.bin

* Split map.bin in half and write to: map1.exo.bin, map2.exo.bin
