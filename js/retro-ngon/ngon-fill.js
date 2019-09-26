/*
 * Tarpeeksi Hyvae Soft 2019 /
 * Retro n-gon renderer
 * 
 */

"use strict";

const depthBuffer = {width:0, height:0, buffer:new Array(0)};

// Rasterizes the given ngons into the given RGBA pixel buffer of the given width and height.
//
// Note: This function should only be called once per frame - i.e. the 'ngons' array should
// contain all the n-gons you want rendered to the current frame. The reason for this requirement
// is that the depth buffer is cleared on entry to this function, so calling it multiple times
// per frame would mess up depth buffering for that frame.
//
Rngon.ngon_filler = function(ngons = [], pixelBuffer, auxiliaryBuffers = [], renderWidth, renderHeight)
{
    Rngon.assert && (ngons instanceof Array) || Rngon.throw("Expected an array of ngons to be rasterized.");
    Rngon.assert && ((renderWidth > 0) && (renderHeight > 0))
                 || Rngon.throw("The transform surface can't have zero width or height.");

    // If depth buffering is enabled, clear the buffer in preparation for a new frame's
    // rendering.
    if (Rngon.internalState.useDepthBuffer)
    {
        if (depthBuffer.width != renderWidth ||
            depthBuffer.height != renderHeight ||
            !depthBuffer.buffer.length)
        {
            depthBuffer.width = renderWidth;
            depthBuffer.height = renderHeight;
            depthBuffer.buffer = new Array(depthBuffer.width * depthBuffer.height).fill(Number.MAX_SAFE_INTEGER); 
        }
        else
        {
            depthBuffer.buffer.fill(Number.MAX_SAFE_INTEGER);
        }
    }

    ngons.forEach((ngon)=>
    {
        // Deal with n-gons that have fewer than 3 vertices.
        switch (ngon.vertices.length)
        {
            case 0: return;

            // A single point.
            case 1:
            {
                const idx = ((Math.floor(ngon.vertices[0].x) + Math.floor(ngon.vertices[0].y) * renderWidth) * 4);
                pixelBuffer[idx + 0] = ngon.material.color.red;
                pixelBuffer[idx + 1] = ngon.material.color.green;
                pixelBuffer[idx + 2] = ngon.material.color.blue;
                pixelBuffer[idx + 3] = ngon.material.color.alpha;

                // Move on to the next iteration in the forEach() chain.
                return;
            }

            // A line segment.
            case 2:
            {
                Rngon.line_draw.into_pixel_buffer(ngon.vertices[0], ngon.vertices[1],
                                                  pixelBuffer, renderWidth, renderHeight,
                                                  ngon.material.color)
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
        const verts = ngon.vertices;
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
                const lr = Rngon.lerp(topVert.x, bottomVert.x, ((verts[i].y - topVert.y) / (bottomVert.y - topVert.y)));
                ((verts[i].x >= lr)? rightVerts : leftVerts).push(verts[i]);
            }

            // Sort the two sides' vertices so that we can trace them anti-clockwise starting from the top,
            // going down to the bottom vertex on the left side, and then back up to the top vertex along
            // the right side.
            leftVerts.sort((a, b)=>((a.y === b.y)? 0 : ((a.y < b.y)? -1 : 1)));
            rightVerts.sort((a, b)=>((a.y === b.y)? 0 : ((a.y > b.y)? -1 : 1)));

            Rngon.assert && ((leftVerts.length !== 0) && (rightVerts.length !== 0))
                         || Rngon.throw("Expected each side list to have at least one vertex.");
            Rngon.assert && ((leftVerts.length + rightVerts.length) === verts.length)
                         || Rngon.throw("Vertices appear to have gone missing.");
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
            // Solid or textured fill.
            if (ngon.material.hasSolidFill)
            {
                const polyYOffset = Math.floor(verts[0].y);
                const polyHeight = leftEdge.length;

                for (let y = 0; y < polyHeight; y++)
                {
                    const rowWidth = (rightEdge[y].x - leftEdge[y].x);
                    if (rowWidth <= 0) continue;

                    for (let x = 0; x <= rowWidth; (x++, leftEdge[y].x++))
                    {
                        const px = leftEdge[y].x;
                        const py = (y + polyYOffset);
                        const idx = ((px + py * renderWidth) * 4);

                        // For linearly interpolating values across the left and right edge.
                        const lerpStep = (x / rowWidth);

                        // Solid fill.
                        if (ngon.material.texture == null)
                        {
                            pixelBuffer[idx + 0] = ngon.material.color.red;
                            pixelBuffer[idx + 1] = ngon.material.color.green;
                            pixelBuffer[idx + 2] = ngon.material.color.blue;
                            pixelBuffer[idx + 3] = ngon.material.color.alpha;
                        }
                        // Textured fill.
                        else
                        {
                            let u = 0, v = 0;
                            switch (ngon.material.textureMapping)
                            {
                                case "affine":
                                {
                                    u = (Rngon.lerp(leftEdge[y].u, rightEdge[y].u, lerpStep) * (ngon.material.texture.width-0.001));
                                    v = (Rngon.lerp(leftEdge[y].v, rightEdge[y].v, lerpStep) * (ngon.material.texture.height-0.001));

                                    // Wrap with repetition.
                                    /// FIXME: Doesn't wrap correctly.
                                    ///u %= ngon.material.texture.width;
                                    ///v %= ngon.material.texture.height;

                                    break;
                                }
                                case "ortho":
                                {
                                    u = x * ((ngon.material.texture.width - 0.001) / rowWidth);
                                    v = y * ((ngon.material.texture.height - 0.001) / ((polyHeight-1)||1));

                                    break;
                                }
                                default: Rngon.throw("Unknown texture-mapping mode."); break;
                            }

                            const texelIdx = ((~~u) + (~~v) * ngon.material.texture.width);

                            // Verify that the texel isn't out of bounds.
                            if (!ngon.material.texture.pixels[texelIdx])
                            {
                                continue;
                            }

                            // Alpha testing. If the pixel is fully opaque, draw it; otherwise, skip it.
                            if (ngon.material.texture.pixels[texelIdx].alpha !== 255)
                            {
                                continue;
                            }

                            // Depth testing. Only allow the pixel to be drawn if any previous pixels
                            // at this screen position are further away from the camera.
                            if (Rngon.internalState.useDepthBuffer)
                            {
                                const depth = Rngon.lerp(leftEdge[y].depth, rightEdge[y].depth, lerpStep);

                                if (depthBuffer.buffer[idx/4] <= depth)
                                {
                                    continue;
                                }
                                else depthBuffer.buffer[idx/4] = depth;
                            }

                            // Draw the pixel.
                            pixelBuffer[idx + 0] = (ngon.material.texture.pixels[texelIdx].red   * ngon.material.color.unitRange.red);
                            pixelBuffer[idx + 1] = (ngon.material.texture.pixels[texelIdx].green * ngon.material.color.unitRange.green);
                            pixelBuffer[idx + 2] = (ngon.material.texture.pixels[texelIdx].blue  * ngon.material.color.unitRange.blue);
                            pixelBuffer[idx + 3] = (ngon.material.texture.pixels[texelIdx].alpha * ngon.material.color.unitRange.alpha);
                        }

                        for (let b = 0; b < auxiliaryBuffers.length; b++)
                        {
                            if (ngon.material.auxiliary[auxiliaryBuffers[b].property] !== null)
                            {
                                // Buffers are expected to consist of one element per pixel.
                                auxiliaryBuffers[b].buffer[idx/4] = ngon.material.auxiliary[auxiliaryBuffers[b].property];
                            }
                        }
                    }
                }
            }

            // Draw a wireframe around any ngons that wish for one.
            if (ngon.material.hasWireframe)
            {
                const putline = (vert1, vert2)=>
                {
                    Rngon.line_draw.into_pixel_buffer(vert1, vert2,
                                                      pixelBuffer, renderWidth, renderHeight,
                                                      ngon.material.wireframeColor)
                };

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
}
