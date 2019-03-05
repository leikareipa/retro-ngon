# The retro n-gon renderer
A minimalist 3d software renderer that draws n-sided polygons (as well as lines and points) onto a user-supplied HTML5 canvas. Its intended use cases are chiefly those where a minimalist retro aesthetic is preferred.

You can view a live sample of the renderer's output at [http://tarpeeksihyvaesoft.com/s/retro-ngon/samples/sample2.html](http://tarpeeksihyvaesoft.com/s/retro-ngon/samples/sample2.html).

### Features
- Simple to use
- Genuine retro aesthetics
- Natively renders convex n-sided polygons
- Vanilla JavaScript, no dependencies
- Data immutability

![A textured cube](/images/painting-cube.png)

### Suggested use cases
The retro n-gon renderer is not intended as a general-purpose software 3d renderer. It omits several modern features &ndash; more of which elsewhere in this document &ndash; in favor of a legit retro look and feel. I've made a number of other open-source software renderers, some of which might fit your needs or interests better:
- [Wray](https://github.com/leikareipa/wray/) for path tracing in JavaScript
- [RallySportED](https://github.com/leikareipa/rallysported-diverse/)'s renderer in C++ with Qt and Win32 API as frontends (also w/ support for OpenGL and Glide)
- [Vond](https://github.com/leikareipa/vond/), a low-res hybrid voxel/polygon software renderer in C++
- [dccb](https://github.com/leikareipa/dccb/)'s is a simple software renderer in C for 16-bit DOS

The retro n-gon renderer encourages very low resolutions, very low polycounts, and designing your way around considerable visual limitations &ndash; like in the old days of software rendering. You might use the renderer for some of the following purposes:
- Engagement in feature minimalism
- Retro 3d games with sparse, simple environments (e.g. an Asteroids clone)
- Visualizing 3d models in a wobbly, old-fashioned manner

# How to use the renderer
In this section, you'll find both practical and theoretical examples on how to use the retro n-gon renderer.

### Introduction and intro tutorial

**The gist of it in theory.** At the heart of the renderer is the `render()` function, which transforms and rasterizes a set of n-gons onto a HTML5 canvas. You call it with the HTML id of the canvas you want the image rendered into, an array of the n-gon meshes you want rendered, and additional, optional parameters to define the position of the camera, etc.

The following pseudocode outlines the basic program flow for rendering an n-gon onto a canvas element. (In practice, you'll render n-gons in batches rather than one by one, but let's just do one, here, for the sake of the example.)
```
// Create the canvas element to render into.
<canvas id="render-target" style="width: 100px; height: 100px;"></canvas>

// Create the n-gon, and wrap it in a mesh for rendering.
ngon = Rngon.ngon(...)
mesh = Rngon.mesh([ngon])

// Render the n-gon mesh onto the canvas.
Rngon.render("render-target", [mesh], {options})
```

**Actually rendering a quad.** The following code first constructs a HTML5 canvas element to render into, using CSS to set the size of the rendering to 300 x 300 pixels. It then creates an n-gon quad (i.e. a 4-gon), wraps it up in a mesh, and asks the renderer to draw the mesh onto the canvas. Note also that the mesh is given a 45-degree rotation, the renderer's camera is moved back by 5 units, and the quad is colored blue.
```
<canvas id="canvas" style="width: 300px; height: 300px; background-color: rgba(0, 0, 0, .05);"></canvas>
<script src="./distributable/rngon.cat.js"></script>
<script>
    const quad = Rngon.ngon([Rngon.vertex(-1, -1, 0),
                             Rngon.vertex( 1, -1, 0),
                             Rngon.vertex( 1,  1, 0),
                             Rngon.vertex(-1,  1, 0)],
                            {
                                color: Rngon.color_rgba(0, 150, 255)
                            })

    const quadMesh = Rngon.mesh([quad],
                                {
                                    rotation: Rngon.rotation_vector(0, 0, 45)
                                })

    Rngon.render("canvas", [quadMesh],
                 {
                     cameraPosition: Rngon.translation_vector(0, 0, 5),
                     scale: 1
                 })
</script>
```
![A blue quad](images/tutorials/blue-quad.png)

**Rendering a textured quad.** Textures are a staple of 3d rendering, so let's add one. The code below is otherwise the same as above, but additionally creates a `texture` object and appends it to the quad's material property. You'll learn more about textures later in this document, but for right now, the details don't need worrying about. Just know that this is roughly how textures are added to n-gons. Since the base color of an n-gon also modifies the color of its texture, we set the color to white instead of blue, as we don't want the texture to be tinted blue, here.
```
<canvas id="canvas" style="width: 300px; height: 300px; background-color: rgba(0, 0, 0, .05);"></canvas>
<script src="./distributable/rngon.cat.js"></script>
<script>
    const texture = Rngon.texture_rgba({width: 2, height: 2, pixels: [255, 200, 0, 255,
                                                                      200, 255, 0, 255,
                                                                      255, 0, 200, 255,
                                                                      0, 255, 200, 255]})

    const quad = Rngon.ngon([Rngon.vertex(-1, -1, 0),
                             Rngon.vertex( 1, -1, 0),
                             Rngon.vertex( 1,  1, 0),
                             Rngon.vertex(-1,  1, 0)],
                            {
                                color: Rngon.color_rgba(255, 255, 255),
                                texture: texture
                            })

    const quadMesh = Rngon.mesh([quad],
                                {
                                    rotation: Rngon.rotation_vector(0, 0, 45)
                                })

    Rngon.render("canvas", [quadMesh],
                 {
                     cameraPosition: Rngon.translation_vector(0, 0, 5),
                     scale: 1
                 })
</script>
```
![A textured quad](images/tutorials/textured-quad.png)

You might notice that the texture hasn't rotated with the quad: its lines are perpendicular to the horizon, while the quad's run diagonally, having been rotated by 45 degrees. This is an artefact of the renderer's default texture-mapping mode. You can learn more about the texturing modes further down, but for now, we can fix this by choosing a more suitable mode.

The code below modifies the `quad` object given above to add UV texture coordinates to the quad's vertices, and the `affine` texture-mapping mode to the quad's material property. With these changes, the renderer will rotate the texture in sync with the quad.
```
    const quad = Rngon.ngon([Rngon.vertex(-1, -1, 0, 0, 0),
                             Rngon.vertex( 1, -1, 0, 1, 0),
                             Rngon.vertex( 1,  1, 0, 1, 1),
                             Rngon.vertex(-1,  1, 0, 0, 1)],
                            {
                                color: Rngon.color_rgba(255, 255, 255),
                                texture: texture,
                                textureMapping: "affine"
                            })
```
![A textured quad with affine mapping](images/tutorials/textured-quad-affine.png)

**Giving the quad a spin.** With a few simple additions, we can modify the code so far to add a spinning animation to the quad. We'll do this by repeatedly calling `render()` in sync with the device's refresh rate via `window.requestAnimationFrame()`, and for each frame wrapping the quad in a new mesh with a slightly increased rotation value. (The retro n-gon renderer favors immutable data, which is why we're creating the mesh object from scratch each frame, rather than modifying the rotation of an existing mesh.)
```
<canvas id="canvas" style="width: 300px; height: 300px; background-color: rgba(0, 0, 0, .05);"></canvas>
<script src="./distributable/rngon.cat.js"></script>
<script>
    const texture = Rngon.texture_rgba({width: 2, height: 2, pixels: [255, 200, 0, 255,
                                                                      200, 255, 0, 255,
                                                                      255, 0, 200, 255,
                                                                      0, 255, 200, 255]})

    const quad = Rngon.ngon([Rngon.vertex(-1, -1, 0, 0, 0),
                             Rngon.vertex( 1, -1, 0, 1, 0),
                             Rngon.vertex( 1,  1, 0, 1, 1),
                             Rngon.vertex(-1,  1, 0, 0, 1)],
                            {
                                color: Rngon.color_rgba(255, 255, 255),
                                texture: texture,
                                textureMapping: "affine"
                            })

    const rotatingQuad = (frameCount)=>
    {
        const rotationSpeed = 0.6;
        return Rngon.mesh([quad],
                          {
                              rotation: Rngon.rotation_vector(0, 0, 45 + (frameCount * rotationSpeed))
                          });
    };

    (function render_loop(frameCount = 0)
    {
        Rngon.render("canvas", [rotatingQuad(frameCount)],
        {
            cameraPosition: Rngon.translation_vector(0, 0, 5),
            scale: 1
        })

        window.requestAnimationFrame(()=>render_loop(frameCount + 1));
    })();
</script>
```

**Adding pixelation.** In the examples above, the renderer's pixel size is 1:1 with the output resolution, so there is no visible pixelation that one might expect from a retro style. Not to worry, though, as the degree of pixelation can be controlled via the `scale` property provided to `render()`. What happens if we set it to, say, 0.14?
```
Rngon.render("canvas", [rotatingQuad(frameCount)],
             {
                 cameraPosition: Rngon.translation_vector(0, 0, 5),
                 scale: 0.14
             })
```
![A textured quad with blurry upscaling](images/tutorials/textured-quad-upscaled-blurry.png)
![A textured quad with pixelated upscaling](images/tutorials/textured-quad-upscaled-pixelated.png)

Setting the `scale` property to a value less than 1 causes the pixel size to be upscaled by the inverse of the property's value &ndash; in this case, by 1 / 0.14 &asymp; 7. In other words, you get chunky pixels, while the display size remains the same.

One thing to be aware of is that, under the hood, the upscaling is done by the browser and not by the retro n-gon renderer. This will typically result in a blurry image, as you see on the left. To have the browser upscale without blur, add `image-rendering: pixelated` to the canvas's CSS:
```
<canvas id="canvas" style="width: 300px;
                           height: 300px;
                           background-color: rgba(0, 0, 0, .05);
                           image-rendering: pixelated;"></canvas>
```

This will result &ndash; with certain browsers, like Chrome &ndash; in the clean upscaling you see in the second image, above. Not all browsers, especially older versions of them, support this syntax, however, and may require one of the following variations:
```
image-rendering: -moz-crisp-edges;    /* For Firefox*/
image-rendering: -o-crisp-edges;      /* For Opera*/
image-rendering: -webkit-crisp-edges; /* For Safari*/
```

**More examples.** The [samples/](samples/) directory collects together various examples of the renderer's usage.

An introductory example is given in [samples/sample1.html](samples/sample1.html). Its source code walks you through a basic setup for rendering a spinning triangle on screen.

A slightly more complex example is provided in [samples/sample2.html](samples/sample2.html). It loads a simple, Blender-exported, textured cube model from file, and renders it on screen. Note that, on Chrome and possibly some other browsers, the HTML file needs to be accessed via a server rather than opened directly from disk, due to its usage of the Fetch API. To get around this, you can, for instance, set up a local dev server with `$ php -S localhost:8000`, and load up the HTML file via localhost.

### Creating and rendering 3d models
**N-gons.** The building-block of 3d models in the retro n-gon renderer is the n-gon. It's a polygon of _n_ sides (_n_-gon), or a line (2-gon), or a single point (1-gon). An n-gon is made up of one or more vertices, and a material that describes how the n-gon should look when rendered (its color, texture, and so on).

A red triangle, for instance, could be created like so:
```
const ngon = Rngon.ngon([Rngon.vertex(0, 0, 0),
                         Rngon.vertex(1, 0, 0),
                         Rngon.vertex(1, 1, 0)],
                        {
                            color: Rngon.color_rgba(255, 0, 0),
                        })
```
Here, we define the three vertices of the triangle, and specify the `color` property of its material. Note that the vertices are passed as an array that can include an arbitrary number of them &ndash; three to make a triangle, four to make a quad, and so on.

The following are valid properties of an n-gon's material, and the valid values of each property, separated by the | symbol:
```
{
    color: Rngon.color_rgba(...)
    texture: Rngon.texture_rgba(...)
    textureMapping: "ortho" | "affine"
    hasSolidFill: true | false
    hasWireframe: true | false
    wireframeColor: Rngon.color_rgba(...)
}
```

The `color` property sets the n-gon's base color. If the n-gon has no texture, its entire face will be rendered with the base color. If it has a texture, the colors of the texture will be modulated by the base color.

The `texture` property sets the n-gon's texture. You can read more about texturing further down this document.

The `textureMapping` property defines how textures should be mapped onto the n-gon's face. You can read more about texturing further down this document.

The `hasSolidFill` property determines whether the face of the n-gon will be rendered. If this is set to false, and the n-gon has no wireframe, it will be invisible.

The `hasWireframe` property determines whether a line should be drawn around the n-gon's face.

The `wireframeColor` property sets the color of the n-gon's wireframe. Note that if `hasWireframe` is false, no wireframe will be drawn, regardless of its color.

**Meshes.** To render n-gons, you first wrap them in a mesh. Meshes are collections of n-gons that share a purpose; for instance, the n-gons that make up a model of a spoon. A mesh thus consists of an array one or more n-gons, and a particular set of 3d transformations that affect the mesh's n-gons in unison.

A mesh containing one triangle rotated by 45 degrees and moved by 11 units along an axis could be created like so:
```
const triangle = Rngon.ngon([Rngon.vertex(0, 0, 0),
                             Rngon.vertex(1, 0, 0),
                             Rngon.vertex(1, 1, 0)])

const mesh = Rngon.mesh([triangle],
                        {
                            rotation: Rngon.rotation_vector(45, 0, 0),
                            translation: Rngon.translation_vector(11, 0, 0),
                        })
```

The following are valid properties of a mesh's set of transformations, and the valid values of each property:
```
{
    rotation: Rngon.rotation_vector(...)
    translation: Rngon.translation_vector(...)
    scaling: Rngon.scaling_vector(...)
}
```
The `rotation` property sets the amount, in degrees between 0 and 359, of rotation of the mesh's n-gons along each of the three axes.

The `translation` property moves the mesh's n-gons to the given location. This is in addition to the n-gons' local coordinates; such that if an n-gon's vertex is located at x = 10, and you translate the n-gon's mesh by 10 on x, that vertex's new location will be x = 20.

The `scaling` property scales each of the mesh's n-gons by the given amount along each of the three axes.

If both translation and rotation are defined, the rotation will be applied first.

**Models.** Meshes and n-gons are the retro n-gon renderer's native objects. Models, on the other hand, are an interface between these native objects and external 3d assets that are in a format that the renderer can't directly interact with.

For instance, if you create a 3d scene in Blender and save it into a file in Blender's format, the retro n-gon renderer can do nothing with that file, because it doesn't understand the format that the contents are in. But if you export the scene from Blender using the retro n-gon renderer's own Blender export script (more of which below), you get a model: a JavaScript file whose code, after some processing (loading textures from disk, etc.), returns an array of n-gons corresponding to the original scene's polygons. The retro n-gon renderer can then render those n-gons as usual.

If that seems vague, don't dwell on it too much, because you don't really need a theoretical conceptualization of it to make use of it. What's important to know is that when you export a Blender scene using the retro n-gon renderer's exporter, you end up with a file that defines a JavaScript object. That object might be called `scene`, for instance; and it provides a function, `ngons()`. When you call `scene.ngons()`, you get an array of n-gons, which you can wrap in a mesh and render as you would any other n-gon mesh.

**Exporting 3d scenes from Blender.** You can use the free 3d modeling program, Blender, to create 3d assets directly for the retro n-gon renderer.

A script for exporting scenes from Blender into the renderer's model format is provided under [tools/conversion/](tools/conversion/). To use it, first create the scene in Blender (or import it into Blender from some other format), then load up and run the script. Note that, at the moment, the script isn't integrated into Blender's UI, and is overall a very early version, so you'll have to manually edit it to provide a custom filename and path for the exported data. Otherwise, just look at the script's contents to see where it exports to, by default.

Only a subset of Blender's operations are supported, at this time. The export script will export for each n-gon in Blender its vertices, diffuse color (modulated by its diffuse intensity), and, if any, the filename of the texture image in the polygon's first material slot (the image must be in PNG format). Note that you should apply any of Blender's transformations, like translation and rotation, before running the script. Otherwise, those operations may be ignored in the exported data.

The exporter ignores UV coordinates and normals. (For more info on texturing, see the sections, below.)

Since the retro n-gon renderer deals with n-gons natively, you don't need to pre-triangulate the meshes in Blender. It's in fact better if you don't, since triangulation will increase the number of polygons, and thus slow down the rendering. An exception is if you have concave polygons, as these aren't supported by the renderer, and will need to be triangulated before exporting.

As the renderer uses per-face depth-sorting, it's a good idea to subdivide large polygons before exporting them. For instance, if you have a statue consisting of several small polygons stood on a floor made up of a single large polygon, the floor will likely obscure the statue during rendering, even when viewed from angles where it shouldn't. This is because depth information is averaged across the entire polygon, causing large polygons to have poor depth resolution. On the other hand, it's good to keep in mind that subdivision can cause issues with texturing (see below for more info on this) and negatively impact rendering speed. It's a bit of a balancing act.

**Texturing.** Each n-gon can have one texture applied to it. Practical examples of basic texturing were given earlier in this document, but further details are provided in this section.

To apply a texture to an n-gon, assign it as the n-gon's `texture` material property:
```
const someTexture = Rngon.texture_rgba(...)

const ngon = Rngon.ngon([...],
                        {
                            texture: someTexture
                        })
```

By default, you don't need to provide UV coordinates for the n-gon's vertices for texturing to work. The texture will be mapped onto the n-gon's face disregarding its orientation, so no UV are needed. Depending on the n-gon's orientation, this mapping can result in texture-warping, however, as shown below.

![A textured quad with ortho mapping](images/tutorials/ortho-mapping-straight.png) ![A textured quad with ortho mapping, rotated](images/tutorials/ortho-mapping.png)

The texture-mapping mode can be changed via the n-gon's `textureMapping` material property, which by default is `ortho` and behaves as described above. The second mode is `affine` &ndash; it requires UV coordinates, but will eliminate texture warp in many cases. In the two images, below, `ortho` mapping is shown on the left, and `affine` mapping on the right.

![A textured quad with ortho mapping](images/tutorials/ortho-mapping.png) ![A textured quad with affine mapping](images/tutorials/affine-mapping.png)

The difference in performance between `ortho` and `affine` mapping should be negligible, but you can test for your target platforms using [tests/performance/perftest1.html](tests/performance/perftest1.html).

The texture for an n-gon's material is created using the `texture_rgba()` function. It takes as input an object specifying the texture's width, height, pixel data, and certain optional properties. The following code creates a red 1 x 1 texture:
```
const texture = Rngon.texture_rgba({width:1,
                                    height:1,
                                    pixels:[255, 0, 0, 0]})
```

In this example, the `pixels` property is an array of raw 8-bit color values, four per pixel for RGBA. Note that the retro n-gon renderer's alpha is either fully opaque (255) or fully transparent (any value but 255); there is no intermediate blending.

The texture's pixel data can also be provided as a Base64-encoded string, with 16 bits per pixel (5 bits for RGB each and 1 bit for alpha). The same example as above but with Base64-encoded pixel data would be like so:
```
const texture = Rngon.texture_rgba({width:1,
                                    height:1,
                                    channels:"rgba:5+5+5+1",
                                    encoding:"base64",
                                    pixels:"H4A="})
```

When using Base64-encoded pixel data, the `encoding` property must be set to "base64". The `channels` property must be "rgba:5+5+5+1".

The benefit of using Base64 encoding &ndash; in tandem with 16-bit color &ndash; is a notable reduction in file size. The reduced color depth causes some degradation in color fidelity, true, but given the renderer's low fidelity overall (low resolutions and polycounts), it's likely not going be visually disruptive in many cases.

A simple-to-use PHP script for converting PNG images into a compatible Base64-encoded JSON format is provided under [tools/conversion/](tools/conversion/).

A texture can also be created directly from a JSON file, by using the `texture_rgba.create_with_data_from_file()` function. It returns a Promise of a `texture_rgba` object, resolved once the file has been loaded and the object created. The following code creates a texture from a JSON file:
```
(async ()=>
{
    const texture = await Rngon.texture_rgba.create_with_data_from_file("file.json");

    // Safe to use the texture here, it's finished loading.
})()
```

Where the JSON file's contents might be like so:
```
{
    "width":1,
    "height":1,
    "channels":"rgba:5+5+5+1",
    "encoding":"base64",
    "pixels":"H4A="
}
```

# Performance
As suggested in the sections, above, the retro n-gon renderer is not intended for real-time display of high-polycount scenes, nor for real-time high-resolution rendering. Its principal target resolution is along the lines of 320 x 200 &ndash; upscaled by whichever amount &ndash; with spartan 3d scenes.

With that in mind, here's some performance figures on various platforms.

### Performance on the desktop
The table below lists test results from [tests/performance/perftest1.html](tests/performance/perftest1.html) as of [5bb8960](https://github.com/leikareipa/retro-ngon/tree/5bb8960f433e99d615253ad56014abf3f19f6b4c) running on a Xeon E3-1230 v3 desktop PC in Chrome 72 (top) and Firefox 65 (bottom). The values given are frames per second (FPS) for polycounts 30, 60, ..., 960. A bullet indicates that the FPS was at least 60, the screen's refresh rate during the tests.

<table>
    <tr>
        <td align="left" width="110">E3-1230 v3</td>
        <th align="center">30</th>
        <th align="center">60</th>
        <th align="center">120</th>
        <th align="center">240</th>
        <th align="center">480</th>
        <th align="center">960</th>
    </tr>
    <tr>
        <th align="left">Wireframe</th>
        <td align="center">&bull;</td>
        <td align="center">&bull;</td>
        <td align="center">&bull;</td>
        <td align="center">&bull;</td>
        <td align="center">&bull;</td>
        <td align="center">58<br>44</td>
    </tr>
    <tr>
        <th align="left">Solid fill</th>
        <td align="center">&bull;</td>
        <td align="center">&bull;</td>
        <td align="center">&bull;</td>
        <td align="center">&bull;</td>
        <td align="center">59<br>56</td>
        <td align="center">44<br>34</td>
    </tr>
    <tr>
        <th align="left">Textured</th>
        <td align="center">&bull;</td>
        <td align="center">&bull;<br>59</td>
        <td align="center">&bull;<br>59</td>
        <td align="center">&bull;<br>46</td>
        <td align="center">57<br>26</td>
        <td align="center">36<br>14</td>
    </tr>
</table>

Below are results from [tests/performance/perftest1.html](tests/performance/perftest1.html) as of [5bb8960](https://github.com/leikareipa/retro-ngon/tree/5bb8960f433e99d615253ad56014abf3f19f6b4c) running on a Pentium G4560 desktop PC in Chrome 72. The notes from the tests above apply.

<table>
    <tr>
        <td align="left" width="110">G4560</td>
        <th align="center">30</th>
        <th align="center">60</th>
        <th align="center">120</th>
        <th align="center">240</th>
        <th align="center">480</th>
        <th align="center">960</th>
    </tr>
    <tr>
        <th align="left">Wireframe</th>
        <td align="center">&bull;</td>
        <td align="center">&bull;</td>
        <td align="center">&bull;</td>
        <td align="center">&bull;</td>
        <td align="center">58</td>
        <td align="center">58</td>
    </tr>
    <tr>
        <th align="left">Solid fill</th>
        <td align="center">&bull;</td>
        <td align="center">&bull;</td>
        <td align="center">&bull;</td>
        <td align="center">58</td>
        <td align="center">59</td>
        <td align="center">41</td>
    </tr>
    <tr>
        <th align="left">Textured</th>
        <td align="center">&bull;</td>
        <td align="center">&bull;</td>
        <td align="center">&bull;</td>
        <td align="center">56</td>
        <td align="center">56</td>
        <td align="center">34</td>
    </tr>
</table>

The gist of these data is that the renderer performs better on Chrome than it does on Firefox, most notably so when texturing is enabled. On Chrome, polycounts of roughly 100 to 300 could be maintained at 60 FPS; or about 1000 at 30 FPS.

### Performance on mobile
Below are results from [tests/performance/perftest1.html](tests/performance/perftest1.html) as of [f340393](https://github.com/leikareipa/retro-ngon/tree/f340393162243b4a6808f31a2db2843bac29833a) running on an Honor View20 (2019) phone in Chrome. The notes from the tests above apply.

<table>
    <tr>
        <td align="left" width="110">View20</td>
        <th align="center">30</th>
        <th align="center">60</th>
        <th align="center">120</th>
        <th align="center">240</th>
        <th align="center">480</th>
        <th align="center">960</th>
    </tr>
    <tr>
        <th align="left">Wireframe</th>
        <td align="center">&bull;</td>
        <td align="center">&bull;</td>
        <td align="center">&bull;</td>
        <td align="center">&bull;</td>
        <td align="center">54</td>
        <td align="center">27</td>
    </tr>
    <tr>
        <th align="left">Solid fill</th>
        <td align="center">&bull;</td>
        <td align="center">&bull;</td>
        <td align="center">&bull;</td>
        <td align="center">59</td>
        <td align="center">41</td>
        <td align="center">20</td>
    </tr>
    <tr>
        <th align="left">Textured</th>
        <td align="center">&bull;</td>
        <td align="center">&bull;</td>
        <td align="center">&bull;</td>
        <td align="center">56</td>
        <td align="center">33</td>
        <td align="center">17</td>
    </tr>
</table>

Below are results from [tests/performance/perftest1.html](tests/performance/perftest1.html) as of [5bb8960](https://github.com/leikareipa/retro-ngon/tree/5bb8960f433e99d615253ad56014abf3f19f6b4c) running on a Huawei MediaPad T1-A21L (2014? 2015?) tablet in Chrome. The notes from the tests above apply. An empty cell indicates that no test was run for that polycount.

<table>
    <tr>
        <td align="left" width="110">T1-A21L</td>
        <th align="center">30</th>
        <th align="center">60</th>
        <th align="center">120</th>
        <th align="center">240</th>
        <th align="center">480</th>
        <th align="center">960</th>
    </tr>
    <tr>
        <th align="left">Wireframe</th>
        <td align="center">55</td>
        <td align="center">56</td>
        <td align="center">42</td>
        <td align="center">27</td>
        <td align="center">13</td>
        <td align="center">6</td>
    </tr>
    <tr>
        <th align="left">Solid fill</th>
        <td align="center">43</td>
        <td align="center">31</td>
        <td align="center">27</td>
        <td align="center">14</td>
        <td align="center">7</td>
        <td align="center">3</td>
    </tr>
    <tr>
        <th align="left">Textured</th>
        <td align="center">31</td>
        <td align="center">12</td>
        <td align="center">6</td>
        <td align="center"></td>
        <td align="center"></td>
        <td align="center"></td>
    </tr>
</table>

# Which features typical of 3d engines are missing?
- Lighting
- Fully perspective-correct texture-mapping
- Frustum clipping (n-gons behind the camera may result in visual glitches and other undesired effects)
- Depth testing (painter's sorting is used)

Note also that concave n-gons are not supported.

# Browser compatibility
Below are rough estimates of the required browser versions for a given version of the retro n-gon renderer. Browsers marked with "No" are not compatible at all.

<table>
    <tr>
        <th align="left" width="110"></th>
        <th align="center" width="90">
            <img alt="Chrome" src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/chrome/chrome_24x24.png">
            <br>Chrome
        </th>
        <th align="center" width="90">
            <img alt="Firefox" src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/firefox/firefox_24x24.png">
            <br>Firefox
        </th>
        <th align="center" width="90">
            <img alt="Opera" src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/opera/opera_24x24.png">
            <br>Opera
        </th>
        <th align="center" width="90">
            <img alt="Safari" src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/safari/safari_24x24.png">
            <br>Safari
        </th>
        <th align="center" width="90">
            <img alt="Edge" src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/edge/edge_24x24.png">
            <br>Edge
        </th>
        <th align="center" width="90">
            <img title="Internet Explorer" alt="Internet Explorer" src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/archive/internet-explorer_6/internet-explorer_6_24x24.png">
            <br>IE
        </th>
    </tr>
    <tr>
        <td align="left">alpha.3+</td>
        <td align="center">60</td>
        <td align="center">55</td>
        <td align="center">50</td>
        <td align="center">11?</td>
        <td align="center">No</td>
        <td align="center">No</td>
    </tr>
</table>

# Authors and credits
The main author of the retro n-gon renderer is the one-man Tarpeeksi Hyvae Soft (see on [GitHub](https://github.com/leikareipa) and the [Web](http://www.tarpeeksihyvaesoft.com)).

On 3d software rendering in general, the aforementioned main author has benefited a good bit from tutorials by Benny Bobaganoosh. You can check out his [YouTube](https://www.youtube.com/playlist?list=PLEETnX-uPtBUbVOok816vTl1K9vV1GgH5) and [GitHub](https://github.com/BennyQBD/3DSoftwareRenderer). The retro n-gon renderer's matrix code ([js/retro-ngon/matrix44.js](js/retro-ngon/matrix44.js)) is adapted, with superficial changes, from Benny's code.

The implementation of the Bresenham line algo in [js/retro-ngon/line-draw.js](js/retro-ngon/line-draw.js) has been adapted, with changes, from the one given by [Phrogz](https://stackoverflow.com/users/405017/phrogz) on [Stack Overflow](https://stackoverflow.com/a/4672319).

The retro n-gon renderer originates as a fork of the renderer used in the JavaScript version of Tarpeeksi Hyvae Soft's [RallySportED](https://github.com/leikareipa/rallysported).