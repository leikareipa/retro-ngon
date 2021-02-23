/*
 * 2019-2021 Tarpeeksi Hyvae Soft
 * 
 * Software: Retro n-gon renderer
 * 
 * Reimplements the retro n-gon renderer's n-gon rasterizer to work better for
 * rendering oblique 2D tiles.
 * 
 */

"use strict";

export function tile_filler()
{
    const pixelBuffer = Rngon.internalState.pixelBuffer.data;
    const renderWidth = Rngon.internalState.pixelBuffer.width;
    const renderHeight = Rngon.internalState.pixelBuffer.height;
    const leftEdge = {};
    const rightEdge = {};

    for (let n = 0; n < Rngon.internalState.ngonCache.count; n++)
    {
        const ngon = Rngon.internalState.ngonCache.ngons[n];
        const material = ngon.material;
        const texture = material.texture;

        // Define the tile's left and right edges. Later, we'll render the tile
        // as horizontal pixel spans across these edges.
        //
        // We assume the tile to have four vertices in a counter-clockwise order,
        // where vertex #0 is at the top left.
        {
            set_edge_properties(leftEdge, ngon.vertices[0], ngon.vertices[1]);
            set_edge_properties(rightEdge, ngon.vertices[3], ngon.vertices[2]);

            function set_edge_properties(edge, vert1, vert2)
            {
                const startY = vert1.y;
                const endY = vert2.y;
                const edgeHeight = (endY - startY);
                
                const startX = vert1.x;
                const endX = vert2.x;
                const deltaX = ((endX - startX) / edgeHeight);

                const startShade = vert1.shade;
                const deltaShade = ((vert2.shade - vert1.shade) / edgeHeight);

                edge.startY = startY;
                edge.endY = endY;
                edge.startX = startX;
                edge.deltaX = deltaX;
                edge.startShade = startShade;
                edge.deltaShade = deltaShade;
            }
        }

        // Draw the tile as horizontal pixel spans across its left and right edges.
        {
            const ngonStartY = leftEdge.startY;
            const ngonEndY = leftEdge.endY;
            
            for (let y = ngonStartY; y < ngonEndY; y++)
            {
                const spanStartX = leftEdge.startX;
                const spanEndX = rightEdge.startX;

                const spanWidth = ((spanEndX - spanStartX) + 1);
                if (spanWidth < 0) continue;

                // Bounds-check, since we don't clip vertices to the viewport.
                if (y < 0) continue;
                if (y >= renderHeight) break;

                // Assumes the pixel buffer consists of 4 elements per pixel (e.g. RGBA).
                let pixelBufferIdx = (((spanStartX + y * renderWidth) * 4) - 4);

                // Values interpolated horizontally along the span.
                const deltaShade = ((rightEdge.startShade - leftEdge.startShade) / spanWidth);
                let iplShade = (leftEdge.startShade - deltaShade);
                let texelIdx = (((y - ngonStartY) * texture.width) - 1);

                // Draw the span into the pixel buffer.
                for (let x = spanStartX; x < spanEndX; x++)
                {
                    // Update interpolated values.
                    iplShade += deltaShade;
                    pixelBufferIdx += 4;
                    texelIdx++;

                    // Bounds-check, since we don't clip vertices to the viewport.
                    if (x < 0) continue;
                    if (x >= renderWidth) break;

                    const shade = (material.renderVertexShade? iplShade : 1);
                    const texel = texture.pixels[texelIdx];

                    // Make sure we gracefully exit if accessing the texture out of bounds.
                    if (!texel) continue;

                    if (material.allowAlphaReject && (texel.alpha !== 255)) continue;

                    if (material.allowAlphaBlend && (material.color.alpha < 255))
                    {
                        // Full transparency.
                        if (material.color.alpha <= 0)
                        {
                            continue;
                        }
                        // Partial transparency.
                        else
                        {
                            const stipplePatternIdx = Math.floor(material.color.alpha / (256 / Rngon.ngon_filler.stipple_patterns.length));
                            const stipplePattern    = Rngon.ngon_filler.stipple_patterns[stipplePatternIdx];
                            const stipplePixelIdx   = ((x % stipplePattern.width) + (y % stipplePattern.height) * stipplePattern.width);

                            // Reject by stipple pattern.
                            if (stipplePattern.pixels[stipplePixelIdx]) continue;
                        }   
                    }

                    // Draw the pixel.
                    pixelBuffer[pixelBufferIdx + 0] = (texel.red   * shade);
                    pixelBuffer[pixelBufferIdx + 1] = (texel.green * shade);
                    pixelBuffer[pixelBufferIdx + 2] = (texel.blue  * shade);
                    pixelBuffer[pixelBufferIdx + 3] = 255;
                }

                // Update values that're interpolated vertically along the edges.
                leftEdge.startX      += leftEdge.deltaX;
                leftEdge.startShade  += leftEdge.deltaShade;
                rightEdge.startX     += rightEdge.deltaX;
                rightEdge.startShade += rightEdge.deltaShade;
            }
        }
    }

    return;
}
