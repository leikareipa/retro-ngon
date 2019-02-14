# The retro n-gon renderer
A minimalist 3d renderer that draws n-sided polygons (as well as lines and points) onto a user-supplied HTML5 canvas. Its intended use cases include ones where a retro aesthetic is preferred.

You can view a live sample of the renderer's output at [http://tarpeeksihyvaesoft.com/s/retro-ngon/](http://tarpeeksihyvaesoft.com/s/retro-ngon/).

## Usage
An introductory example of the renderer's usage is given in [sample1.html](sample1.html). Its source code walks you through a basic setup for rendering a spinning triangle on screen.

A slightly more involved example is provided in [sample2.html](sample2.html). It renders miscellaneous 3d meshes of varying complexity.

## Performance
The renderer is not intended for real-time display of high-polycount scenes. To maintain 60 FPS on a reasonable desktop system, you'd probably want to keep the polycount under 500.

## What's *not* supported?
- Convex n-gons
- Lighting
- Per-vertex attributes
- Perspective-correct texture-mapping
- Frustum clipping (n-gons behind the camera will result in odd behavior)
- Depth testing
