## Integration tests for the retro n-gon renderer

### How to use
Open the corresponding HTML file in a browser. You'll find a description of what each file does, below.

The tests assume to be located two directories above the renderer's root; e.g. in `rngon/tests/integration/*`.

Depending on your browser, you may need to use a server to access the files, rather than loading them directly from disk. You can do this easily enough locally: e.g. `$ php -S localhost:8000` in the retro n-gon renderer's root to set up a web server on localhost, then access the tests via `localhost:8000/tests/integration/*`.

### The tests
#### [render-output.html](render-output.html)
Renders a variety of n-gons and compares the resulting pixel data to pre-rendered reference images of those n-gons to find whether the renderer is producing the expected output. If the slightest mismatch is found, the page will display a notification. You can also compare the image pairs by eye.

**Note:** Since different browsers and/or hardware configurations can produce slightly different results when rendering onto the HTML5 canvas, you may find that you need to re-generate the reference images ("reference-*.png" found under the ./render-output/ directory) for the system you plan to be running the tests on. To do this, simply open the test's HTML file as instructed, above, and save the generated renderings (e.g. via the right-click menu for each rendered image) into the corresponding PNG files.

- Each reference image is identified by a code, which is given in its file name. For instance, "reference-abcd.png" is identified by the code "abcd". To find which reference image a particular rendering should be matched with, hover the mouse cursor over the rendered image, and the code should appear in a tooltip.
