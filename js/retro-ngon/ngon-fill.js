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
            // We'll sort the n-gon's vertices into those on its left side and those on its
            // right side.
            const leftVerts = [];
            const rightVerts = [];

            // Then we'll trace the n-gon's outline by drawing two lines: one connecting the
            // left-side vertices, and the other the right-side vertices. The lines will be
            // stored in these off-screen arrays where the array key encodes the Y coordinate
            // and the value the X coordinate. (Having done that, we can then rasterize the
            // n-gon by drawing into the pixel buffer the horizontal spans between the left
            // and right side X coordinates on the particular Y row.)
            const leftSide = [];
            const rightSide = [];

            // Figure out which of the n-gon's vertices are on its left side and which on the
            // right. The vertices on both sides will be arranged from smallest Y to largest
            // Y, i.e. top-to-bottom in screen space. The top-most vertex and the bottom-most
            // vertex will be shared between the two sides.
            {
                // For triangles.
                if (ngon.vertices.length === 3)
                {
                    // Sort the vertices by height from smallest Y to largest Y.
                    {
                        let tmp;
                        
                        if (ngon.vertices[0].y > ngon.vertices[1].y)
                        {
                            tmp = ngon.vertices[0];
                            ngon.vertices[0] = ngon.vertices[1];
                            ngon.vertices[1] = tmp;
                        }

                        if (ngon.vertices[1].y > ngon.vertices[2].y)
                        {
                            tmp = ngon.vertices[1];
                            ngon.vertices[1] = ngon.vertices[2];
                            ngon.vertices[2] = tmp;
                        }

                        if (ngon.vertices[0].y > ngon.vertices[1].y)
                        {
                            tmp = ngon.vertices[0];
                            ngon.vertices[0] = ngon.vertices[1];
                            ngon.vertices[1] = tmp;
                        }
                    }

                    const topVert = ngon.vertices[0];
                    const midVert = ngon.vertices[1];
                    const bottomVert = ngon.vertices[2];

                    leftVerts.push(topVert);
                    rightVerts.push(topVert);

                    // Find whether the mid vertex is on the left or right side.
                    const lr = Rngon.lerp(topVert.x, bottomVert.x, ((midVert.y - topVert.y) / (bottomVert.y - topVert.y)));
                    ((midVert.x >= lr)? rightVerts : leftVerts).push(midVert);

                    leftVerts.push(bottomVert);
                    rightVerts.push(bottomVert);
                }
                // Generic algorithm for n-sided convex polygons.
                else
                {
                    // Sort the vertices by height from smallest Y to largest Y.
                    ngon.vertices.sort(vertexSorters.verticalAscending);

                    const topVert = ngon.vertices[0];
                    const bottomVert = ngon.vertices[ngon.vertices.length-1];

                    leftVerts.push(topVert);
                    rightVerts.push(topVert);

                    // Trace a line along XY between the top-most vertex and the bottom-most vertex;
                    // and for the intervening vertices, find whether they're to the left or right of
                    // that line on X. Being on the left means the vertex is on the n-gon's left side,
                    // otherwise it's on the right side.
                    for (let i = 1; i < (ngon.vertices.length - 1); i++)
                    {
                        const lr = Rngon.lerp(topVert.x, bottomVert.x, ((ngon.vertices[i].y - topVert.y) / (bottomVert.y - topVert.y)));
                        ((ngon.vertices[i].x >= lr)? rightVerts : leftVerts).push(ngon.vertices[i]);
                    }

                    leftVerts.push(bottomVert);
                    rightVerts.push(bottomVert);
                }
            }

            // Trace the n-gon's outline into the off-screen left side and right side buffers.
            {
                for (let l = 1; l < leftVerts.length; l++)
                {
                    Rngon.line_draw.into_array(leftVerts[l-1], leftVerts[l], leftSide, ngon.vertices[0].y);
                }

                for (let r = 1; r < rightVerts.length; r++)
                {
                    Rngon.line_draw.into_array(rightVerts[r-1], rightVerts[r], rightSide, ngon.vertices[0].y);
                }
            }

            // Rasterize the n-gon by connecting on each Y row the X ends of the n-gon's left-
            // and right-side off-screen buffers.
            {
                // Solid or textured fill.
                if (ngon.material.hasSolidFill)
                {
                    const polyYOffset = Math.ceil(ngon.vertices[0].y);
                    const polyHeight = leftSide.length;

                    for (let y = 0; y < polyHeight; y++)
                    {
                        // Corresponding position in the pixel buffer.
                        const py = (y + polyYOffset);
                        if (py >= renderHeight) break;

                        const rowWidth = (rightSide[y].x - leftSide[y].x);
                        if (rowWidth <= 0) continue;

                        // We'll interpolate certain parameters across this pixel row. For that,
                        // let's pre-compute delta values we can just add onto the parameter's
                        // base value each step of the loop.
                        const interpolationStepSize = (1 / (rowWidth + 1));

                        interpolationDeltas.u =     ((rightSide[y].u - leftSide[y].u) * interpolationStepSize);
                        interpolationDeltas.v =     ((rightSide[y].v - leftSide[y].v) * interpolationStepSize);
                        interpolationDeltas.uvw =   ((rightSide[y].uvw - leftSide[y].uvw) * interpolationStepSize);
                        interpolationDeltas.depth = ((rightSide[y].depth - leftSide[y].depth) * interpolationStepSize);

                        // Decrement the value by the delta so we can increment at the start
                        // of the loop rather than at the end of it - so we can e.g. bail out
                        // of the loop where needed without worry of not correctly incrementing
                        // the interpolated values.
                        interpolatedValues.u =     (leftSide[y].u - interpolationDeltas.u);
                        interpolatedValues.v =     (leftSide[y].v - interpolationDeltas.v);
                        interpolatedValues.uvw =   (leftSide[y].uvw - interpolationDeltas.uvw);
                        interpolatedValues.depth = (leftSide[y].depth - interpolationDeltas.depth);

                        // Assumes the pixel buffer is 4 elements per pixel (RGBA).
                        let pixelBufferIdx = (((leftSide[y].x + py * renderWidth) * 4) - 4);

                        // Assumes the depth buffer is 1 element per pixel.
                        let depthBufferIdx = (pixelBufferIdx / 4);

                        for (let x = 0; x <= rowWidth; x++)
                        {
                            // Increment the interpolated values before continuing with the loop.
                            interpolatedValues.u += interpolationDeltas.u;
                            interpolatedValues.v += interpolationDeltas.v;
                            interpolatedValues.uvw += interpolationDeltas.uvw;
                            interpolatedValues.depth += interpolationDeltas.depth;
                            pixelBufferIdx += 4;
                            depthBufferIdx++;

                            // Depth testing. Only allow the pixel to be drawn if previous pixels at this
                            // screen position are further away from the camera.
                            if (depthBuffer &&
                                (depthBuffer[depthBufferIdx] <= interpolatedValues.depth))
                            {
                                continue;
                            }

                            if ((leftSide[y].x + x) >= renderWidth) break;

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
                                if (depthBuffer) depthBuffer[depthBufferIdx] = interpolatedValues.depth;
                            }
                            // Textured fill.
                            else
                            {
                                let u = 0, v = 0;
                                
                                switch (ngon.material.textureMapping)
                                {
                                    // Affine mapping for power-of-two textures.
                                    case "affine":
                                    {
                                        u = (interpolatedValues.u / interpolatedValues.uvw);
                                        v = (interpolatedValues.v / interpolatedValues.uvw);
                                        
                                        u *= ngon.material.texture.width;
                                        v *= ngon.material.texture.height;

                                        // Modulo for power-of-two.
                                        u = (u & (ngon.material.texture.width - 1));
                                        v = (v & (ngon.material.texture.height - 1));

                                        /// FIXME: We need to flip v or the textures render upside down. Why?
                                        v = (ngon.material.texture.height - v - 1);

                                        break;
                                    }
                                    // Affine mapping for non-power-of-two textures.
                                    /// TODO: This implementation is a bit kludgy.
                                    case "affine-npot":
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
                                    // Screen-space UV mapping, as used e.g. in the DOS game Rally-Sport.
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
                                if (depthBuffer) depthBuffer[depthBufferIdx] = interpolatedValues.depth;
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

                // Draw a wireframe around any n-gons that wish for one.
                if (Rngon.internalState.showGlobalWireframe ||
                    ngon.material.hasWireframe)
                {
                    for (let l = 1; l < leftVerts.length; l++)
                    {
                        Rngon.line_draw.into_pixel_buffer(leftVerts[l-1], leftVerts[l], ngon.material.wireframeColor, Rngon.internalState.useDepthBuffer);
                    }

                    for (let r = 1; r < rightVerts.length; r++)
                    {
                        Rngon.line_draw.into_pixel_buffer(rightVerts[r-1], rightVerts[r], ngon.material.wireframeColor, Rngon.internalState.useDepthBuffer);
                    }
                }
            }
        }
    }

    return;
}
