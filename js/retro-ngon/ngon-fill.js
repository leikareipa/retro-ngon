/*
 * Tarpeeksi Hyvae Soft 2019 /
 * Retro n-gon renderer
 * 
 */

"use strict";

// Rasterizes into the internal pixel buffer all n-gons currently stored in the internal n-gon cache.
Rngon.ngon_filler = function(auxiliaryBuffers = [])
{
    const pixelBuffer = Rngon.internalState.pixelBuffer.data;
    const depthBuffer = (Rngon.internalState.useDepthBuffer? Rngon.internalState.depthBuffer.buffer : null);
    const renderWidth = Rngon.internalState.pixelBuffer.width;
    const renderHeight = Rngon.internalState.pixelBuffer.height;

    const vertexSorters =
    {
        verticalAscending: (vertA, vertB)=>((vertA.y === vertB.y)? 0 : ((vertA.y < vertB.y)? -1 : 1)),
        verticalDescending: (vertA, vertB)=>((vertA.y === vertB.y)? 0 : ((vertA.y > vertB.y)? -1 : 1))
    }
    
   // const spans = new Array(renderHeight);

    // 'spans' contains for each y row the left edge of any polygons on that row
    //  - the left edge includes the span width, i.e. its distance to the right edge
    //  - also the interpolation deltas and starting values

    // Used for interpolating values between n-gon edge spans during rasterization.
    const interpolationDeltas = {};
    const interpolatedValues = {};

    // Rasterize the n-gons.
    for (let n = 0; n < Rngon.internalState.transformedNgonsCache.numActiveNgons; n++)
    {
        const ngon = Rngon.internalState.transformedNgonsCache.ngons[n];

        // In theory, we should never receive n-gons that have no vertices, but let's check
        // to make sure.
        if (ngon.vertices.length <= 0)
        {
            continue;
        }

        // Handle n-gons that constitute points and lines.
        /// TODO: Add depth and alpha testing for points and lines.
        if (ngon.vertices.length === 1)
        {
            const idx = ((Math.ceil(ngon.vertices[0].x) + Math.ceil(ngon.vertices[0].y) * renderWidth) * 4);
                
            pixelBuffer[idx + 0] = ngon.material.color.red;
            pixelBuffer[idx + 1] = ngon.material.color.green;
            pixelBuffer[idx + 2] = ngon.material.color.blue;
            pixelBuffer[idx + 3] = ngon.material.color.alpha;

            continue;
        }
        else if (ngon.vertices.length === 2)
        {
            Rngon.line_draw.into_pixel_buffer(ngon.vertices[0], ngon.vertices[1], ngon.material.color, Rngon.internalState.useDepthBuffer);

            continue;
        }

        // Handle n-gons with 3 or more vertices.
        {
            // Draw two virtual lines around the n-gon, one through its left-hand vertices
            // and the other through the right-hand ones, such that together the lines trace
            // the n-gon's outline.
            const leftEdge = [];
            const rightEdge = [];
            const leftVerts = [];
            const rightVerts = [];
            {
                // Figure out which of the n-gon's vertices are on its left edge and which on
                // the right one. The vertices will be arranged such that the first entry in
                // the list of left vertices will be the ngon's top-most (lowest y) vertex, and
                // the entries after that are successively higher in y. For the list of right
                // vertices, the first entry will be the ngon's bottom-most vertex, and entries
                // following are successively lower in y. Thus, by tracing first through the list
                // of left vertices and then through the list of right ones, you end up with an
                // anti-clockwise loop around the ngon.
                {
                    // Generic algorithm for n-sided convex polygons.
                    {
                        // Sort the vertices by height (i.e. by increasing y).
                        ngon.vertices.sort(vertexSorters.verticalAscending);
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

                        // Make sure the right side is sorted bottom-to-top.
                        rightVerts.sort(vertexSorters.verticalDescending);

                        // Add linking vertices, so we can connect the two sides easily in a line loop.
                        leftVerts.push(bottomVert);
                        rightVerts.push(topVert);
                    }
                }

                // Now that we known which vertices are on the right-hand side and which on the left,
                // we can trace the two virtual lines around the polygon.
                for (let l = 1; l < leftVerts.length; l++) Rngon.line_draw.into_array(leftVerts[l-1], leftVerts[l], leftEdge, ngon.vertices[0].y);
                for (let r = 1; r < rightVerts.length; r++) Rngon.line_draw.into_array(rightVerts[r-1], rightVerts[r], rightEdge, ngon.vertices[0].y);
            }

            // Draw the ngon.
            {

                // Solid or textured fill.
                if (ngon.material.hasSolidFill)
                {
                    const polyYOffset = Math.ceil(ngon.vertices[0].y);
                    const polyHeight = leftEdge.length;

                    for (let y = 0; y < polyHeight; y++)
                    {
                        // Corresponding position in the pixel buffer.
                        const py = (y + polyYOffset);
                        if (py >= renderHeight) break;

                        const rowWidth = (rightEdge[y].x - leftEdge[y].x);
                        if (rowWidth <= 0) continue;

                        // We'll interpolate certain parameters across this pixel row. For that,
                        // let's pre-compute delta values we can just add onto the parameter's
                        // base value each step of the loop.
                        const interpolationStepSize = (1 / (rowWidth + 1));

                        interpolationDeltas.u =     (Rngon.lerp(leftEdge[y].u, rightEdge[y].u, interpolationStepSize) - leftEdge[y].u);
                        interpolationDeltas.v =     (Rngon.lerp(leftEdge[y].v, rightEdge[y].v, interpolationStepSize) - leftEdge[y].v);
                        interpolationDeltas.uvw =   (Rngon.lerp(leftEdge[y].uvw, rightEdge[y].uvw, interpolationStepSize) - leftEdge[y].uvw);
                        interpolationDeltas.depth = (Rngon.lerp(leftEdge[y].depth, rightEdge[y].depth, interpolationStepSize) - leftEdge[y].depth);

                        // Decrement the value by the delta so we can increment at the start
                        // of the loop rather than at the end of it - so we can e.g. bail out
                        // of the loop where needed without worry of not correctly incrementing
                        // the interpolated values.
                        interpolatedValues.u =     (leftEdge[y].u - interpolationDeltas.u);
                        interpolatedValues.v =     (leftEdge[y].v - interpolationDeltas.v);
                        interpolatedValues.uvw =   (leftEdge[y].uvw - interpolationDeltas.uvw);
                        interpolatedValues.depth = (leftEdge[y].depth - interpolationDeltas.depth);

                        for (let x = 0; x <= rowWidth; x++)
                        {
                            // Increment the interpolated values before doing anything else.
                            interpolatedValues.u += interpolationDeltas.u;
                            interpolatedValues.v += interpolationDeltas.v;
                            interpolatedValues.uvw += interpolationDeltas.uvw;
                            interpolatedValues.depth += interpolationDeltas.depth;

                            // Corresponding position in the pixel buffer.
                            const px = (leftEdge[y].x + x);
                            if (px >= renderWidth) break;

                            // Assumes the pixel buffer is 4 bytes per pixel (RGBA).
                            const pixelBufferIdx = ((px + py * renderWidth) * 4);

                            // Depth testing. Only allow the pixel to be drawn if previous pixels at this
                            // screen position are further away from the camera.
                            if (depthBuffer &&
                                (depthBuffer[pixelBufferIdx/4] <= interpolatedValues.depth))
                            {
                                continue;
                            }

                            // Solid fill.
                            if (ngon.material.texture == null)
                            {
                                // Alpha testing. If the pixel is fully opaque, draw it; otherwise, skip it.
                                if (ngon.material.color.alpha !== 255) continue;

                                // Draw the pixel.
                                pixelBuffer[pixelBufferIdx + 0] = ngon.material.color.red;
                                pixelBuffer[pixelBufferIdx + 1] = ngon.material.color.green;
                                pixelBuffer[pixelBufferIdx + 2] = ngon.material.color.blue;
                                pixelBuffer[pixelBufferIdx + 3] = ngon.material.color.alpha;
                                if (depthBuffer) depthBuffer[pixelBufferIdx/4] = interpolatedValues.depth;
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

                                        u = (interpolatedValues.u / interpolatedValues.uvw);
                                        v = (interpolatedValues.v / interpolatedValues.uvw);
                                        
                                        u *= textureWidth;
                                        v *= textureHeight;

                                        /// FIXME: We need to flip v or the textures render upside down. Why?
                                        v = (textureHeight - v);

                                        // Wrap with repetition.
                                        /// FIXME: Why do we need to test for UV < 0 even when using positive
                                        /// but tiling UV coordinates? Doesn't render properly unless we do.
                                        if ((u < 0) ||
                                            (v < 0) ||
                                            (u > textureWidth) ||
                                            (v > textureHeight))
                                        {
                                            const uWasNeg = (u < 0);
                                            const vWasNeg = (v < 0);

                                            u = (Math.abs(u) % ngon.material.texture.width);
                                            v = (Math.abs(v) % ngon.material.texture.height);

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

                                const texel = ngon.material.texture.pixels[(~~u) + (~~v) * ngon.material.texture.width];

                                // Verify that the texel isn't out of bounds.
                                if (!texel) continue;

                                // Alpha testing. If the pixel is fully opaque, draw it; otherwise, skip it.
                                if (texel.alpha !== 255) continue;

                                // Draw the pixel.
                                pixelBuffer[pixelBufferIdx + 0] = (texel.red   * ngon.material.color.unitRange.red);
                                pixelBuffer[pixelBufferIdx + 1] = (texel.green * ngon.material.color.unitRange.green);
                                pixelBuffer[pixelBufferIdx + 2] = (texel.blue  * ngon.material.color.unitRange.blue);
                                pixelBuffer[pixelBufferIdx + 3] = (texel.alpha * ngon.material.color.unitRange.alpha);
                                if (depthBuffer) depthBuffer[pixelBufferIdx/4] = interpolatedValues.depth;
                            }

                            for (let b = 0; b < auxiliaryBuffers.length; b++)
                            {
                                if (ngon.material.auxiliary[auxiliaryBuffers[b].property] !== null)
                                {
                                    // Buffers are expected to consist of one element per pixel.
                                    auxiliaryBuffers[b].buffer[pixelBufferIdx/4] = ngon.material.auxiliary[auxiliaryBuffers[b].property];
                                }
                            }
                        }
                    }
                }

                // Draw a wireframe around any ngons that wish for one.
                if (Rngon.internalState.showGlobalWireframe ||
                    ngon.material.hasWireframe)
                {
                    const putline = (vert1, vert2)=>
                    {
                        Rngon.line_draw.into_pixel_buffer(vert1, vert2, ngon.material.wireframeColor, Rngon.internalState.useDepthBuffer)
                    };

                    // Draw a line around the polygon.
                    for (let l = 1; l < leftVerts.length; l++) putline(leftVerts[l-1], leftVerts[l]);
                    for (let r = 1; r < rightVerts.length; r++) putline(rightVerts[r-1], rightVerts[r]);
                }
            }
        }
    }
}
