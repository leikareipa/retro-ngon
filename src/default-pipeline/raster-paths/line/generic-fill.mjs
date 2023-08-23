/*
 * 2023 Tarpeeksi Hyvae Soft
 * 
 * Software: Retro n-gon renderer
 * 
 */

import {Vertex} from "../../../api/vertex.mjs";
import {Color} from "../../../api/color.mjs";

export function line_generic_fill(
    renderState,
    vert1 = Vertex(),
    vert2 = Vertex(),
    color = Color(),
    renderShade = true,
)
{
    const depthBuffer = (renderState.useDepthBuffer? renderState.depthBuffer.data : null);
    const renderWidth = renderState.pixelBuffer.width;
    const renderHeight = renderState.pixelBuffer.height;

    // Interpolated values.
    const startX = Math.floor(vert1.x);
    const startY = Math.floor(vert1.y);
    const endX = Math.floor(vert2.x);
    const endY = Math.ceil(vert2.y);
    let lineLength = Math.ceil(Math.sqrt((endX - startX)**2 + (endY - startY)**2));
    const deltaX = ((endX - startX) / lineLength);
    const deltaY = ((endY - startY) / lineLength);
    const startDepth = (vert1.z / renderState.farPlaneDistance);
    const endDepth = (vert2.z / renderState.farPlaneDistance);
    const deltaDepth = ((endDepth - startDepth) / lineLength);
    const startShade = (renderShade? vert1.shade : 1);
    const endShade = (renderShade? vert2.shade : 1);
    const deltaShade = ((endShade - startShade) / lineLength);

    // Rasterize the line.
    let realX = startX;
    let realY = startY;
    let depth = startDepth;
    let shade = startShade;
    while (lineLength--)
    {
        const x = ~~realX;
        const y = ~~realY;
        const pixelBufferIdx = (x + y * renderWidth);
        
        if (
            (x >= 0) &&
            (y >= 0) &&
            (x < renderWidth) &&
            (y < renderHeight) &&
            (!depthBuffer || (depthBuffer[pixelBufferIdx] > depth))
        ){
            const red = (color.red * shade);
            const green = (color.green * shade);
            const blue = (color.blue * shade);
    
            // If shade is > 1, the color values may exceed 255, in which case we write into
            // the clamped 8-bit view to get 'free' clamping.
            if (shade > 1)
            {
                const idx = (pixelBufferIdx * 4);
                renderState.pixelBuffer8[idx+0] = red;
                renderState.pixelBuffer8[idx+1] = green;
                renderState.pixelBuffer8[idx+2] = blue;
                renderState.pixelBuffer8[idx+3] = 255;
            }
            else
            {
                renderState.pixelBuffer32[pixelBufferIdx] = (
                    (255 << 24) +
                    (blue << 16) +
                    (green << 8) +
                    ~~red
                );
            }

            if (depthBuffer)
            {
                depthBuffer[pixelBufferIdx] = depth;
            }
        }

        realX += deltaX;
        realY += deltaY;
        depth += deltaDepth;
        shade += deltaShade;
    }

    return true;
}
