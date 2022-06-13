/*
 * 2019-2022 Tarpeeksi Hyvae Soft
 * 
 * Software: Retro n-gon renderer
 * 
 */

// The n-gon and render state must fulfill the following criteria:
// - No texture
// - No pixel shader
// - No alpha operations
// - No auxiliary buffers
// - Depth buffering enabled
export function plain_solid_fill({
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

    let curLeftEdgeIdx = 0;
    let curRightEdgeIdx = 0;
    let leftEdge = leftEdges[curLeftEdgeIdx];
    let rightEdge = rightEdges[curRightEdgeIdx];
    
    if (!numLeftEdges || !numRightEdges) return;

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

            const deltaInvW = ((rightEdge.start.invW - leftEdge.start.invW) / spanWidth);
            let iplInvW = (leftEdge.start.invW - deltaInvW);

            let pixelBufferIdx = ((spanStartX + y * pixelBufferWidth) - 1);

            // Draw the span into the pixel buffer.
            for (let x = spanStartX; x < spanEndX; x++)
            {
                // Update values that're interpolated horizontally along the span.
                iplDepth += deltaDepth;
                iplShade += deltaShade;
                iplInvW += deltaInvW;
                pixelBufferIdx++;

                const depth = (iplDepth / iplInvW);
                if (depthBuffer[pixelBufferIdx] <= depth) continue;

                // The color we'll write into the pixel buffer for this pixel; assuming
                // it passes the alpha test, the depth test, etc.
                const shade = (material.renderVertexShade? iplShade : 1);
                const red   = (material.color.red   * shade);
                const green = (material.color.green * shade);
                const blue  = (material.color.blue  * shade);

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
            leftEdge.start.invW   += leftEdge.delta.invW;

            rightEdge.start.x     += rightEdge.delta.x;
            rightEdge.start.depth += rightEdge.delta.depth;
            rightEdge.start.shade += rightEdge.delta.shade;
            rightEdge.start.invW  += rightEdge.delta.invW;
        }

        // We can move onto the next edge when we're at the end of the current one.
        if (y === (leftEdge.bottom - 1)) leftEdge = leftEdges[++curLeftEdgeIdx];
        if (y === (rightEdge.bottom - 1)) rightEdge = rightEdges[++curRightEdgeIdx];
    }

    return true;
}
