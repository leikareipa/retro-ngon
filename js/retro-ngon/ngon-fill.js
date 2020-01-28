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
            const idx = ((Math.round(ngon.vertices[0].x) + Math.round(ngon.vertices[0].y) * renderWidth) * 4);
                
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

            // Then we'll organize the sorted vertices into edges (lines between given two
            // vertices). Once we've got the edges figured out, we can render the n-gon by filling
            // in the spans between its edges.
            const leftEdges = [];
            const rightEdges = [];
            
            // Figure out which of the n-gon's vertices are on its left side and which on the
            // right. The vertices on both sides will be arranged from smallest Y to largest
            // Y, i.e. top-to-bottom in screen space. The top-most vertex and the bottom-most
            // vertex will be shared between the two sides.
            {
                // Generic algorithm for n-sided convex polygons.
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

            // Create edges out of the vertices.
            {
                const interpolatePerspective = Rngon.internalState.usePerspectiveCorrectTexturing;

                const add_edge = (vert1, vert2, isLeftEdge)=>
                {
                    const startY = Math.min(renderHeight, Math.max(0, Math.round(vert1.y)));
                    const endY = Math.min(renderHeight, Math.max(0, Math.round(vert2.y)));
                    
                    // Ignore horizontal edges.
                    if ((endY - startY) === 0) return;

                    const edgeHeight = (endY - startY);

                    const startX = Math.min(renderWidth, Math.max(0, Math.round(vert1.x)));
                    const endX = Math.min(renderWidth, Math.max(0, Math.ceil(vert2.x)));
                    const deltaX = ((endX - startX) / edgeHeight);

                    const startDepth = vert1.z;
                    const deltaDepth = ((vert2.z - vert1.z) / edgeHeight);

                    const u1 = (ngon.material.texture? vert1.u : 1);
                    const v1 = (ngon.material.texture? vert1.v : 1);
                    const u2 = (ngon.material.texture? vert2.u : 1);
                    const v2 = (ngon.material.texture? vert2.v : 1);

                    const startU = interpolatePerspective? (u1 / vert1.w)
                                                         : u1;
                    const deltaU = interpolatePerspective? (((u2 / vert2.w) - (u1 / vert1.w)) / edgeHeight)
                                                         : ((u2 - u1) / edgeHeight);

                    const startV = interpolatePerspective? (v1 / vert1.w)
                                                         : v1;
                    const deltaV = interpolatePerspective? (((v2 / vert2.w) - (v1 / vert1.w)) / edgeHeight)
                                                         : ((v2 - v1) / edgeHeight);

                    const startUVW = interpolatePerspective? (1 / vert1.w)
                                                           : 1;
                    const deltaUVW = interpolatePerspective? (((1 / vert2.w) - (1 / vert1.w)) / edgeHeight)
                                                           : 0;

                    const edge =
                    {
                        startY, endY,
                        startX, deltaX,
                        startDepth, deltaDepth,
                        startU, deltaU,
                        startV, deltaV,
                        startUVW, deltaUVW,
                    }

                    if (isLeftEdge) leftEdges.push(edge);
                    else rightEdges.push(edge);
                };

                for (let l = 1; l < leftVerts.length; l++) add_edge(leftVerts[l-1], leftVerts[l], true);
                for (let r = 1; r < rightVerts.length; r++) add_edge(rightVerts[r-1], rightVerts[r], false);
            }

            // Draw the n-gon. On each horizontal raster line, there will be two edges: left and right.
            // We'll render into the pixel buffer each horizontal span that runs between the two edges.
            {
                let curLeftEdgeIdx = 0;
                let curRightEdgeIdx = 0;
                let leftEdge = leftEdges[curLeftEdgeIdx];
                let rightEdge = rightEdges[curRightEdgeIdx];
                
                if (!leftEdges.length || !rightEdges.length) continue;

                // Note: We assume the n-gon's vertices to be sorted by increasing Y.
                const ngonStartY = leftEdges[0].startY;
                const ngonEndY = leftEdges[leftEdges.length-1].endY;
                
                // Rasterize the n-gon in horizontal pixel spans over its height.
                for (let y = ngonStartY; y < ngonEndY; y++)
                {
                    const spanStartX = Math.min(renderWidth, Math.max(0, Math.round(leftEdge.startX)));
                    const spanEndX = Math.min(renderWidth, Math.max(0, Math.round(rightEdge.startX)));
                    const spanWidth = ((spanEndX - spanStartX) + 1);

                    if (spanWidth > 0)
                    {
                        // We'll interpolate these parameters across the span.
                        const deltaDepth = ((rightEdge.startDepth - leftEdge.startDepth) / spanWidth);
                        let iplDepth = (leftEdge.startDepth - deltaDepth);

                        const deltaU = ((rightEdge.startU - leftEdge.startU) / spanWidth);
                        let iplU = (leftEdge.startU - deltaU);

                        const deltaV = ((rightEdge.startV - leftEdge.startV) / spanWidth);
                        let iplV = (leftEdge.startV - deltaV);

                        const deltaUVW = ((rightEdge.startUVW - leftEdge.startUVW) / spanWidth);
                        let iplUVW = (leftEdge.startUVW - deltaUVW);

                        // Assumes the pixel buffer consists of 4 elements per pixel (e.g. RGBA).
                        let pixelBufferIdx = (((spanStartX + y * renderWidth) * 4) - 4);

                        // Assumes the depth buffer consists of 1 element per pixel.
                        let depthBufferIdx = (pixelBufferIdx / 4);

                        // Draw the span into the pixel buffer.
                        for (let x = spanStartX; x < spanEndX; x++)
                        {
                            // Update values that're interpolated horizontally along the span.
                            iplDepth += deltaDepth;
                            iplU += deltaU;
                            iplV += deltaV;
                            iplUVW += deltaUVW;
                            pixelBufferIdx += 4;
                            depthBufferIdx++;

                            // Depth test.
                            if (depthBuffer[depthBufferIdx] <= iplDepth) continue;

                            // Solid fill.
                            if (!ngon.material.texture)
                            {
                                // Alpha test. If the pixel is fully opaque, draw it; otherwise, skip it.
                                if (ngon.material.color.alpha !== 255) continue;

                                pixelBuffer[pixelBufferIdx + 0] = ngon.material.color.red;
                                pixelBuffer[pixelBufferIdx + 1] = ngon.material.color.green;
                                pixelBuffer[pixelBufferIdx + 2] = ngon.material.color.blue;
                                pixelBuffer[pixelBufferIdx + 3] = ngon.material.color.alpha;
                                depthBuffer[depthBufferIdx] = iplDepth;
                            }
                            // Textured fill.
                            else
                            {
                                let u, v;

                                switch (ngon.material.textureMapping)
                                {
                                    // Affine mapping for power-of-two textures.
                                    case "affine":
                                    {
                                        u = (iplU / iplUVW);
                                        v = (iplV / iplUVW);

                                        switch (ngon.material.uvWrapping)
                                        {
                                            case "clamp":
                                            {
                                                const signU = Math.sign(u);
                                                const signV = Math.sign(v);
                                                const upperLimit = (1 - Number.EPSILON);

                                                u = Math.max(0, Math.min(Math.abs(u), upperLimit));
                                                v = Math.max(0, Math.min(Math.abs(v), upperLimit));

                                                // Negative UV coordinates flip the texture.
                                                if (signU === -1) u = (upperLimit - u);
                                                if (signV === -1) v = (upperLimit - v);

                                                u *= ngon.material.texture.width;
                                                v *= ngon.material.texture.height;

                                                break;
                                            }
                                            case "repeat":
                                            {
                                                u -= Math.floor(u);
                                                v -= Math.floor(v);

                                                u *= ngon.material.texture.width;
                                                v *= ngon.material.texture.height;

                                                // Modulo for power-of-two. This will also flip the texture for
                                                // negative UV coordinates.
                                                u = (u & (ngon.material.texture.width - 1));
                                                v = (v & (ngon.material.texture.height - 1));

                                                break;
                                            }
                                            default: Rngon.throw("Unrecognized UV wrapping mode."); break;
                                        }

                                        break;
                                    }
                                    // Affine mapping for wrapping non-power-of-two textures.
                                    /// FIXME: This implementation is a bit kludgy.
                                    /// TODO: Add clamped UV wrapping mode (we can just use the one for
                                    /// power-of-two textures).
                                    case "affine-npot":
                                    {
                                        u = (iplU / iplUVW);
                                        v = (iplV / iplUVW);

                                        u *= ngon.material.texture.width;
                                        v *= ngon.material.texture.height;
                
                                        // Wrap with repetition.
                                        /// FIXME: Why do we need to test for UV < 0 even when using positive
                                        /// but tiling UV coordinates? Doesn't render properly unless we do.
                                        if ((u < 0) ||
                                            (v < 0) ||
                                            (u >= ngon.material.texture.width) ||
                                            (v >= ngon.material.texture.height))
                                        {
                                            const uWasNeg = (u < 0);
                                            const vWasNeg = (v < 0);
                
                                            u = (Math.abs(u) % ngon.material.texture.width);
                                            v = (Math.abs(v) % ngon.material.texture.height);
                
                                            if (uWasNeg) u = (ngon.material.texture.width - u);
                                            if (vWasNeg) v = (ngon.material.texture.height - v);
                                        }
                
                                        break;
                                    }
                                    // Screen-space UV mapping, as used e.g. in the DOS game Rally-Sport.
                                    case "ortho":
                                    {
                                        const ngonHeight = (ngonEndY - ngonStartY);

                                        // Pixel coordinates relative to the polygon.
                                        const ngonX = (x - spanStartX + 1);
                                        const ngonY = (y - ngonStartY);

                                        u = (ngonX * (ngon.material.texture.width / spanWidth));
                                        v = (ngonY * (ngon.material.texture.height / ngonHeight));

                                        // The texture image is flipped, so we need to flip V as well.
                                        v = (ngon.material.texture.height - v - 1);

                                        break;
                                    }
                                    default: Rngon.throw("Unknown texture-mapping mode."); break;
                                }

                                const texel = ngon.material.texture.pixels[(~~u) + (~~v) * ngon.material.texture.width];

                                // Verify that the texel isn't out of bounds.
                                if (!texel) continue;

                                // Alpha test. If the pixel is fully opaque, draw it; otherwise, skip it.
                                if (texel.alpha !== 255) continue;

                                pixelBuffer[pixelBufferIdx + 0] = (texel.red   * ngon.material.color.unitRange.red);
                                pixelBuffer[pixelBufferIdx + 1] = (texel.green * ngon.material.color.unitRange.green);
                                pixelBuffer[pixelBufferIdx + 2] = (texel.blue  * ngon.material.color.unitRange.blue);
                                pixelBuffer[pixelBufferIdx + 3] = (texel.alpha * ngon.material.color.unitRange.alpha);
                                depthBuffer[depthBufferIdx] = iplDepth;
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

                    // Update values that're interpolated vertically along the edges.
                    {
                        leftEdge.startX += leftEdge.deltaX;
                        leftEdge.startDepth += leftEdge.deltaDepth;
                        leftEdge.startU += leftEdge.deltaU;
                        leftEdge.startV += leftEdge.deltaV;
                        leftEdge.startUVW += leftEdge.deltaUVW;

                        rightEdge.startX += rightEdge.deltaX;
                        rightEdge.startDepth += rightEdge.deltaDepth;
                        rightEdge.startU += rightEdge.deltaU;
                        rightEdge.startV += rightEdge.deltaV;
                        rightEdge.startUVW += rightEdge.deltaUVW;
                    }

                    // We can move onto the next edge when we're at the end of the current one.
                    if (y === (leftEdge.endY - 1)) leftEdge = leftEdges[++curLeftEdgeIdx];
                    if (y === (rightEdge.endY - 1)) rightEdge = rightEdges[++curRightEdgeIdx];
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
