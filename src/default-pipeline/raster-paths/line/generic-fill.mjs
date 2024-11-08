/*
 * 2023 ArtisaaniSoft
 * 
 * Software: Retro n-gon renderer
 * 
 */

import {Vertex} from "../../../api/vertex.mjs";

export function line_generic_fill(
    renderContext,
    vert1 = Vertex(),
    vert2 = Vertex(),
    material = {},
)
{
    const color = material.wireframeColor;

    if (
        material.allowAlphaReject &&
        (color.alpha < 255)
    ){
        return true;
    }

    const depthBuffer = (renderContext.useDepthBuffer? renderContext.depthBuffer.data : null);
    const renderWidth = renderContext.pixelBuffer.width;
    const renderHeight = renderContext.pixelBuffer.height;
    const useFragmentBuffer = renderContext.useFragmentBuffer;
    const fragmentBuffer = renderContext.fragmentBuffer.data;
    const fragments = renderContext.fragments;
    
    let ngon = undefined;
    if (useFragmentBuffer && fragments.ngon) {
        ngon = Rngon.ngon([vert1, vert2], material);
    }

    // Interpolated values.
    const startX = Math.floor(vert1.x);
    const startY = Math.floor(vert1.y);
    const endX = Math.floor(vert2.x);
    const endY = Math.ceil(vert2.y);
    let lineLength = Math.ceil(Math.sqrt((endX - startX)**2 + (endY - startY)**2));
    const deltaX = ((endX - startX) / lineLength);
    const deltaY = ((endY - startY) / lineLength);
    const startDepth = (vert1.z / renderContext.farPlaneDistance);
    const endDepth = (vert2.z / renderContext.farPlaneDistance);
    const deltaDepth = ((endDepth - startDepth) / lineLength);
    const startShade = (material.renderVertexShade? vert1.shade : 1);
    const endShade = (material.renderVertexShade? vert2.shade : 1);
    const deltaShade = ((endShade - startShade) / lineLength);

    // Rasterize the line.
    let i = 0;
    while (lineLength--)
    {
        const realX = (startX + (deltaX * i));
        const realY = (startY + (deltaY * i));
        const depth = (startDepth + (deltaDepth * i));
        const shade = (startShade + (deltaShade * i));
        i++;

        const x = ~~realX;
        const y = ~~realY;
        const pixelBufferIdx = (x + y * renderWidth);
        
        if (
            (x >= 0) &&
            (y >= 0) &&
            (x < renderWidth) &&
            (y < renderHeight) &&
            (!depthBuffer || (depthBuffer[pixelBufferIdx] >= depth))
        ){
            const red = (color.red * shade);
            const green = (color.green * shade);
            const blue = (color.blue * shade);
            
            if (!material.bypassPixelBuffer)
            {
                // If shade is > 1, the color values may exceed 255, in which case
                // we write into the clamped 8-bit view to get 'free' clamping.
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

            if (useFragmentBuffer && fragments.ngon)
            {
                fragmentBuffer[pixelBufferIdx].ngon = ngon;
            }
        }
    }

    return true;
}
