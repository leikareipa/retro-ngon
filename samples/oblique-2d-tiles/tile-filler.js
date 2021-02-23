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
                const edgeHeight = (vert2.y - vert1.y);
                const shade = vert1.shade;
                const shadeDelta = ((vert2.shade - vert1.shade) / edgeHeight);

                edge.shade = (material.renderVertexShade? (shade - shadeDelta) : 1);
                edge.shadeDelta = (material.renderVertexShade? shadeDelta : 0);
            }
        }

        // Draw the tile as horizontal pixel spans across its left and right edges.
        {
            const ngonStartY = ngon.vertices[0].y;
            const ngonEndY = ngon.vertices[1].y;

            for (let y = ngonStartY; y < ngonEndY; y++)
            {
                // Update values that're interpolated vertically along the edges.
                leftEdge.shade  += leftEdge.shadeDelta;
                rightEdge.shade += rightEdge.shadeDelta;
                
                const spanStartX = ngon.vertices[0].x;
                const spanEndX = ngon.vertices[3].x;

                const spanWidth = ((spanEndX - spanStartX) + 1);
                if (spanWidth < 0) continue;

                // Bounds-check, since we don't clip vertices to the viewport.
                if (y < 0) continue;
                if (y >= renderHeight) break;

                // Assumes the pixel buffer consists of 4 elements per pixel (e.g. RGBA).
                let pixelBufferIdx = (((spanStartX + y * renderWidth) * 4) - 4);

                // Values interpolated horizontally along the span.
                const shadeDelta = ((rightEdge.shade - leftEdge.shade) / spanWidth);
                let shade = (leftEdge.shade - shadeDelta);
                let texelIdx = (((y - ngonStartY) * texture.width) - 1);

                // Draw the span into the pixel buffer.
                for (let x = spanStartX; x < spanEndX; x++)
                {
                    // Update interpolated values.
                    shade += shadeDelta;
                    pixelBufferIdx += 4;
                    texelIdx++;

                    // Bounds-check, since we don't clip vertices to the viewport.
                    if (x < 0) continue;
                    if (x >= renderWidth) break;

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
            }
        }
    }

    return;
}
