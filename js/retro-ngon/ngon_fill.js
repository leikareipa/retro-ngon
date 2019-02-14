/*
 * Tarpeeksi Hyvae Soft 2019 /
 * Retro n-gon renderer
 * 
 */

"use strict";

// Rasterizes the given ngon through the given render context. The given width and height
// should match the dimensions of the context.
Rngon.ngon_filler = function(ngons = [], renderContext, renderWidth, renderHeight)
{
    k_assert((ngons instanceof Array), "Expected an array of ngons to be rasterized.");
    k_assert((renderContext instanceof CanvasRenderingContext2D), "Expected a 2d canvas render context for the ngon filler.");
    k_assert(((renderWidth > 0) && (renderHeight > 0)), "The transform surface can't have zero width or height.");
    if (ngons.length === 0) return;

    // We'll rasterize the ngon on top of whatever else exists in the context's
    // pixel array.
    const pixelMap = renderContext.getImageData(0, 0, renderWidth, renderHeight);

    ngons.forEach((ngon)=>
    {
        // Deal with ngons that have fewer than 3 vertices.
        switch (ngon.vertices.length)
        {
            case 0: k_assert(0, "Received an n-gon with no vertices. Can't deal with it."); return;

            // A single point.
            case 1:
            {
                const idx = ((Math.floor(ngon.vertices[0].x) + Math.floor(ngon.vertices[0].y) * renderWidth) * 4);
                pixelMap.data[idx + 0] = ngon.color.red;
                pixelMap.data[idx + 1] = ngon.color.green;
                pixelMap.data[idx + 2] = ngon.color.blue;
                pixelMap.data[idx + 3] = ngon.color.alpha;

                // Move on to the next iteration in the forEach() chain.
                return;
            }

            // A line segment.
            case 2:
            {
                Rngon.line_draw.into_pixel_buffer(ngon.vertices[0], ngon.vertices[1], pixelMap.data, renderWidth, renderHeight, ngon.color)
                return;
            }

            // If the ngon has more than 2 vertices, fall through to the code below the switch block.
            default: break;
        }

        // Find which of the ngon's vertices form the ngon's left side and which the right.
        // With that information, we can then fill in the horizontal pixel spans between them.
        // The vertices will be arranged such that the first entry in the 'left' list will be the
        // ngon's top-most (lowest y) vertex, and entries after that successively higher in y.
        // For the 'right' list, the first entry will be the ngon's bottom-most vertex, and
        // entries following successively lower in y. In other words, by tracing the vertices
        // first through 'left' and then 'right', you end up with an anti-clockwise loop around
        // the ngon.
        const verts = ngon.vertices.slice();
        const leftVerts = [];
        const rightVerts = [];
        {
            // Sort the vertices by height (i.e. by increasing y).
            verts.sort((vertA, vertB)=>((vertA.y === vertB.y)? 0 : ((vertA.y < vertB.y)? -1 : 1)));
            const topVert = verts[0];
            const bottomVert = verts[verts.length-1];

            // The left side will always start with the top-most vertex, and the right side with
            // the bottom-most vertex.
            leftVerts.push(topVert);
            rightVerts.push(bottomVert);

            // Trace a line along x,y between the top-most vertex and the bottom-most vertex; and for
            // the two intervening vertices, find whether they're to the left or right of that line on
            // x. Being on the left side of that line means the vertex is on the ngon's left side,
            // and same for the right side.
            for (let i = 1; i < (verts.length - 1); i++)
            {
                const lr = k_lerp(topVert.x, bottomVert.x, ((verts[i].y - topVert.y) / (bottomVert.y - topVert.y)));
                ((verts[i].x >= lr)? rightVerts : leftVerts).push(verts[i]);
            }

            // Sort the two sides' vertices so that we can trace them anti-clockwise starting from the top,
            // going down to the bottom vertex on the left side, and then back up to the top vertex along
            // the right side.
            leftVerts.sort((a, b)=>((a.y === b.y)? 0 : ((a.y < b.y)? -1 : 1)));
            rightVerts.sort((a, b)=>((a.y === b.y)? 0 : ((a.y > b.y)? -1 : 1)));

            k_assert(((leftVerts.length !== 0) && (rightVerts.length !== 0)), "Expected each side list to have at least one vertex.");
            k_assert(((leftVerts.length + rightVerts.length) === verts.length), "Vertices appear to have gone missing.");
        }

        // Create an array for each edge, where the index represents the y coordinate and the
        // value is the x coordinates at that y (e.g. the coordinates 5,8 would be represented
        // as array[8] === 5).
        /// CLEANUP: The code for this is a bit unsightly.
        const leftEdge = [];
        const rightEdge = [];
        {
            // Left edge.
            let prevVert = leftVerts[0];
            for (let l = 1; l < leftVerts.length; l++)
            {
                Rngon.line_draw.into_array(prevVert, leftVerts[l], leftEdge, verts[0].y);
                prevVert = leftVerts[l];
            }
            Rngon.line_draw.into_array(prevVert, rightVerts[0], leftEdge, verts[0].y);
            
            // Right edge.
            prevVert = rightVerts[0];
            for (let r = 1; r < rightVerts.length; r++)
            {
                Rngon.line_draw.into_array(prevVert, rightVerts[r], rightEdge, verts[0].y);
                prevVert = rightVerts[r];
            }
            Rngon.line_draw.into_array(prevVert, leftVerts[0], rightEdge, verts[0].y);
        }

        // Draw the ngon.
        {
            // Solid/textured fill.
            if (ngon.hasSolidFill)
            {
                const polyYOffset = Math.floor(verts[0].y);
                const polyHeight = leftEdge.length;

                let v = 0;
                const vDelta = ((ngon.texture == null)? 0 : ((ngon.texture.height - 0.001) / (polyHeight - 1)));

                for (let y = 0; y < polyHeight; y++)
                {
                    const rowWidth = (rightEdge[y] - leftEdge[y]);
                    if (rowWidth <= 0) continue;

                    let u = 0;
                    const uDelta = ((ngon.texture == null)? 0 : ((ngon.texture.width - 0.001) / rowWidth));

                    while (leftEdge[y] <= rightEdge[y])
                    {
                        if (leftEdge[y] >= 0 && leftEdge[y] < renderWidth)
                        {
                            const px = leftEdge[y];
                            const py = (y + polyYOffset);

                            if (py >= 0 && py < renderHeight)
                            {
                                const idx = ((px + py * renderWidth) * 4);
                                
                                // Solid fill.
                                if (ngon.texture == null)
                                {
                                    pixelMap.data[idx + 0] = ngon.color.red;
                                    pixelMap.data[idx + 1] = ngon.color.green;
                                    pixelMap.data[idx + 2] = ngon.color.blue;
                                    pixelMap.data[idx + 3] = ngon.color.alpha;
                                }
                                // Textured fill.
                                else
                                {
                                    const color = ngon.texture.rgba_pixel_at(Math.floor(u), Math.floor(v));
                                    pixelMap.data[idx + 0] = color.red;
                                    pixelMap.data[idx + 1] = color.green;
                                    pixelMap.data[idx + 2] = color.blue;
                                    pixelMap.data[idx + 3] = color.alpha;
                                }
                            }
                        }

                        leftEdge[y]++;
                        u += uDelta;
                    }

                    v += vDelta;
                }
            }

            // Draw a wireframe around any ngons that wish for one.
            if (ngon.hasWireframe)
            {
                const wireColor = Rngon.color_rgba(0, 0, 0, 255);
                const putline = function(vert1, vert2){Rngon.line_draw.into_pixel_buffer(vert1, vert2, pixelMap.data, renderWidth, renderHeight, wireColor)};

                // Left edge.
                let prevVert = leftVerts[0];
                for (let l = 1; l < leftVerts.length; l++)
                {
                    putline(prevVert, leftVerts[l]);
                    prevVert = leftVerts[l];
                }
                putline(prevVert, rightVerts[0]);

                // Right edge.
                prevVert = rightVerts[0];
                for (let r = 1; r < rightVerts.length; r++)
                {
                    putline(prevVert, rightVerts[r]);
                    prevVert = rightVerts[r];
                }
                putline(prevVert, leftVerts[0]);
            }
        }
    });

    renderContext.putImageData(pixelMap, 0, 0);
}
