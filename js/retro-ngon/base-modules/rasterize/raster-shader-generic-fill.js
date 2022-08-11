/*
 * 2019-2022 Tarpeeksi Hyvae Soft
 * 
 * Software: Retro n-gon renderer
 * 
 */

// No performance-enhancing assumptions are made, so this is the most compatible filler,
// but also potentially the slowest.
export function generic_fill({
    ngon,
    ngonIdx,
    leftEdges,
    rightEdges,
    numLeftEdges,
    numRightEdges,
    pixelBuffer32,
    auxiliaryBuffers
})
{
    const usePalette = Rngon.internalState.usePalette;
    const usePixelShader = Rngon.internalState.usePixelShader;
    const fragmentBuffer = Rngon.internalState.fragmentBuffer.data;
    const depthBuffer = (Rngon.internalState.useDepthBuffer? Rngon.internalState.depthBuffer.data : null);
    const pixelBufferImage = Rngon.internalState.pixelBuffer;
    const pixelBufferClamped8 = pixelBufferImage.data;
    const pixelBufferWidth = pixelBufferImage.width;
    const material = ngon.material;
    const texture = (material.texture || null);
    
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
    
    if (!numLeftEdges || !numRightEdges) return;

    // Note: We assume the n-gon's vertices to be sorted by increasing Y.
    const ngonStartY = leftEdges[0].top;
    const ngonEndY = leftEdges[numLeftEdges-1].bottom;
    
    // Rasterize the n-gon in horizontal pixel spans over its height.
    for (let y = ngonStartY; y < ngonEndY; y++)
    {
        const spanStartX = Math.min(pixelBufferWidth, Math.max(0, Math.round(leftEdge.start.x)));
        const spanEndX = Math.min(pixelBufferWidth, Math.max(0, Math.ceil(rightEdge.start.x)));
        const spanWidth = ((spanEndX - spanStartX) + 1);

        if (spanWidth > 0)
        {
            const deltaDepth = ((rightEdge.start.depth - leftEdge.start.depth) / spanWidth);
            let iplDepth = (leftEdge.start.depth - deltaDepth);

            const deltaShade = ((rightEdge.start.shade - leftEdge.start.shade) / spanWidth);
            let iplShade = (leftEdge.start.shade - deltaShade);

            const deltaU = ((rightEdge.start.u - leftEdge.start.u) / spanWidth);
            let iplU = (leftEdge.start.u - deltaU);

            const deltaV = ((rightEdge.start.v - leftEdge.start.v) / spanWidth);
            let iplV = (leftEdge.start.v - deltaV);

            const deltaInvW = ((rightEdge.start.invW - leftEdge.start.invW) / spanWidth);
            let iplInvW = (leftEdge.start.invW - deltaInvW);

            if (usePixelShader)
            {
                var deltaWorldX = ((rightEdge.start.worldX - leftEdge.start.worldX) / spanWidth);
                var iplWorldX = (leftEdge.start.worldX - deltaWorldX);

                var deltaWorldY = ((rightEdge.start.worldY - leftEdge.start.worldY) / spanWidth);
                var iplWorldY = (leftEdge.start.worldY - deltaWorldY);

                var deltaWorldZ = ((rightEdge.start.worldZ - leftEdge.start.worldZ) / spanWidth);
                var iplWorldZ = (leftEdge.start.worldZ - deltaWorldZ);
            }

            // Assumes the depth buffer consists of 1 element per pixel.
            let pixelBufferIdx = ((spanStartX + y * pixelBufferWidth) - 1);

            // Draw the span into the pixel buffer.
            for (let x = spanStartX; x < spanEndX; x++)
            {
                // Will hold the texture coordinates used if we end up drawing
                // a textured pixel at the current x,y screen location.
                let u = 0.0, v = 0.0;

                // Update values that're interpolated horizontally along the span.
                iplDepth += deltaDepth;
                iplShade += deltaShade;
                iplU += deltaU;
                iplV += deltaV;
                iplInvW += deltaInvW;
                pixelBufferIdx++;

                if (usePixelShader)
                {
                    iplWorldX += deltaWorldX;
                    iplWorldY += deltaWorldY;
                    iplWorldZ += deltaWorldZ;
                }

                const depth = (iplDepth / iplInvW);

                // Depth test.
                if (depthBuffer && (depthBuffer[pixelBufferIdx] <= depth)) continue;

                let shade = (material.renderVertexShade? iplShade  : 1);

                // The color we'll write into the pixel buffer for this pixel; assuming
                // it passes the alpha test, the depth test, etc.
                let red = 0;
                let green = 0;
                let blue = 0;
                let index = 0;

                // Solid fill.
                if (!texture)
                {
                    // Note: We assume that the triangle transformer has already culled away
                    // n-gons whose base color alpha is less than 255; so we don't test for
                    // material.allowAlphaReject.

                    if (material.allowAlphaBlend &&
                        Rngon.baseModules.rasterize.stipple(material.color.alpha, x, y))
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
                                    const signU = Math.sign(u);
                                    const signV = Math.sign(v);
                                    const upperLimit = (1 - Number.EPSILON);

                                    u = Math.max(0, Math.min(Math.abs(u), upperLimit));
                                    v = Math.max(0, Math.min(Math.abs(v), upperLimit));

                                    // Negative UV coordinates flip the texture.
                                    if (signU === -1) u = (upperLimit - u);
                                    if (signV === -1) v = (upperLimit - v);

                                    u *= textureMipLevel.width;
                                    v *= textureMipLevel.height;

                                    break;
                                }
                                case "repeat":
                                {
                                    u -= Math.floor(u);
                                    v -= Math.floor(v);

                                    u *= textureMipLevel.width;
                                    v *= textureMipLevel.height;

                                    // Modulo for power-of-two. This will also flip the texture for
                                    // negative UV coordinates.
                                    u = (u & (textureMipLevel.width - 1));
                                    v = (v & (textureMipLevel.height - 1));

                                    break;
                                }
                                default: Rngon.$throw("Unrecognized UV wrapping mode."); break;
                            }

                            break;
                        }
                        // Affine mapping for wrapping non-power-of-two textures.
                        /// FIXME: This implementation is a bit kludgy.
                        /// TODO: Add clamped UV wrapping mode (we can just use the one for
                        /// power-of-two textures).
                        case "affine-npot":
                        {
                            u = (iplU / iplInvW);
                            v = (iplV / iplInvW);

                            u *= textureMipLevel.width;
                            v *= textureMipLevel.height;
    
                            // Wrap with repetition.
                            /// FIXME: Why do we need to test for UV < 0 even when using positive
                            /// but tiling UV coordinates? Doesn't render properly unless we do.
                            if ((u < 0) ||
                                (v < 0) ||
                                (u >= textureMipLevel.width) ||
                                (v >= textureMipLevel.height))
                            {
                                const uWasNeg = (u < 0);
                                const vWasNeg = (v < 0);
    
                                u = (Math.abs(u) % textureMipLevel.width);
                                v = (Math.abs(v) % textureMipLevel.height);
    
                                if (uWasNeg) u = (textureMipLevel.width - u);
                                if (vWasNeg) v = (textureMipLevel.height - v);
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

                            u = (ngonX * (textureMipLevel.width / spanWidth));
                            v = (ngonY * (textureMipLevel.height / ngonHeight));

                            // The texture image is flipped, so we need to flip V as well.
                            v = (textureMipLevel.height - v);

                            break;
                        }
                        default: Rngon.$throw("Unknown texture-mapping mode."); break;
                    }

                    const texel = textureMipLevel.pixels[(~~u) + (~~v) * textureMipLevel.width];

                    // Make sure we gracefully exit if accessing the texture out of bounds.
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
                        Rngon.baseModules.rasterize.stipple(material.color.alpha, x, y))
                    {
                        continue;
                    }

                    index = texel.index;
                    red   = (texel.red   * material.color.unitRange.red   * shade);
                    green = (texel.green * material.color.unitRange.green * shade);
                    blue  = (texel.blue  * material.color.unitRange.blue  * shade);
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
                                red
                            );
                        }
                    }

                    if (depthBuffer)
                    {
                        depthBuffer[pixelBufferIdx] = depth;
                    }

                    if (usePixelShader)
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
            leftEdge.start.x      += leftEdge.delta.x;
            leftEdge.start.depth  += leftEdge.delta.depth;
            leftEdge.start.shade  += leftEdge.delta.shade;
            leftEdge.start.u      += leftEdge.delta.u;
            leftEdge.start.v      += leftEdge.delta.v;
            leftEdge.start.invW   += leftEdge.delta.invW;

            rightEdge.start.x     += rightEdge.delta.x;
            rightEdge.start.depth += rightEdge.delta.depth;
            rightEdge.start.shade += rightEdge.delta.shade;
            rightEdge.start.u     += rightEdge.delta.u;
            rightEdge.start.v     += rightEdge.delta.v;
            rightEdge.start.invW  += rightEdge.delta.invW;

            if (usePixelShader)
            {
                leftEdge.start.worldX  += leftEdge.delta.worldX;
                leftEdge.start.worldY  += leftEdge.delta.worldY;
                leftEdge.start.worldZ  += leftEdge.delta.worldZ;

                rightEdge.start.worldX += rightEdge.delta.worldX;
                rightEdge.start.worldY += rightEdge.delta.worldY;
                rightEdge.start.worldZ += rightEdge.delta.worldZ;
            }
        }

        // We can move onto the next edge when we're at the end of the current one.
        if (y === (leftEdge.bottom - 1)) leftEdge = leftEdges[++curLeftEdgeIdx];
        if (y === (rightEdge.bottom - 1)) rightEdge = rightEdges[++curRightEdgeIdx];
    }

    return true;
}
