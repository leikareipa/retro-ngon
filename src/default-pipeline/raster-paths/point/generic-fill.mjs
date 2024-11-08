/*
 * 2023 ArtisaaniSoft
 * 
 * Software: Retro n-gon renderer
 * 
 */

import {Vertex} from "../../../api/vertex.mjs";

export function point_generic_fill(
    renderContext,
    vertex = Vertex(),
    material = {},
)
{
    const depthBuffer = (renderContext.useDepthBuffer? renderContext.depthBuffer.data : null);
    const renderWidth = renderContext.pixelBuffer.width;
    const x = Math.floor(vertex.x);
    const y = Math.floor(vertex.y);
    const pixelBufferIdx = (x + y * renderWidth);
    const depth = (vertex.z / renderContext.farPlaneDistance);
    const color = material.color;

    if (depthBuffer && (depthBuffer[pixelBufferIdx] <= depth))
    {
        return;
    }
    
    // Rasterize the pixel.
    {
        const shade = vertex.shade;

        if (!material.bypassPixelBuffer)
        {
            const red = (color.red * shade);
            const green = (color.green * shade);
            const blue = (color.blue * shade);

            // If shade is > 1, the color values may exceed 255, in which case we write into
            // the clamped 8-bit view to get 'free' clamping.
            if (shade > 1)
            {
                const idx = (pixelBufferIdx * 4);
                renderContext.pixelBuffer8[idx+0] = red;
                renderContext.pixelBuffer8[idx+1] = green;
                renderContext.pixelBuffer8[idx+2] = blue;
                renderContext.pixelBuffer8[idx+3] = 255;
            }
            else
            {
                renderContext.pixelBuffer32[pixelBufferIdx] = (
                    (255 << 24) +
                    (blue << 16) +
                    (green << 8) +
                    ~~red
                );
            }
        }

        if (depthBuffer)
        {
            depthBuffer[pixelBufferIdx] = depth;
        }
    }

    return true;
}
