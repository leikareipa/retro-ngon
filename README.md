# The retro n-gon renderer

A well-featured retro-themed 3D software renderer for the HTML5 \<canvas\> (also supports off-screen rendering).

You can view various interactive render samples [here](https://www.tarpeeksihyvaesoft.com/experimental/retro-ngon/samples/).

![A textured cube](./images/screenshots/beta/tomb-raider-crt.webp)\
*An indoor scene from Tomb Raider, with a CRT shader. (Based on assets created by Core Design for Tomb Raider. Core Design is not associated with this renderer.)*

![A view from Grand Prix Legends](./images/screenshots/beta/gpl.webp)\
*A view of the race track and stands at Rouen in Grand Prix Legends. (Based on textures and 3D models created by Papyrus Design Group for Grand Prix Legends. Papyrus Design Group is not associated with this renderer.)*

![A view from Grand Prix Legends](./images/screenshots/beta/quake-bilinear.webp)\
*A corridor in Quake, with bilinear texture filtering and per-pixel lighting. (Based on textures and 3D models created by id Software for Quake. id Software is not associated with this renderer.)*

## Main features

- Straightforward API
- Genuine retro aesthetics
- Customizable render pipeline
- Reasonable performance (for retro uses)

## Suggested use cases

Being a retro-oriented software renderer written in JavaScript, the retro n-gon renderer thrives in low resolutions and low polycounts, its performance generally lacking for modern-style rendering.

I'd generally expect the renderer to find a home powering nostalgia projects reminiscent of the 90s and early 2000. Retro-themed games, model visualization, etc.

With its relatively simple API, this renderer may also be a good choice for prototyping.

## Documentation

- [Quick-start guide](#quick-start-guide)
- [API reference](#api-reference)

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
        color: Rngon.color(0, 150, 255)
});

const quadMesh = Rngon.mesh([quad], {
    rotation: Rngon.vector(0, 0, 45),
});

Rngon.render({
    target: "canvas",
    scene: [quadMesh],
    options: {
        cameraPosition: Rngon.vector(0, 0, -5),
        scale: 1,
    }
});
```

![A blue quad](./images/tutorials/blue-quad.png)

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

![A textured quad](./images/tutorials/textured-quad.png)

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

A PHP-based tool for converting PNG images into this JSON format is provided in the [tools/conversion/](./tools/conversion/) directory.

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

![A textured quad with affine mapping](./images/tutorials/textured-quad-affine.png)

## Make it pixelated

1. Adjust the `scale` property in the render call:

```javascript
Rngon.render({
    target: "canvas",
    scene: [quadMesh],
    options: {
        cameraPosition: Rngon.vector(0, 0, -5),
        scale: 0.14,
    },
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

## Exporting scenes from Blender

A Python script for exporting scenes from Blender into a JSON format that supports this renderer is provided under [tools/conversion/](./tools/conversion/). At the moment, the export script is rudimentary but does the business.

To export a scene from Blender, load up the export script file in Blender, and run it. The script will export vertex coordinates, vertex UV coordinates, the diffuse color and intensity of each material, and, if any, the filename of the texture image in each material's first texture slot. Objects that are hidden won't be exported.

Remember to first apply any pending transformations to the objects (Object > Apply in Blender's menu) before running the export script, as any unapplied transformations will be ignored. The same goes for any other mesh modifiers that haven't yet been applied.

Once the scene has been exported into the JSON file, you may need to make a few edits to the file by hand. Texture filenames, for example, will probably need to be given correct paths. You'll also want to convert the texture images into the renderer's JSON format (see [Add a texture](#add-a-texture)).

## More!

You can find various render samples under the [samples/](./samples/) directory.

You should also have a look at the [API reference](#api-reference), as it contains much more detail than is found in this quick-start guide. For example, you'll find out about vertex shaders, custom rasterizer functions, asynchronous rendering, raw render buffer access, and many other things.

# API reference

The renderer's public API consists of the following objects:

| Object                                          | Brief description                            |
| ----------------------------------------------- | -------------------------------------------- |
| [render()](#rendertarget-scene-options-pipeline) | Renders n-gon meshes.                       |
| [render_async()](#render_asyncmeshes-options-rngonurl) | Renders n-gon meshes asynchronously.  |
| [mesh](#meshngons-transform)                    | Collection of related n-gons.                |
| [ngon](#ngonvertices-material-normal)           | Polygonal shape defined by *n* vertices.     |
| [vertex](#vertexx-y-z-u-v-w)                    | Corner of an n-gon.                          |
| [vector](#vectorx-y-z)                          | Three-component vector.                      |
| [color](#colorred-green-blue-alpha)             | 32-bit RGBA color.                           |
| [texture](#texturedata)                         | 2D RGBA image for texturing n-gons.          |
| light                                           | (A description is coming.)                   |

## render({target, scene, options, pipeline})

Renders the specified n-gon meshes onto the provided render target (a canvas element or an off-screen pixel buffer). This function is blocking and will return after rendering is completed. For non-blocking rendering, see [render_async()](#render_asyncmeshes-options-rngonurl).

After the call, the rendered pixel buffer is accessible via *Rngon.state.active.pixelBuffer*, and the corresponding screen-space n-gons are available from *Rngon.state.active.ngonCache*.

### Parameters

- **target** (HTMLCanvasElement | string | null = *null*): The target recepticle for the rendered image.
    - Possible values:
        - HTMLCanvasElement: The image will be displayed on this canvas element.
        - string: The image will be displayed on the canvas element found in `document.body` whose `id` property matches this string.
        - null: The image won't be displayed. It can be accessed as a raw pixel buffer via `Rngon.state.active.pixelBuffer`.
- **scene** (array = *[mesh()]*): The `mesh` objects to be rendered.
- **options** (object): Additional rendering options:
    - **state** (string = *"default"*): The name of the state object to be used for storing internal state during rendering. Subsequent calls to `render()` with this name will re-use the corresponding state object, so that e.g. render buffers won't be re-allocated if there are intervening calls to `render()` with different parameters using a different state name. You can access the state object via `Rngon.state[name]` after the call.
        - The value "active" is reserved and should not be used.
    - **scale** (number = *1*): The size of the rendered image, as a multiplier of the size of the target canvas. Ignored if the `target` parameter is *null*, i.e. when there is no target canvas, in which case the `width` and `height` options will be used.
    - **width** (number = *640*): The width of the image to be rendered. Ignored if the `target` parameter is not *null*.
    - **height** (number = *480*): The height of the image to be rendered. Ignored if the `target` parameter is not *null*.
    - **fov** (number = *43*): Field-of-view size.
    - **depthSort** (string = *"painter-reverse"*): The method of sorting n-gons prior to rasterization.
        - Possible values:
            - "none": N-gons are rendered without additional sorting.
            - "painter": Painter's algorithm; n-gons furthest from the camera are rendered first.
            - "painter-reverse": N-gons closest to the camera are rendered first.
    - **useDepthBuffer** (boolean = *true*): Whether a depth buffer should be generated and used during rasterization to discard occluded pixels. If enabled, the depth buffer is also accessible via `Rngon.state.active.depthBuffer` after the call.
    - **hibernateWhenNotOnScreen** (boolean = *true*): Whether to inhibit rendering when the target canvas is not within the browser's viewport. Ignored if the `target` parameter is *null*.
    - **nearPlane** (number = *1*): Vertices closer to the camera than this will be clipped.
    - **farPlane** (number = *1000*): Vertices further from the camera than this will be clipped.
    - **perspectiveCorrectInterpolation** (number = *false*): Whether properties that are linearly interpolated between vertices during rasterization (e.g. texture coordinates) are perspective-corrected, eliminating view-dependent distortion.
    - **cameraPosition** (vector = *vector(0, 0, 0)*): The position from which the scene is rendered.
    - **cameraDirection** (vector = *vector(0, 0, 0)*): The direction in which the scene is viewed for rendering.
    - **useFragmentBuffer** (boolean = *false*): Whether the renderer should generate a fragment buffer to provide per-pixel metadata (e.g. depth value and world XYZ coordinates). Will be set to *true* automatically if the `pixelShader` function accepts a "fragmentBuffer" parameter. If enabled, the fragment buffer is also accessible via `Rngon.state.active.fragmentBuffer` after the call.
    - **lights** (array = *[]*): The scene's light sources, as *`light`* objects. N-gons will be lit according to their `vertexShading` material property, or by the *vertexShader* function if provided.
- **pipeline** (object): Customize the render pipeline:
    - **transformClipLighter** (function | undefined | null = *undefined*): A function to be called by the renderer to transform, clip, and light the input n-gons; or [the built-in function](./js/retro-ngon/base-modules/transform-clip-light.js) if *undefined*; or disabled entirely if *null*.
    - **rasterizer** (function | undefined | null = *undefined*): A function to be called by the renderer to rasterize the input n-gons; or [the built-in function](./js/retro-ngon/base-modules/rasterize.js) if *undefined*; or disabled entirely if *null*.
    - **surfaceWiper** (function | undefined | null = *undefined*): A function tp be called by the renderer to clear the render surface of previous renderings (pixel colors, depth values, etc.); or [the built-in function](./js/retro-ngon/base-modules/surface-wipe.js) if *undefined*; or disabled entirely if *null*.
    - **pixelShader** (function | null = *null*): A function to be called by the renderer at the completion of rasterization to apply pixel-shading effects to the rendered image ('pixelBuffer'). See the [pixel shaders sample](./samples/pixel-shaders/pixel-shaders.js) for examples of usage.
        - Function signature: pixelShader({renderWidth, renderHeight, pixelBuffer, fragmentBuffer, ngonCache, cameraPosition}) {..}.
            - **renderWidth** (number): The width of the rendered image.
            - **renderHeight** (number): The height of the rendered image.
            - **pixelBuffer** (Uint8ClampedArray): The pixels of the rendered image (32-bit RGBA).
            - **fragmentBuffer** (array): For each pixel in `pixelBuffer`, an object containing metadata about the pixel:
                - **ngonIdx** (number): Index in the `ngonCache` array identifying the pixel's n-gon.
                - **textureUScaled** (number): The U texel coordinate that was used to fetch this pixel. In the range from 0 to the width of the texture.
                - **textureVScaled** (number): The V texel coordinate that was used to fetch this pixel. In the range from 0 to the height of the texture.
                - **textureMipLevelIdx** (number): The texture mip level that was used. A value in the range [0,*n*-1], where *n* is the count of mip levels in the texture.
                - **worldX** (number): World X coordinate.
                - **worldY** (number): World Y coordinate.
                - **worldZ** (number): World Z coordinate.
                - **depth** (number): The depth value written into the depth buffer by this fragment.
                - **shade** (number): The lightness level, in the range [0,1]. 
            - **ngonCache** (object): The screen-space n-gons that were rasterized:
                - **count** (number): The number of n-gons.
                - **ngons** (array): The n-gons, as an array of *`ngon`* objects. The length of this array may be larger than `count` due to caching, but only the first `count` elements are valid for this rendering.
            - **cameraPosition** (vector): The position of the camera.
        - Note: The `useFragmentBuffer` option must be set to *true* if the pixel shader accesses the fragment buffer. The renderer will in most cases automatically detect this and set the property accordingly, but in some cases you may need to manually assign it.
    - **vertexShader** (function | null = *null*): A function to be called by the renderer for each of the scene's n-gons to apply vertex-shading effects to the n-gon. The function will be called when the n-gon has been transformed into world-space coordinates but prior to clipping and rasterization. See the [vertex shaders sample](./samples/vertex-shaders/vertex-shaders.js) for examples of usage.
        - Function signature: vertexShader({ngon, cameraPosition}) {..}.
    - **rasterShader** (function | null = *null*): A function to be called by the renderer to implement custom rasterization of the transformed screen-space n-gons. If this function returns a falsy value, the renderer will call the appropriate [built-in raster shader](./js/retro-ngon/base-modules/rasterize/).

### Returns

An object with the following properties:

- **renderWidth** (number): Width of the output image.
- **renderHeight** (number): Height of the output image.
- **numNgonsRendered** (number): Total count of n-gons rendered. May be smaller than the number of n-gons originally submitted for rendering, due to visibility culling etc.
- **totalRenderTimeMs** (number): Total time it took to complete the render call, in milliseconds.

### Sample usage

```javascript
// Create a mesh out of a single-vertex n-gon, and render it onto a canvas.
const ngon = Rngon.ngon(
    [Rngon.vertex(0, 0, 0)], {
        color: Rngon.color(255, 255, 0),
});

const mesh = Rngon.mesh([ngon], {
    rotation: Rngon.vector(0, 0, 45)
});

Rngon.render({
    target: "canvas",
    scene: [mesh],
    options: {
        cameraPosition: Rngon.vector(0, 0, -5),
    },
});
```

```javascript
//  Render into an off-screen pixel buffer using a custom render state.
const point = Rngon.ngon([Rngon.vertex(0, 0, 0)]);

Rngon.render({
    target: null,
    scene: [Rngon.mesh(point)],
    options: {
        state: "custom-state",
        width: 100,
        height: 100,
    },
});

// Until render() is invoked with a different render state, the custom
// state's pixel buffer is available via:
Rngon.state.active.pixelBuffer;

// The custom state's pixel buffer can also be accessed permanently via:
Rngon.state["custom-state"].pixelBuffer;
```

### Rasterization paths

Based on the material properties of the input n-gons and certain rendering options, the renderer will pass each n-gon through one of three possible rasterization paths: Textured, Solid, or Generic. (You can also implement your own custom rasterization paths. See the [the built-in paths](./js/retro-ngon/base-modules/rasterize/), [the additional sample paths](./samples/raster-shaders/), and the 'rasterShaders' render option for more details.)

The paths are listed below, with the conditions required for that path to activate for a given n-gon:

1. Textured
    1. Render options:
        1. Depth buffer enabled (`useDepthBuffer` set to *true*)
        2. Fragment buffer disabled (`useFragmentBuffer` set to false, and `pixelShader` set to a falsy value or a function that doesn't use the fragment buffer)
    3. N-gon material properties:
        1. Textured
        2. White base color (`color` set to *Rngon.color(255, 255, 255)*)
        3. Alpha operations disabled (`allowAlphaReject` and `allowAlphaBlend` set to *false*)
        4. Affine texture-mapping (`textureMapping` set to "affine")
        5. Texture filtering disabled (`textureFiltering` set to "none")
3. Solid
    1. Depth buffer enabled (`useDepthBuffer` set to *true*)
    2. Fragment buffer disabled (`useFragmentBuffer` set to false, and `pixelShader` set to a falsy value or a function that doesn't use the fragment buffer)
    4. N-gon material properties:
        1. Not textured
        2. Alpha operations disabled (`allowAlphaReject` and `allowAlphaBlend` set to *false*)
2. Generic. N-gons not matching the criteria for the Textured or Solid paths will be rendered by  path.

The Generic path is best-equipped to render all types of n-gons, but it can also make the fewest performance-increasing assumptions and so is the slowest of the paths. For textured n-gons, the Textured path can be up to twice as fast as the Generic path.

## render_async([meshes[, options[, rngonUrl]]])

An non-blocking version of **render()** that executes in a Web Worker.

### Parameters

Accepts the same parameters as **render()**, with the following differences:

- **options** (object):
    - **pixelShader** (string | undefined = *undefined*): Same as for **render()**, but the function must now be provided as a string.
    - **vertexShader** (string | undefined = *undefined*): Same as for **render()**, but the function must now be provided as a string.
    - **scale**: Ignored. Use the `width` and `height` options instead.
    - **modules**: Ignored (default values will be used for all properties).
- **rngonUrl** (string | null = *null*): The absolute URL to the renderer's script file; e.g. `"http://localhost:8000/distributable/rngon.js"`. If *null*, the URL will be determined automatically by inspecting the Document's \<script\> tags' `src` attributes and selecting the first one that ends in `"rngon.js"`.

### Returns

A Promise that resolves to an object with the following properties:

- **image** (ImageData): The rendered image.
- **renderWidth** (number): The width of the output image.
- **renderHeight** (number): The height of the output image.
- **numNgonsRendered** (number): The total count of n-gons rendered. May be smaller than the number of n-gons originally submitted for rendering, due to visibility culling etc.
- **totalRenderTimeMs** (number): The total time it took to complete the render call, in milliseconds.

### Sample usage

```javascript
const {image} = await Rngon.render_async([mesh], {width: 640, height: 480});

if (image instanceof ImageData)
{
    const canvas = document.getElementById("target-canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    canvas.getContext("2d").putImageData(image, 0, 0);
}
else
{
    throw `Rendering failed. ${result}`;
} 
```

## mesh([ngons[, transform]])

A selection of n-gons related to each other in some way, rendered as a unit with shared transformations.

### Parameters

- **ngons** (array = *[ngon()]*): The n-gons that make up the mesh.
- **transform** (object): Transformations to the mesh's n-gons, to be applied at render-time:
    - **translation** (vector = *vector(0, 0, 0)*): Delta increments to XYZ vertex coordinates.
    - **rotation** (vector = *vector(0, 0, 0)*): Rotation around the origin of (0, 0, 0), in degrees.
        - Note: Rotation is not applied to normals.
    - **scaling** (vector = *vector(1, 1, 1)*): Multipliers to XYZ vertex coordinates.

Note: If both `transform.translation` and `transform.rotation` are given, rotation will be applied first.

### Returns

An object with the following properties:

- **ngons** (array): The `ngons` parameter.
- **translation** (vector): The `transform.translation` parameter.
- **rotation** (vector): The `transform.rotation` parameter.
- **scale** (vector): The `transform.scaling` parameter.

### Sample usage

```javascript
// Construct a mesh containing one n-gon, and apply scaling to it.
const mesh = Rngon.mesh([ngon], {
    scaling: Rngon.vector(10, 15, 5),
});

// Transformations can be edited directly:
mesh.scaling.x = 100;
```

## ngon([vertices[, material[, normal]]])

A polygon made up of *n* vertices, also known as an n-gon. Single-vertex n-gons are treated as points, and two-vertex n-gons as lines.

### Parameters

- **vertices** (array = *[vertex()]*): The `vertex` objects that define the corners of the n-gon. The length of the array must be in the range [1,500].
- **material** (object): The material properties that define the n-gon's appearance:
    - **color** (color = *color(255, 255, 255, 255)*): Base color. If the `texture` property is *null*, the n-gon will be rendered in this color. Otherwise, the renderer will multiply texel colors by (C / 255), where C is the corresponding channel of the base color.
    - **texture** (texture | null = *null*): The image to be rendered onto the n-gon's face. If *null*, or if there are fewer than 3 vertices, the n-gon will be rendered without a texture.
    - **textureMapping** (string = *"ortho"*): The method by which `texture` should be mapped onto the n-gon's face.
        - Possible values:
            - "ortho": The texture is mapped using vertex UV coordinates that are generated automatically at render-time in 2D screen space. This method only works for planar n-gons; rotating the n-gon will produce a skewed mapping.
            - "affine": Affine texture-mapping using the UV coordinates provided by the `vertex` objects in the `vertices` parameter.
        - For "affine" to perform perspective-correct UV mapping, enable the `perspectiveCorrectInterpolation` option in `render()`.
    - **textureFiltering** (string = *"none"*): The filtering effect to be applied when rasterizing *texture*.
        - Possible values:
            - "none": No filtering. The texture will appear pixelated when viewed up close.
            - "dither": Faux bilinear filtering by jittering texel coordinates.
            - "bilinear": Bilinear filtering.
    - **uvWrapping** (string = *"repeat"*): How the renderer should scale UV coordinates.
        - Possible values:
            - "clamp": UV coordinates are clamped to [0,1].
            - "repeat": UV coordinates' integer part is discarded. 
        - The "repeat" option is available only for power-of-two textures. Others will fall back to "clamp".
    - **hasWireframe** (boolean = *false*): Whether the n-gon should be rendered with a wireframe outline.
        - Also see the `wireframeColor` property.
    - **wireframeColor** (color = *color(0, 0, 0)*): If the `hasWireframe` property is *true*, this value sets the wireframe's color.
    - **hasFill** (boolean = *true*): Whether the face of the n-gon should be rendered. If *false* and `hasWireframe` is *true*, the n-gon's wireframe outline will be rendered.
    - **isTwoSided** (boolean = *true*): Whether the n-gon should be visible from behind, as determined by the direction of its face normal.
        - Should be set to *true* for n-gons that are part of a **mesh** to which you apply rotation, as rotation doesn't apply to normals.
    - **allowTransform** (boolean = *true*): Whether the n-gon's vertices should be transformed into screen space prior to rasterization. If *false*, the vertices are assumed to already be in screen space.
        - If *false*, you must ensure that all vertex XY coordinates are within the dimensions of the rendered image.
    - **vertexShading** (string = *"none"*): The type of shading to be used when applying the scene's light sources to the n-gon.
        - Possible values:
            - "none": Light sources do not affect the appearance of the n-gon.
            - "flat": The n-gon's face receives a solid shade based on the angle between the incident light and the n-gon's face normal.
            - "gouraud": Same as "flat" but computed per vertex, resulting in smooth shading across the n-gon's face.
        - For "gouraud" to work, n-gons must have pre-computed smooth vertex normals.
    - **renderVertexShade** (boolean = *true*): Whether the shading values calculated as per the `vertexShading` property should be used during rendering. If *false*, this shading information won't directly affect the rendered image, but is accessible to pixel shaders.
    - **allowAlphaBlend** (boolean = *false*): Whether the alpha channel of the `color` property can modify the appearance of the n-gon. If *true*, the n-gon's pixels will be blended with their background according to the alpha value (0 = fully transparent, 255 = fully opaque).
    - **allowAlphaReject** (boolean = *false*): Whether the alpha channel of the `color` property can modify the appearance of the n-gon. If *true*, the pixel will be drawn only if the alpha value is 255.
- **normal** (array | vector = *vector(0, 1, 0)*): A vector determining the orientation of the n-gon's face. If given as a `vector` object, represents the face normal. If given as an array, each element must be a `vector` object that represents the normal of the corresponding vertex in the `vertices` parameter, and in this case the n-gon's face normal will be automatically calculated as the normalized average of these vertex normals.

### Returns

An object with the following properties:

- **vertices** (array): The `vertices` parameter.
- **material** (object): The `material` parameter.
- **vertexNormals** (array): For each element in the `vertices` parameter, a corresponding `vector` object determining the normal of the vertex.
- **normal** (vector): The face normal.
- **mipLevel** (number): The mip level to be used when rendering the n-gon's texture. The value is in the range [0,1], with 0 corresponding to the maximum resolution and 1 the minimum resolution.

### Sample usage

```javascript
// Construct a 2-sided red n-gon.
const line = Rngon.ngon([
    Rngon.vertex(-1, -1, 0),
    Rngon.vertex( 1, -1, 0)], {
        color: Rngon.color(255, 0, 0),
});
```

## vertex([x[, y[, z[, u[, v[, w]]]]]])

A point in space representing a corner of an n-gon.

Note: In the renderer's coordinate space, X is horizontal (positive = right), and Y is vertical (positive = up); positive Z is forward.

### Parameters

- **x** (number = *0*): X coordinate. 
- **y** (number = *0*): Y coordinate. 
- **z** (number = *0*): Z coordinate. 
- **u** (number = *0*): U texel coordinate. 
- **v** (number = *0*): V texel coordinate. 
- **w** (number = *1*): W coordinate.

### Returns

An object with the following properties:

- **x** (number): The `x` parameter.
- **y** (number): The `y` parameter.
- **z** (number): The `z` parameter.
- **u** (number): The `u` parameter.
- **v** (number): The `v` parameter.
- **w** (number): The `w` parameter.
- **shade** (number): A positive number defining the vertex's degree of shade, with 0 being fully unlit and 1 fully lit.

## vector([x[, y[, z]]])

A three-component vector.

### Parameters

- **x** (number = *0*): X coordinate.
- **y** (number = *0*): Y coordinate.
- **z** (number = *0*): Z coordinate.

### Returns

An object with the following properties:

- **x** (number): The `x` parameter.
- **y** (number): The `y` parameter.
- **z** (number): The `z` parameter.

## color([red[, green[, blue[, alpha]]]])

A 32-bit, four-channel, RGBA color value, where each color channel is 8 bits.

### Parameters

- **red** (number = *0*): The red channel.
- **green** (number = *0*): The green channel.
- **blue** (number = *0*): The blue channel.
- **alpha** (number = *255*): The alpha channel.

### Returns

A frozen object with the following properties:

- **red** (number): The `red` parameter.
- **green** (number): The `green` parameter.
- **blue** (number): The `blue` parameter.
- **alpha** (number): The `alpha` parameter.
- **unitRange** (object): The input color values divided by 255, in the range [0,1].

## texture([data])

A 2D RGBA image for texturing n-gons. Supports 16 and 32-bit input data and generates mipmaps automatically.

Note: Textures with a power-of-two resolution may render faster and support more features than textures that are not a power of two.

### Parameters

- **data** (object): The texture's data:
    - **width** (number = *0*): The width of the image. Must be in the range [0, 32768].
    - **height** (number = *0*): The height of the image. Must be in the range [0, 32768].
    - **pixels** (array | string = *[]*): The texture's pixels. The layout of the data is determimned by the `channels` property, and the encoding of the data is determined by the `encoding` property.
    - **channels** (string = *"rgba:8+8+8+8*): Specifies the layout of the pixel data.
        - Possible values:
            - "rgba:5+5+5+1": Each pixel is a 16-bit integer with 5 bits each for red, green, and blue; and 1 bit for alpha.
            - "rgba:8+8+8+8": Each pixel consists of four consecutive 8-bit values for red, green, blue, and alpha.
    - **encoding** (string = *"none"*): Specifies the encoding of the pixel data.
        - Possible values:
            - "none": The value of the `pixels` property is an array, and its elements are numbers according to the `channels` property.
            - "base64": The value of the `pixels` property is a string representing a Base64-encoded array whose elements are numbers according to the `channels` property.
    - **needsFlip** (boolean = *true*): Whether the input image data should be flipped vertically.

### Returns

An object with the following properties:

- **width** (number): The `data.width` property.
- **height** (number): The `data.height` property.
- **pixels** (array): The decoded, processed pixel data from `data.pixels`. Each element in the array is an object of the form "{red, green, blue, alpha}".
- **mipLevels** (array): Downscaled versions of the original image. Each element in the array is an object of the form "{width, height, pixels: [{red, green, blue, alpha, red, green, ...}]}". The first element is the full-sized image, the second element is half the size of the first, the third half the size of the second, etc., down to an image the size of 1 &times; 1.

### Sample usage

```javascript
// Create a 2-by-2 texture.
const texture = Rngon.texture({
    width: 2,
    height: 2,
    pixels: [
        255, 200, 0, 255,
        200, 255, 0, 255,
        255, 0, 200, 255,
        0, 255, 200, 255
    ],
});
```

```javascript
// Create a texture with the 'data' object loaded from a JSON file.
const texture = await Rngon.texture.load("texture.json");
```

# Authors and credits

The main author of the retro n-gon renderer is the one-man Tarpeeksi Hyvae Soft (see on [GitHub](https://github.com/leikareipa) and the [Web](https://www.tarpeeksihyvaesoft.com)).

On 3D software rendering in general, the aforementioned main author has benefited a good bit from tutorials by Benny Bobaganoosh. You can check out his [YouTube](https://www.youtube.com/playlist?list=PLEETnX-uPtBUbVOok816vTl1K9vV1GgH5) and [GitHub](https://github.com/BennyQBD/3DSoftwareRenderer). The retro n-gon renderer's matrix code ([js/retro-ngon/core/matrix44.js](./js/retro-ngon/core/matrix44.js)) is adapted, with superficial changes, from [Benny's code](https://github.com/BennyQBD/3DSoftwareRenderer/blob/master/src/Matrix4f.java).
