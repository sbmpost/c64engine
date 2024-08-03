function onLoad()
{
	var choose = document.querySelector( 'input[type="file"]' );
	var loadDemoButton = document.querySelector( 'button[demo]' );
	var loadDemoBigButton = document.querySelector( 'button[demo-big]' );
	var tileWidthInput = document.querySelector( 'input[name="tile-width"]' );
	var tileHeightInput = document.querySelector( 'input[name="tile-height"]' );
	var toleranceInput = document.querySelector( 'input[name="tolerance"]' );
	var progress = document.querySelector( 'progress' );
	var consoleLayer = document.querySelector( 'div[console]' );
	var tilesLayer = document.querySelector( 'div[tiles]' );
	var tilesetLayer = document.querySelector( 'div[tileset]' );
	var resultLayer = document.querySelector( 'div[result]' );

	var downloadMapLink = document.querySelector( "a[download-map]" );
	var downloadTilesLink = document.querySelector( "a[download-tiles]" );
	var downloadTileMapLink = document.querySelector( "a[download-tilemap]" );
	var downloadTiledTMXLink = document.querySelector( "a[download-tmx]" );

	var downloadPixelsLink = document.querySelector( "a[download-pixels]" );
	var downloadScreenLink = document.querySelector( "a[download-screen]" );
	var downloadColorsLink = document.querySelector( "a[download-colors]" );

	var map = null;
	var tiles = null;
	var source = null;
	var worker = null;
	var sourceWidth = 0;
	var sourceHeight = 0;
	var numCols = 0;
	var numRows = 0;
	var tileWidth = 0;
	var tileHeight = 0;
	var extractedTilesWidth = 0;
	var extractedTilesHeight = 0;

	function reset()
	{
		if( worker )
		{
			worker.terminate();
			worker = null;
		}

		map = null;
		tiles = null;

		consoleLayer.innerHTML = "";
		tilesLayer.innerHTML = "";
		tilesetLayer.innerHTML = "";
		progress.value = 0;

		resultLayer.setAttribute( "hidden", "" );
	}

	function fullReset()
	{
		reset();

		source = null;
		sourceWidth = 0;
		sourceHeight = 0;
		numCols = 0;
		numRows = 0;
		tileWidth = 0;
		tileHeight = 0;
		extractedTilesWidth = 0;
		extractedTilesHeight = 0;
	}

	function log( header, content )
	{
		var line = document.createElement( "p" );
		line.setAttribute( "fine", "" );

		var spanHeader = document.createElement( "span" );
		spanHeader.textContent = header;
		var spanContent = document.createElement( "span" );
		spanContent.textContent = content;

		line.appendChild( spanHeader );
		line.appendChild( spanContent );

		consoleLayer.appendChild( line );
	}

	function error( msg )
	{
		var line = document.createElement( "p" );
		line.setAttribute( "error", "" );
		line.textContent = msg;

		consoleLayer.appendChild( line );
	}

	function checkSourceSize()
	{
		var valid = true;

		if( 0 == numCols || numCols != Math.floor( numCols ) )
		{
			error( "image-width not dividable by tile-width." );
			valid = false;
		}
		if( 0 == numRows || numRows != Math.floor( numRows ) )
		{
			error( "image-height not dividable by tile-height." );
			valid = false;
		}

		return valid;
	}

	function extract( src )
	{
		tileWidth = tileWidthInput.value;
		tileHeight = tileHeightInput.value;

		source = new Image();
		source.src = src;
		source.onload = function ()
		{
			sourceWidth = source.width;
			sourceHeight = source.height;

			numCols = sourceWidth / tileWidth;
			numRows = sourceHeight / tileHeight;

			if( checkSourceSize() )
				beginExtractionWorker();
		};
		source.onError = function ()
		{
			error( "Could not load image." );
		};
	}

	function extractSourceData( source )
	{
		var canvas = document.createElement( "canvas" );
		canvas.setAttribute( "width", source.width );
		canvas.setAttribute( "height", source.height );

		var context = canvas.getContext( "2d" );
		context.drawImage( source, 0, 0, source.width, source.height );

		return context.getImageData( 0, 0, source.width, source.height );
	}

	function exportTiledFormat()
	{
		var xmlMap = document.createElement( "map" );
		xmlMap.setAttribute( "version", "1.0" );
		xmlMap.setAttribute( "orientation", "orthogonal" );
		xmlMap.setAttribute( "renderorder", "right-down" );
		xmlMap.setAttribute( "width", numCols );
		xmlMap.setAttribute( "height", numRows );
		xmlMap.setAttribute( "tilewidth", tileWidth );
		xmlMap.setAttribute( "tileheight", tileHeight );
		xmlMap.setAttribute( "nextobjectid", "1" );

		var xmlTileSet = document.createElement( "tileset" );
		xmlTileSet.setAttribute( "firstgid", "1" );
		xmlTileSet.setAttribute( "name", "tiles" );
		xmlTileSet.setAttribute( "tilewidth", tileWidth );
		xmlTileSet.setAttribute( "tileheight", tileHeight );
		var xmlImage = document.createElement( "image" );
		xmlImage.setAttribute( "source", "tiles.png" );
		xmlImage.setAttribute( "width", extractedTilesWidth );
		xmlImage.setAttribute( "height", extractedTilesHeight );
		xmlTileSet.appendChild( xmlImage );
		xmlMap.appendChild( xmlTileSet );

//		console.log( extractedTilesWidth, extractedTilesHeight  );

		var xmlLayer = document.createElement( "layer" );
		xmlLayer.setAttribute( "name", "layer" );
		xmlLayer.setAttribute( "width", numCols );
		xmlLayer.setAttribute( "height", numRows );
		var xmlData = document.createElement( "data" );
		for( var i = 0, n = map.length; i < n; ++i )
		{
			var xmlTile = document.createElement( "tile" );
			xmlTile.setAttribute( "gid", map[i] + 1 );
			xmlData.appendChild( xmlTile );
		}
		xmlLayer.appendChild( xmlData );
		xmlMap.appendChild( xmlLayer );

		return '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString( xmlMap );
	}

	function beginExtractionWorker()
	{
		log( "Size:", sourceWidth + " x " + sourceHeight + "px" );
		log( "Map:", numCols + " x " + numRows );

		worker = new Worker( 'tileset-extractor-worker.js' );
		worker.onmessage = function ( event )
		{
			var data = event.data;
			var action = data.action;

			if( action == "extract-start" )
			{
				progress.removeAttribute( "hidden" );
			}
			else if( action == "extract-progress" )
			{
				progress.value = Math.min( data.progress, 1.0 );
			}
			else if( action == "extract-result" )
			{
				progress.setAttribute( "hidden", "" );
				resultLayer.removeAttribute( "hidden" );

				map = data.map;
				tiles = data.tiles;

				log( "Tiles:", tiles.length );
				log( "Time:", data.time + "ms" );

				showExtractedTiles();

				showTileset();

				downloadMapLink.download = "map.json";
				downloadMapLink.href = window.URL.createObjectURL( new Blob( [JSON.stringify( {
					map: map,
					numCols: numCols,
					numRows: numRows
				} )], {type: 'text/plain'} ) );

				downloadTiledTMXLink.download = "tiled.tmx";
				downloadTiledTMXLink.href = window.URL.createObjectURL( new Blob( [exportTiledFormat()], {type: 'text/xml'} ) );
			}
		};

		worker.postMessage( {
			action: "extract",
			tileWidth: tileWidthInput.value,
			tileHeight: tileHeightInput.value,
			tolerance: toleranceInput.value * 1024,
			imageData: extractSourceData( source )
		} );
	}

	function showExtractedTiles()
	{
		for( var i = 0, n = tiles.length; i < n; ++i )
		{
			var canvas = document.createElement( "canvas" );
			canvas.setAttribute( "width", tileWidth.toString() );
			canvas.setAttribute( "height", tileHeight.toString() );
			canvas.getContext( "2d" ).putImageData( tiles[i], 0, 0 );

			tilesLayer.appendChild( canvas );
		}

		downloadTilesLink.href = createTilesDataURL();
		downloadTilesLink.download = "tiles.png";
	}

	function showTileset()
	{
		var canvas = document.createElement( 'canvas' );
		canvas.setAttribute( "width", sourceWidth.toString() );
		canvas.setAttribute( "height", sourceHeight.toString() );

		var context = canvas.getContext( '2d' );

		var index = 0;
		for( var y = 0; y < numRows; ++y )
			for( var x = 0; x < numCols; ++x )
				context.putImageData( tiles[map[index++]], x * tileWidth, y * tileHeight );

		tilesetLayer.appendChild( canvas );

		downloadTileMapLink.href = canvas.toDataURL();
		downloadTileMapLink.download = "tilemap.png";
	}

	function createTilesDataURL()
	{
		var last_colors;
		var background_color;
		var rgb_colors = new Set();
		var tileSize = tileWidth*tileHeight;
		var rgba_data = new Uint8ClampedArray(tiles.length * tileSize * 4);
		var data_index = 0;

		for(var i=0;i != tiles.length;i++) {
			for(var y=0;y != tileHeight/8;y++) {
				for(var x=0;x != tileWidth/8;x++) {
					var rgb_tile_colors = new Set();
					for(var row=0;row != 8;row++) {
						for(var col=0;col != 8;col++) {
							var rgba_index = 4*(tileWidth*(8*y+row) + 8*x + col);
							var r = tiles[i].data[rgba_index + 0];
							var g = tiles[i].data[rgba_index + 1];
							var b = tiles[i].data[rgba_index + 2];
							var a = tiles[i].data[rgba_index + 3];
							
							rgba_data[data_index++] = r;
							rgba_data[data_index++] = g;
							rgba_data[data_index++] = b;
							rgba_data[data_index++] = a;
							
							var key = r.toString() + "|" + g.toString() + "|" + b.toString();
							rgb_colors.add(key);	
							rgb_tile_colors.add(key);
						}
					}

					var tile_colors = new Set(rgb_tile_colors);
					var tile_color_count = tile_colors.size;
					if (!background_color && tile_color_count == 4) {
						if (last_colors) {
							var equal_key = null;
							for (let key of last_colors.keys()) {
								if (tile_colors.add(key).size != ++tile_color_count && !equal_key) {
									equal_key = key;
								}
							}

							if (tile_colors.size == 7) {
								background_color = equal_key;
							}
						}
						last_colors = new Set(rgb_tile_colors);
					}
				}
			}
		}

		console.log("different colors: " + rgb_colors.size);
		for (let key of rgb_colors) { console.log(key);}

		var color_map = new Map([
                        ["148|218|135", 13], // light green
                        ["134|61|39", 8], // orange
                        ["85|44|0", 9], // brown
                        ["86|156|73", 5], // green
                        ["174|86|99", 10], // pink
                        ["15|15|15", 0], // black
                        ["156|156|156", 15], // light grey
                        ["78|78|78", 11], // dark grey
                        ["117|117|197", 14], // light blue
                        ["62|62|142", 6], // dark blue
                        ["111|192|180", 3], // cyan
                        ["250|250|250", 1], // white
                        ["117|117|117", 12], // grey
                        ["127|39|52", 2], // red
                        ["187|187|106", 7] // yellow
		]);

		var pixel_data = [];
		var screen_data = [];
		var color_data = [];
		var tileCount = tileSize/(8*8);
		for(var i=0;i != tiles.length;i++) {
			for(var j=0;j != tileCount;j++) {
				var tile_color_count = 3; // start with non screen colors
				var rgb_tile_colors = new Map();
				for(var row=0;row != 8;row++) {
					var pixel_byte = 0;
					for(var col=0;col != 8;col+=2) {
						var rgba_index = 4*(tileSize*i + 8*8*j + 8*row + col);
						var r = rgba_data[rgba_index + 0];
						var g = rgba_data[rgba_index + 1];
						var b = rgba_data[rgba_index + 2];

						var color_number = 0;
						var key = r.toString() + "|" + g.toString() + "|" + b.toString();
						if (key != background_color) {
							if (rgb_tile_colors.has(key)) {
								color_number = rgb_tile_colors.get(key);
							} else {
								color_number = tile_color_count;
								rgb_tile_colors.set(key, tile_color_count--);
							}
						} 
						
						pixel_byte |= (color_number << (6-col)); 
					}

					if (pixel_data[j] === undefined) {
					    pixel_data[j] = new Array(tileCount);
					}
					if (pixel_data[j][row] === undefined) {
						pixel_data[j][row] = new Array(8);
					}
					if (pixel_data[j][row][i] === undefined) {
						pixel_data[j][row][i] = new Array(tiles.length);
					}

					pixel_data[j][row][i] = pixel_byte;
				}
				
				var screen_byte = 0, color_byte = 0;
				for (let [key, color_number] of rgb_tile_colors.entries()) {
					var color = color_map.get(key);
					if (color_number == 1) {
						screen_byte |= (color << 4);
					} else if (color_number == 2) {
						screen_byte |= color;
					} else if (color_number == 3) {
						color_byte = color;
					} else {
						console.log("unexpected color number: " + color_number);
					}
				}

				if (screen_data[j] === undefined) {
				    screen_data[j] = new Array(tileCount);
				    color_data[j] = new Array(tileCount);
				}
				if (screen_data[j][i] === undefined) {
					screen_data[j][i] = new Array(tiles.length);
					color_data[j][i] = new Array(tiles.length);
				}

				screen_data[j][i] = screen_byte;
				color_data[j][i] = color_byte;
			}
		}

		// (pixels, screen, colors, background)
		var pixels_blob = new Blob([new Uint8ClampedArray(pixel_data.flat(2))],
			{type: 'application/octet-stream'});
		downloadPixelsLink.href = URL.createObjectURL(pixels_blob);
		downloadPixelsLink.download = "pixels.bin";

		var screen_blob = new Blob([new Uint8ClampedArray(screen_data.flat())],
			{type: 'application/octet-stream'});
		downloadScreenLink.href = URL.createObjectURL(screen_blob);
		downloadScreenLink.download = "screen.bin";

		var colors_blob = new Blob([new Uint8ClampedArray(color_data.flat())],
			{type: 'application/octet-stream'});
		downloadColorsLink.href = URL.createObjectURL(colors_blob);
		downloadColorsLink.download = "colors.bin";

        extractedTilesWidth = (Math.ceil(tiles.length / numRows ) | 0) * tileWidth;
        extractedTilesHeight = (Math.sqrt(tiles.length) | 0) * tileHeight;

		var canvas = document.createElement("canvas");
		canvas.setAttribute("width", (tileWidth * tileHeight).toString());
		canvas.setAttribute("height", tiles.length.toString());

		var context = canvas.getContext("2d");
		context.putImageData(new ImageData(rgba_data, tileWidth * tileHeight), 0, 0);

		alert("background color: " + color_map.get(background_color));
		return canvas.toDataURL();
	}

	choose.addEventListener( "change", function ( e )
	{
		fullReset();

		var file = e.target.files[0];
		if( !file )
		{
			error( "No file selected." );
			return;
		}
		if( file.type != "image/png" && file.type != "image/gif" )
		{
			error( "Not a png or gif file." );
			return;
		}

		extract( URL.createObjectURL( file ) );
	} );

	loadDemoButton.addEventListener( "click", function ()
	{
		fullReset();
		extract( "tileset-extractor-demo.png" );
	} );

	loadDemoBigButton.addEventListener( "click", function ()
	{
		fullReset();
		extract( "tileset-extractor-demo-big.png" );
	} );

	toleranceInput.addEventListener( "change", function ()
	{
		if( null === source )
			return;

		reset();
		beginExtractionWorker();
	} );
}
