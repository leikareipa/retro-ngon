/*
 * 2019-2023 Tarpeeksi Hyvae Soft
 * 
 * Software: Retro n-gon renderer
 * 
 */

export function poly_plain_textured_fill({
    renderState,
    ngon,
    leftEdges,
    rightEdges,
    numLeftEdges,
    numRightEdges,
})
{
    if (!numLeftEdges || !numRightEdges) return true;

    const fullInterpolation = renderState.useFullInterpolation;
    const useFragmentBuffer = renderState.useFragmentBuffer;
    const fragments = renderState.fragments;
    const fragmentBuffer = renderState.fragmentBuffer.data;
    const pixelBufferWidth = renderState.pixelBuffer.width;
    const depthBuffer = (renderState.useDepthBuffer? renderState.depthBuffer.data : null);
    const material = ngon.material;
    const texture = (material.texture || null);
    
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

            let pixelBufferIdx = ((spanStartX + y * pixelBufferWidth) - 1);

            let x = (spanStartX - 1);
            let ix = 0;
            while (++x < spanEndX)
            {
                // Update values that're interpolated horizontally along the span.
                const iplDepth = (startDepth + (deltaDepth * ix));
                const iplShade = (startShade + (deltaShade * ix));
                const iplInvW = (startInvW + (deltaInvW * ix));
                const iplU = (startU + (deltaU * ix));
                const iplV = (startV + (deltaV * ix));
                pixelBufferIdx++;
                ix++;

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
                    default: throw new Error("Unrecognized UV wrapping mode."); break;
                }

                const texelIdx = (((~~u) + (~~v) * textureMipLevel.width) * 4);
                
                // Draw the pixel.
                {
                    const shade = (material.renderVertexShade? (iplShade / iplInvW) : 1);
                    const red   = (textureMipLevel.pixels[texelIdx + 0] * shade);
                    const green = (textureMipLevel.pixels[texelIdx + 1] * shade);
                    const blue  = (textureMipLevel.pixels[texelIdx + 2] * shade);

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

                    depthBuffer[pixelBufferIdx] = depth;

                    if (useFragmentBuffer)
                    {
                        const fragment = fragmentBuffer[pixelBufferIdx];
                        fragments.ngon? fragment.ngon = ngon : 1;
                        fragments.textureUScaled? fragment.textureUScaled = ~~u : 1;
                        fragments.textureVScaled? fragment.textureVScaled = ~~v : 1;
                        fragments.shade? fragment.shade = (iplShade / iplInvW) : 1;
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
        }

        // We can move onto the next edge when we're at the end of the current one.
        if (y === (leftEdge.bottom - 1)) leftEdge = leftEdges[++curLeftEdgeIdx];
        if (y === (rightEdge.bottom - 1)) rightEdge = rightEdges[++curRightEdgeIdx];
    }

    return true;
}
