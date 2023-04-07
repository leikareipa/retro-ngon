# The retro n-gon renderer

A well-featured retro-themed 3D software renderer for the HTML5 \<canvas\> (also supports off-screen rendering).

You can view various interactive render samples [here](https://www.tarpeeksihyvaesoft.com/experimental/retro-ngon/samples/).

![A textured cube](./images/screenshots/beta/tomb-raider-crt.webp)\
*An indoor scene from Tomb Raider, with a CRT shader. (Based on assets created by Core Design for Tomb Raider. Core Design is not associated with this renderer.)*

![A view from Grand Prix Legends](./images/screenshots/beta/gpl.webp)\
*A view of the race track and stands at Rouen in Grand Prix Legends. (Based on textures and 3D models created by Papyrus Design Group for Grand Prix Legends. Papyrus Design Group is not associated with this renderer.)*

![A view from Grand Prix Legends](./images/screenshots/beta/quake-bilinear.webp)\
*A corridor in Quake, with bilinear texture filtering and per-pixel lighting. (Based on textures and 3D models created by id Software for Quake. id Software is not associated with this renderer.)*

## Documentation

- [Quick-start guide](#quick-start-guide)
- [API reference](#api-reference)

## Main features

- Straightforward API
- Genuine retro aesthetics
- Modular design makes it easy to override parts of the render pipeline for specialized uses
- No external dependencies

## Suggested use cases

Being a retro-oriented software 3D renderer for JavaScript, the retro n-gon renderer encourages low resolutions, low polycounts, and general creativity in navigating around technical and/or performance limitations.

Among some of the possible use cases are:
- Retro-themed 3D games and model visualization
- To avoid idiosyncrasies of hardware rendering
- Engagement in minimalism

## Performance

Below are sample runs of the renderer's [performance benchmarks](tests/performance/), showing average FPS counts across various render resolutions running in Google Chrome.

<table>
    <tr>
        <td align="left">AMD Ryzen 5 5600X</td>
        <th align="center">480 &times; 270</th>
        <th align="center">960 &times; 540</th>
        <th align="center">1920 &times; 1080</th>
        <th align="center">3840 &times; 2160</th>
    </tr>
    <tr>
        <th align="left">Quake 1</th>
        <td align="center">180</td>
        <td align="center">88</td>
        <td align="center">28</td>
        <td align="center">7</td>
    </tr>
    <tr>
        <th align="left">Quake 1 (untextured)</th>
        <td align="center">252</td>
        <td align="center">134</td>
        <td align="center">52</td>
        <td align="center">13</td>
    </tr>
    <tr>
        <th align="left">Quake 1 (wireframe)</th>
        <td align="center">286</td>
        <td align="center">223</td>
        <td align="center">135</td>
        <td align="center">62</td>
    </tr>
    <tr>
        <th align="left">Quake 1 (shader)</th>
        <td align="center">83</td>
        <td align="center">24</td>
        <td align="center">6</td>
        <td align="center">2</td>
    </tr>
</table>

# Quick-start guide

## Render a simple quad

1. In your HTML document, create a canvas element:

```html
<canvas id="canvas" style="width: 300px; height: 300px;"></canvas>
```

2. Import the retro n-gon renderer's JavaScript distributable:

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
        color: Rngon.color_rgba(0, 150, 255)
});

const quadMesh = Rngon.mesh([quad], {
    rotation: Rngon.rotation_vector(0, 0, 45),
});

Rngon.render("canvas", [quadMesh], {
    cameraPosition: Rngon.translation_vector(0, 0, -5),
    scale: 1,
});
```

![A blue quad](./images/tutorials/blue-quad.png)

## Add a texture

1. Define a texture and assign it to the quad:

```javascript
const simpleTexture = Rngon.texture_rgba({
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
        color: Rngon.color_rgba(255, 255, 255),
        texture: simpleTexture,
});
```

![A textured quad](./images/tutorials/textured-quad.png)

2. Optionally, you can load the texture's data from a JSON file:

```javascript
const quad = Rngon.ngon([
    Rngon.vertex(-1, -1, 0),
    Rngon.vertex(1, -1, 0),
    Rngon.vertex(1, 1, 0),
    Rngon.vertex(-1, 1, 0)], {
        color: Rngon.color_rgba(255, 255, 255),
        texture: await Rngon.texture_rgba.create_with_data_from_file("texture.json"),
});
```

A PHP-based tool for converting PNG images into this JSON format is provided in the [tools/conversion/](./tools/conversion/) directory.

3. Enable affine texture-mapping by adding vertex UV coordinates and setting the `textureMapping` and `uvWrapping` properties:

```javascript
const quad = Rngon.ngon([
    Rngon.vertex(-1, -1, 0, 0, 0),
    Rngon.vertex( 1, -1, 0, 1, 0),
    Rngon.vertex(1, 1, 0, 1, 1),
    Rngon.vertex(-1, 1, 0, 0, 1)], {
        color: Rngon.color_rgba(255, 255, 255),
        texture: simpleTexture,
        textureMapping: "affine",
        uvWrapping: "clamp",
});
```

![A textured quad with affine mapping](./images/tutorials/textured-quad-affine.png)

## Make it pixelated

Adjust the `scale` property in the render call:

```javascript
Rngon.render("canvas", [quadMesh], {
    cameraPosition: Rngon.translation_vector(0, 0, -5),
    scale: 0.14
});
```

![A textured quad with blurry upscaling](./images/tutorials/textured-quad-upscaled-blurry.png)

2. Modify the canvas's CSS to disable blurry upscaling:

```html
<canvas id="canvas" style="image-rendering: pixelated; width: 300px; height: 300px;"></canvas>
```
![A textured quad with pixelated upscaling](./images/tutorials/textured-quad-upscaled-pixelated.png)

## Brief introduction to pixel shaders

1. Enable custom pixel shading by passing a shader function to render():

```javascript
Rngon.render("...", [...], {
    pixelShader: sample_shader,
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

![Before applying the shader](./images/tutorials/shader-before-all-blue.png)
![After applying the shader](./images/tutorials/shader-after-all-blue.png)

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

![Before applying the shader](./images/tutorials/shader-before-corner-blue.png)
![After applying the shader](./images/tutorials/shader-after-corner-blue.png)

### Exporting models from Blender

A Python script for exporting scenes from Blender into a JSON format that supports this renderer is provided under [tools/conversion/](./tools/conversion/). At the moment, the export script is rudimentary but does the business.

To export a scene from Blender, load up the export script file in Blender, and run it. The script will export vertex coordinates, vertex UV coordinates, the diffuse color and intensity of each material, and, if any, the filename of the texture image in each material's first texture slot. Objects that are hidden won't be exported.

Remember to first apply any pending transformations to the objects (Object > Apply in Blender's menu) before running the export script, as any unapplied transformations will be ignored. The same goes for any other mesh modifiers that haven't yet been applied.

Once the scene has been exported into the JSON file, you may need to make a few edits to the file by hand. Texture filenames, for example, will probably need to be given correct paths. You'll also want to convert the texture images into the renderer's JSON format (see [Add a texture](#add-a-texture)).

## More!

You can find various render samples under the [samples/](./samples/) directory.

You should also have a look at the [API reference](#api-reference), as it contains much more detail than is found in this quick-start guide. For example, you'll find out about vertex shaders, custom rasterizer functions, asynchronous rendering, raw render buffer access, and many other things.

# API reference

The renderer's public API consists of the following objects:

| Object                                          | Brief description                           |
| ----------------------------------------------- | ------------------------------------------- |
| [render()](#rendertarget-meshes-options)        | Renders n-gon meshes.                       |
| [render_async()](#render_async-meshes-options-rngonurl) | Renders n-gon meshes asynchronously.  |
| [mesh](#meshngons-transform)                    | Collection of thematically-related n-gons.  |
| [ngon](#ngonvertices-material-normal)           | Polygonal shape defined by *n* vertices.    |
| [vertex](#vertexx-y-z-u-v-w)                    | Corner of an n-gon.                         |
| [vector3](#vector3x-y-z)                        | Three-component vector. Aliases: *translation_vector*, *rotation_vector*, *scaling_vector*. |
| [color_rgba](#color_rgbared-green-blue-alpha)   | RGB color with transparency.                |
| [texture_rgba](#texture_rgbadata)               | RGB texture with transparency.              |
| light                                           | (A description is coming.)                  |

## render(target[, meshes[, options]])

Renders the specified n-gon meshes onto the provided render target (a canvas element or an off-screen pixel buffer). This function is blocking and will return after rendering is completed. For non-blocking rendering, see [render_async()](#render_async-meshes-options-rngonurl).

After the call, the rendered pixel buffer is accessible via *Rngon.state.active.pixelBuffer*, and the corresponding screen-space n-gons are available from *Rngon.state.active.ngonCache*.

*Parameters:*

| Type      | Name            | Description |
| --------- | --------------- | ----------- |
| *mixed*   | target   | Identifies the target canvas element. Accepted types: HTMLCanvasElement, string, *null*. If HTMLCanvasElement, the rendering will be displayed on the corresponding canvas element. A string will be interpreted as the `id` property of the target canvas element. If *null*, the image will only be rendered into an off-screen pixel buffer, accessible via *Rngon.state.active.pixelBuffer* after the call. |
| *array*   | meshes          | An array of **mesh** objects to be rendered. Defaults to *[Rngon.mesh()]*. |
| *object*  | options         | An object containing optional directives (see below). |

*The **options** parameter object recognizes the following properties:*

| Type                  | Property                 | Description |
| --------------------- | ------------------------ | ----------- |
| *string*              | state                    | The renderer stores certain internal data, like the raw pixel buffer, in a render state object, which it reuses on subsequent render calls to avoid having to recreate the data buffers each time. This string identifies which render state object should be used by this call to [render()](#rendertarget-meshes-options). The first time render() is called with a particular state identifier value, a corresponding state object is automatically created and initialized; subsequent calls with that value will reuse the corresponding state object. Normally, you can ignore this setting; but if you want to e.g. render something into textures before rendering the scene proper, it can be more performant to use separate render states. You can access the state object via *Rngon.state[\<identifier\>]* after the render call. Note that the value *"active"* is reserved and should not be used. Defaults to *"default"*. |
| *number*              | scale                    | If the render target is a canvas, sets the resolution of the rendering relative to the size of the canvas. For example, a value of 0.5 results in an image half the resolution of the canvas. The image is then sized to fit the canvas. If the render target is not a canvas, the value will be ignored. Defaults to *1*. |
| *number*    | width         | If the render target is *null*, sets the width (in pixels) of the image to be rendered. Ignored if the render target is not *null*. Defaults to *640*. |
| *number*    | height        | If the render target is *null*, sets the height (in pixels) of the image to be rendered. Ignored if the render target is not *null*. Defaults to *480*. |
| *number*              | fov                      | Field of view. Defaults to *43*. |
| *string*              | depthSort                | Determines the depth sorting method for n-gons prior to rasterization. Possible values: "none" (no depth sorting; n-gons rendered in given order), "painter" (painter's algorithm; furthest n-gons rendered first), "painter-reverse" (closest n-gons rendered first). If the *useDepthBuffer* option is true, "painter-reverse" may provide the best performance, as this combination allows for early rejection of occluded pixels. Defaults to *"painter-reverse"*. |
| *boolean*             | useDepthBuffer           | If true, a depth buffer will be used during rasterization to discard occluded pixels. For best performance, consider combining depth buffering with the "painter-reverse" *depthSort* option. Defaults to *true*. |
| *boolean*             | hibernateWhenNotOnScreen | If true and the target canvas is not within the browser's viewport, the function will return without rendering anything. Defaults to *true*. |
| *number*              | nearPlane                | Distance from the camera to the near plane. Vertices closer to the camera will be clipped. Defaults to *1*.|
| *number*              | farPlane                 | Distance from the camera to the far plane. Vertices further from the camera will be clipped. Defaults to *1000*.|
| *number*              | perspectiveCorrectInterpolation | If *true*, any properties that are linearly interpolated between vertices (e.g. texture coordinates) will be perspective-corrected. This results in less view-dependent distortion, but will reduce performance to some extent. Defaults to *false*.|
| *boolean*             | clipToViewport           | If *true*, the renderer will clip all n-gons against the viewport prior to rendering. If none of your n-gons extend beyond the screen's boundaries, setting this to *false* may save you some performance. Defaults to *true*. |
| *translation_vector*  | cameraPosition           | The camera's position. Defaults to *vector3(0, 0, 0)*. |
| *rotation_vector*     | cameraDirection          | The camera's direction. Defaults to *vector3(0, 0, 0)*. |
| *array*               | auxiliaryBuffers         | One or more auxiliary render buffers. Each buffer is an object containing the properties *buffer* and *property*; where *buffer* points to an array containing as many elements as there are pixels in the rendering, and *property* names a source property in an n-gon's material. For each pixel rendered, the corresponding element in an auxiliary buffer will be written with the n-gon's material source value. Defaults to *[]*. |
| *boolean*             | useFragmentBuffer        | If true, a fragment buffer will be created during rasterization to contain metadata about each pixel (e.g. depth value and world XYZ coordinates). Will be set to *true* automatically if the pixel shader function is detected (via *Function.toString*) to accept a "fragmentBuffer" parameter; but note that this detection may fail e.g. if the function was created from *Function.bind*. Defaults to *false*. |
| *function*            | pixelShader              | A function to be called by the renderer at the completion of rasterization but before the rendered image is displayed on the canvas, for applying a pixel shader effect on the image. See the [pixel shaders sample](./samples/pixel-shaders/pixel-shaders.js) for examples of usage. Setting the value to *null* will disable pixel shader functionality. Note that the 'useFragmentBuffer' property must be set to *true* if the pixel shader accesses the fragment buffer; the renderer will in most cases automatically detect this and set the property accordingly, but in some cases you may need to manually assign it. Defaults to *null*.  |
| *function*            | vertexShader             | A function to be called by the renderer for each of the input n-gons after the n-gon has been transformed into world-space coordinates (prior to rasterization), for applying a vertex shader effect on the properties of the n-gon. See the [vertex shaders sample](./samples/vertex-shaders/vertex-shaders.js) for examples of usage. Setting the value to *null* will disable vertex shader functionality. Defaults to *null*.  |
| *array*              | lights          | An array of **light** objects to be assigned as the scene's light sources. The vertices in the scene will be affected by these lights according to their parent n-gon's 'vertexShading' material property. Defaults to *[]*.  |
| *object*             | modules | Modules are an advanced feature providing a way to override default core renderer behavior. For instance, you can provide a custom rasterizer function that will be called by the renderer in place of the default rasterizer. Defaults to all properties being *null* (see below for documentation of the properties).  |

*The **options.modules** object recognizes the following properties:*

| Type                  | Name                     | Description |
| --------------------- | ------------------------ | ----------- |
| *mixed*               | transformClipLight       | A function to be called by the renderer to transform, clip, and light the input n-gons; or *null* to disable this functionality in the render path. For more information, including the list of parameters, see [the default function](./js/retro-ngon/base-modules/transform-clip-light.js). Defaults to *undefined*, which will invoke the default function. |
| *mixed*               | rasterize                 | A function to be called by the renderer to rasterize the input n-gons; or *null* to disable rasterization in the render path. If you intend to disable rasterization, setting this value to *null* instead of an empty function is recommended, as the former will also inhibit the unnecessary allocation of raster buffers. For more information, including the list of parameters, see [the default function](./js/retro-ngon/base-modules/rasterize.js). Defaults to *undefined*, which will invoke the default function. |
| *mixed*               | surfaceWipe              | A function tp be called by the renderer to clear the render surface of previous renderings (pixel colors, depth values, etc.); or *null* to disable this functionality in the render path. For more information, including the list of parameters, see [the default function](./js/retro-ngon/base-modules/surface-wipe.js). Defaults to *undefined*, which will invoke the default function. |

*Returns:*

```
{
    // The resolution of the output image. May be smaller or larger than the target
    // canvas element, depending on the value of the 'scale' render option.
    renderWidth,
    renderHeight,

    // The total count of n-gons rendered. May be smaller than the number of n-gons
    // originally submitted for rendering, due to visibility culling etc. performed
    // during the rendering process.
    numNgonsRendered,

    // The total time it took to complete the render call, in milliseconds.
    totalRenderTimeMs,
}
```

*Sample usage:*

```
// Create a mesh out of a single-vertex n-gon, and render it onto a canvas.

const ngon = Rngon.ngon(
    [Rngon.vertex(0, 0, 0)],
    {
        color: Rngon.color_rgba(255, 255, 0),
    }
);

const mesh = Rngon.mesh(
    [ngon],
    {
        rotation: Rngon.rotation_vector(0, 0, 45)
    }
);

Rngon.render("canvas", [mesh], {
    cameraPosition: Rngon.translation_vector(0, 0, -5),
});
```

```
//  Render into an off-screen pixel buffer using a second render state.

const point = Rngon.ngon([Rngon.vertex(0, 0, 0)]);

Rngon.render(null, [Rngon.mesh(point)], {
    state: "custom-state",
    width: pbuf.width,
    height: pbuf.height,
});

// Until Rngon.render() is invoked with a different render state, the
// second state's pixel buffer is available via:
Rngon.state.active.pixelBuffer;

// The second state's pixel buffer can also be accessed permanently via:
Rngon.state["custom-state"].pixelBuffer;
```

```
// Create and use a custom rasterizer function.

Rngon.render(canvas, [meshes], {
    modules: {
        rasterize: custom_rasterizer,
    },
});

function custom_rasterizer()
{
    console.log("I've been asked to rasterize some n-gons.");

    // Rasterize the screen-space n-gons.
    for (let n = 0; n < Rngon.state.active.ngonCache.count; n++)
    {
        const ngon = Rngon.state.active.ngonCache.ngons[n];
        const pixelBuffer = Rngon.state.active.pixelBuffer.data;

        ...

        // Draw a pixel (1 byte per color channel).
        pixelBuffer[pixelIdx + 0] = red;
        pixelBuffer[pixelIdx + 1] = green;
        pixelBuffer[pixelIdx + 2] = blue;
        pixelBuffer[pixelIdx + 3] = alpha;
    }

    // Optional: we could also call the renderer's default rasterizer.
    Rngon.baseModules.rasterize();
}
```

## render_async([, meshes[, options[, rngonUrl]]])
Renders an image of the given n-gon meshes into an off-screen target. This call is non-blocking; the brunt of the rendering will be done using Web Workers.

Returns a Promise that will resolve when the rendering is completed.

*Parameters:*

| Type      | Name            | Description |
| --------- | --------------- | ----------- |
| *array*   | meshes          | An array of one or more **mesh** objects to be rendered. Defaults to *[Rngon.mesh()]* (one empty mesh). |
| *object*  | options         | An object providing optional directives (see below). |
| *string*  | rngonUrl        | A string providing the complete source URL of the renderer's script file &ndash; for example, `"http://localhost:8000/distributable/rngon.js"`. This information is needed by the renderer's Web Worker, which runs from a Blob environment and thus can't use relative file paths. If this argument is not given, or if *null*, the URL will be determined automatically by inspecting the Document's \<script\> tags' `src` properties and selecting the first one that ends in `"rngon.js"`.  Defaults to *null*. |

*The **options** parameter object recognizes the same properties as the one for **render()** but with the following additions and exceptions:*

| Type        | Name          | Description |
| ----------- | ------------- | ----------- |
| *number*    | width         | The width (in pixels) of the image to be rendered. Defaults to *640*. |
| *number*    | height        | The height (in pixels) of the image to be rendered. Defaults to *480*. |
| *number*    | scale         | Ignored. Use the 'width' and 'height' properties instead. |
| *string*    | pixelShader   | Same as for **render()**, but the function must now be provided as a string (e.g. of the form `"(a)=>{console.log(a)}"`) so that it can be passed to a Web Worker. If *null*, pixel shader functionality will be disabled. Defaults to *null*. |
| *string*    | vertexShader  | Same as for **render()**, but the function must now be provided as a string (e.g. of the form `"(a)=>{console.log(a)}"`) so that it can be passed to a Web Worker. If *null*, vertex shader functionality will be disabled. Defaults to *null*. |
| *object*    | modules       | Ignored. Default parameter values will be used. |

*Returns:*

```
{
    // An ImageData object containing the rendered pixels.
    image,

    renderWidth,
    renderHeight,

    // The total count of n-gons rendered. May be smaller than the number of n-gons
    // originally submitted for rendering, due to visibility culling etc. performed
    // during the rendering process.
    numNgonsRendered,

    // The total time this call to render() took, in milliseconds.
    totalRenderTimeMs,
}
```

*Sample usage:*

```
// Create a mesh out of a single-vertex n-gon, render it asynchronously in a
// Web Worker thread, and paint the rendered image onto an existing <canvas>
// element whose DOM id is "target-canvas".

const ngon = Rngon.ngon(
    [Rngon.vertex(0, 0, 5)],
    {
        color: Rngon.color_rgba(255, 255, 0),
    }
);

const mesh = Rngon.mesh([ngon]);

Rngon.render_async([mesh], {width: 640, height: 480}).then(result=>
{
    if (result.image instanceof ImageData)
    {
        const canvas = document.getElementById("target-canvas");

        canvas.width = result.renderWidth;
        canvas.height = result.renderHeight;
        canvas.getContext("2d").putImageData(result.image, 0, 0);
    }
    else
    {
        throw `Rendering failed. ${result}`;
    }
});
```

```
// Use async/await instead of .then().

const result = await Rngon.render_async([mesh], {width: 640, height: 480});
```

## mesh([ngons[, transform]])
A collection of thematically-related n-gons, rendered as a unit with shared transformations.

*Parameters:*

| Type      | Name            | Description |
| --------- | --------------- | ----------- |
| *array*   | ngons           | An array of one or more **ngon** objects, which define the mesh's geometry. Defaults to *[Rngon.ngon()]*. |
| *object*  | transform      | An object whose properties define the transformations to apply on the mesh's n-gons prior to rendering. |

*The **transform** parameter object recognizes the following properties:*

| Type                 | Name            | Description |
| -------------------- | --------------- | ----------- |
| *translation_vector* | translation     | The amount by and direction in which to displace the mesh's n-gons. This is in addition to the n-gons' local coordinates; such that if an n-gon's vertex is located at x = 10, and the mesh it belongs to is translated by 10 on x, the vertex's new location will be x = 20. Defaults to *translation_vector(0, 0, 0)*. |
| *rotation_vector*    | rotation        | The amount of rotation, in degrees 0-359, to apply to each of the mesh's n-gons. Defaults to *rotation_vector(0, 0, 0)*.<br><br>NOTE: The rotation is not applied to the n-gons' surface normals. If you require the surface normals to respect the mesh's rotation, the rotation must be applied - e.g. in your 3D editor of choice - prior to importing the mesh into the renderer, and no further rotation should be requested via this property. |
| *scaling_vector*     | scaling         | The amount by which to scale each of the mesh's n-gons along each of the three axes. Defaults to *scaling_vector(1, 1, 1)*. |

*Note:* If both *translation* and *rotation* are given, the rotation will be applied first.

*Returns:*

```
{
    rotation: transform.rotation,
    translation: transform.translation,
    scale: transform.scaling,

    // The array of n-gons passed as an argument into the function.
    ngons,
})
```

*Sample usage:*

```
// Construct a mesh containing one n-gon, and apply rotation and scaling to it.

const ngon = Rngon.ngon([Rngon.vertex(0, 0, 0)]);

const mesh = Rngon.mesh([ngon],
                        {
                            rotation: Rngon.rotation_vector(20, 0, 0),
                            scaling: Rngon.scaling_vector(10, 15, 5),
                        });
```

## ngon([vertices[, material[, normal]]])
An n-gon &ndash; a shape defined by *n* vertices; typically a triangle or a quad.

*Parameters:*

| Type      | Name            | Description |
| --------- | --------------- | ----------- |
| *array*   | vertices        | An array of one or more **vertex** objects, which define the corners of the n-gon. Defaults to *[vertex()]*. |
| *object*  | material        | An object whose properties define the n-gon's material. Will be combined with the *ngon.defaultMaterial* object such that any colliding parameters are overridden by this object. Defaults to *{}*. |
| *vector3* | normal          | A surface normal defining the direction of the n-gon's face. Defaults to *vector3(0, 1, 0)* &ndash; a vector pointing up.<br><br>NOTE: Surface normals do not react to rotation applied to the n-gon's **mesh** object. They are therefore best used for static meshes. |

*The **material** parameter object recognizes the following properties:*

| Type                 | Name              | Description |
| -------------------- | ----------------- | ----------- |
| *color_rgba*         | color             | Defines the n-gon's base color. If the n-gon has no texture, its entire face will be rendered in this color. If the n-gon has a texture, the colors of the texture will be multiplied by (x / 255), where *x* is the corresponding color channel of the base color. Defaults to *color_rgba(255, 255, 255, 255)*. |
| *mixed*              | texture           | Gives the n-gon's texture as a **texture_rgba** object; or, if *null*, the n-gon will be rendered without a texture. N-gons with fewer than three vertices (i.e. points and lines) will ignore any value other than *null*. Defaults to *null*. |
| *string*             | textureMapping    | Defines how textures (if any) should be mapped onto the n-gon's surface during rendering. Possible values: "ortho" (view-dependent mapping without UV), "affine" (UV mapping). If set to "ortho", vertices do not need UV coordinates, but visual distortions will be introduced in many cases. The "affine" mapping mode requires vertices to have UV coordinates, but results in more visually-accurate mapping. Defaults to *"ortho"*. |
| *string*             | textureFiltering  | Identifies the filtering effect to be used when rasterizing the n-gon's texture. Possible values: "none" (no filtering, textures will appear pixelated), "dither" (Unreal-style UV dithering, mimics bilinear filtering but is faster to render), "bilinear". Note that the "dither" and "bilinear" options currently use the renderer's generic, less performance-optimized render path. Defaults to *"none"*. |
| *string*             | uvWrapping        | Controls how the texture sampler should interpret UV coordinates. Possible values: "clamp" (UV coordinates are clamped to [0,1-ϵ], or [-ϵ,-1] if negative values are given), "repeat" (discards the coordinate's integer part and repeats the texture). Note that the "repeat" option is currently only available for textures whose resolution is a power of two &ndash; non-power-of-two textures will be clamped regardless of the value of this setting. Defaults to *"repeat"*. |
| *boolean*            | hasWireframe      | If true, the n-gon will be rendered with a wireframe outline. Defaults to *false*. |
| *boolean*            | hasFill           | If false, the n-gon's pixels will not be rendered (filled in). Setting this to false and 'hasWireframe' to true results in just the n-gon's wireframe outline being rendered. Defaults to *true*. |
| *boolean*            | isTwoSided        | If true, the n-gon can be viewed from both front and back. Otherwise, the n-gon will be culled when viewed from behind, as determined by the direction of its surface normal. Defaults to *true*.<br><br>Note: Should not be set to false for n-gons that are part of a **mesh** object to which you have applied rotation. This is because surface normals ignore rotation, so applying backface culling in these cases would give an incorrect result. |
| *color_rgba*         | wireframeColor    | If the n-gon has a wireframe, this property gives the wireframe's color as a **color_rgba** object. Defaults to *color_rgba(0, 0, 0)*. |
| *array*              | auxiliary         | Properties accessible to the auxiliary buffers of **render**. Defaults to *{}*. |
| *boolean*            | allowTransform    | If true, the n-gon's vertices will be transformed into screen space prior to rasterization. Otherwise, the vertices are assumed to already be in screen space, where X,Y == 0,0 is the top left corner and X,Y == rw-1,rh-1 the bottom right corner, with rw being the render width and rh the render height; and in which case no further transformation will be performed. Defaults to *true*.<br><br>Caution: If set to false, viewport clipping will also not be performed. All vertex XY coordinates of such n-gons must be in the range [0,d-1], where d is the render width for X and render height for Y. |
| *string*             | vertexShading     | Sets the type of built-in shading to be used when applying lighting to n-gons from the scene's light sources (which are given by the 'lights' property to **render()**). Possible values: "none" (no shading will be applied and so all light sources are ignored), "flat" (each n-gon face will receive a solid shade based on the angle between incident light and the n-gon's surface normal), "gouraud" (same as "flat" but computed for each vertex, resulting in smooth shading). For Gouraud shading, you should export the 3D meshes with smooth vertex normals. Defaults to *"none"*. |
| *boolean*            | renderVertexShade | Controls whether the renderer will apply vertex shading to pixels during rasterization. If set to *false*, built-in lighting will effectively be turned off. But if this is *false* and the 'vertexShading' property is *"flat"* or *"gouraud"*, shading information will still be computed and made available to e.g. pixel shaders. Defaults to *true*. |
| *boolean*            | allowAlphaBlend   | If *true*, the n-gon will be blended with its background pixels to an extent determined by the 'color' property's alpha value (0 = fully transparent, 255 = fully opaque). If *false*, no blending will be performed. Note that the 'allowAlphaReject' property will also influence alpha rendering. Defaults to *false*. |
| *boolean*            | allowAlphaReject  | If *true*, the rasterizer will discard any texel whose alpha value is not equal to 255, and any n-gon whose material color's alpha value is less than or equal to 0. Otherwise, texels will be rasterized regardless of their alpha, and n-gons will be either subjected to alpha blending (if the 'allowAlphaBlend' property is *true*) or rasterized regardless of their alpha. Defaults to *false*. |

*Returns:*

```
{
    vertices,
    material,
    normal,        // The face normal.
    vertexNormals, // The corresponding normal for each vertex.

    // A value in the range [0,1] that defines which mip level of this
    // n-gon's texture (if it has a texture) should be used when rendering.
    // A value of 0 is the maximum-resolution (base) mip level, 1 is the
    // lowest-resolution (1 x 1) mip level.
    mipLevel,
}
```

*Sample usage:*

```
// Construct a 4-sided n-gon (quad) with a texture applied to it.

const texture = Rngon.texture_rgba(
                {
                    width: 2,
                    height: 2,
                    pixels: [255, 200, 0, 255,
                             200, 255, 0, 255,
                             255, 0, 200, 255,
                             0, 255, 200, 255],
                });

const quad = Rngon.ngon([Rngon.vertex(-1, -1, 0),
                         Rngon.vertex( 1, -1, 0),
                         Rngon.vertex( 1,  1, 0),
                         Rngon.vertex(-1,  1, 0)],
                        {
                            color: Rngon.color_rgba(255, 255, 255),
                            texture: texture
                        });
```

## vertex([x[, y[, z[, u[, v[, w]]]]]])
One corner of an n-gon.

*Parameters:*

| Type          | Name     | Description |
| ------------- | -------- | ----------- |
| *number*      | x        | The vertex's *x* coordinate. Defaults to *0*. |
| *number*      | y        | The vertex's *y* coordinate. Defaults to *0*. |
| *number*      | z        | The vertex's *z* coordinate. Defaults to *0*. |
| *number*      | u        | The vertex's *u* texture coordinate. Defaults to *0*. |
| *number*      | v        | The vertex's *v* texture coordinate.  Defaults to *0*. |
| *number*      | w        | The vertex's *w* coordinate, for matrix transformations. Defaults to *1*. |

*Note:* In the coordinate space, *x* is horizontal (positive = right), and *y* is vertical (positive = up); positive *z* is forward. Of the texture coordinates, *u* is horizontal, and *v* is vertical.

*Returns:*

```
{
    x, y, z, w, u, v,

    // A value in the range >= 0 that defines how lit this vertex is.
    // Will be modified by built-in lighting, if enabled.
    shade,

    // The vertex's object-space coordinates. Will be set automatically
    // by the vertex transformer and made accessible to pixel shaders.
    worldX, worldY, worldZ,
}
```

*Sample usage:*

```
// Create a vertex at coordinates (1, 1, 0), and give it UV coordinates (1, 0).

const vertex = Rngon.vertex(1, 1, 0, 1, 0);
```

```
// Create an n-gon from two vertices.

const vertex1 = Rngon.vertex(1, 1, 0);
const vertex2 = Rngon.vertex(-1, -1, 0);

const ngon = Rngon.ngon([vertex1, vertex2]);
```

## vector3([x[, y[, z]]])
A three-component vector.

*Aliases:* **rotation_vector**\*, **translation_vector**, **scaling_vector**

\* Component values passed to **rotation_vector** are expected to be in units of degrees; and are automatically converted by value into the renderer's internal angle units.

*Parameters:*

| Type          | Name     | Description |
| ------------- | -------- | ----------- |
| *number*      | x        | The vector's *x* coordinate. Defaults to *0*. |
| *number*      | y        | The vector's *y* coordinate. Defaults to *0*. |
| *number*      | z        | The vector's *z* coordinate. Defaults to *0*. |

*Note:* In the coordinate space, *x* is horizontal (positive = right), and *y* is vertical (positive = up); positive *z* is forward.

*Returns:*

```
{
    x, y, z,
}
```

*Sample usage:*

```
// Create a vector (1, 2, 3).

const vector = Rngon.vector3(1, 2, 3);
```

## color_rgba([red[, green[, blue[, alpha]]]])
RGB color with transparency (alpha channel). The alpha channel is either fully transparent or fully opaque.

*Parameters:*

| Type          | Name  | Description |
| ------------- | ------| ----------- |
| *number*      | red   | The color's red channel. Defaults to *55*. |
| *number*      | green | The color's green channel. Defaults to *55*. |
| *number*      | blue  | The color's blue channel. Defaults to *55*. |
| *number*      | alpha | The color's alpha channel. A value of 255 is fully opaque, while a value other than 255 is fully transparent. Defaults to *255*. |

*Note:* All color channel values are to be given in the range [0, 255].

*Returns:*

```
{
    red, green, blue, alpha,

    // An object containing as properties the color channel values in the range [0, 1].
    unitRange,
}
```

## texture_rgba([data])
A texture whose pixels are RGB with alpha.

*Parameters:*

| Type          | Name  | Description |
| ------------- | ------| ----------- |
| *object*      | data  | An object whose properties provide the texture's data. Defaults to *{width:0, height:0, pixels:[]}* (an empty texture). |

*The **data** parameter object recognizes the following properties:*

| Type      | Name      | Description |
| --------- | ----------| ----------- |
| *number*  | width     | The number of pixels in the texture, horizontally. The value must be in the range [0, 32768]. If affine texture-mapping is used, textures whose dimensions are a power of two render a bit faster. |
| *number*  | height    | The number of pixels in the texture, vertically. The value must be in the range [0, 32768]. If affine texture-mapping is used, textures whose dimensions are a power of two render a bit faster. |
| *array*   | pixels    | An array containing the texture's pixels. The *encoding* property defines the encoding used for the pixel data; by default, each pixel is given as four consecutive 8-bit values (red, green, blue, alpha). |
| *string*  | encoding  | *Optional parameter.* Specifies the encoding used for data in the *pixels* array. Possible values: "none" (each pixel is given as four discrete 8-bit values), "base64" (pixels are packed integers encoded with Base64). If "base64" is specified, the bit layout of the packed pixel values must be given via the *channels* property.
| *string*  | channels  | *Optional parameter.* Will be ignored if *encoding* is not "base64". Specifies the bit layout of the data in the *pixels* array. Possible values: "rgba:5+5+5+1" (each pixel element is a 16-bit integer with 5 bits each for red/green/blue, and 1 bit for alpha). |

*Note:* The texture's data can be provided either via the *data* parameter, or through a JSON file using the `texture_rgba.create_with_data_from_file()` helper function.

*Returns:*

```
{
    width: data.width,
    height: data.height,

    // The pixels from data.pixels converted into an array of
    // elements of the form {red, green, blue, alpha}.
    pixels: pixelArray,
}
```

*Sample usage:*

```
// Create a 2-by-2 texture.

const texture = Rngon.texture_rgba(
                {
                    width: 2,
                    height: 2,
                    pixels: [255, 200, 0, 255,
                             200, 255, 0, 255,
                             255, 0, 200, 255,
                             0, 255, 200, 255],
                });
```

```
// Create a texture with data from a JSON file.

const texture = await Rngon.texture_rgba.create_with_data_from_file("texture.json");
```

```
// Create a texture whose pixels are Base64-encoded packed 16-bit integers.

const texture = Rngon.texture_rgba(
                {
                    width: 1,
                    height: 1,
                    channels: "rgba:5+5+5+1",
                    encoding: "base64",
                    pixels: "H4A=",
                });
```

# Authors and credits

The main author of the retro n-gon renderer is the one-man Tarpeeksi Hyvae Soft (see on [GitHub](https://github.com/leikareipa) and the [Web](https://www.tarpeeksihyvaesoft.com)).

On 3D software rendering in general, the aforementioned main author has benefited a good bit from tutorials by Benny Bobaganoosh. You can check out his [YouTube](https://www.youtube.com/playlist?list=PLEETnX-uPtBUbVOok816vTl1K9vV1GgH5) and [GitHub](https://github.com/BennyQBD/3DSoftwareRenderer). The retro n-gon renderer's matrix code ([js/retro-ngon/core/matrix44.js](./js/retro-ngon/core/matrix44.js)) is adapted, with superficial changes, from [Benny's code](https://github.com/BennyQBD/3DSoftwareRenderer/blob/master/src/Matrix4f.java).
