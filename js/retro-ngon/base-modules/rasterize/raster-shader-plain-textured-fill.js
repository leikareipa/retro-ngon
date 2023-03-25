/*
 * 2019-2022 Tarpeeksi Hyvae Soft
 * 
 * Software: Retro n-gon renderer
 * 
 */

// The n-gon and render state must fulfill the following criteria:
// - Depth buffering enabled
// - No pixel shader
// - No alpha operations
// - Textured, the texture resolution being power of two
// - White material color
// - Affine texture-mapping
export function plain_textured_fill({
    ngon,
    leftEdges,
    rightEdges,
    numLeftEdges,
    numRightEdges,
    pixelBuffer32,
})
{
    const usePalette = Rngon.state.active.usePalette;
    const pixelBufferImage = Rngon.state.active.pixelBuffer;
    const pixelBufferClamped8 = pixelBufferImage.data;
    const pixelBufferWidth = pixelBufferImage.width;
    const depthBuffer = (Rngon.state.active.useDepthBuffer? Rngon.state.active.depthBuffer.data : null);
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

    let y = (ngonStartY - 1);
    while (++y < ngonEndY)
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

                        // Modulo for power-of-two. This will also flip the texture for
                        // negative UV coordinates.
                        u = (u & (textureMipLevel.width - 1));
                        v = (v & (textureMipLevel.height - 1));

                        break;
                    }
                    default: Rngon.$throw("Unrecognized UV wrapping mode."); break;
                }

                const texel = textureMipLevel.pixels[(~~u) + (~~v) * textureMipLevel.width];
                
                // Gracefully handle attempts to access the texture out of bounds.
                if (!texel)
                {
                    continue;
                }

                // Draw the pixel.
                {
                    if (usePalette)
                    {
                        pixelBufferClamped8[pixelBufferIdx] = texel.color.index;
                    }
                    else
                    {
                        const shade = (material.renderVertexShade? iplShade : 1);
                        const red   = (texel.red   * shade);
                        const green = (texel.green * shade);
                        const blue  = (texel.blue  * shade);

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

                    depthBuffer[pixelBufferIdx] = depth;
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
        }

        // We can move onto the next edge when we're at the end of the current one.
        if (y === (leftEdge.bottom - 1)) leftEdge = leftEdges[++curLeftEdgeIdx];
        if (y === (rightEdge.bottom - 1)) rightEdge = rightEdges[++curRightEdgeIdx];
    }

    return true;
}
