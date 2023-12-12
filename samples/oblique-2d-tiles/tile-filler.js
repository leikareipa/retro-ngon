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

// Note: Only supports square polygons.
export function tile_filler(renderContext)
{
    const pixelBuffer = renderContext.pixelBuffer.data;
    const renderWidth = renderContext.pixelBuffer.width;
    const renderHeight = renderContext.pixelBuffer.height;
    const leftEdge = {};
    const rightEdge = {};

    for (const ngon of renderContext.screenSpaceNgons)
    {
        const material = ngon.material;
        const texture = material.texture;

        console.assert?.(
            (ngon.vertices.length == 4),
            "Expected four-sided polygons."
        );

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

            for (let y = ngonStartY; y <= ngonEndY; y++)
            {
                // Update values that're interpolated vertically along the edges.
                leftEdge.shade  += leftEdge.shadeDelta;
                rightEdge.shade += rightEdge.shadeDelta;
                
                const spanStartX = ngon.vertices[0].x;
                const spanWidth = texture.width;

                // Bounds-check, since we don't clip vertices to the viewport.
                if (y < 0) continue;
                if (y >= renderHeight) break;

                // Assumes the pixel buffer consists of 4 elements per pixel (e.g. RGBA).
                let pixelBufferIdx = (((spanStartX + y * renderWidth) * 4) - 4);

                // Values interpolated horizontally along the span.
                const shadeDelta = ((rightEdge.shade - leftEdge.shade) / spanWidth);
                let shade = (leftEdge.shade - shadeDelta);
                let texelIdx = (((y - ngonStartY) * texture.width) - 1);

                // Skip the first n non-solid pixels on this horizontal row.
                const firstSolidIdx = texture.firstSolidPixelIdx[y - ngonStartY];
                const lastSolidIdx = texture.lastSolidPixelIdx[y - ngonStartY];
                shade += (shadeDelta * firstSolidIdx);
                pixelBufferIdx += (4 * firstSolidIdx);
                texelIdx += firstSolidIdx;

                // Draw the span into the pixel buffer.
                for (let x = (spanStartX + firstSolidIdx); x <= (spanStartX + lastSolidIdx); x++)
                {
                    // Update interpolated values.
                    shade += shadeDelta;
                    pixelBufferIdx += 4;
                    texelIdx++;

                    // Bounds-check, since we don't clip vertices to the viewport.
                    if (x < 0) continue;
                    if (x >= renderWidth) break;

                    const ti = (texelIdx * 4);

                    if (texture.pixels[ti + 3] !== 255) continue;

                    let red = (texture.pixels[ti + 0] * shade);
                    let green = (texture.pixels[ti + 1] * shade);
                    let blue = (texture.pixels[ti + 2] * shade);

                    if (material.color.alpha < 255)
                    {
                        const prevRed = pixelBuffer[pixelBufferIdx + 0];
                        const prevBlue = pixelBuffer[pixelBufferIdx + 1];
                        const prevGreen = pixelBuffer[pixelBufferIdx + 2];
                        const factor = (material.color.alpha / 255);

                        red = lerp(prevRed, red, factor);
                        green = lerp(prevBlue, green, factor);
                        blue = lerp(prevGreen, blue, factor);
                    }

                    pixelBuffer[pixelBufferIdx + 0] = red;
                    pixelBuffer[pixelBufferIdx + 1] = green;
                    pixelBuffer[pixelBufferIdx + 2] = blue;
                    pixelBuffer[pixelBufferIdx + 3] = 255;
                }
            }
        }
    }

    return;
}

function lerp(x, y, interval)
{
    return (x + (interval * (y - x)));
}
