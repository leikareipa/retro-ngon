/*
 * 2019-2022 Tarpeeksi Hyvae Soft
 * 
 * Software: Retro n-gon renderer
 * 
 */

import {lerp as Lerp} from "../../core/util.js";
import {$throw as Throw} from "../../core/util.js";

export function plain_textured_fill_with_color({
    renderState,
    ngonIdx,
    leftEdges,
    rightEdges,
    numLeftEdges,
    numRightEdges,
    pixelBuffer32,
})
{
    if (!numLeftEdges || !numRightEdges) return true;

    const ngon = renderState.ngonCache.ngons[ngonIdx];
    const usePalette = renderState.usePalette;
    const pixelBufferImage = renderState.pixelBuffer;
    const pixelBufferClamped8 = pixelBufferImage.data;
    const pixelBufferWidth = pixelBufferImage.width;
    const depthBuffer = (renderState.useDepthBuffer? renderState.depthBuffer.data : null);
    const material = ngon.material;
    const texture = (material.texture || null);
    const useBilinearTextureFiltering = (texture && material.textureFiltering === "bilinear");
    
    let textureMipLevel = null;
    let textureMipLevelIdx = 0;
    const numMipLevels = texture.mipLevels.length;
    textureMipLevelIdx = Math.max(0, Math.min((numMipLevels - 1), Math.round((numMipLevels - 1) * ngon.mipLevel)));
    textureMipLevel = texture.mipLevels[textureMipLevelIdx];

    let curLeftEdgeIdx = 0;
    let curRightEdgeIdx = 0;
    let leftEdge = leftEdges[curLeftEdgeIdx];
    let rightEdge = rightEdges[curRightEdgeIdx];

    // Note: We assume the n-gon's vertices to be sorted by increasing Y.
    const ngonStartY = leftEdges[0].top;
    const ngonEndY = leftEdges[numLeftEdges-1].bottom;

    let y = (ngonStartY - 1);
    while (++y < ngonEndY)
    {
        const spanStartX = Math.min(pixelBufferWidth, Math.max(0, Math.round(leftEdge.x)));
        const spanEndX = Math.min(pixelBufferWidth, Math.max(0, Math.ceil(rightEdge.x)));
        const spanWidth = ((spanEndX - spanStartX) + 1);

        if (spanWidth > 0)
        {
            const deltaDepth = ((rightEdge.depth - leftEdge.depth) / spanWidth);
            let iplDepth = (leftEdge.depth - deltaDepth);

            const deltaShade = ((rightEdge.shade - leftEdge.shade) / spanWidth);
            let iplShade = (leftEdge.shade - deltaShade);

            const deltaU = ((rightEdge.u - leftEdge.u) / spanWidth);
            let iplU = (leftEdge.u - deltaU);

            const deltaV = ((rightEdge.v - leftEdge.v) / spanWidth);
            let iplV = (leftEdge.v - deltaV);

            const deltaInvW = ((rightEdge.invW - leftEdge.invW) / spanWidth);
            let iplInvW = (leftEdge.invW - deltaInvW);

            let pixelBufferIdx = ((spanStartX + y * pixelBufferWidth) - 1);

            let x = (spanStartX - 1);
            while (++x < spanEndX)
            {
                // Update values that're interpolated horizontally along the span.
                {
                    iplDepth += deltaDepth;
                    iplShade += deltaShade;
                    iplU += deltaU;
                    iplV += deltaV;
                    iplInvW += deltaInvW;
                    pixelBufferIdx++;
                }

                const depth = (iplDepth / iplInvW);
                if (depthBuffer[pixelBufferIdx] <= depth)
                {
                    continue;
                }

                // Compute texture UV coordinates.
                let u = (iplU / iplInvW);
                let v = (iplV / iplInvW);
                switch (material.uvWrapping)
                {
                    case "clamp":
                    {
                        const upperLimit = (1 - Number.EPSILON);

                        // Negative UV coordinates flip the texture.
                        u = ((u < 0)? (upperLimit + u) : u);
                        v = ((v < 0)? (upperLimit + v) : v);

                        u = (textureMipLevel.width * ((u < 0)? 0 : (u > upperLimit)? upperLimit : u));
                        v = (textureMipLevel.height * ((v < 0)? 0 : (v > upperLimit)? upperLimit : v));

                        break;
                    }
                    case "repeat":
                    {
                        u = (textureMipLevel.width * (u - Math.floor(u)));
                        v = (textureMipLevel.height * (v - Math.floor(v)));

                        const uAbs = Math.abs(u);
                        const vAbs = Math.abs(v);
                        const uFrac = (uAbs - ~~uAbs);
                        const vFrac = (vAbs - ~~vAbs);

                        // Modulo for power-of-two. This will also flip the texture for
                        // negative UV coordinates. Note that we restore the fractional
                        // part, for potential texture filtering etc. later on.
                        u = ((u & (textureMipLevel.width - 1)) + uFrac);
                        v = ((v & (textureMipLevel.height - 1)) + vFrac);

                        break;
                    }
                    default: Throw("Unrecognized UV wrapping mode."); break;
                }

                const texelIdx = (((~~u) + (~~v) * textureMipLevel.width) * 4);
                
                // Draw the pixel.
                {
                    if (usePalette)
                    {
                        pixelBufferClamped8[pixelBufferIdx] = textureMipLevel.pixels[texelIdx];
                    }
                    else
                    {
                        const shade = (material.renderVertexShade? iplShade : 1);
                        let red   = textureMipLevel.pixels[texelIdx + 0];
                        let green = textureMipLevel.pixels[texelIdx + 1];
                        let blue  = textureMipLevel.pixels[texelIdx + 2];

                        if (useBilinearTextureFiltering)
                        {
                            const tx = (u - (u = ~~u));
                            const ty = (v - (v = ~~v));
                            let c10 = (textureMipLevel.pixels[(u + 1) + v * textureMipLevel.width] || texel);
                            let c01 = (textureMipLevel.pixels[u + (v + 1) * textureMipLevel.width] || texel);
                            let c11 = (textureMipLevel.pixels[(u + 1) + (v + 1) * textureMipLevel.width] || texel);

                            if (c10.alpha !== 255) c10 = texel;
                            if (c01.alpha !== 255) c01 = texel;
                            if (c11.alpha !== 255) c11 = texel;
        
                            const cx0 = {
                                red: Lerp(red, c10.red, tx),
                                green: Lerp(green, c10.green, tx),
                                blue: Lerp( blue, c10.blue, tx),
                            };
        
                            const cx1 = {
                                red: Lerp(c01.red, c11.red, tx),
                                green: Lerp(c01.green, c11.green, tx),
                                blue: Lerp(c01.blue, c11.blue, tx),
                            };
        
                            red = (shade * material.color.unitRange.red * Lerp(cx0.red, cx1.red, ty));
                            green = (shade * material.color.unitRange.green * Lerp(cx0.green, cx1.green, ty));
                            blue = (shade * material.color.unitRange.blue * Lerp(cx0.blue, cx1.blue, ty));
                        }
                        else
                        {
                            red   *= (shade * material.color.unitRange.red);
                            green *= (shade * material.color.unitRange.green);
                            blue  *= (shade * material.color.unitRange.blue);
                        }

                        // If shade is > 1, the color values may exceed 255, in which case we write into
                        // the clamped 8-bit view to get 'free' clamping.
                        if (shade > 1)
                        {
                            const idx = (pixelBufferIdx * 4);
                            pixelBufferClamped8[idx+0] = red;
                            pixelBufferClamped8[idx+1] = green;
                            pixelBufferClamped8[idx+2] = blue;
                            pixelBufferClamped8[idx+3] = 255;
                        }
                        else
                        {
                            pixelBuffer32[pixelBufferIdx] = (
                                (255 << 24) +
                                (blue << 16) +
                                (green << 8) +
                                ~~red
                            );
                        }
                    }

                    depthBuffer[pixelBufferIdx] = depth;
                }
            }
        }

        // Update values that're interpolated vertically along the edges.
        {
            leftEdge.x      += leftEdge.delta.x;
            leftEdge.depth  += leftEdge.delta.depth;
            leftEdge.shade  += leftEdge.delta.shade;
            leftEdge.u      += leftEdge.delta.u;
            leftEdge.v      += leftEdge.delta.v;
            leftEdge.invW   += leftEdge.delta.invW;

            rightEdge.x     += rightEdge.delta.x;
            rightEdge.depth += rightEdge.delta.depth;
            rightEdge.shade += rightEdge.delta.shade;
            rightEdge.u     += rightEdge.delta.u;
            rightEdge.v     += rightEdge.delta.v;
            rightEdge.invW  += rightEdge.delta.invW;
        }

        // We can move onto the next edge when we're at the end of the current one.
        if (y === (leftEdge.bottom - 1)) leftEdge = leftEdges[++curLeftEdgeIdx];
        if (y === (rightEdge.bottom - 1)) rightEdge = rightEdges[++curRightEdgeIdx];
    }

    return true;
}
