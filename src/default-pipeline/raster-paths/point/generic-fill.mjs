/*
 * 2023 Tarpeeksi Hyvae Soft
 * 
 * Software: Retro n-gon renderer
 * 
 */

import {Vertex} from "../../../api/vertex.mjs";
import {Color} from "../../../api/color.mjs";

export function point_generic_fill(
    renderState,
    vertex = Vertex(),
    color = Color(),
)
{
    const depthBuffer = (renderState.useDepthBuffer? renderState.depthBuffer.data : null);
    const renderWidth = renderState.pixelBuffer.width;
    const x = Math.floor(vertex.x);
    const y = Math.floor(vertex.y);
    const pixelBufferIdx = (x + y * renderWidth);
    const depth = (vertex.z / renderState.farPlaneDistance);

    if (depthBuffer && (depthBuffer[pixelBufferIdx] <= depth))
    {
        return;
    }
    
    // Rasterize the pixel.
    {
        const shade = vertex.shade;
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

    return true;
}
