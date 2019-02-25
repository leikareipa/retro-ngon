# The retro n-gon renderer
A minimalist 3d renderer that draws n-sided polygons (as well as lines and points) onto a user-supplied HTML5 canvas. Its intended use cases are mainly those where a minimalist retro aesthetic is preferred.

You can view a live sample of the renderer's output at [http://tarpeeksihyvaesoft.com/s/retro-ngon/samples/sample2.html](http://tarpeeksihyvaesoft.com/s/retro-ngon/samples/sample2.html).

### Suggested use cases
It's worth noting, first, that the retro n-gon renderer is not intended as a general-purpose software 3d renderer. It omits several key features &ndash; more of which elsewhere in this document &ndash; in favor of a legit retro look and feel. I've made several other open-source software renderers, some of which might fit your needs better:
- [Wray](https://github.com/leikareipa/wray/) for path-tracing in JavaScript
- [RallySportED](https://github.com/leikareipa/rallysported-diverse/)'s renderer in C++ using Qt and the Win32 API (also w/ support for OpenGL and Glide)
- [Vond](https://github.com/leikareipa/vond/) for a hybrid voxel/polygon software renderer in C++

The retro n-gon renderer encourages low resolutions, low polycounts, and designing around considerable visual limitations &ndash; like in the old days of software rendering. You might use the renderer for some of the following:
- Engagment in feature minimalism
- Retro 3d games with sparse, simple environments (e.g. an Asteroids clone)
- Visualizing invidual objects in wobbly 3d

## How to use it
Below, you'll find practical examples of how to use the renderer. But first, a theoretical example gives a bird's-eye overview of how the renderer operates.

### The gist of it in theory
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

Before proceeding onto the practical examples, below, it's good to note that the renderer prefers immutable data. For instance, to produce a rotating mesh, you'll see that the examples re-create the mesh for each frame, rather than altering some mutable parameter in it. This isn't ideal for performance, but is the style I fancied writing the renderer in.

### Some practical examples
An introductory example of the renderer's usage is given in [samples/sample1.html](samples/sample1.html). Its source code walks you through a basic setup for rendering a spinning triangle on screen.

A slightly more involved example is provided in [samples/sample2.html](samples/sample2.html). It loads a simple, Blender-exported, textured model from disk and renders it. Note that, on Chrome, and possibly some other browsers, the HTML file needs to be accessed via a server rather than opened directly from disk. If you want to access the file locally, you can set up a simple test server, e.g. via `php -S localhost:8000`.

## Performance
The renderer is not intended for real-time display of high-polycount scenes, nor for real-time high-resolution rendering. Its principal target is 320 x 200 &ndash; upscaled by whichever amount &ndash; and spartan 3d scenes.

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

Below are results from [perf-tests/perftest1.html](perf-tests/perftest1.html) as of [5bb8960](https://github.com/leikareipa/retro-ngon/tree/5bb8960f433e99d615253ad56014abf3f19f6b4c) running on a G4560 desktop PC in Chrome. The notes from the tests above apply.

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

## Which features typical of 3d engines are missing?
- Lighting
- Per-vertex attributes
- Perspective-correct texture-mapping
- Frustum clipping (n-gons behind the camera will result in odd behavior)
- Depth testing (painter's sorting is used)

Note also that concave n-gons are not supported.

## Browser compatibility
At the moment, versions of Chrome and Firefox released in the last year or so are supported; although, as per the performance tests above, Chrome is preferred.

Safari is untested for, but newer versions of it should work.
