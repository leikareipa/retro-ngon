/*
 * 2023 Tarpeeksi Hyvae Soft
 * 
 * Software: Retro n-gon renderer
 * 
 */

import {Vertex} from "../../../api/vertex.mjs";
import {Color} from "../../../api/color.mjs";

export function line_plain_fill(
    renderContext,
    vert1 = Vertex(),
    vert2 = Vertex(),
    color = Color(),
)
{
    const renderWidth = renderContext.pixelBuffer.width;
    const renderHeight = renderContext.pixelBuffer.height;
    const startX = Math.floor(vert1.x);
    const startY = Math.floor(vert1.y);
    const endX = Math.floor(vert2.x);
    const endY = Math.ceil(vert2.y);
    let lineLength = Math.ceil(Math.sqrt((endX - startX)**2 + (endY - startY)**2));
    const deltaX = ((endX - startX) / lineLength);
    const deltaY = ((endY - startY) / lineLength);
    const color32 = (
        (255 << 24) +
        (color.blue << 16) +
        (color.green << 8) +
        ~~color.red
    );

    // Rasterize the line.
    let i = 0;
    while (lineLength--)
    {
        const realX = (startX + (deltaX * i));
        const realY = (startY + (deltaY * i));
        i++;

        const x = ~~realX;
        const y = ~~realY;
        
        if (
            (x >= 0) &&
            (y >= 0) &&
            (x < renderWidth) &&
            (y < renderHeight)
        ){
            const pixelBufferIdx = (x + y * renderWidth);
            renderContext.pixelBuffer32[pixelBufferIdx] = color32;
        }

    }

    return true;
}
