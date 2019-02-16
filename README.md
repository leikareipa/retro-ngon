# The retro n-gon renderer
A minimalist 3d renderer that draws n-sided polygons (as well as lines and points) onto a user-supplied HTML5 canvas. Its intended use cases include ones where a retro aesthetic is preferred.

You can view a live sample of the renderer's output at [http://tarpeeksihyvaesoft.com/s/retro-ngon/](http://tarpeeksihyvaesoft.com/s/retro-ngon/).

## Usage
An introductory example of the renderer's usage is given in [sample1.html](sample1.html). Its source code walks you through a basic setup for rendering a spinning triangle on screen.

A slightly more involved example is provided in [sample2.html](sample2.html). It renders miscellaneous 3d meshes of varying complexity.

## Performance
The renderer is not intended for real-time display of high-polycount scenes, nor for real-time high-resolution rendering. Its principal target is 320 x 200 &ndash; upscaled by whichever amount &ndash; and spartan 3d scenes.

Below are test results from [perf-tests/perftest1.html](perf-tests/perftest1.html) as of [9b61659](https://github.com/leikareipa/retro-ngon/tree/9b616595d11c19308090b5ac26064c9bcb29a6a7) running on a Xeon E3-1230 v3 desktop PC in Chrome and Firefox. The values given in the matrices are frames per second (FPS) for polycounts 30, 60, ..., 1920. An empty cell indicates that no test was run for that polycount; a bullet notes that the FPS was at least 60, the screen's refresh rate during the tests.

<table>
    <tr>
        <td align="left">Chrome 72</td>
        <th align="center">30</th>
        <th align="center">60</th>
        <th align="center">120</th>
        <th align="center">240</th>
        <th align="center">480</th>
        <th align="center">960</th>
        <th align="center">1920</th>
    </tr>
    <tr>
        <th align="left">Wireframe</th>
        <td align="center">&bull;</td>
        <td align="center">&bull;</td>
        <td align="center">&bull;</td>
        <td align="center">&bull;</td>
        <td align="center">&bull;</td>
        <td align="center">&bull;</td>
        <td align="center">48</td>
    </tr>
    <tr>
        <th align="left">Solid fill</th>
        <td align="center">&bull;</td>
        <td align="center">&bull;</td>
        <td align="center">&bull;</td>
        <td align="center">&bull;</td>
        <td align="center">59</td>
        <td align="center">49</td>
        <td align="center">25</td>
    </tr>
    <tr>
        <th align="left">Textured</th>
        <td align="center">&bull;</td>
        <td align="center">&bull;</td>
        <td align="center">55</td>
        <td align="center">35</td>
        <td align="center">19</td>
        <td align="center">10</td>
        <td align="center"></td>
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
        <th align="center">1920</th>
    </tr>
    <tr>
        <th align="left">Wireframe</th>
        <td align="center">&bull;</td>
        <td align="center">&bull;</td>
        <td align="center">&bull;</td>
        <td align="center">&bull;</td>
        <td align="center">&bull;</td>
        <td align="center">54</td>
        <td align="center">28</td>
    </tr>
    <tr>
        <th align="left">Solid fill</th>
        <td align="center">&bull;</td>
        <td align="center">&bull;</td>
        <td align="center">&bull;</td>
        <td align="center">&bull;</td>
        <td align="center">59</td>
        <td align="center">35</td>
        <td align="center">19</td>
    </tr>
    <tr>
        <th align="left">Textured</th>
        <td align="center">46</td>
        <td align="center">28</td>
        <td align="center">15</td>
        <td align="center">8</td>
        <td align="center">4</td>
        <td align="center"></td>
        <td align="center"></td>
    </tr>
</table>

The gist of these data is that the renderer performs better on Chrome than it does on Firefox, most notably so when texturing is enabled. On Chrome, polycounts of roughly 100 to 300 could be maintained at 60 FPS; or about 250-1000 at 30 FPS.

Below are results from [perf-tests/perftest1.html](perf-tests/perftest1.html) as of [9b61659](https://github.com/leikareipa/retro-ngon/tree/9b616595d11c19308090b5ac26064c9bcb29a6a7) running on a G4560 desktop PC in Chrome. The notes from the tests above apply.

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
        <td align="center">59</td>
        <td align="center">58</td>
    </tr>
    <tr>
        <th align="left">Solid fill</th>
        <td align="center">&bull;</td>
        <td align="center">&bull;</td>
        <td align="center">59</td>
        <td align="center">58</td>
        <td align="center">58</td>
        <td align="center">45</td>
    </tr>
    <tr>
        <th align="left">Textured</th>
        <td align="center">&bull;</td>
        <td align="center">56</td>
        <td align="center">56</td>
        <td align="center">36</td>
        <td align="center">19</td>
        <td align="center">9</td>
    </tr>
</table>

Below are results from [perf-tests/perftest1.html](perf-tests/perftest1.html) as of [9b61659](https://github.com/leikareipa/retro-ngon/tree/9b616595d11c19308090b5ac26064c9bcb29a6a7) running on a Nexus 9 tablet in Chrome. The notes from the tests above apply.

<table>
    <tr>
        <td align="left">Nexus 9</td>
        <th align="center">30</th>
        <th align="center">60</th>
        <th align="center">120</th>
        <th align="center">240</th>
        <th align="center">480</th>
        <th align="center">960</th>
    </tr>
    <tr>
        <th align="left">Wireframe</th>
        <td align="center">56</td>
        <td align="center">56</td>
        <td align="center">41</td>
        <td align="center">26</td>
        <td align="center">13</td>
        <td align="center">5</td>
    </tr>
    <tr>
        <th align="left">Solid fill</th>
        <td align="center">55</td>
        <td align="center">42</td>
        <td align="center">26</td>
        <td align="center">15</td>
        <td align="center">7</td>
        <td align="center">3</td>
    </tr>
    <tr>
        <th align="left">Textured</th>
        <td align="center">21</td>
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

Convex n-gons are also not supported.
