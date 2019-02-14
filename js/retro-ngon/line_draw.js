"use strict";

// Provides functions for drawing lines.
Rngon.line_draw = (()=>
{
    return Object.freeze(
    {
        // Draws a line between the two given vertices into the given array of pixels. It's
        // expected that the pixel array packs the pixels as consecutive RGBA values, each
        // in the range 0..255.
        into_pixel_buffer: function(vert1 = Rngon.vertex4(),
                                    vert2 = Rngon.vertex4(),
                                    pixelBuffer = [],
                                    bufferWidth = 0,
                                    bufferHeight = 0,
                                    lineColor = Rngon.color_rgba(127, 127, 127, 255))
        {
            function put_pixel(x = 0, y = 0)
            {
                if (x < 0 || x >= bufferWidth ||
                   (y < 0 || y >= bufferHeight)) return;

                const idx = ((x + y * bufferWidth) * 4);
                pixelBuffer[idx + 0] = lineColor.red;
                pixelBuffer[idx + 1] = lineColor.green;
                pixelBuffer[idx + 2] = lineColor.blue;
                pixelBuffer[idx + 3] = lineColor.alpha;
            }

            let x0 = Math.floor(vert1.x);
            let y0 = Math.floor(vert1.y);
            const x1 = Math.floor(vert2.x);
            const y1 = Math.floor(vert2.y);

            k_assert((!isNaN(x0) && !isNaN(x1) && !isNaN(y0) && !isNaN(y1)),
                        "Invalid vertex coordinates for line-drawing.")

            // Bresenham line algo. Adapted from https://stackoverflow.com/a/4672319.
            {
                let dx = Math.abs(x1 - x0);
                let dy = Math.abs(y1 - y0);
                const sx = ((x0 < x1)? 1 : -1);
                const sy = ((y0 < y1)? 1 : -1); 
                let err = (((dx > dy)? dx : -dy) / 2);
                
                while (1)
                {
                    put_pixel(x0, y0);

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
        },
        
        // 'Draws' a line between the two given vertices into the given array, such that
        // e.g. the coordinates 5,8 would be represented as array[8] === 5. The yOffset
        // parameter lets you specify a value that'll be subtracted from all y coordinates
        // (i.e. from indices when writing into the array).
        into_array: function(vert1 = Rngon.vertex4(),
                             vert2 = Rngon.vertex4(),
                             array = [],
                             yOffset = 0)
        {
            yOffset = Math.floor(yOffset);

            let x0 = Math.floor(vert1.x);
            let y0 = Math.floor(vert1.y);
            const x1 = Math.floor(vert2.x);
            const y1 = Math.floor(vert2.y);

            k_assert((!isNaN(x0) && !isNaN(x1) && !isNaN(y0) && !isNaN(y1)),
                     "Invalid vertex coordinates for line-drawing.")

            // If true, we won't touch non-null elements in the array. Useful in preventing certain
            // edge rendering errors.
            const noOverwrite = (y1 <= y0);

            // Bresenham line algo. Adapted from https://stackoverflow.com/a/4672319.
            {
                let dx = Math.abs(x1 - x0);
                let dy = Math.abs(y1 - y0);
                const sx = ((x0 < x1)? 1 : -1);
                const sy = ((y0 < y1)? 1 : -1); 
                let err = (((dx > dy)? dx : -dy) / 2);
                
                while (1)
                {
                    // Mark the pixel into the array.
                    if (noOverwrite)
                    {
                        if (array[y0 - yOffset] == null) array[y0 - yOffset] = x0;
                    }
                    else array[y0 - yOffset] = x0;
                    
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
        },
    });
})();
