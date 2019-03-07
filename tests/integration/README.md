## Integration tests for the retro n-gon renderer

#### How to use
Open the corresponding HTML file in a browser. You'll find a description of what each file does, below.

The tests assume to be located two directories above the renderer's root; e.g. in `rngon/tests/integration/*`.

Depending on your browser, you may need to use a server to access the files, rather than loading them directly from disk. You can do this easily enough locally: e.g. `$ php -S localhost:8000` in the retro n-gon renderer's root to set up a web server on localhost, then access the tests via `localhost:8000/tests/integration/*`.

#### The tests
**[render-output.html](render-output.html)** &mdash; Renders a variety of n-gons and compares the resulting pixel data to reference images of those n-gons, to find whether the renderer is producing the correct output. If the slightest mismatch is found, the page will display a notification. You can also compare the image pairs visually, yourself. **Note:** There may be inherent in the HTML5 canvas slight variations in how images are drawn onto them &ndash; depending on your hardware and operating environment &ndash; resulting in potential false mismatches in the test's automated pixel-by-pixel comparison. I don't know that this would happen, necessarily; but if the test is reporting mismatched image pairs and you see no obvious difference between them, this might be the cause. In that case, you may need to re-generate (i.e. render and save) the reference images on that particular platform.
