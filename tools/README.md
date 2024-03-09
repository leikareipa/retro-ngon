# Tools for the retro n-gon renderer

The following tools are available:

- [Blender scene exporter](#blender-scene-exporter)
- [Image-to-texture converter](#image-to-texture-converter)
- [PNG-to-texture converter](#png-to-texture-converter) (command line)

## Blender scene exporter

The Python script `blender-export.py` provides a rough export script to convert Blender scenes into a format compatible with the renderer. Consider it an alpha solution, a placeholder for a better implementation.

The script was made for Blender 2.76, but may work with other versions.

### Usage

1. Create or import a scene in Blender.
2. Open and run `blender-export.py` in Blender.
3. The script will export the screne into a file called `model.rngon-model.js`, in whatever file path Blender uses by default.

The script exports vertex and UV coordinates, material diffuse color and intensity, and the filename of the texture in each material's first texture slot, if any. It won't export camera settings etc.

You'll need to convert any textures separately, using e.g. [PNG-to-texture converter](#png-to-texture-converter).

### Importing the converted scene

You can load the converted scene into your rendering code like so:

```javascript
import scene from "model.rngon-model.js";
await scene.initialize();
const sceneMesh = Rngon.mesh(scene.ngons);
```

Note that you may beed to edit `model.rngon-model.js` so that it exports the scene object.

## Image-to-texture converter

A web app to convert common image formats into the renderer's JSON format [is available here](https://leikareipa.github.io/desktop/apps/rngon-texture-converter/).

See [PNG-to-texture converter#Importing the texture](#importing-the-texture) for instructions on how to import the JSON into your rendering code.

## PNG-to-texture converter

The PHP script `png2json.php` provides functionality to convert PNG images into the renderer's JSON texture format.

### Usage

Invoke the script using the PHP interpreter:

`$ php png2json.php -i <INPUT_PNG_FILENAME> -o <OUTPUT_JSON_FILENAME>`

By default, the output pixel data will be in Base64 encoded RGBA-5551 format.

You can customize the output with these command-line options:

| Option              | Description                                                  |
|---------------------|------------------------------------------------------------- |
| `-i <string>`       | Name and path of the input PNG file.                         |
| `-o <string>`       | Name and path of the output JSON file.                       |
| `-r`                | Save pixel data in RGBA-8888 format.                         |
| `-b`                | Save pixel data in binary format (1 bit per pixel).          |
| `-a`                | Output pixel data as an array.                               |
| `-t <r,g,b>`        | Chroma key. Pixels with this color will be made transparent. |

### Importing the texture

You can import the JSON file in your rendering code like so:

```javascript
const texture = await Rngon.texture.load("file.json");
```

Alternatively, you can pre-wrap the JSON in a texture object:

```javascript
export default Rngon.texture({...});
```
