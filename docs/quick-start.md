# Quick-start guide

## Build the distributable

If you've only just downloaded the repository, follow the [installation instructions](/README.md#installation).

## Render a simple quad

1. In a HTML document, create a canvas element:

```html
<canvas id="canvas" style="width: 300px; height: 300px;"></canvas>
```

2. Import the renderer's distributable into the document:

```html
<script src="distributable/rngon.js"></script>
<script>
    // Your JavaScript rendering code can go here.
</script>
```

3. Define a quad and render it onto the canvas:

```javascript
const quad = Rngon.ngon([
    Rngon.vertex(-1, -1, 0),
    Rngon.vertex(1, -1, 0),
    Rngon.vertex(1, 1, 0),
    Rngon.vertex(-1, 1, 0)], {
        color: Rngon.color(0, 150, 255)
});

const quadMesh = Rngon.mesh([quad], {
    rotate: Rngon.vector(0, 0, 45),
});

Rngon.render({
    target: "canvas",
    scene: [quadMesh],
    options: {
        resolution: 1,
        cameraPosition: Rngon.vector(0, 0, -5),
    },
});
```

![A blue quad](/docs/images/tutorials/blue-quad.png)

## Add a texture

1. Define a texture and assign it to the quad:

```javascript
const simpleTexture = Rngon.texture({
    width: 2,
    height: 2,
    pixels: [
        255, 200, 0, 255,
        200, 255, 0, 255,
        255, 0, 200, 255,
        0, 255, 200, 255
    ],
});

const quad = Rngon.ngon([
    Rngon.vertex(-1, -1, 0),
    Rngon.vertex(1, -1, 0),
    Rngon.vertex(1, 1, 0),
    Rngon.vertex(-1, 1, 0)], {
        color: Rngon.color(255, 255, 255),
        texture: simpleTexture,
});
```

![A textured quad](/docs/images/tutorials/textured-quad.png)

2. Optionally, you can load the texture's data from a JSON file:

```javascript
const quad = Rngon.ngon([
    Rngon.vertex(-1, -1, 0),
    Rngon.vertex(1, -1, 0),
    Rngon.vertex(1, 1, 0),
    Rngon.vertex(-1, 1, 0)], {
        color: Rngon.color(255, 255, 255),
        texture: await Rngon.texture.load("texture.json"),
});
```

A PHP-based tool for converting PNG images into this JSON format is provided in the [tools/](/tools/) directory.

3. Enable affine texture-mapping by adding vertex UV coordinates and setting the `textureMapping` and `uvWrapping` properties:

```javascript
const quad = Rngon.ngon([
    Rngon.vertex(-1, -1, 0, 0, 0),
    Rngon.vertex( 1, -1, 0, 1, 0),
    Rngon.vertex(1, 1, 0, 1, 1),
    Rngon.vertex(-1, 1, 0, 0, 1)], {
        color: Rngon.color(255, 255, 255),
        texture: simpleTexture,
        textureMapping: "affine",
        uvWrapping: "clamp",
});
```

![A textured quad with affine mapping](/docs/images/tutorials/textured-quad-affine.png)

## Make it pixelated

1. Adjust the `options.resolution` property in the render call:

```javascript
Rngon.render({
    target: "canvas",
    scene: [quadMesh],
    options: {
        resolution: 0.2,
        cameraPosition: Rngon.vector(0, 0, -5),
    },
});
```

![A textured quad with blurry upscaling](/docs/images/tutorials/textured-quad-upscaled-blurry.png)

2. Modify the canvas's CSS to disable blurry upscaling:

```html
<canvas id="canvas" style="image-rendering: pixelated; width: 300px; height: 300px;"></canvas>
```
![A textured quad with pixelated upscaling](/docs/images/tutorials/textured-quad-upscaled-pixelated.png)

## Brief introduction to pixel shaders

1. Enable custom pixel shading by passing a shader function to render():

```javascript
Rngon.render({
    target: "...",
    scene: [...],
    options: {...},
    pipeline: {
        pixelShader: sample_shader,
    },
});

function sample_shader(...)
{
    ...
}
```

2. A pixel shader to make every pixel in the image blue:

```javascript
function sample_shader({renderWidth, renderHeight, pixelBuffer})
{
    for (let i = 0; i < (renderWidth * renderHeight); i++)
    {
        pixelBuffer[(i * 4) + 0] = 0;
        pixelBuffer[(i * 4) + 1] = 150;
        pixelBuffer[(i * 4) + 2] = 255;
        pixelBuffer[(i * 4) + 3] = 255;
    }
}
```

![Before applying the shader](/docs/images/tutorials/shader-before-all-blue.png)
![After applying the shader](/docs/images/tutorials/shader-after-all-blue.png)

3. A pixel shader to color half of our quad blue:

```javascript
function sample_shader({renderWidth, renderHeight, pixelBuffer, fragmentBuffer})
{
    for (let i = 0; i < (renderWidth * renderHeight); i++)
    {
        if (fragmentBuffer[i]?.worldY < 0))
        {
            pixelBuffer[(i * 4) + 0] = 0;
            pixelBuffer[(i * 4) + 1] = 150;
            pixelBuffer[(i * 4) + 2] = 255;
        }
    }
}
```

![Before applying the shader](/docs/images/tutorials/shader-before-corner-blue.png)
![After applying the shader](/docs/images/tutorials/shader-after-corner-blue.png)

## Exporting scenes from Blender

A Python script for exporting scenes from Blender into a JSON format that supports this renderer is provided under [tools/](/tools/). At the moment, the export script is rudimentary but does the business.

To export a scene from Blender, load up the export script file in Blender, and run it. The script will export vertex coordinates, vertex UV coordinates, the diffuse color and intensity of each material, and, if any, the filename of the texture image in each material's first texture slot. Objects that are hidden won't be exported.

Remember to first apply any pending transformations to the objects (Object > Apply in Blender's menu) before running the export script, as any unapplied transformations will be ignored. The same goes for any other mesh modifiers that haven't yet been applied.

Once the scene has been exported into the JSON file, you may need to make a few edits to the file by hand. Texture filenames, for example, will probably need to be given correct paths. You'll also want to convert the texture images into the renderer's JSON format (see [Add a texture](#add-a-texture)).

## More!

You can find various render samples under the [samples/](/samples/) directory.

You should also have a look at the [API reference](/docs/api-reference.md), as it contains much more detail than is found in this quick-start guide. For example, you'll find out about vertex shaders, custom rasterizer functions, raw render buffer access, and many other things.
