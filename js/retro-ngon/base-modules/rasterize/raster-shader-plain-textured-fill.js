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
// - Textured
// - White material color
// - Only affine texture-mapping
export function plain_textured_fill({
    ngon,
    leftEdges,
    rightEdges,
    numLeftEdges,
    numRightEdges,
    pixelBuffer32,
})
{
    const pixelBufferClamped8 = Rngon.internalState.pixelBuffer.data;
    const pixelBufferWidth = Rngon.internalState.pixelBuffer.width;
    const depthBuffer = (Rngon.internalState.useDepthBuffer? Rngon.internalState.depthBuffer.data : null);
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

            let pixelBufferIdx = ((spanStartX + y * pixelBufferWidth) - 1);

            // Draw the span into the pixel buffer.
            for (let x = spanStartX; x < spanEndX; x++)
            {
                // Update values that're interpolated horizontally along the span.
                iplDepth += deltaDepth;
                iplShade += deltaShade;
                iplU += deltaU;
                iplV += deltaV;
                iplInvW += deltaInvW;
                pixelBufferIdx++;

                const depth = (iplDepth / iplInvW);
                if (depthBuffer[pixelBufferIdx] <= depth) continue;

                // Texture UV coordinates.
                let u = (iplU / iplInvW);
                let v = (iplV / iplInvW);

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

                const texel = textureMipLevel.pixels[(~~u) + (~~v) * textureMipLevel.width];
                
                // Make sure we gracefully exit if accessing the texture out of bounds.
                if (!texel)
                {
                    continue;
                }

                const shade = (material.renderVertexShade? iplShade : 1);
                const red   = (texel.red   * shade);
                const green = (texel.green * shade);
                const blue  = (texel.blue  * shade);

                depthBuffer[pixelBufferIdx] = depth;

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
