## Performance tests and testers for the retro n-gon renderer

### How to use

Open the corresponding HTML file (see below) in a browser.

Note that the tests assume to be located one directory above the renderer's root; e.g. in `/ngon/perf-tests/`, where `/ngon/js/` contains the renderer's JavaScript code, etc.

### The tests

**[perftest1.html](perftest1.html)** &mdash; Spins _n_ quads on the screen in 320 x 200, each quad taking about 5% of the screen area, and records the FPS. Includes wireframe, solid, and textured fill modes. Capped at the screen's refresh rate.
