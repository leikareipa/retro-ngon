/*
 * 2019-2022 Tarpeeksi Hyvae Soft
 * 
 * Software: Retro n-gon renderer
 * 
 */

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

// No performance-enhancing assumptions are made, so this is the most compatible filler,
// but also potentially the slowest.
export function generic_fill({
    ngonIdx,
    leftEdges,
    rightEdges,
    numLeftEdges,
    numRightEdges,
    pixelBuffer32,
    auxiliaryBuffers
})
{
    if (!numLeftEdges || !numRightEdges) return true;

    const ngon = Rngon.state.active.ngonCache.ngons[ngonIdx];
    const usePalette = Rngon.state.active.usePalette;
    const useFragmentBuffer = Rngon.state.active.useFragmentBuffer;
    const fragmentBuffer = Rngon.state.active.fragmentBuffer.data;
    const depthBuffer = (Rngon.state.active.useDepthBuffer? Rngon.state.active.depthBuffer.data : null);
    const pixelBufferImage = Rngon.state.active.pixelBuffer;
    const pixelBufferClamped8 = pixelBufferImage.data;
    const pixelBufferWidth = pixelBufferImage.width;
    const material = ngon.material;
    const texture = (material.texture || null);
    const useBilinearTextureFiltering = (texture && material.textureFiltering === "bilinear");
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

            if (useFragmentBuffer)
            {
                var deltaWorldX = ((rightEdge.worldX - leftEdge.worldX) / spanWidth);
                var iplWorldX = (leftEdge.worldX - deltaWorldX);

                var deltaWorldY = ((rightEdge.worldY - leftEdge.worldY) / spanWidth);
                var iplWorldY = (leftEdge.worldY - deltaWorldY);

                var deltaWorldZ = ((rightEdge.worldZ - leftEdge.worldZ) / spanWidth);
                var iplWorldZ = (leftEdge.worldZ - deltaWorldZ);
            }

            // Assumes the depth buffer consists of 1 element per pixel.
            let pixelBufferIdx = ((spanStartX + y * pixelBufferWidth) - 1);

            let x = (spanStartX - 1);
            while (++x < spanEndX)
            {
                // Will hold the texture coordinates used if we end up drawing
                // a textured pixel at the current x,y screen location.
                let u = 0.0, v = 0.0;

                // Update values that're interpolated horizontally along the span.
                {
                    iplDepth += deltaDepth;
                    iplShade += deltaShade;
                    iplU += deltaU;
                    iplV += deltaV;
                    iplInvW += deltaInvW;
                    pixelBufferIdx++;
                }

                if (useFragmentBuffer)
                {
                    iplWorldX += deltaWorldX;
                    iplWorldY += deltaWorldY;
                    iplWorldZ += deltaWorldZ;
                }

                const depth = (iplDepth / iplInvW);
                if (depthBuffer && (depthBuffer[pixelBufferIdx] <= depth))
                {
                    continue;
                }

                let shade = (material.renderVertexShade? iplShade  : 1);

                // The color we'll write into the pixel buffer for this pixel; assuming
                // it passes the alpha test, the depth test, etc.
                let red = 0;
                let green = 0;
                let blue = 0;
                let index = 0;
                let texel = undefined;

                // Solid fill.
                if (!texture)
                {
                    // Note: We assume that the triangle transformer has already culled away
                    // n-gons whose base color alpha is less than 255; so we don't test for
                    // material.allowAlphaReject.

                    if (material.allowAlphaBlend &&
                        Rngon.defaultPipeline.rasterizer.stipple(material.color.alpha, x, y))
                    {
                        continue;
                    }
                    
                    index = material.color.index;
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
                                default: Rngon.$throw("Unrecognized UV wrapping mode."); break;
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
                        default: Rngon.$throw("Unknown texture-mapping mode."); break;
                    }

                    texel = textureMipLevel.pixels[(~~u) + (~~v) * textureMipLevel.width];

                    // Gracefully handle attempts to access the texture out of bounds.
                    if (!texel)
                    {
                        continue;
                    }

                    if (material.allowAlphaReject &&
                        (texel.alpha !== 255))
                    {
                        continue;
                    }

                    if (material.allowAlphaBlend &&
                        Rngon.defaultPipeline.rasterizer.stipple(material.color.alpha, x, y))
                    {
                        continue;
                    }

                    index = texel.index;
                    red   = texel.red;
                    green = texel.green;
                    blue  = texel.blue;
                }

                // The pixel passed its alpha test, depth test, etc., and should be drawn
                // on screen.
                {
                    if (usePalette)
                    {
                        pixelBufferClamped8[pixelBufferIdx] = index;
                    }
                    else
                    {
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
                                red: Rngon.lerp(red, c10.red, tx),
                                green: Rngon.lerp(green, c10.green, tx),
                                blue: Rngon.lerp( blue, c10.blue, tx),
                            };
        
                            const cx1 = {
                                red: Rngon.lerp(c01.red, c11.red, tx),
                                green: Rngon.lerp(c01.green, c11.green, tx),
                                blue: Rngon.lerp(c01.blue, c11.blue, tx),
                            };
        
                            red = (shade * material.color.unitRange.red * Rngon.lerp(cx0.red, cx1.red, ty));
                            green = (shade * material.color.unitRange.green * Rngon.lerp(cx0.green, cx1.green, ty));
                            blue = (shade * material.color.unitRange.blue * Rngon.lerp(cx0.blue, cx1.blue, ty));
                        }
                        else
                        {
                            red *= (shade * material.color.unitRange.red);
                            green *= (shade * material.color.unitRange.green);
                            blue *= (shade * material.color.unitRange.blue);
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

                    if (depthBuffer)
                    {
                        depthBuffer[pixelBufferIdx] = depth;
                    }

                    if (useFragmentBuffer)
                    {
                        const fragment = fragmentBuffer[pixelBufferIdx];
                        fragment.ngonIdx = ngonIdx;
                        fragment.textureUScaled = ~~u;
                        fragment.textureVScaled = ~~v;
                        fragment.depth = (iplDepth / iplInvW);
                        fragment.shade = iplShade;
                        fragment.worldX = (iplWorldX / iplInvW);
                        fragment.worldY = (iplWorldY / iplInvW);
                        fragment.worldZ = (iplWorldZ / iplInvW);
                        fragment.w = (1 / iplInvW);
                    }

                    for (let b = 0; b < auxiliaryBuffers.length; b++)
                    {
                        if (material.auxiliary[auxiliaryBuffers[b].property] !== null)
                        {
                            // Buffers are expected to consist of one element per pixel.
                            auxiliaryBuffers[b].buffer[pixelBufferIdx] = material.auxiliary[auxiliaryBuffers[b].property];
                        }
                    }
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

            if (useFragmentBuffer)
            {
                leftEdge.worldX  += leftEdge.delta.worldX;
                leftEdge.worldY  += leftEdge.delta.worldY;
                leftEdge.worldZ  += leftEdge.delta.worldZ;

                rightEdge.worldX += rightEdge.delta.worldX;
                rightEdge.worldY += rightEdge.delta.worldY;
                rightEdge.worldZ += rightEdge.delta.worldZ;
            }
        }

        // We can move onto the next edge when we're at the end of the current one.
        if (y === (leftEdge.bottom - 1)) leftEdge = leftEdges[++curLeftEdgeIdx];
        if (y === (rightEdge.bottom - 1)) rightEdge = rightEdges[++curRightEdgeIdx];
    }

    return true;
}