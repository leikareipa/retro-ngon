/*
 * 2019-2023 ArtisaaniSoft
 * 
 * Software: Retro n-gon renderer
 * 
 */

import {rasterizer} from "../../rasterizer.mjs";

// UV offsets for applying Unreal-style dithered texture filtering.
// See https://www.flipcode.com/archives/Texturing_As_In_Unreal.shtml.
const textureDitherFilterKernel = {
    enabled: [
        [[0.25, 0.00], [0.50, 0.75]],
        [[0.75, 0.50], [0.00, 0.25]],
    ],
    disabled: [
        [[0, 0], [0, 0]],
        [[0, 0], [0, 0]],
    ],
};

export function poly_generic_fill({
    renderContext,
    ngon,
    leftEdges,
    rightEdges,
    numLeftEdges,
    numRightEdges,
})
{
    if (!numLeftEdges || !numRightEdges) return true;

    const fullInterpolation = renderContext.useFullInterpolation;
    const useFragmentBuffer = renderContext.useFragmentBuffer;
    const fragments = renderContext.fragments;
    const fragmentBuffer = renderContext.fragmentBuffer.data;
    const depthBuffer = (renderContext.useDepthBuffer? renderContext.depthBuffer.data : null);
    const pixelBufferWidth = renderContext.pixelBuffer.width;
    const material = ngon.material;
    const texture = (material.texture || null);
    const uvDitherKernel = (
        (texture && (material.textureFiltering === "dither"))
            ? textureDitherFilterKernel.enabled
            : textureDitherFilterKernel.disabled
    );

    let textureMipLevel = null;
    let textureMipLevelIdx = 0;
    if (texture)
    {
        const numMipLevels = texture.mipLevels.length;
        textureMipLevelIdx = Math.max(0, Math.min((numMipLevels - 1), Math.round((numMipLevels - 1) * ngon.mipLevel)));
        textureMipLevel = texture.mipLevels[textureMipLevelIdx];
    }

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
            const leftW = (fullInterpolation? 1 : leftEdge.invW);
            const rightW = (fullInterpolation? 1 : rightEdge.invW);

            const deltaInvW = (fullInterpolation? ((rightEdge.invW - leftEdge.invW) / spanWidth) : 0);
            const startInvW = (fullInterpolation? leftEdge.invW : 1);

            const deltaDepth = ((rightEdge.depth/rightW - leftEdge.depth/leftW) / spanWidth);
            const startDepth = (leftEdge.depth/leftW);

            const deltaShade = ((rightEdge.shade/rightW - leftEdge.shade/leftW) / spanWidth);
            const startShade = (leftEdge.shade/leftW);

            const deltaU = ((rightEdge.u/rightW - leftEdge.u/leftW) / spanWidth);
            const startU = (leftEdge.u/leftW);

            const deltaV = ((rightEdge.v/rightW - leftEdge.v/leftW) / spanWidth);
            const startV = (leftEdge.v/leftW);

            const deltaWorldX = ((rightEdge.worldX/rightW - leftEdge.worldX/leftW) / spanWidth);
            const startWorldX = (leftEdge.worldX/leftW);

            const deltaWorldY = ((rightEdge.worldY/rightW - leftEdge.worldY/leftW) / spanWidth);
            const startWorldY = (leftEdge.worldY/leftW);

            const deltaWorldZ = ((rightEdge.worldZ/rightW - leftEdge.worldZ/leftW) / spanWidth);
            const startWorldZ = (leftEdge.worldZ/leftW);

            const deltaNormalX = ((rightEdge.normalX/rightW - leftEdge.normalX/leftW) / spanWidth);
            const startNormalX = (leftEdge.normalX/leftW);

            const deltaNormalY = ((rightEdge.normalY/rightW - leftEdge.normalY/leftW) / spanWidth);
            const startNormalY = (leftEdge.normalY/leftW);

            const deltaNormalZ = ((rightEdge.normalZ/rightW - leftEdge.normalZ/leftW) / spanWidth);
            const startNormalZ = (leftEdge.normalZ/leftW);

            // Assumes the depth buffer consists of 1 element per pixel.
            let pixelBufferIdx = ((spanStartX + y * pixelBufferWidth) - 1);

            let x = (spanStartX - 1);
            let ix = 0;
            while (++x < spanEndX)
            {
                // Will hold the texture coordinates used if we end up drawing
                // a textured pixel at the current x,y screen location.
                let u = 0.0, v = 0.0;

                // Update values that're interpolated horizontally along the span.
                const iplDepth = (startDepth + (deltaDepth * ix));
                const iplShade = (startShade + (deltaShade * ix));
                const iplU = (startU + (deltaU * ix));
                const iplV = (startV + (deltaV * ix));
                const iplInvW = (startInvW + (deltaInvW * ix));
                const iplWorldX = (startWorldX + (deltaWorldX * ix));
                const iplWorldY = (startWorldY + (deltaWorldY * ix));
                const iplWorldZ = (startWorldZ + (deltaWorldZ * ix));
                const iplNormalX = (startNormalX + (deltaNormalX * ix));
                const iplNormalY = (startNormalY + (deltaNormalY * ix));
                const iplNormalZ = (startNormalZ + (deltaNormalZ * ix));
                pixelBufferIdx++;
                ix++;

                const depth = (iplDepth / iplInvW);
                if (depthBuffer && (depthBuffer[pixelBufferIdx] <= depth))
                {
                    continue;
                }

                let shade = (material.renderVertexShade? (iplShade / iplInvW) : 1);

                // The color we'll write into the pixel buffer for this pixel; assuming
                // it passes the alpha test, the depth test, etc.
                let red = 0;
                let green = 0;
                let blue = 0;

                // Solid fill.
                if (!texture)
                {
                    // Note: We assume that the triangle transformer has already culled away
                    // n-gons whose base color alpha is less than 255; so we don't test for
                    // material.allowAlphaReject.

                    if (material.allowAlphaBlend && rasterizer.stipple_test(material.color.alpha, x, y))
                    {
                        continue;
                    }
                    
                    red   = (material.color.red   * shade);
                    green = (material.color.green * shade);
                    blue  = (material.color.blue  * shade);
                }
                // Textured fill.
                else
                {
                    switch (material.textureMapping)
                    {
                        // Affine mapping for power-of-two textures.
                        case "affine":
                        {
                            u = (iplU / iplInvW);
                            v = (iplV / iplInvW);

                            switch (material.uvWrapping)
                            {
                                case "clamp":
                                {
                                    const upperLimit = (1 - Number.EPSILON);

                                    // Negative UV coordinates flip the texture.
                                    u = ((u < 0)? (upperLimit + u) : u);
                                    v = ((v < 0)? (upperLimit + v) : v);
                            
                                    const ditherOffset = uvDitherKernel[y & 1][x & 1];
                                    u += (ditherOffset[0] / textureMipLevel.width);
                                    v += (ditherOffset[1] / textureMipLevel.height);
                                    
                                    u = (textureMipLevel.width * ((u < 0)? 0 : (u > upperLimit)? upperLimit : u));
                                    v = (textureMipLevel.height * ((v < 0)? 0 : (v > upperLimit)? upperLimit : v));

                                    break;
                                }
                                case "repeat":
                                {
                                    const ditherOffset = uvDitherKernel[y & 1][x & 1];
                                    u += (ditherOffset[0] / textureMipLevel.width);
                                    v += (ditherOffset[1] / textureMipLevel.height);
            
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
                                default: throw new Error("Unrecognized UV wrapping mode."); break;
                            }

                            break;
                        }
                        // Affine mapping for non-power-of-two textures.
                        case "affine-npot":
                        {
                            // When (material.uvWrapping === "clamp").
                            {
                                u = (iplU / iplInvW);
                                v = (iplV / iplInvW);

                                const upperLimit = (1 - Number.EPSILON);

                                // Negative UV coordinates flip the texture.
                                u = ((u < 0)? (upperLimit + u) : u);
                                v = ((v < 0)? (upperLimit + v) : v);
                        
                                const ditherOffset = uvDitherKernel[y & 1][x & 1];
                                u += (ditherOffset[0] / textureMipLevel.width);
                                v += (ditherOffset[1] / textureMipLevel.height);
                                
                                u = (textureMipLevel.width * ((u < 0)? 0 : (u > upperLimit)? upperLimit : u));
                                v = (textureMipLevel.height * ((v < 0)? 0 : (v > upperLimit)? upperLimit : v));
                            }

                            // When (material.uvWrapping === "repeat").
                            {
                                /// TODO.
                            }
                            
                            break;
                        }
                        // Screen-space UV mapping, as used e.g. in the DOS game Rally-Sport.
                        case "ortho":
                        {
                            const ngonHeight = (ngonEndY - ngonStartY);

                            // Pixel coordinates relative to the polygon.
                            const ngonX = (x - spanStartX + 1);
                            const ngonY = (y - ngonStartY + 1);
                            
                            const ditherOffset = uvDitherKernel[y & 1][x & 1];
                            u += ditherOffset[0];
                            v += ditherOffset[1];

                            u = (ngonX * (textureMipLevel.width / spanWidth));
                            v = (ngonY * (textureMipLevel.height / ngonHeight));

                            // The texture image is flipped, so we need to flip V as well.
                            v = (textureMipLevel.height - v);

                            break;
                        }
                        default: throw new Error("Unknown texture-mapping mode."); break;
                    }

                    const texelIdx = (((~~u) + (~~v) * textureMipLevel.width) * 4);

                    if (material.allowAlphaReject && (textureMipLevel.pixels[texelIdx + 3] !== 255))
                    {
                        continue;
                    }

                    if (material.allowAlphaBlend && rasterizer.stipple_test(material.color.alpha, x, y))
                    {
                        continue;
                    }

                    red   = textureMipLevel.pixels[texelIdx + 0];
                    green = textureMipLevel.pixels[texelIdx + 1];
                    blue  = textureMipLevel.pixels[texelIdx + 2];
                }

                // The pixel passed its alpha test, depth test, etc., and should be drawn
                // on screen.
                {
                    red *= (shade * material.color.unitRange.red);
                    green *= (shade * material.color.unitRange.green);
                    blue *= (shade * material.color.unitRange.blue);

                    if (!material.bypassPixelBuffer)
                    {
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

                    if (useFragmentBuffer)
                    {
                        const fragment = fragmentBuffer[pixelBufferIdx];
                        fragments.ngon? fragment.ngon = ngon : 1;
                        fragments.textureUScaled? fragment.textureUScaled = ~~u : 1;
                        fragments.textureVScaled? fragment.textureVScaled = ~~v : 1;
                        fragments.shade? fragment.shade = (iplShade / iplInvW) : 1;
                        fragments.worldX? fragment.worldX = (iplWorldX / iplInvW) : 1;
                        fragments.worldY? fragment.worldY = (iplWorldY / iplInvW) : 1;
                        fragments.worldZ? fragment.worldZ = (iplWorldZ / iplInvW) : 1;
                        fragments.normalX? fragment.normalX = (iplNormalX / iplInvW) : 1;
                        fragments.normalY? fragment.normalY = (iplNormalY / iplInvW) : 1;
                        fragments.normalZ? fragment.normalZ = (iplNormalZ / iplInvW) : 1;
                    }
                }
            }
        }

        // Update values that're interpolated vertically along the edges.
        {
            leftEdge.x       += leftEdge.delta.x;
            leftEdge.depth   += leftEdge.delta.depth;
            leftEdge.shade   += leftEdge.delta.shade;
            leftEdge.u       += leftEdge.delta.u;
            leftEdge.v       += leftEdge.delta.v;
            leftEdge.invW    += leftEdge.delta.invW;
            leftEdge.worldX  += leftEdge.delta.worldX;
            leftEdge.worldY  += leftEdge.delta.worldY;
            leftEdge.worldZ  += leftEdge.delta.worldZ;
            leftEdge.normalX += leftEdge.delta.normalX;
            leftEdge.normalY += leftEdge.delta.normalY;
            leftEdge.normalZ += leftEdge.delta.normalZ;

            rightEdge.x       += rightEdge.delta.x;
            rightEdge.depth   += rightEdge.delta.depth;
            rightEdge.shade   += rightEdge.delta.shade;
            rightEdge.u       += rightEdge.delta.u;
            rightEdge.v       += rightEdge.delta.v;
            rightEdge.invW    += rightEdge.delta.invW;
            rightEdge.worldX  += rightEdge.delta.worldX;
            rightEdge.worldY  += rightEdge.delta.worldY;
            rightEdge.worldZ  += rightEdge.delta.worldZ;
            rightEdge.normalX += rightEdge.delta.normalX;
            rightEdge.normalY += rightEdge.delta.normalY;
            rightEdge.normalZ += rightEdge.delta.normalZ;
        }

        // We can move onto the next edge when we're at the end of the current one.
        if (y === (leftEdge.bottom - 1)) leftEdge = leftEdges[++curLeftEdgeIdx];
        if (y === (rightEdge.bottom - 1)) rightEdge = rightEdges[++curRightEdgeIdx];
    }

    return true;
}
