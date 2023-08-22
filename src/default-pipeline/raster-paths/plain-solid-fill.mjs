/*
 * 2019-2022 Tarpeeksi Hyvae Soft
 * 
 * Software: Retro n-gon renderer
 * 
 */

export function plain_solid_fill({
    renderState,
    ngonIdx,
    leftEdges,
    rightEdges,
    numLeftEdges,
    numRightEdges,
    pixelBuffer32,
})
{
    const ngon = renderState.ngonCache.ngons[ngonIdx];
    const fullInterpolation = renderState.useFullInterpolation;
    const useFragmentBuffer = renderState.useFragmentBuffer;
    const fragments = renderState.fragments;
    const fragmentBuffer = renderState.fragmentBuffer.data;
    const pixelBufferImage = renderState.pixelBuffer;
    const pixelBufferClamped8 = pixelBufferImage.data;
    const pixelBufferWidth = pixelBufferImage.width;
    const depthBuffer = (renderState.useDepthBuffer? renderState.depthBuffer.data : null);
    const material = ngon.material;

    let curLeftEdgeIdx = 0;
    let curRightEdgeIdx = 0;
    let leftEdge = leftEdges[curLeftEdgeIdx];
    let rightEdge = rightEdges[curRightEdgeIdx];
    
    if (!numLeftEdges || !numRightEdges) return;

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
            let iplInvW = (fullInterpolation? (leftEdge.invW - deltaInvW) : 1);

            const deltaDepth = ((rightEdge.depth/rightW - leftEdge.depth/leftW) / spanWidth);
            let iplDepth = (leftEdge.depth/leftW - deltaDepth);

            const deltaShade = ((rightEdge.shade - leftEdge.shade) / spanWidth);
            let iplShade = (leftEdge.shade - deltaShade);

            let pixelBufferIdx = ((spanStartX + y * pixelBufferWidth) - 1);

            let x = (spanStartX - 1);
            while (++x < spanEndX)
            {
                // Update values that're interpolated horizontally along the span.
                {
                    iplDepth += deltaDepth;
                    iplShade += deltaShade;
                    iplInvW += deltaInvW;
                    pixelBufferIdx++;
                }

                const depth = (iplDepth / iplInvW);
                if (depthBuffer[pixelBufferIdx] <= depth) 
                {
                    continue;
                }

                // Draw the pixel.
                {
                    // The color we'll write into the pixel buffer for this pixel; assuming
                    // it passes the alpha test, the depth test, etc.
                    const shade = (material.renderVertexShade? iplShade : 1);
                    const red   = (material.color.red   * shade);
                    const green = (material.color.green * shade);
                    const blue  = (material.color.blue  * shade);

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

                    depthBuffer[pixelBufferIdx] = depth;

                    if (useFragmentBuffer)
                    {
                        const fragment = fragmentBuffer[pixelBufferIdx];
                        fragments.ngon? fragment.ngon = ngon : 1;
                        fragments.shade? fragment.shade = iplShade : 1;
                    }
                }
            }
        }

        // Update values that're interpolated vertically along the edges.
        {
            leftEdge.x      += leftEdge.delta.x;
            leftEdge.depth  += leftEdge.delta.depth;
            leftEdge.shade  += leftEdge.delta.shade;
            leftEdge.invW   += leftEdge.delta.invW;

            rightEdge.x     += rightEdge.delta.x;
            rightEdge.depth += rightEdge.delta.depth;
            rightEdge.shade += rightEdge.delta.shade;
            rightEdge.invW  += rightEdge.delta.invW;
        }

        // We can move onto the next edge when we're at the end of the current one.
        if (y === (leftEdge.bottom - 1)) leftEdge = leftEdges[++curLeftEdgeIdx];
        if (y === (rightEdge.bottom - 1)) rightEdge = rightEdges[++curRightEdgeIdx];
    }

    return true;
}
