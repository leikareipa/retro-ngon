/*
 * Tarpeeksi Hyvae Soft 2019 /
 * Retro n-gon renderer
 * 
 */

"use strict";

const depthBuffer = {width:0, height:0, buffer:new Array(0), clearValue:Number.MAX_SAFE_INTEGER};

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
        if ((depthBuffer.width != renderWidth) ||
            (depthBuffer.height != renderHeight) ||
            !depthBuffer.buffer.length)
        {
            depthBuffer.width = renderWidth;
            depthBuffer.height = renderHeight;
            depthBuffer.buffer = new Array(depthBuffer.width * depthBuffer.height).fill(depthBuffer.clearValue); 
        }
        else
        {
            depthBuffer.buffer.fill(depthBuffer.clearValue);
        }
    }

    // Rasterize the n-gons.
    for (const ngon of ngons)
    {
        // In theory, we should never receive n-gons that have no vertices, but let's check
        // to make sure.
        if (ngon.vertices.length <= 0)
        {
            continue;
        }

        // Handle n-gons that constitute points and lines.
        if (ngon.vertices.length === 1)
        {
            const idx = ((Math.floor(ngon.vertices[0].x) + Math.floor(ngon.vertices[0].y) * renderWidth) * 4);
                
            pixelBuffer[idx + 0] = ngon.material.color.red;
            pixelBuffer[idx + 1] = ngon.material.color.green;
            pixelBuffer[idx + 2] = ngon.material.color.blue;
            pixelBuffer[idx + 3] = ngon.material.color.alpha;

            continue;
        }
        else if (ngon.vertices.length === 2)
        {
            Rngon.line_draw.into_pixel_buffer(ngon.vertices[0], ngon.vertices[1],
                                              pixelBuffer, renderWidth, renderHeight,
                                              ngon.material.color)

            continue;
        }

        // Handle n-gons with 3 or more vertices.
        {
            // Draw two virtual lines around the n-gon, one through its left-hand vertices
            // and the other through the right-hand ones, such that together the lines trace
            // the n-gon's outline.
            const leftEdge = [];
            const rightEdge = [];
            {
                // Figure out which of the n-gon's vertices are on its left edge and which on
                // the right one. The vertices will be arranged such that the first entry in
                // the list of left vertices will be the ngon's top-most (lowest y) vertex, and
                // the entries after that are successively higher in y. For the list of right
                // vertices, the first entry will be the ngon's bottom-most vertex, and entries
                // following are successively lower in y. Thus, by tracing first through the list
                // of left vertices and then through the list of right ones, you end up with an
                // anti-clockwise loop around the ngon.
                const leftVerts = [];
                const rightVerts = [];
                
                // Generic algorithm for n-sided convex polygons.
                {
                    // Sort the vertices by height (i.e. by increasing y).
                    ngon.vertices.sort((vertA, vertB)=>((vertA.y === vertB.y)? 0 : ((vertA.y < vertB.y)? -1 : 1)));
                    const topVert = ngon.vertices[0];
                    const bottomVert = ngon.vertices[ngon.vertices.length-1];

                    // The left side will always start with the top-most vertex, and the right side with
                    // the bottom-most vertex.
                    leftVerts.push(topVert);
                    rightVerts.push(bottomVert);

                    // Trace a line along x,y between the top-most vertex and the bottom-most vertex; and for
                    // the two intervening vertices, find whether they're to the left or right of that line on
                    // x. Being on the left side of that line means the vertex is on the ngon's left side,
                    // and same for the right side.
                    for (let i = 1; i < (ngon.vertices.length - 1); i++)
                    {
                        const lr = Rngon.lerp(topVert.x, bottomVert.x, ((ngon.vertices[i].y - topVert.y) / (bottomVert.y - topVert.y)));
                        ((ngon.vertices[i].x >= lr)? rightVerts : leftVerts).push(ngon.vertices[i]);
                    }

                    // Sort the two sides' vertices so that we can trace them anti-clockwise starting from the top,
                    // going down to the bottom vertex on the left side, and then back up to the top vertex along
                    // the right side.
                    leftVerts.sort((a, b)=>((a.y === b.y)? 0 : ((a.y < b.y)? -1 : 1)));
                    rightVerts.sort((a, b)=>((a.y === b.y)? 0 : ((a.y > b.y)? -1 : 1)));

                    Rngon.assert && ((leftVerts.length !== 0) &&
                                     (rightVerts.length !== 0))
                                 || Rngon.throw("Expected each side list to have at least one vertex.");
                    Rngon.assert && ((leftVerts.length + rightVerts.length) === ngon.vertices.length)
                                 || Rngon.throw("Vertices appear to have gone missing.");
                }

                // Now that we known which vertices are on the right-hand side and which on
                // the left, we can trace the two virtual lines.
                /// CLEANUP: The code here is a bit unsightly.
                {
                    // Virtual line on the left side.
                    let prevVert = leftVerts[0];
                    for (let l = 1; l < leftVerts.length; l++)
                    {
                        Rngon.line_draw.into_array(prevVert, leftVerts[l], leftEdge, ngon.vertices[0].y);
                        prevVert = leftVerts[l];
                    }
                    Rngon.line_draw.into_array(prevVert, rightVerts[0], leftEdge, ngon.vertices[0].y);
                    
                    // Virtual line on the right side.
                    prevVert = rightVerts[0];
                    for (let r = 1; r < rightVerts.length; r++)
                    {
                        Rngon.line_draw.into_array(prevVert, rightVerts[r], rightEdge, ngon.vertices[0].y);
                        prevVert = rightVerts[r];
                    }
                    Rngon.line_draw.into_array(prevVert, leftVerts[0], rightEdge, ngon.vertices[0].y);
                }
            }

            // Draw the ngon.
            {
                // Solid or textured fill.
                if (ngon.material.hasSolidFill)
                {
                    const polyYOffset = Math.floor(ngon.vertices[0].y);
                    const polyHeight = leftEdge.length;

                    for (let y = 0; y < polyHeight; y++)
                    {
                        const rowWidth = (rightEdge[y].x - leftEdge[y].x);
                        if (rowWidth <= 0) continue;

                        // We'll interpolate certain parameters across this pixel row. For that,
                        // let's pre-compute delta values we can just add onto the parameter's
                        // base value each step of the loop.
                        const interpolationStepSize = (1 / (rowWidth + 1));
                        const interpolationDelta = 
                        {
                            u:     (Rngon.lerp(leftEdge[y].u, rightEdge[y].u, interpolationStepSize) - leftEdge[y].u),
                            v:     (Rngon.lerp(leftEdge[y].v, rightEdge[y].v, interpolationStepSize) - leftEdge[y].v),
                            uvw:   (Rngon.lerp(leftEdge[y].uvw, rightEdge[y].uvw, interpolationStepSize) - leftEdge[y].uvw),
                            depth: (Rngon.lerp(leftEdge[y].depth, rightEdge[y].depth, interpolationStepSize) - leftEdge[y].depth),
                        };
                        const interpolatedValue = 
                        {
                            // Decrement the value by the delta so we can increment at the start
                            // of the loop rather than at the end of it - so we can e.g. bail out
                            // of the loop where needed without worry of not correctly incrementing
                            // the interpolated values.
                            u:     (leftEdge[y].u - interpolationDelta.u),
                            v:     (leftEdge[y].v - interpolationDelta.v),
                            uvw:   (leftEdge[y].uvw - interpolationDelta.uvw),
                            depth: (leftEdge[y].depth - interpolationDelta.depth),
                        };

                        for (let x = 0; x <= rowWidth; (x++, leftEdge[y].x++))
                        {
                            interpolatedValue.u += interpolationDelta.u;
                            interpolatedValue.v += interpolationDelta.v;
                            interpolatedValue.uvw += interpolationDelta.uvw;
                            interpolatedValue.depth += interpolationDelta.depth;

                            if (leftEdge[y].x < 0 || leftEdge[y].x >= renderWidth) continue;

                            const px = leftEdge[y].x;
                            const py = (y + polyYOffset);
                            const pixelBufferIdx = ((px + py * renderWidth) * 4);

                            if (py < 0 || py >= renderHeight) continue;

                            // Solid fill.
                            if (ngon.material.texture == null)
                            {
                                // Alpha testing. If the pixel is fully opaque, draw it; otherwise, skip it.
                                if (ngon.material.color.alpha !== 255)
                                {
                                    continue;
                                }

                                // Depth testing. Only allow the pixel to be drawn if any previous pixels
                                // at this screen position are further away from the camera.
                                if (Rngon.internalState.useDepthBuffer)
                                {
                                    if (depthBuffer.buffer[pixelBufferIdx/4] <= interpolatedValue.depth) continue;
                                    else depthBuffer.buffer[pixelBufferIdx/4] = interpolatedValue.depth;
                                }

                                // Draw the pixel.
                                pixelBuffer[pixelBufferIdx + 0] = ngon.material.color.red;
                                pixelBuffer[pixelBufferIdx + 1] = ngon.material.color.green;
                                pixelBuffer[pixelBufferIdx + 2] = ngon.material.color.blue;
                                pixelBuffer[pixelBufferIdx + 3] = ngon.material.color.alpha;
                            }
                            // Textured fill.
                            else
                            {
                                let u = 0, v = 0;
                                
                                switch (ngon.material.textureMapping)
                                {
                                    case "affine":
                                    {
                                        const textureWidth = (ngon.material.texture.width - 0.001);
                                        const textureHeight = (ngon.material.texture.height - 0.001);

                                        u = (interpolatedValue.u / interpolatedValue.uvw);
                                        v = (interpolatedValue.v / interpolatedValue.uvw);
                                        
                                        /// FIXME: We need to flip v or the textures render upside down. Why?
                                        v = (1 - v);

                                        u *= textureWidth;
                                        v *= textureHeight;

                                        // Wrap with repetition.
                                        if ((u < -0.001) ||
                                            (v < -0.001) ||
                                            (u >= ngon.material.texture.width) ||
                                            (v >= ngon.material.texture.height))
                                        {
                                            const uWasNeg = (u < -0.001);
                                            const vWasNeg = (v < -0.001);

                                            u = (Math.abs(u) % textureWidth);
                                            v = (Math.abs(v) % textureHeight);

                                            if (uWasNeg) u = (textureWidth - u);
                                            if (vWasNeg) v = (textureHeight - v);
                                        }
    
                                        break;
                                    }
                                    case "ortho":
                                    {
                                        u = x * ((ngon.material.texture.width - 0.001) / rowWidth);
                                        v = y * ((ngon.material.texture.height - 0.001) / ((polyHeight - 1) || 1));

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
                                    if (depthBuffer.buffer[pixelBufferIdx/4] <= interpolatedValue.depth) continue;
                                    else depthBuffer.buffer[pixelBufferIdx/4] = interpolatedValue.depth;
                                }

                                // Draw the pixel.
                                pixelBuffer[pixelBufferIdx + 0] = (ngon.material.texture.pixels[texelIdx].red   * ngon.material.color.unitRange.red);
                                pixelBuffer[pixelBufferIdx + 1] = (ngon.material.texture.pixels[texelIdx].green * ngon.material.color.unitRange.green);
                                pixelBuffer[pixelBufferIdx + 2] = (ngon.material.texture.pixels[texelIdx].blue  * ngon.material.color.unitRange.blue);
                                pixelBuffer[pixelBufferIdx + 3] = (ngon.material.texture.pixels[texelIdx].alpha * ngon.material.color.unitRange.alpha);
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
        }
    }
}
