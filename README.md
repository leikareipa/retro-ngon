# The retro n-gon renderer

A low-level retro-oriented 3D software renderer for the HTML5 \<canvas\> (also supports rendering into an off-screen pixel buffer).

You can view various interactive render samples [here](https://www.tarpeeksihyvaesoft.com/rngon/samples/).

## Key features

- Genuine retro aesthetics
- Programmable render pipeline
- Good performance (for retro uses)

![Tomb Raider](/images/screenshots/beta/tomb-raider-crt.webp)\
*A scene from [Tomb Raider](https://en.wikipedia.org/wiki/Tomb_Raider_(1996_video_game)), rendered with a CRT-like shader. (Based on assets created by Core Design for Tomb Raider. Core Design is not associated with this renderer.)*

## Documentation

- [Installation](#installation)
- [Quick-start guide](/docs/quick-start.md)
- [API reference](/docs/api-reference.md)

## Suggested use cases

Being a retro-oriented software renderer written in JavaScript, the retro n-gon renderer thrives in low resolutions and low polycounts, its performance generally lacking for modern-style rendering.

I'd generally expect the renderer to find a home powering nostalgia projects reminiscent of the 90s and early 2000. Retro-themed games, model visualization, etc.

## Performance

The repository provides [performance benchmarks](/tests/performance/) to gauge the renderer's performance on your system.

Below are benchmark results (frames per second) running in Google Chrome on an AMD Ryzen 5000 series desktop CPU.

<table>
    <tr>
        <th>Resolution</th>
        <th colspan="4">Rendering mode</th>
    </tr>
    <tr>
        <th></th>
        <th>Wireframe</th>
        <th>Untextured<sup>1</sup></th>
        <th>Textured<sup>1</sup></th>
        <th>Pixel shader<sup>2</sup></th>
    </tr>
    <tr>
        <td>1920 &times; 1080</td>
        <td>255</td>
        <td>70</td>
        <td>45</td>
        <td>5</td>
    </tr>
    <tr>
        <td>1280 &times; 720</td>
        <td>340</td>
        <td>110</td>
        <td>80</td>
        <td>15</td>
    </tr>
    <tr>
        <td>640 &times; 360</td>
        <td>470</td>
        <td>260</td>
        <td>180</td>
        <td>65</td>
    </tr>
    <tfoot>
        <tr>
            <td colspan="5">
                <sup>1</sup>With Gouraud shading.
            </td>
        </tr>
        <tr>
            <td colspan="5">
                <sup>2</sup>Simpler pixel shaders may impact performance by as little as 10%.
            </td>
        </tr>
    </tfoot>
</table>

![A view from Grand Prix Legends](/images/screenshots/beta/bench-quake.jpg)

Pixel shaders can have a large impact on the frame rate, but otherwise this 800-polygon scene with texturing and Gouraud shading is renderable at a high rate.*

\*Note that the renderer performs no pre-rasterization visibility culling other than back-face removal and frustum clipping. It's at the discretion of the host application to apply more sophisticated culling techniques to maximize performance.

## Installation

After downloading the repository, follow these steps to build the code into a single-file distributable that you can use in your apps.

1. Install the required developer dependencies:

```bash
$ yarn install
```

These dependencies are needed only to build the distributable. They don't need to be bundled with your application.

2. Build the distributable:

```bash
$ yarn run build
```

- Optionally, you can build the distributable in developer mode with `$ yarn run build:dev`. The developer mode includes additional run-time error checks and data validation, which help you find bugs at the cost of run-time performance. Keep an eye on your browser's developer console.

The build process should produce the file [distributable/rngon.js](/distributable/rngon.js), which you can embed into a HTML document to expose the rendering API as a global `Rngon` object:

```html
<script src="distributable/rngon.js"></script>
```

### Testing

#### Unit tests

```bash
$ yarn run test:unit
```

#### Performance benchmarks

```bash
$ yarn run test:perf:wireframe
$ yarn run test:perf:untextured
$ yarn run test:perf:textured
$ yarn run test:perf:shader
```

These benchmarks run in a headless Google Chrome using [Puppeteer](https://github.com/puppeteer/puppeteer), at a render resolution of 640 &times; 360. They require the files of the repository to be hosted on a web server (e.g. `localhost`).

By default, the benchmarks attempt to run on `http://localhost:8222`, but you can set a different URL via the `RESOURCE_ORIGIN` environment variable.

You can also run the benchmarks in a browser window (after hosting the files on a web server):

- `test:perf:wireframe`: [/tests/performance/quake/wireframe.html]()
- `test:perf:untextured`: [/tests/performance/quake/untextured.html]()
- `test:perf:textured`: [/tests/performance/quake/textured.html]()
- `test:perf:shader`: [/tests/performance/quake/shader.html]()

The benefits of running them this way is that you get to see the render output and at the end a graph showing the frame rate as a function of time.

When run in a browser window, the benchmarks' render resoluton is determined by the size of the viewport as well as the `scale` URL parameter: for example, with a viewport of 1920 &times; 1080 and `scale=0.25`, the render resolution will be 480 &times; 270.
