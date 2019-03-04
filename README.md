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

**More examples.** The [samples/](samples/) directory collects together various examples of the renderer's usage.

An introductory example is given in [samples/sample1.html](samples/sample1.html). Its source code walks you through a basic setup for rendering a spinning triangle on screen.

A slightly more complex example is provided in [samples/sample2.html](samples/sample2.html). It loads a simple, Blender-exported, textured model from disk, and renders it on screen. Also shows you how to get pixelated (rather than blurry) upscaling. Note that, on Chrome and possibly some other browsers, the HTML file needs to be accessed via a server rather than opened directly from disk. If you want to access the file locally, you can set up a simple test server, e.g. with `$ php -S localhost:8000`.

### Dealing with and creating 3d models
**N-gons** (polygons of _n_ sides, but also points and lines) are the building-blocks of 3d models in the retro n-gon renderer. Each n-gon includes one or more vertices, and a material that describes how the n-gon should look when rendered (its color, texture, and so on). A red 1-gon object could be created like so:
```
const ngon = Rngon.ngon([Rngon.vertex(1, 0, 0)],
                        {
                            color: Rngon.color_rgba(255, 0, 0),
                            hasSolidFill: true
                        });
```

**Meshes** are one step up from n-gons, being collections of n-gons that share a purpose (e.g. the n-gons that make up a model of a spoon). A mesh thus consists of the n-gons belonging to it, and a set of 3d transformations, like rotation and translation, that can be used to transform the n-gons in unison. A mesh object containing one n-gon could be created like so:
```
const mesh = Rngon.mesh([ngon],
                        {
                            translation: Rngon.translation_vector(0, 0, 0),
                            rotation: Rngon.rotation_vector(0, 0, 0),
                            scaling: Rngon.scaling_vector(1, 1, 1)
                        });
```

To render n-gons, you first wrap them up in one or more `mesh` objects, then feed those meshes into the `render()` function.

**Models** describe a list of related n-gons and of any materials, texture resources, etc. that go along with those n-gons. For instance, if you create a 3d scene in Blender and export it using the retro n-gon renderer's Blender export script, you get a model file, which provides a JavaScript factory function that ultimately returns an array of n-gons corresponding to the 3d scene. You can then wrap those n-gons in a `mesh` object and render it with `render()`.

You can think of models as functions that translate external 3d assets into the renderer's native n-gon format.

**Exporting models from Blender.** You can use the free 3d modeling program, Blender, to create 3d assets directly for the retro n-gon renderer.

A script for exporting scenes from Blender into the renderer's model format is provided under [tools/conversion/](tools/conversion/). To use it, first create the scene in Blender (or import it into Blender from some other format), then load up and run the script. Note that, at the moment, the script isn't integrated into Blender's UI, and is overall a very early version, so you'll have to manually edit it to provide a custom filename and path for the exported data. Otherwise, just look at the script's contents to see where it exports to, by default.

Only a subset of Blender's operations are supported, at this time. The export script will export for each n-gon in Blender its vertices, diffuse color (modulated by its diffuse intensity), and, if any, the filename of the texture image in the polygon's first material slot (the image must be in PNG format). Note that you should apply any of Blender's transformations, like translation and rotation, before running the script. Otherwise, those operations may be ignored in the exported data.

The exporter ignores UV coordinates and normals. (For more info on texturing, see the sections, below.)

Since the retro n-gon renderer deals with n-gons natively, you don't need to pre-triangulate the meshes in Blender. It's in fact better if you don't, since triangulation will increase the number of polygons, and thus slow down the rendering. An exception is if you have concave polygons, as these aren't supported by the renderer, and will need to be triangulated before exporting.

As the renderer uses per-face depth-sorting, it's a good idea to subdivide large polygons before exporting them. For instance, if you have a statue consisting of several small polygons stood on a floor made up of a single large polygon, the floor will likely obscure the statue during rendering, even when viewed from angles where it shouldn't. This is because depth information is averaged across the entire polygon, causing large polygons to have poor depth resolution. On the other hand, it's good to keep in mind that subdivision can cause issues with texturing (see below for more info on this) and negatively impact rendering speed. It's a bit of a balancing act.

**Texturing.** Each n-gon can have one texture applied to it.

In `ortho` mode &ndash; the default texture-mapping mode as defined via the n-gon's `textureMapping` material property &ndash; you don't need to provide UV coordinates for the n-gon's vertices. The downside is that the texture may warp in undesired ways depending on the n-gon's orientation and the viewing angle. This mode works best when the n-gon's lines are perpendicular to the horizon (e.g. UI elements), or when the rendering resolution is low and the texture represents organic detail, like grass (in which case, the warping will provide additional visual variance to tiled textures). The other texture-mapping mode, `affine`, requires UV coordinates to be assigned to the n-gon's vertices, but will make use of them to prevent texture-warping. The difference in performance between `ortho` and `affine` should be negligible, but you can test it on you target platforms with [perf-tests/perftest1.html](perf-tests/perftest1.html).

Texture data is provided to the retro n-gon renderer in JSON format, which for a red 1 x 1 RGBA texture might look something like this:
```
{
    "width":1,
    "height":1,
    "channels":"rgba:8+8+8+8",
    "encoding":"none",
    "pixels":[255, 0, 0, 0]
}
```
Calling `texture_rgba()` with this JSON object returns a texture object that can be assigned as the `texture` property of an n-gon's material.

You can pass the JSON object either directly into `texture_rgba()` as a parameter; or indirectly as a file, by calling `texture_rgba.create_with_data_from_file()` and passing to it as a parameter the JSON file's name and path. The latter will return a Promise for a `texture_rgba` object, resolved once the data has been loaded from the file and the object created from it.

There are two options for encoding the texture's pixel data in the `pixels` property: `none` and `base64`. With `none`, you provide the texture's RGBA values as a flat array of consecutive 8-bit RGBA values, each in the range 0 to 255. With `base64`, you provide a Base64-encoded string representing consecutive 16-bit values into which the RGB components have been packed as 5 bits each and 1 bit for the alpha. The benefit of `base64` encoding is a smaller file size; although with some degradation in color fidelity due to the reduction in color depth. Given the renderer's low fidelity overall (low resolutions and polycounts), this reduction in textures' color depth will likely not be visually disruptive in many cases.

A simple-to-use PHP script for converting PNG images into a compatible Base64-encoded JSON format is provided under [tools/conversion/](tools/conversion/).

Only RGBA textures are supported, at this time; the alpha channel being either fully opaque (255) or fully transparent (any value but 255).

# Performance
As suggested in the sections, above, the retro n-gon renderer is not intended for real-time display of high-polycount scenes, nor for real-time high-resolution rendering. Its principal target resolution is along the lines of 320 x 200 &ndash; upscaled by whichever amount &ndash; with spartan 3d scenes.

With that in mind, here's some performance figures on various platforms.

### Performance on the desktop
The table below lists test results from [perf-tests/perftest1.html](perf-tests/perftest1.html) as of [5bb8960](https://github.com/leikareipa/retro-ngon/tree/5bb8960f433e99d615253ad56014abf3f19f6b4c) running on a Xeon E3-1230 v3 desktop PC in Chrome 72 (top) and Firefox 65 (bottom). The values given are frames per second (FPS) for polycounts 30, 60, ..., 960. A bullet indicates that the FPS was at least 60, the screen's refresh rate during the tests.

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

Below are results from [perf-tests/perftest1.html](perf-tests/perftest1.html) as of [5bb8960](https://github.com/leikareipa/retro-ngon/tree/5bb8960f433e99d615253ad56014abf3f19f6b4c) running on a Pentium G4560 desktop PC in Chrome 72. The notes from the tests above apply.

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
Below are results from [perf-tests/perftest1.html](perf-tests/perftest1.html) as of [f340393](https://github.com/leikareipa/retro-ngon/tree/f340393162243b4a6808f31a2db2843bac29833a) running on an Honor View20 (2019) phone in Chrome. The notes from the tests above apply.

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

Below are results from [perf-tests/perftest1.html](perf-tests/perftest1.html) as of [5bb8960](https://github.com/leikareipa/retro-ngon/tree/5bb8960f433e99d615253ad56014abf3f19f6b4c) running on a Huawei MediaPad T1-A21L (2014? 2015?) tablet in Chrome. The notes from the tests above apply. An empty cell indicates that no test was run for that polycount.

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
