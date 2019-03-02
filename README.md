# The retro n-gon renderer
A minimalist 3d renderer that draws n-sided polygons (as well as lines and points) onto a user-supplied HTML5 canvas. Its intended use cases are mainly those where a minimalist retro aesthetic is preferred.

You can view a live sample of the renderer's output at [http://tarpeeksihyvaesoft.com/s/retro-ngon/samples/sample2.html](http://tarpeeksihyvaesoft.com/s/retro-ngon/samples/sample2.html).

### Features
- Genuine retro aesthetics
- Natively renders convex n-sided polygons
- Immutable data structures
- Simple to use

### Suggested use cases
The retro n-gon renderer is not intended as a general-purpose software 3d renderer. It omits several modern features &ndash; more of which elsewhere in this document &ndash; in favor of a legit retro look and feel. I've made a number of other open-source software renderers, some of which might fit your needs or interests better:
- [Wray](https://github.com/leikareipa/wray/) for path tracing in JavaScript
- [RallySportED](https://github.com/leikareipa/rallysported-diverse/)'s renderer in C++ using Qt and the Win32 API (also w/ support for OpenGL and Glide)
- [Vond](https://github.com/leikareipa/vond/) for a hybrid voxel/polygon software renderer in C++
- [dccb](https://github.com/leikareipa/dccb/) for a simple software renderer in C for 16-bit DOS

The retro n-gon renderer encourages very low resolutions, very low polycounts, and designing your way around considerable visual limitations &ndash; like in the old days of software rendering. You might use the renderer for some of the following purposes:
- Engagement in feature minimalism
- Retro 3d games with sparse, simple environments (e.g. an Asteroids clone)
- Visualizing 3d models in a wobbly, old-fashioned manner

# How to use the renderer
In this section, you'll find both practical and theoretical examples of how to use the retro n-gon renderer. You don't need to read all of it, though &ndash; you can dig directly into the practical examples under [samples/](samples/), if you want to figure it out as you go; then return here for the details.

### The gist of it
At the heart of the renderer is the `render()` function, which transforms and rasterizes a set of n-gons onto a HTML5 canvas. You call it with the HTML id of the canvas you want the image rendered into, an array of the n-gon meshes you want rendered, and additional, optional parameters to define the position and orientation of the camera, etc.

The following JavaScript pseudocode renders a triangle onto a canvas:
```
<canvas id="render-target"></canvas>

triangle = Rngon.ngon(...)
mesh = Rngon.mesh([triangle]);

camera = Rngon.camera(...)
Rngon.render("render-target", [mesh], camera)
```
This produces a static image of the triangle. If you wanted to animate it, you'd simply call `render()` repeatedly (e.g. with `window.requestAnimationFrame()`), each time altering the triangle mesh's orientation, etc.

### Practical examples
An introductory example of the renderer's usage is given in [samples/sample1.html](samples/sample1.html). Its source code walks you through a basic setup for rendering a spinning triangle on screen.

A slightly more involved example is provided in [samples/sample2.html](samples/sample2.html). It loads a simple, Blender-exported, textured model from disk and renders it. Note that, on Chrome, and possibly some other browsers, the HTML file needs to be accessed via a server rather than opened directly from disk. If you want to access the file locally, you can set up a simple test server, e.g. via `php -S localhost:8000`.

### A how-to of 3d modeling
**N-gons** (polygons of _n_ sides, but also points and lines) are the building-blocks of 3d models in the retro n-gon renderer. Each n-gon includes one or more vertices, and a material that describes how the n-gon should look when rendered (its color, texture, and so on). A red 1-gon object could be created like so:
```
const ngon = Rngon.ngon([Rngon.vertex4(1, 0, 0)],
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

#### Exporting models from Blender
You can use the popular and free 3d modeling program, Blender, to create 3d assets directly for the retro n-gon renderer.

A script for exporting scenes from Blender into the renderer's model format is provided under [tools/conversion/](tools/conversion/). To use it, first create the scene in Blender (or import it into Blender from some other format), then load up and run the script. Note that, at the moment, the script isn't integrated into Blender's UI, and is overall a very early version, so you'll have to manually edit it to provide a custom filename and path for the exported data. Otherwise, just look at the script's contents to see where it exports to, by default.

Only a subset of Blender's operations are supported, at this time. The export script will export for each n-gon in Blender its vertices, diffuse color (modulated by its diffuse intensity), and, if any, the filename of the texture image in the polygon's first material slot (the image must be in PNG format). Note that you should apply any of Blender's transformations, like translation and rotation, before running the script. Otherwise, those operations may be ignored in the exported data.

The exporter ignores UV coordinates and normals. (For more info on texturing, see the sections, below.)

Since the retro n-gon renderer deals with n-gons natively, you don't need to pre-triangulate the meshes in Blender. It's in fact better if you don't, since triangulation will increase the number of polygons, and thus slow down the rendering. An exception is if you have concave polygons, as these aren't supported by the renderer, and will need to be triangulated before exporting.

As the renderer uses per-face depth-sorting, it's a good idea to subdivide large polygons before exporting them. For instance, if you have a statue consisting of several small polygons stood on a floor made up of a single large polygon, the floor will likely obscure the statue during rendering, even when viewed from angles where it shouldn't. This is because depth information is averaged across the entire polygon, causing large polygons to have poor depth resolution. On the other hand, it's good to keep in mind that subdivision can cause issues with texturing (see below for more info on this) and negatively impact rendering speed. It's a bit of a balancing act.

#### Texturing
Each n-gon can have one texture applied to it. The texture will apply to the n-gon's entire face. A single texture can't stretch over multiple n-gons; i.e. there are no UV coordinates. The renderer does not correct the textures for perspective; meaning they will warp in a particular way depending on the n-gon's orientation and the camera angle. (The warping can look ugly at high resolutions and/or with textures of rigid geometric detail, but is less of a problem at low resolutions with images of organic subjects, like grass and the like).

Texture data is provided to the retro n-gon renderer in JSON format, which for a red 1 x 1 RGBA texture might look like this:
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
Below are test results from [perf-tests/perftest1.html](perf-tests/perftest1.html) as of [5bb8960](https://github.com/leikareipa/retro-ngon/tree/5bb8960f433e99d615253ad56014abf3f19f6b4c) running on a Xeon E3-1230 v3 desktop PC in Chrome and Firefox. The values given in the matrices are frames per second (FPS) for polycounts 30, 60, ..., 960. An empty cell indicates that no test was run for that polycount; a bullet notes that the FPS was at least 60, the screen's refresh rate during the tests.

<table>
    <tr>
        <td align="left">Chrome 72</td>
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
        <td align="center">58</td>
    </tr>
    <tr>
        <th align="left">Solid fill</th>
        <td align="center">&bull;</td>
        <td align="center">&bull;</td>
        <td align="center">&bull;</td>
        <td align="center">&bull;</td>
        <td align="center">59</td>
        <td align="center">44</td>
    </tr>
    <tr>
        <th align="left">Textured</th>
        <td align="center">&bull;</td>
        <td align="center">&bull;</td>
        <td align="center">&bull;</td>
        <td align="center">&bull;</td>
        <td align="center">57</td>
        <td align="center">36</td>
    </tr>
</table>
<br>
<table>
    <tr>
        <td align="left">Firefox 65</td>
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
        <td align="center">44</td>
    </tr>
    <tr>
        <th align="left">Solid fill</th>
        <td align="center">&bull;</td>
        <td align="center">&bull;</td>
        <td align="center">&bull;</td>
        <td align="center">&bull;</td>
        <td align="center">56</td>
        <td align="center">34</td>
    </tr>
    <tr>
        <th align="left">Textured</th>
        <td align="center">&bull;</td>
        <td align="center">59</td>
        <td align="center">59</td>
        <td align="center">46</td>
        <td align="center">26</td>
        <td align="center">14</td>
    </tr>
</table>

Below are results from [perf-tests/perftest1.html](perf-tests/perftest1.html) as of [5bb8960](https://github.com/leikareipa/retro-ngon/tree/5bb8960f433e99d615253ad56014abf3f19f6b4c) running on a Pentium G4560 desktop PC in Chrome. The notes from the tests above apply.

<table>
    <tr>
        <td align="left">Chrome 72</td>
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
        <td align="left">View20</td>
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

Below are results from [perf-tests/perftest1.html](perf-tests/perftest1.html) as of [5bb8960](https://github.com/leikareipa/retro-ngon/tree/5bb8960f433e99d615253ad56014abf3f19f6b4c) running on a Huawei MediaPad T1-A21L (2014? 2015?) tablet in Chrome. The notes from the tests above apply.

<table>
    <tr>
        <td align="left">T1-A21L</td>
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
- Per-vertex attributes
- Perspective-correct texture-mapping
- Frustum clipping (n-gons behind the camera will result in odd behavior)
- Depth testing (painter's sorting is used)

Note also that concave n-gons are not supported.

# Browser compatibility
At the moment, versions of Chrome and Firefox released in the last year or so are supported; although, as per the performance tests above, Chrome is preferred.

Safari is untested for, but newer versions of it should work.
