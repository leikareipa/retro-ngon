"use strict";

// Provides functions for drawing lines.
Rngon.line_draw = (()=>
{
    return Object.freeze(
    {
        // Draws a line between the two given vertices into the render's pixel buffer. It's
        // expected that the pixel array packs the pixels as consecutive RGBA values, each
        // in the range 0..255. If the 'respectDepth' option is set to true, the line's pixels
        // will be tested against the depth buffer before rendering.
        into_pixel_buffer: function(vert1 = Rngon.vertex(),
                                    vert2 = Rngon.vertex(),
                                    lineColor = Rngon.color_rgba(127, 127, 127, 255),
                                    respectDepth = false)
        {
            const pixelBuffer = Rngon.internalState.pixelBuffer.data;
            const bufferWidth = Rngon.internalState.pixelBuffer.width;
            const bufferHeight = Rngon.internalState.pixelBuffer.height;

            /// TODO: Depth-aware drawing is disabled until a better implementation of it is in place.
            respectDepth = false;

            let x0 = Math.round(vert1.x);
            let y0 = Math.round(vert1.y);
            const x1 = Math.round(vert2.x);
            const y1 = Math.round(vert2.y);
            const lineLength = (respectDepth? this.distanceBetween(x0, y0, x1, y1) : 1);

            // Bresenham line algo. Adapted from https://stackoverflow.com/a/4672319.
            {
                let dx = Math.abs(x1 - x0);
                let dy = Math.abs(y1 - y0);
                const sx = ((x0 < x1)? 1 : -1);
                const sy = ((y0 < y1)? 1 : -1); 
                let err = (((dx > dy)? dx : -dy) / 2);
                
                while (1)
                {
                    const l = (respectDepth? (this.distanceBetween(x1, y1, x0, y0) / (lineLength || 1)) : 1);

                    put_pixel(x0, y0, (respectDepth? Rngon.lerp((vert2.w - 5), (vert1.w - 5), l) : 0));

                    if ((x0 === x1) && (y0 === y1)) break;

                    const e2 = err;
                    if (e2 > -dx)
                    {
                        err -= dy;
                        x0 += sx;
                    }
                    if (e2 < dy)
                    {
                        err += dx;
                        y0 += sy;
                    }
                }
            }

            function put_pixel(x = 0, y = 0, depth = 0)
            {
                if (x < 0 || x >= bufferWidth ||
                   (y < 0 || y >= bufferHeight))
                {
                    return;
                }

                const idx = ((x + y * bufferWidth) * 4);

                if (respectDepth &&
                    (Rngon.internalState.depthBuffer.buffer[idx/4] <= depth))
                {
                    return;
                }

                pixelBuffer[idx + 0] = lineColor.red;
                pixelBuffer[idx + 1] = lineColor.green;
                pixelBuffer[idx + 2] = lineColor.blue;
                pixelBuffer[idx + 3] = lineColor.alpha;
            }
        },

        distanceBetween: function(x1, y1, x2, y2)
        {
            return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
        }
    });
})();
