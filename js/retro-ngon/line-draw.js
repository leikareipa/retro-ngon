"use strict";

// Draws a line between the two given vertices into the render's pixel buffer.
// Note that the line will ignore the depth and fragment buffers.
Rngon.line_draw = function(vert1 = Rngon.vertex(),
                           vert2 = Rngon.vertex(),
                           lineColor = Rngon.color_rgba(127, 127, 127, 255))
{
    const pixelBuffer = Rngon.internalState.pixelBuffer.data;
    const bufferWidth = Rngon.internalState.pixelBuffer.width;
    const bufferHeight = Rngon.internalState.pixelBuffer.height;

    let x0 = Math.round(vert1.x);
    let y0 = Math.round(vert1.y);
    const x1 = Math.round(vert2.x);
    const y1 = Math.round(vert2.y);

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

    function put_pixel(x = 0, y = 0)
    {
        if ((x < 0 || x >= bufferWidth) ||
            (y < 0 || y >= bufferHeight))
        {
            return;
        }

        const idx = ((x + y * bufferWidth) * 4);
        pixelBuffer[idx + 0] = lineColor.red;
        pixelBuffer[idx + 1] = lineColor.green;
        pixelBuffer[idx + 2] = lineColor.blue;
        pixelBuffer[idx + 3] = lineColor.alpha;
    }
};
