"use strict";

// Provides functions for drawing lines.
Rngon.line_draw = (()=>
{
    return Object.freeze(
    {
        // Draws a line between the two given vertices into the given array of pixels. It's
        // expected that the pixel array packs the pixels as consecutive RGBA values, each
        // in the range 0..255.
        into_pixel_buffer: function(vert1 = Rngon.vertex(),
                                    vert2 = Rngon.vertex(),
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

            Rngon.assert && (!isNaN(x0) && !isNaN(x1) && !isNaN(y0) && !isNaN(y1))
                         || Rngon.throw("Invalid vertex coordinates for line-drawing.");

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
        // e.g. the coordinates 5,8 would be represented as array[8].x === 5. The yOffset
        // parameter lets you specify a value that'll be subtracted from all y coordinates
        // (i.e. from indices when writing into the array). Will interpolate the vertices'
        // u,v coordinates, as well, and place them into array[].u and array[].v.
        into_array: function(vert1 = Rngon.vertex(),
                             vert2 = Rngon.vertex(),
                             array = [],
                             yOffset = 0)
        {
            yOffset = Math.floor(yOffset);

            let x0 = Math.floor(vert1.x);
            let y0 = Math.floor(vert1.y);
            const x1 = Math.floor(vert2.x);
            const y1 = Math.floor(vert2.y);

            Rngon.assert && (!isNaN(x0) &&
                             !isNaN(x1) &&
                             !isNaN(y0) &&
                             !isNaN(y1))
                         || Rngon.throw("Invalid vertex coordinates for line-drawing.");

            const lineLength = distanceBetween(x0, y0, x1, y1);

            // If true, we won't touch non-null elements in the array. Useful in preventing certain
            // edge-rendering errors.
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
                    {
                        // Interpolate select parameters.
                        const l = (distanceBetween(x1, y1, x0, y0) / (lineLength||1));
                        const u = (Rngon.internalState.usePerspectiveCorrectTexturing? Rngon.lerp((vert2.u / vert2.w), (vert1.u / vert1.w), l)
                                                                                     : Rngon.lerp(vert2.u, vert1.u, l));
                        const v = (Rngon.internalState.usePerspectiveCorrectTexturing? Rngon.lerp((vert2.v / vert2.w), (vert1.v / vert1.w), l)
                                                                                     : Rngon.lerp(vert2.v, vert1.v, l));
                        const depth = (Rngon.internalState.useDepthBuffer? Rngon.lerp(vert2.w, vert1.w, l)
                                                                         : 0);
                        const uvw = (Rngon.internalState.usePerspectiveCorrectTexturing? Rngon.lerp((1 / vert2.w), (1 / vert1.w), l)
                                                                                       : 1);

                        const pixel = {x:x0, u, v, depth, uvw};

                        if (noOverwrite)
                        {
                            if (array[y0 - yOffset] == null) array[y0 - yOffset] = pixel;
                        }
                        else array[y0 - yOffset] = pixel;
                    }
                    
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

            function distanceBetween(x1, y1, x2, y2)
            {
                return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
            }
        },
    });
})();
