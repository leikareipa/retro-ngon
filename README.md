# The retro n-gon renderer
A minimalist 3d renderer that draws n-sided polygons (as well as lines and points) onto a user-supplied HTML5 canvas.

You can view a live sample of the renderer's output at [http://tarpeeksihyvaesoft.com/s/retro-ngon/](http://tarpeeksihyvaesoft.com/s/retro-ngon/). It cycles through various 3d models.

## Usage
You can find a practical example of the renderer's usage in `index.html`.

Below is a more simplified, step-by-step guide. It'll render a single triangle onto a canvas on the page.

**Step 1.** Create a HTML5 canvas element in your HTML source. This is where the rendered triangle will be displayed.

    <canvas id="render-canvas" class="ngon-canvas ngon-pixelated-upscale"></canvas>

**Step 2.** Add the canvas's CSS classes. You could put these in a separate CSS file, but for the sake of this demonstration, they're embedded in a <style> element.

    <style scoped>
        .ngon-canvas {
            width: 300px;
            height: 300px;
            background-color: lightgray;
        }

        /* If the render scale is < 1, upscale with nearest-neighbor interpolation.*/
        .ngon-pixelated-upscale {
            image-rendering: pixelated;
            image-rendering: -moz-crisp-edges;
            image-rendering: -webkit-crisp-edges;
            -ms-interpolation-mode: nearest-neighbor;
        }
    </style>

**Step 3.** Include the renderer's JavaScript source files.

    <script src="js/retro-ngon/retro_ngon.js"></script>
    <script src="js/retro-ngon/log.js"></script>
    <script src="js/retro-ngon/color.js"></script>
    <script src="js/retro-ngon/geometry.js"></script>
    <script src="js/retro-ngon/line_draw.js"></script>
    <script src="js/retro-ngon/matrix44.js"></script>
    <script src="js/retro-ngon/ngon_fill.js"></script>
    <script src="js/retro-ngon/render.js"></script>
    <script src="js/retro-ngon/transform.js"></script>
    <script src="js/retro-ngon/texture.js"></script>
    <script src="js/retro-ngon/canvas.js"></script>
    <script src="js/common.js"></script>

**Step 4.** Create a triangle object. We'll assign the triangle a yellow color, and ask it to be drawn with a wireframe around it.

    <script>
        const triangle = Rngon.ngon([Rngon.vertex4(-0.5, -0.5, 0),
                                     Rngon.vertex4(0.5, -0.5, 0),
                                     Rngon.vertex4(0.5, 0.5, 0)],
                                    Rngon.color_rgba(255, 255, 0),
                                    null /*no texture*/,
                                    true /*solid fill*/,
                                    true /*with a wireframe around the triangle*/);

**Step 5.** Render the triangle onto the canvas. Note that we first construct a mesh that acts as a container for the triangle, then pass the mesh to the renderer as the sole entry in an array of meshes. We request the render scale to be 1, which causes the rendering to span all of the canvas's pixels. If we asked for a scale less than 1, the image would be rendered at a resolution of width * scale and height * scale, then upscaled to the dimensions of the canvas. The outcome of this would be a more pixelated look, and also slightly better performance.

        Rngon.render("render-canvas",
                     [Rngon.mesh([triangle])],
                     Rngon.translation_vector(0, 0, 3) /*camera position*/,
                     Rngon.rotation_vector(0, 0, 0)    /*camera direction*/,
                     1 /*scale of the rendered image, relative to the size of the canvas*/);
    </script>

**Step 6.** That's it. When you load the page, you should see a 300 x 300 light gray box with a yellow triangle inside it.

**Step 7.** For added effect, let's make the triangle rotate.

    <script>
        // A function that returns a mesh containing the triangle rotated by a certain amount
        // each successive frame.
        const rotatingTriangle = (frameCount)=>
        {
            const rotationSpeed = 0.01;
            return Rngon.mesh([triangle],
                              Rngon.translation_vector(0, 0, 0),
                              Rngon.rotation_vector(0, (frameCount * rotationSpeed), 0),
                              Rngon.scaling_vector(1, 1, 1));
        };

        // A function that executes repeatedly, at the device's refresh rate. On each execution,
        // the function re-renders the triangle in its new orientation, given the accumulating
        // frame count.
        (function render_loop(frameCount = 0)
        {
            Rngon.render("render-canvas",
                         [rotatingTriangle(frameCount)],
                         Rngon.translation_vector(0, 0, 3));

            window.requestAnimationFrame(()=>render_loop(frameCount + 1));
        })();
    </script>

## Performance
On a modern desktop in Chrome at 1080p with a ¼-x resolution multiplier, the n-gon renderer can just about maintain 60 FPS with the low-polycount 'res4' version of the Stanford bunny (~900 triangles). The renderer's performance is thus not sufficient for high-polycount scenes when fluid, real-time operation is required.

## What's *not* supported?
- Convex n-gons
- Lighting
- Per-vertex attributes
- Perspective-correct texture-mapping
- Frustum clipping
- Depth testing
