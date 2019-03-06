## Data converters for the retro n-gon renderer

#### [png2json.php](png2json.php)
Usage: `$ php png2json.php -i <INPUT_PNG_FILENAME> [-o <OUTPUT_JSON_FILENAME>]`

Converts PNG images into a JSON format compatible with the retro n-gon renderer. The output JSON will be of the following form:
```
{
    "what": "A texture for the retro n-gon renderer",
    "source": "<input_png_filename>",
    "width": <input_png_width>,
    "height": <input_png_height>,
    "channels": "rgba:5+5+5+1",
    "encoding": "base64",
    "pixels":" <input_png_pixels_in_base64>"
}
```
The converter packs the input PNG's pixel data into 16 bits per pixel, where 5 bits are reserved for each of the RGB channels and 1 bit for alpha (fully opaque or fully transparent), storing the data as a Base64-encoded string in the `pixels` property.

JSON files created with this converter can be loaded into the retro n-gon renderer like so:
```
(async ()=>
{
    const texture = await Rngon.texture_rgba.create_with_data_from_file("file.json")

    // Safe to use the texture here, it's finished loading.
})()
```

#### [blender-export.py](blender-export.py)
A very rough export script for Blender to convert 3d scenes modeled in it into a format compatible with the retro n-gon renderer. The script was made for Blender 2.76, but may work with other versions. It's currently pre-alpha; a stopgap for a more permanent Blender export solution; so unfortunately you can expect some issues while using it.

To use the script, first create your model in Blender, or import one into it, then open and run the script inside Blender. The specifics of how to run scripts in Blender will depend on your version of the program etc. &ndash; if you're unsure of how to do it (which is likely, unless you're an experienced Blender user), just have a quick googling and it should become clear.

The script will export vertex and UV coordinates, material diffuse color and intensity, and the filename of the texture in each material's first texture slot, if any. Prior to being able to use the exported model with the retro n-gon renderer, you need to also convert any texture images into the renderer's own format. Since PNG2JSON (see above) is the only such converter currently available, you may want to limit all of your textures to the PNG format.

The exporter's output will be a JavaScript file containing an object that provides functionality for the retro n-gon renderer to interface with the model's 3d assets. Something like the following:
```
const model =
{
    ngons:[],
    initialize: async function()
    {
        // ...Set up materials and textures.

        this.ngons = Object.freeze(
        [
            // ...Create the model's n-gons.
        ]);
    }
}
```

Assuming you've exported a model from Blender into a file called `scene.js`, and the object in it is called `model`, the following code could be used to render it:
```
<script src="./distributable/rngon.cat.js"></script>
<script src="./scene.js"></script>
<canvas id="canvas" style="width: 300px; height: 300px;"></canvas>
<script>
    (async ()=>
    {
        await model.initialize()
        const modelMesh = Rngon.mesh(model.ngons)
        Rngon.render("canvas", [modelMesh])
    })()
</script>
```
