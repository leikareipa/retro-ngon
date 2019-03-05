## Performance tests and testers for the retro n-gon renderer

#### How to use

Open the corresponding HTML file in a browser. You'll find a description of what each file does, below.

Note that the tests assume to be located two directories above the renderer's root; e.g. in `rngon/tests/performance/*`, where `rngon/js/*` contains the renderer's JavaScript code.

#### The tests

**[perftest1.html](perftest1.html)** &mdash; Spins _n_ quads on the screen in 320 x 200, each quad taking up a couple % of the screen area, and records the FPS. Includes wireframe, solid, and textured fill modes. Capped at the screen's refresh rate. **Note:** This tester relies on requestAnimationFrame() to spin, so you want to make sure to keep the test running as the top-most tab in your browser. Otherwise, the results may be skewed.

**[perftest2.html](perftest2.html)** &mdash; Renders a version of the Stanford bunny with texturing for _n_ frames at 320 x 200 (upscaled to 1280 x 800), then spells out the FPS at which the renderer ran. **Note:** This test relies on requestAnimationFrame() to spin, so you want to make sure to keep the test running as the top-most tab in your browser, or the results may be skewed.
