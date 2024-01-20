# API reference for the retro n-gon renderer

## Introduction

The renderer's public API consists of the following components:

| Component           | Brief description                                        |
| ------------------- | -------------------------------------------------------- |
| [color](#color)     | A four-channel RGBA color value.                         |
| [context](#context) | Provides access to render contexts.                      |
| [default](#default) | Provides default arguments for other API components.     |
| [light](#light)     | A light source.                                          |
| [matrix](#matrix)   | A four-by-four matrix.                                   |
| [mesh](#mesh)       | A set of n-gons with shared geometric transformations.   |
| [ngon](#ngon)       | A geometric primitive defined by *n* vertices (*n*-gon). |
| [render](#render)   | Renders n-gonal meshes.                                  |
| [texture](#texture) | A 2D image for texturing n-gons.                         |
| [vector](#vector)   | A three-component vector.                                |
| [version](#version) | Provides the renderer's version.                         |
| [vertex](#vertex)   | One corner of an n-gon.                                  |

The API is available via the `Rngon` namespace after you've imported the renderer's distributable into your application (see [README.md#Installation](/README.md#installation)):

```html
<script src="distributable/rngon.global.js"></script>
<script>
    console.log(Rngon.texture) // f texture(...) ...
</script>
```

<a id="render"></a>

## render({meshes, target, options, pipeline})

Renders n-gonal meshes into a pixel buffer, and optionally displays the image on a \<canvas\>.

(Implemented in [api/render.mjs](/src/api/render.mjs).)

### Parameters

- **target** (HTMLCanvasElement | string | undefined &lArr; *undefined*): Where to display the rendered image. Canvas element; `id` attribute of canvas element; or *undefined* to not display it. In all cases, the image is also accessible via `Rngon.context.default.pixelBuffer` after the call.

- **meshes** (array | undefined &lArr; *undefined*): The [mesh](#mesh) objects to be rendered. If *undefined*, the objects from the previous render call on this render context (see `render::options.context`) will be used.

- **options** (object &lArr; `Rngon.default.render.options`): Additional rendering options.

    - **cameraDirection** ([vector](#vector) &lArr; *vector(0, 0, 0)*): The direction in which the scene is viewed for rendering.

    - **cameraPosition** ([vector](#vector) &lArr; *vector(0, 0, 0)*): The position from which the scene is rendered.

    - **context** (string | number | undefined &lArr; *undefined*): The name of the [context](#context) to use for rendering; or `Rngon.default.context` if *undefined*. A new context by this name will be created and initialized if it doesn't already exist; otherwise the existing context will be reused.

    - **farPlane** (number &lArr; *1000*): Vertices further from the camera will be clipped. See also `render::options.nearPlane`.

    - **fov** (number &lArr; *43*): Field-of-view size.
    
    - **fragments** (undefined | object &lArr; *undefined*): Determines which metadata the fragment buffer (see `render::options.useFragmentBuffer`) will include. You can choose one or more of the following:
        
        - **ngon**: The n-gon (as an [ngon](#ngon) object) whose surface the pixel represents.

        - **shade**: The pixel's lightness level as computed by `render::pipeline.transformClipLighter`, in the range [0,1].
        
        - **textureUScaled**: The texel U coordinate used in rasterizing this pixel, if texturing was enabled. In the range from 0 to the width of the texture.
        
        - **textureVScaled**: The texel V coordinate used in rasterizing this pixel, if texturing was enabled. In the range from 0 to the height of the texture.
        
        - **normalX**: The X coordinate of the pixel's surface normal.
        
        - **normalY**: The Y coordinate of the pixel's surface normal.
        
        - **normalZ**: The Z coordinate of the pixel's surface normal.
        
        - **worldX**: The X coordinate of the pixel's surface in world-space.
        
        - **worldY**: The Y coordinate of the pixel's surface in world-space.
        
        - **worldZ**: The Z coordinate of the pixel's surface in world-space.

        The value of `render::options.fragments` should be an object with one or more of the above keys set to *true* to have the corresponding data property included in the fragment buffer. If the value of `render::options.fragments` is *undefined*, each key will be initialized to the value of `render::options.useFragmentBuffer`, i.e. *true* when a fragment buffer is used and *false* otherwise.

    - **hibernateWhenTargetNotVisible** (boolean &lArr; *true*): Return without rendering if the target canvas is not within the browser's viewport. Ignored if `render::target` is *null*.

    - **lights** (array &lArr; *[]*): An array of [light](#light) objects, representing the scene's light sources. N-gons will be lit according to their `ngon::material.vertexShading` property.

    - **nearPlane** (number &lArr; *1*): Vertices closer to the camera will be clipped. See also `render::options.farPlane`.

    - **resolution** (number | object &lArr; *1*): The resolution of the output image.

        - *number*: The resolution is the size of the \<canvas\> element (according to `window.getComputedStyle`) multiplied by this number.

        - *object*: The resolution is given by the `width` and `height` properties of this object; e.g. {width:640, height:480} for a rendering the size of 640 &times; 480.

        - Note: If `render::target` refers to a \<canvas\>, the browser may scale the display of the output image to fit the \<canvas\> element.

    - **useBackfaceCulling** (boolean &lArr; *false*): Whether to remove back-facing polygons (n-gons with at least 3 vertices) prior to rasterization. See also `ngon::material.isTwoSided` if you want to disable back-face culling for individual n-gons.

    - **useDepthBuffer** (boolean &lArr; *true*): Whether to generate a depth buffer to discard occluded pixels. The depth buffer, if generated, is accessible via `Rngon.context.default.depthBuffer` after the call.

    - **useFragmentBuffer** (boolean &lArr; *false*): Whether to generate a fragment buffer which provides per-pixel metadata (e.g. world XYZ coordinates) to accompany the rasterized image, for use e.g. in pixel shaders. Must be set to *true* if using a pixel shader that accesses the fragment buffer, as otherwise the fragment buffer will be unavailable or stale. The fragment buffer, if generated, is accessible via `Rngon.context.default.fragmentBuffer` after the call. See also `render::options.fragments`.

    - **useFullInterpolation** (boolean = *true*): Whether to apply full perspective correction in property interpolation (e.g. of texture UV coordinates) during rasterization. If set to *false*, artifacts like warping of textures may become evident.

- **pipeline** (object &lArr; `Rngon.default.render.pipeline`): The render pipeline.
    
    - **canvasShader** (function | undefined &lArr; *undefined*): A function that paints the final rendered image onto the target \<canvas\> element. If *undefined*, a default painting routine will be used. Ignored if `render::target` is *undefined*. See [the canvas shader samples](/samples/canvas-shaders/canvas-shaders.js) for examples of usage.
        
        - function canvasShader(canvasContext:CanvasRenderingContext2D, image:ImageData)

            - Paints `image` onto `canvasContext`, e.g. via `canvasContext.putImageData()`. The function can also apply other effects of the CanvasRenderingContext2D API.

            - Returns nothing.
    
    - **ngonSorter** (function | undefined &lArr; `Rngon.default.render.pipeline.ngonSorter`): A function to be called by the renderer to sort the input meshes' n-gons prior to rendering; or disabled if *undefined*. The default behavior is to sort in reverse painter order (on the Z axis, closest first) if `render::options.useDepthBuffer` is *true* and otherwise to do no sorting. See [the default function](/src/default-pipeline/ngon-sorter.mjs) for a sample of usage.
        
        - function ngonSorter(renderContext:[context](#context))
            
            - Sorts the `renderContext.screenSpaceNgons` array in-place.

            - Returns nothing.

    - **pixelShader** (function | undefined &lArr; *undefined*): A function to be called by the renderer at the completion of rasterization to apply pixel-shading effects to the rendered image; or disabled if *undefined*. See [the pixel shader samples](/samples/pixel-shaders/pixel-shaders.js) for examples of usage.
        
        - function pixelShader(renderContext:[context](#context))

            - Modifies the pixel values in `renderContext.pixelBuffer` to produce an effect. The function can also make use of other available metadata in `renderContext`, for example `renderContext.depthBuffer`.

            - Returns nothing.
        
        - If the pixel shader accesses the fragment buffer, `render::options.useFragmentBuffer` must be set to *true*. Use `render::options.fragments` to control the contents of the fragment buffer.
    
    - **rasterizer** (function | null &lArr; `Rngon.default.render.pipeline.rasterizer`): A function to be called by the renderer to rasterize the meshes; or disabled if *null*. See [the default function](/src/default-pipeline/rasterizer.mjs) for a sample of usage.
        
        - function rasterizer(renderContext:[context](#context))
            
            - Rasterizes the n-gons from the `renderContext.screenSpaceNgons` array.

            - Returns nothing.

        - See `render::pipeline.rasterPath` for a lighter-weight option for custom rasterization.
    
    - **rasterPath** (function | undefined &lArr; *undefined*): A function to be called by the default `render::pipeline.rasterizer` to rasterize a polygon (an [ngon](#ngon) with at least 3 vertices). If *undefined*, a suitable default raster path will be used. See [the default polygon raster paths](/src/default-pipeline/raster-paths/polygon/) for examples of usage.
        
        - function rasterPath({renderContext:[context](#context), ngon:[ngon](#ngon), leftEdges:Array, rightEdges:Array, numLeftEdges:Number, numRightEdges:Number})

            - **ngon**: Metadata about the polygon to be rasterized. See `leftEdges` and `rightEdges` for the screen-space shape to be rasterized.

            - **leftEdges**: An array of screen-space edges defining the left-hand side of the polygon. Sorted from lowest Y to highest Y.

            - **rightEdges**: An array of screen-space edges defining the right-hand side of the polygon. Sorted from lowest Y to highest Y.

            - **numLeftEdges**: The first *n* entries in `leftEdges` are relevant.

            - **numRightEdges**: The first *n* entries in `rightEdges` are relevant.

            - Returns *true* if the n-gon was successfully processed; *false* otherwise. If *false* is returned, a suitable default raster path will be used instead.

        - The gist of a typical raster path function is that it rasterizes each horizontal pixel span between the left and right edges, making use of the interpolation parameters provided in the edge objects to decide the color of each pixel.

        - The benefit of implementing a custom raster path instead of a custom rasterizer (`render::pipeline.rasterizer`) is that a raster path doesn't need to decompose the polygon into edges prior to rasterization. If you just want to implement custom rasterization and are happy with the default edge decomposition, a custom raster path is the way to go.
    
    - **surfaceWiper** (function | null &lArr; `Rngon.default.render.pipeline.surfaceWiper`): A function to be called by the renderer to clear the render surface of previous renderings (pixel colors, depth values, etc.); or disabled if *null*. See [the default function](/src/default-pipeline/surface-wiper.mjs) for a sample of usage.
        
        - function surfaceWiper(renderContext:[context](#context))
            
            - Resets the contents of the `renderContext.pixelBuffer`, `renderContext.depthBuffer` and `renderContext.fragmentBuffer` buffers to their initial values.

            - Returns nothing.
    
    - **transformClipLighter** (function | null &lArr; `Rngon.default.render.pipeline.transformClipLighter`): A function to be called by the renderer to transform, clip and light each input meshe; or disabled if *null*. See [the default function](/src/default-pipeline/transform-clip-lighter.mjs) for a sample of usage.
        
        - function transformClipLighter(renderContext:[context](#context), mesh:[mesh](#mesh), cameraMatrix:[matrix](#matrix), perspectiveMatrix:[matrix](#matrix), screenSpaceMatrix:[matrix](#matrix))

            - Copies the n-gons from `mesh` into `renderContext.screenSpaceNgons` and transforms, clips and lights the copies.
    
    - **vertexShader** (function | undefined &lArr; *undefined*): A function to be called by `render::pipeline.transformClipLighter` for each of the scene's n-gons, to apply effects to the properties of the n-gon prior to rasterization; or disabled if *undefined*. The function will be called after world-space transformation and vertex lighting. See [the vertex shader samples](/samples/vertex-shaders/vertex-shaders.js) for examples of usage.
        
        - function vertexShader(ngon:[ngon](#ngon), renderContext:[context](#context))
            
            - **ngon**: The target n-gon, in world-space coordinates and prior to clipping.

            - Returns nothing.

### Returns

An object with the following properties:

- **numNgonsRendered** (number): Total count of n-gons rendered. May be smaller than the number of n-gons originally submitted for rendering, due to visibility culling etc.

- **renderHeight** (number): Height of the output image.

- **renderWidth** (number): Width of the output image.

- **totalRenderTimeMs** (number): Total time it took to complete the render call, in milliseconds.

### Sample usage

```javascript
// Create a mesh out of a quad and render it onto a canvas.

const quad = Rngon.ngon([
    Rngon.vertex(-1, -1, 0),
    Rngon.vertex( 1, -1, 0),
    Rngon.vertex( 1,  1, 0),
    Rngon.vertex(-1,  1, 0)], {
        color: Rngon.color.yellow,
});

const mesh = Rngon.mesh([quad], {
    rotate: Rngon.vector(0, 0, 45)
});

Rngon.render({
    target: "canvas",
    meshes: [mesh],
    options: {
        cameraPosition: Rngon.vector(0, 0, -5),
    },
});
```

<a id="mesh"></a>

## mesh([ngons[, transform]])

A selection of n-gons related to each other in some way, rendered as a unit with shared transformations.

(Implemented in [api/mesh.mjs](/src/api/mesh.mjs).)

### Parameters

- **ngons** (array &lArr; *[ngon()]*): The n-gons that make up the mesh.

- **transform** (object &lArr; `Rngon.default.mesh.transform`): Transformations to the mesh's n-gons, to be applied by the renderer prior to rasterization:

    - **rotate** ([vector](#vector) &lArr; *vector(0, 0, 0)*): Rotation around the origin of (0, 0, 0), in degrees.
         
    - **scale** ([vector](#vector) &lArr; *vector(1, 1, 1)*): Multipliers to XYZ vertex coordinates.

    - **translate** ([vector](#vector) &lArr; *vector(0, 0, 0)*): Delta increments to XYZ vertex coordinates.

    - If both `mesh::transform.translate` and `mesh::transform.rotate` are given, rotation will be applied first.

### Returns

An object with the following properties:

- **$constructor** (string &lArr; *"Mesh"*)

- **ngons** (array): The `mesh::ngons` argument.

- **rotate** ([vector](#vector)): The `mesh::transform.rotate` argument.

- **scale** ([vector](#vector)): The `mesh::transform.scale` argument.

- **translate** ([vector](#vector)): The `mesh::transform.translate` argument.

### Sample usage

```javascript
// Construct a mesh containing one n-gon, and apply scaling to it.
const mesh = Rngon.mesh([ngon], {
    scale: Rngon.vector(10, 15, 5),
});

// Transformations can be edited directly:
mesh.scale.x = 100;
```

<a id="ngon"></a>

## ngon([vertices[, material[, normal]]])

A polygon made up of *n* vertices, also known as an *n*-gon. Single-vertex n-gons are treated as points, and two-vertex n-gons as lines.

(Implemented in [api/ngon.mjs](/src/api/ngon.mjs).)

### Parameters

- **vertices** (array &lArr; *[vertex()]*): The [vertex](#vertex) objects that define the corners of the n-gon. The length of the array must be in the range [1,500].

- **material** (object &lArr; `Rngon.default.ngon.material`): The material properties that define the n-gon's appearance:

    - **allowAlphaBlend** (boolean &lArr; *false*): Whether the alpha channel of the `ngon::material.color` property can modify the appearance of the n-gon. If *true*, the n-gon's pixels will be blended with their background according to the alpha value (0 = fully transparent, 255 = fully opaque).

    - **allowAlphaReject** (boolean &lArr; *false*): Whether the alpha channel of the `ngon::material.color` property can modify the appearance of the n-gon. If *true*, the pixel will be drawn only if the alpha value is 255.

    - **color** ([color](#color) &lArr; *color.white*): Base color. If the `ngon::material.texture` property is *null*, the n-gon will be rendered in this color. Otherwise, the renderer will multiply texel colors by (C / 255), where C is the corresponding channel of the base color.

    - **depthOffset** (number &lArr; *0*): A number by which the depth value of each pixel of this n-gon will be incremented at rasterization. Similar to OpenGL's [glPolygonOffset](https://registry.khronos.org/OpenGL-Refpages/gl4/html/glPolygonOffset.xhtml).

    - **hasWireframe** (boolean &lArr; *false*): Whether the n-gon should be rendered with a wireframe outline. See also `ngon::material.wireframeColor`.

    - **hasFill** (boolean &lArr; *true*): Whether the face of the n-gon should be rendered. If *false* and `ngon::material.hasWireframe` is *true*, the n-gon's wireframe outline will be rendered.

    - **isTwoSided** (boolean &lArr; *false*): Whether the n-gon should be visible from behind, as determined by the direction of its face normal. Has no effect if `render::options.useBackfaceCulling` is *false*.

    - **isInScreenSpace** (boolean &lArr; *false*): Whether the XY coordinates of the n-gon's vertices are in screen space. If they are, the renderer won't transform them into screen space nor clip them against the edges of the image before rasterization. If *true*, you must ensure that all vertex XY coordinates are integers that lie within the boundaries of the image.

    - **renderVertexShade** (boolean &lArr; *true*): Whether the shading values calculated as per the `ngon::material.vertexShading` property should be used during rendering. If *false*, this shading information won't directly affect the rendered image, but is accessible to pixel shaders.

    - **texture** ([texture](#texture) | undefined &lArr; *undefined*): The image to be rendered onto the n-gon's face. If *undefined*, or if there are fewer than 3 vertices, the n-gon will be rendered without a texture.

    - **textureMapping** (string &lArr; *"ortho"*): The method by which `ngon::material.texture` should be mapped onto the n-gon's face:

        - "ortho": Map by automatically-generated UV coordinates in 2D screen space. Disregards perspective and rotation. UV coordinates provided by the n-gon's [vertex](#vertex) objects are ignored.

        - "affine": Affine texture-mapping using the UV coordinates provided by the n-gon's [vertex](#vertex) objects. For perspective-correct affine mapping, also enable the `render::options.useFullInterpolation` property.

    - **textureFiltering** (string &lArr; *"none"*): The filtering effect to be applied when rasterizing `ngon::material.texture`:

        - "none": No filtering. The texture will appear pixelated when viewed up close.

        - "dither": Jittering of texel coordinates to approximate bilinear filtering.

    - **uvWrapping** (string &lArr; *"repeat"*): How the renderer should scale UV coordinates:

        - "clamp": Clamp UV coordinates to [0,1].

        - "repeat": Discard UV coordinates' integer part. This option is available only for power-of-two textures; others will fall back to "clamp".

    - **vertexShading** (string &lArr; *"none"*): How the scene's light sources should affect the appearance of the n-gon:

        - "none": Light sources don't affect the appearance of the n-gon.

        - "flat": The n-gon's face receives a solid shade based on the angle between the incident light and the n-gon's face normal.
        
        - "gouraud": Same as "flat" but computed per vertex, resulting in smooth shading across the n-gon's face. For this to work, n-gons must have pre-computed smooth vertex normals.

    - **wireframeColor** ([color](#color) &lArr; *color.black*): If `ngon::material.hasWireframe` is *true*, this value sets the wireframe's color.

- **normal** (array | [vector](#vector) &lArr; *vector(0, 1, 0)*): A vector determining the orientation of the n-gon's face. If given as a [vector](#vector) object, represents the face normal. If given as an array, each element must be a [vector](#vector) object that represents the normal of the corresponding vertex in the `ngon::vertices` parameter, and in this case the n-gon's face normal will be automatically calculated as the normalized average of these vertex normals.

### Returns

An object with the following properties:

- **$constructor** (string &lArr; *"Ngon"*)

- **material** (object): The value of the `ngon::material` argument.

- **normal** ([vector](#vector)): The face normal.

- **vertexNormals** (array): For each element in the `ngon::vertices` array, a corresponding [vector](#vector) object representing the normal of the vertex.

- **vertices** (array): The value of the `ngon::vertices` argument.

### Utilities

<a id="ngon.clip_to_viewport"></a>

#### ngon.clip_to_viewport(ngon:[ngon](#ngon))

Clips the vertices of `ngon` against the sides of the viewport. Assumes that the vertices are in clip space.

<a id="ngon.perspective_divide"></a>

#### ngon.perspective_divide(ngon:[ngon](#ngon))

Applies perspective division to the X and Y components of the vertices of `ngon`. Assumes that the vertices are in screen space.

<a id="ngon.transform"></a>

#### ngon.transform(ngon:[ngon](#ngon), matrix:[matrix](#matrix))

Transforms the vertices of `ngon` by `matrix`.

### Sample usage

```javascript
// Construct a red line.
const line = Rngon.ngon([
    Rngon.vertex(-1, -1, 0),
    Rngon.vertex( 1, -1, 0)], {
        color: Rngon.color.red,
});
```

<a id="vertex"></a>

## vertex([x[, y[, z[, u[, v]]]]])

A point in space representing a corner of an n-gon.

Note: In the renderer's coordinate space, X is horizontal (positive = right), and Y is vertical (positive = up); positive Z is forward.

(Implemented in [api/vertex.mjs](/src/api/vertex.mjs).)

### Parameters

- **x** (number &lArr; *0*): The X coordinate.

- **y** (number &lArr; *0*): The Y coordinate.

- **z** (number &lArr; *0*): The Z coordinate.

- **u** (number &lArr; *0*): The U texel coordinate.

- **v** (number &lArr; *0*): The V texel coordinate.

### Returns

An object with the following properties:

- **$constructor** (string &lArr; *"Vertex"*)

- **shade** (number): A positive number defining the vertex's degree of shade, with 0 being fully unlit, 0.5 half lit, and 1 fully lit. The value is computed at render-time.

- **u** (number): The `vertex::u` argument.

- **v** (number): The `vertex::v` argument.

- **x** (number): The `vertex::x` argument.

- **y** (number): The `vertex::y` argument.

- **z** (number): The `vertex::z` argument.

### Utilities

<a id="vertex.transform"></a>

#### vertex.transform(vertex:[vertex](#vertex), matrix:[matrix](#matrix))

Transforms `vertex` by `matrix`.

<a id="matrix"></a>

## matrix(...data)

A four-by-four matrix.

(Implemented in [matrix.mjs](/src/api/matrix.mjs).)

### Parameters

- **...data** (list of numbers &lArr; `...matrix.identity.data`): The 16 values of the matrix, row by row.

### Returns

- **$constructor** (string &lArr; *"Matrix"*) 

- **data** (array): The values of the `matrix::...data` argument as an array.

### Utilities

<a id="matrix.identity"></a>

#### matrix.identity()

Constructs and returns a [matrix](#matrix) object representing an identity matrix:

```javascript
Matrix(
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,
);
```

<a id="matrix.multiply"></a>

#### matrix.multiply(a:[matrix](#matrix), b:[matrix](#matrix))

Constructs and returns a [matrix](#matrix) representing the multiplication of `a` by `b`.

<a id="matrix.rotating"></a>

#### matrix.rotating(x:number, y:number, z:number)

Constructs and returns a [matrix](#matrix) for rotating a vector by `x`, `y` and `z` in the corresponding XYZ axes. The arguments are given in degrees.

<a id="matrix.scaling"></a>

#### matrix.scaling(x:number, y:number, z:number)

Constructs and returns a [matrix](#matrix) for scaling a vector by `x`, `y` and `z` in the corresponding XYZ axes.

<a id="matrix.translating"></a>

#### matrix.translating(x:number, y:number, z:number)

Constructs and returns a [matrix](#matrix) for translating a vector by `x`, `y` and `z` in the corresponding XYZ axes.

### Sample usage

```javascript
const scalingMatrix = Rngon.matrix.scaling(2, 2, 1)
const vector = Rngon.vector(1, 1, 1);
Rngon.vector.transform(vector, scalingMatrix);

console.log(vector) // {x: 2, y: 2, z: 1}
```

<a id="light"></a>

## light([x[, y[, z[, options]]]])

A light source.

(Implemented in [api/light.mjs](/src/api/light.mjs).)

### See also

- *[render](#render)::options.lights*
- *[ngon](#ngon)::material.vertexShading*
- *[ngon](#ngon)::material.renderVertexShade*

### Parameters

- **x** (number &lArr; *0*): The X coordinate of the light's position in world space.

- **y** (number &lArr; *0*): The Y coordinate of the light's position in world space.

- **z** (number &lArr; *0*): The Z coordinate of the light's position in world space.

- **options** (object &lArr; *{}*): Additional metadata about the light source:

    - **intensity** (number): The light's luminosity. Higher values result in brighter light.

    All properties included in `light::options` are exposed in the return value.

### Returns

An object with the following properties:

- **$constructor** (string &lArr; *"Light"*)

- **x** (number): The `light::x` argument.

- **y** (number): The `light::y` argument.

- **z** (number): The `light::z` argument.

- **...options**: A spread of the `light::options` argument.

### Sample usage

```javascript
const line = Rngon.ngon([
    Rngon.vertex(0, 0),
    Rngon.vertex(1, 0)], {
        vertexShading: "gouraud",
});

Rngon.render({
    meshes: [Rngon.mesh([line])],
    options: {
        lights: [Rngon.light(4, 4, 4, {intensity: 100})],
    },
});
```

<a id="vector"></a>

## vector([x[, y[, z]]])

A three-component vector.

(Implemented in [api/vector.mjs](/src/api/vector.mjs).)

### Parameters

- **x** (number &lArr; *0*): The X coordinate.

- **y** (number &lArr; *0*): The Y coordinate.

- **z** (number &lArr; *0*): The Z coordinate.

### Returns

An object with the following properties:

- **$constructor** (string &lArr; *"Vector"*) 

- **x** (number): The `vector::x` argument.

- **y** (number): The `vector::y` argument.

- **z** (number): The `vector::z` argument.

### Utilities

<a id="vector.cross"></a>

#### vector.cross(a:[vector](#vector), b:[vector](#vector))

Returns the cross product between `a` and `b`.

<a id="vector.dot"></a>

#### vector.dot(a:[vector](#vector), b:[vector](#vector))

Returns the dot product between `a` and `b`.

<a id="vector.normalize"></a>

#### vector.normalize(a:[vector](#vector))

Normalizes `a`.

<a id="vector.transform"></a>

#### vector.transform(vector:[vector](#vector), matrix:[matrix](#matrix))

Transforms `vector` by `matrix`.

<a id="context"></a>

## context

An object that contains all render contexts created by calls to [render()](#render).

An individual render context holds the internal state and data for a particular call to [render()](#render), including but not limited to scene geometry, lights, and render pipeline configuration. For a full list of the properties in a render context, see [api/context.mjs](/src/api/context.mjs)

(Implemented in [api/context.mjs](/src/api/context.mjs).)

### See also

- *[render](#render)::options.context*

### Sample usage

```javascript
Rngon.render({
    options: {
        context: "hello",
        resolution: {
            width: 600,
            height: 600,
        },
    },
});

console.log(Rngon.context["hello"].pixelBuffer); // ImageData {width: 600, ...}
```

<a id="default"></a>

## default

An object that provides default arguments for other API components.

(Implemented in [api/default.mjs](/src/api/default.mjs).)

### Sample usage

```javascript
console.log(Rngon.default.texture.channels) // "rgba:8+8+8+8"
console.log(Rngon.texture().channels) // "rgba:8+8+8+8"

Rngon.default.texture.channels = "rgba:5+5+5+1";
console.log(Rngon.texture().channels) // "rgba:5+5+5+1"
```

<a id="version"></a>

## version

An object that provides the renderer's version.

(Implemented in [main.mjs](/src/main.mjs).)

### Properties

- **isProductionBuild** (boolean): Whether the renderer's distributable was built without debugging support.

- **major** (number): Major version.

- **minor** (number): Minor version.

### Sample usage

```javascript
if (MyApp.isInProduction && !Rngon.version.isProductionBuild) {
    window.alert("wat");
}
```

<a id="color"></a>

## color([red[, green[, blue[, alpha]]]])

Four-channel RGBA color, with channel values in the range [0, 255].

(Implemented in [api/color.mjs](/src/api/color.mjs).)

### Parameters

- **red** (number &lArr; *0*): The red channel.

- **green** (number &lArr; *0*): The green channel.

- **blue** (number &lArr; *0*): The blue channel.

- **alpha** (number &lArr; *255*): The alpha channel.

### Returns

An object with the following properties:

- **$constructor** (string &lArr; *"Color"*)

- **alpha** (number): The `color::alpha` argument.

- **blue** (number): The `color::blue` argument.

- **green** (number): The `color::green` argument.

- **red** (number): The `color::red` argument.

### Utilities

<a id="color.colorname"></a>

#### color.\<colorname\>

Pre-defined [color](#color) objects corresponding to named web colors.

See e.g. https://developer.mozilla.org/en-US/docs/Web/CSS/named-color for a list of supported color names.

### Sample usage

```javascript
// A fully opaque yellow color.
const color = Rngon.color(255, 255, 0);

// A fully opaque yellow color using web color names.
const color = Rngon.color.yellow;
```

<a id="texture"></a>

## texture([data])

A 2D RGBA image for texturing n-gons. Supports 1, 16, and 32-bit input data and generates mipmaps automatically.

Note: Textures with a power-of-two resolution may render faster and support more features than textures that are not a power of two.

(Implemented in [api/texture.mjs](/src/api/texture.mjs).)

### Parameters

- **data** (object &lArr; `Rngon.default.texture`): The texture's data.

    - **channels** (string &lArr; *"rgba:8+8+8+8"*): Specifies the data layout of `texture::data.pixels`:

        - "binary": Each element is an 8-bit binary value, either 0 (black/transparent) or 1 (white/opaque). One element per pixel.
        
            - `texture::data.encoding` must be "base64".

        - "rgba:5+5+5+1": Each element is a 16-bit unsigned integer with 5 bits each for red, green, and blue; and 1 bit for alpha. One element per pixel.
        
            - `texture::data.encoding` must be "base64".

        - "rgba:8+8+8+8": Each element is an 8-bit unsigned integer. Four elements per pixel.

    - **encoding** (string &lArr; *"none"*): Specifies the encoding of `texture::data.pixels`:

        - "none": The value of `texture::data.pixels` is an array.

            - `texture::data.channels` must be "rgba:8+8+8+8".

        - "base64": The value of the `texture::data.pixels` property is a string representing a Base64-encoded array whose elements are numbers according to the `texture::data.channels` property.

    - **height** (number &lArr; *1*): The height of the image. See also `texture::data.width`.

    - **pixels** (array | string | undefined &lArr; *undefined*): The texture's pixels. The layout of the data is determined by the `data.channels` property, and the encoding of the data is determined by the `texture::data.encoding` property. If *undefined*, will be initialized to an empty array of size **width** * **height** * 4.

    - **width** (number &lArr; *1*): The width of the image. See also `texture::data.height`.

### Returns

An object with the following properties:

- **$constructor** (string &lArr; *"Texture"*)

- **height** (number): The `texture::data.height` argument.

- **mipLevels** (array): Progressively downscaled versions of the base image. Each element in the array is an object of the form "{width, height, pixels: [red, green, blue, alpha, red, green, blue, ...]}". The first element is the full-sized image, the second element is half the size of the first, the third half the size of the second, etc., down to an image the size of 1 &times; 1.

- **pixels** (Uint8ClampedArray): The decoded pixel data from `texture::data.pixels`, as consecutive RGBA values ([red, green, blue, alpha, red, green, blue, ...]). If you modify this array, call `regenerate_mipmaps()` to update the mip levels.

- **regenerate_mipmaps** (function): Rebuilds the texture's mip levels from the `texture::pixels` array.

- **width** (number): The `texture::data.width` argument.

### Utilities

<a id="texture.load"></a>

#### texture.load(filename:string)

Constructs a [texture](#texture) using `texture::data` loaded asynchronously from a JSON file. Returns a Promise that resolves with the texture object.

### Sample usage

```javascript
// Create a 2-by-2 texture.
const texture = Rngon.texture({
    width: 2,
    height: 2,
    pixels: [
        255, 200, 0,   255,
        200, 255, 0,   255,
        255, 0,   200, 255,
        0,   255, 200, 255
    ],
});

// Change the color of the first pixel.
texture.pixels[0] = 100;
texture.regenerate_mipmaps();
```

```javascript
// Create a texture with the 'data' argument loaded from a JSON file.
const texture = await Rngon.texture.load("texture.json");

// The contents of the texture.json file could be something like this:
{
    "width": 2,
    "height": 2,
    "pixels": [
        255, 200, 0,   255,
        200, 255, 0,   255,
        255, 0,   200, 255,
        0,   255, 200, 255
    ]
}
```
