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

            let x0 = Math.ceil(vert1.x);
            let y0 = Math.ceil(vert1.y);
            const x1 = Math.ceil(vert2.x);
            const y1 = Math.ceil(vert2.y);
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
            yOffset = Math.ceil(yOffset);

            let x0 = Math.ceil(vert1.x);
            let y0 = Math.ceil(vert1.y);
            const x1 = Math.ceil(vert2.x);
            const y1 = Math.ceil(vert2.y);
            const interpolatePerspective = Rngon.internalState.usePerspectiveCorrectTexturing;
            const lineLength = this.distanceBetween(x0, y0, x1, y1);

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
                    if (!noOverwrite || (array[y0 - yOffset] == null))
                    {
                        // Interpolate select parameters.
                        const l = (this.distanceBetween(x1, y1, x0, y0) / (lineLength || 1));
                        const pixel =
                        {
                            x: x0,
                            depth: (Rngon.internalState.useDepthBuffer? Rngon.lerp(vert2.z, vert1.z, l) : 0),
                            uvw: (interpolatePerspective? Rngon.lerp((1 / vert2.w), (1 / vert1.w), l) : 1),
                            u: (interpolatePerspective? Rngon.lerp((vert2.u / vert2.w), (vert1.u / vert1.w), l) : Rngon.lerp(vert2.u, vert1.u, l)),
                            v: (interpolatePerspective? Rngon.lerp((vert2.v / vert2.w), (vert1.v / vert1.w), l) : Rngon.lerp(vert2.v, vert1.v, l)),
                        };

                        array[y0 - yOffset] = pixel;
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
        },

        distanceBetween: function(x1, y1, x2, y2)
        {
            return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
        }
    });
})();
