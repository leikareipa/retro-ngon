/*
 * 2019, 2020 Tarpeeksi Hyvae Soft
 * 
 * Software: Retro n-gon renderer
 * 
 */

"use strict";

// Rasterizes into the internal pixel buffer all n-gons currently stored in the
// internal n-gon cache.
//
// Note: Consider this the inner render loop; it may contain ugly things like
// code repetition for the benefit of performance. If you'd like to refactor the
// code, please benchmark its effects on performance first - maintaining or
// improving performance would be great, losing performance would be bad.
//
Rngon.ngon_filler = function(auxiliaryBuffers = [])
{
    const interpolatePerspective = Rngon.internalState.usePerspectiveCorrectInterpolation;
    const useShaders = Rngon.internalState.useShaders;
    const fragmentBuffer = Rngon.internalState.fragmentBuffer.data;
    const pixelBuffer = Rngon.internalState.pixelBuffer.data;
    const depthBuffer = (Rngon.internalState.useDepthBuffer? Rngon.internalState.depthBuffer.data : null);
    const renderWidth = Rngon.internalState.pixelBuffer.width;
    const renderHeight = Rngon.internalState.pixelBuffer.height;

    const vertexSorters =
    {
        verticalAscending: (vertA, vertB)=>((vertA.y === vertB.y)? 0 : ((vertA.y < vertB.y)? -1 : 1)),
        verticalDescending: (vertA, vertB)=>((vertA.y === vertB.y)? 0 : ((vertA.y > vertB.y)? -1 : 1))
    }

    // Rasterize the n-gons.
    for (let n = 0; n < Rngon.internalState.transformedNgonsCache.count; n++)
    {
        const ngon = Rngon.internalState.transformedNgonsCache.ngons[n];
        const material = ngon.material;
        const texture = material.texture;

        // In theory, we should never receive n-gons that have no vertices, but let's check
        // to make sure.
        if (ngon.vertices.length <= 0)
        {
            continue;
        }

        // Handle n-gons that constitute points and lines.
        /// TODO: Add the fragment buffer, depth testing, and alpha testing for points and lines.
        if (ngon.vertices.length === 1)
        {
            const idx = ((Math.round(ngon.vertices[0].x) + Math.round(ngon.vertices[0].y) * renderWidth) * 4);
                
            pixelBuffer[idx + 0] = material.color.red;
            pixelBuffer[idx + 1] = material.color.green;
            pixelBuffer[idx + 2] = material.color.blue;
            pixelBuffer[idx + 3] = material.color.alpha;

            continue;
        }
        else if (ngon.vertices.length === 2)
        {
            Rngon.line_draw.into_pixel_buffer(ngon.vertices[0], ngon.vertices[1], material.color, Rngon.internalState.useDepthBuffer);

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
                for (let l = 1; l < leftVerts.length; l++) add_edge(leftVerts[l-1], leftVerts[l], true);
                for (let r = 1; r < rightVerts.length; r++) add_edge(rightVerts[r-1], rightVerts[r], false);

                function add_edge(vert1, vert2, isLeftEdge)
                {
                    const startY = Math.min(renderHeight, Math.max(0, Math.round(vert1.y)));
                    const endY = Math.min(renderHeight, Math.max(0, Math.round(vert2.y)));
                    const edgeHeight = (endY - startY);
                    
                    // Ignore horizontal edges.
                    if (edgeHeight === 0) return;

                    const w1 = interpolatePerspective? vert1.w : 1;
                    const w2 = interpolatePerspective? vert2.w : 1;

                    const startX = Math.min(renderWidth, Math.max(0, Math.round(vert1.x)));
                    const endX = Math.min(renderWidth, Math.max(0, Math.ceil(vert2.x)));
                    const deltaX = ((endX - startX) / edgeHeight);

                    const depth1 = (vert1.z / Rngon.internalState.farPlaneDistance);
                    const depth2 = (vert2.z / Rngon.internalState.farPlaneDistance);
                    const startDepth = depth1/w1;
                    const deltaDepth = ((depth2/w2 - depth1/w1) / edgeHeight);

                    const startShade = vert1.shade/w1;
                    const deltaShade = ((vert2.shade/w2 - vert1.shade/w1) / edgeHeight);

                    if (useShaders)
                    {
                        var startWorldX = vert1.worldX/w1;
                        var deltaWorldX = ((vert2.worldX/w2 - vert1.worldX/w1) / edgeHeight);

                        var startWorldY = vert1.worldY/w1;
                        var deltaWorldY = ((vert2.worldY/w2 - vert1.worldY/w1) / edgeHeight);

                        var startWorldZ = vert1.worldZ/w1;
                        var deltaWorldZ = ((vert2.worldZ/w2 - vert1.worldZ/w1) / edgeHeight);
                    }

                    const u1 = (material.texture? vert1.u : 1);
                    const v1 = (material.texture? vert1.v : 1);
                    const u2 = (material.texture? vert2.u : 1);
                    const v2 = (material.texture? vert2.v : 1);
                    const startU = u1/w1;
                    const deltaU = ((u2/w2- u1/w1) / edgeHeight);
                    const startV = v1/w1;
                    const deltaV = ((v2/w2 - v1/w1) / edgeHeight);

                    const startInvW = 1/w1;
                    const deltaInvW = ((1/w2 - 1/w1) / edgeHeight);

                    (isLeftEdge? leftEdges : rightEdges).push({
                        startY, endY,
                        startX, deltaX,
                        startDepth, deltaDepth,
                        startShade, deltaShade,
                        startU, deltaU,
                        startV, deltaV,
                        startInvW, deltaInvW,
                        startWorldX, deltaWorldX,
                        startWorldY, deltaWorldY,
                        startWorldZ, deltaWorldZ,
                    });
                }
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
                        const deltaDepth = ((rightEdge.startDepth - leftEdge.startDepth) / spanWidth);
                        let iplDepth = (leftEdge.startDepth - deltaDepth);

                        const deltaShade = ((rightEdge.startShade - leftEdge.startShade) / spanWidth);
                        let iplShade = (leftEdge.startShade - deltaShade);

                        const deltaU = ((rightEdge.startU - leftEdge.startU) / spanWidth);
                        let iplU = (leftEdge.startU - deltaU);

                        const deltaV = ((rightEdge.startV - leftEdge.startV) / spanWidth);
                        let iplV = (leftEdge.startV - deltaV);

                        const deltaInvW = ((rightEdge.startInvW - leftEdge.startInvW) / spanWidth);
                        let iplInvW = (leftEdge.startInvW - deltaInvW);

                        if (useShaders)
                        {
                            var deltaWorldX = ((rightEdge.startWorldX - leftEdge.startWorldX) / spanWidth);
                            var iplWorldX = (leftEdge.startWorldX - deltaWorldX);

                            var deltaWorldY = ((rightEdge.startWorldY - leftEdge.startWorldY) / spanWidth);
                            var iplWorldY = (leftEdge.startWorldY - deltaWorldY);

                            var deltaWorldZ = ((rightEdge.startWorldZ - leftEdge.startWorldZ) / spanWidth);
                            var iplWorldZ = (leftEdge.startWorldZ - deltaWorldZ);
                        }

                        // Assumes the pixel buffer consists of 4 elements per pixel (e.g. RGBA).
                        let pixelBufferIdx = (((spanStartX + y * renderWidth) * 4) - 4);

                        // Assumes the depth buffer consists of 1 element per pixel.
                        let depthBufferIdx = (pixelBufferIdx / 4);

                        // Draw the span into the pixel buffer.
                        for (let x = spanStartX; x < spanEndX; x++)
                        {
                            // Will hold the texture coordinates used if we end up drawing
                            // a textured pixel at the current x,y screen location.
                            let u = 0.0, v = 0.0;

                            // Update values that're interpolated horizontally along the span.
                            iplDepth += deltaDepth;
                            iplShade += deltaShade;
                            iplU += deltaU;
                            iplV += deltaV;
                            iplInvW += deltaInvW;
                            pixelBufferIdx += 4;
                            depthBufferIdx++;

                            if (useShaders)
                            {
                                iplWorldX += deltaWorldX;
                                iplWorldY += deltaWorldY;
                                iplWorldZ += deltaWorldZ;
                            }

                            const depth = (iplDepth / iplInvW);

                            // Depth test.
                            if (depthBuffer && (depthBuffer[depthBufferIdx] <= depth)) continue;

                            const shade = (material.renderVertexShade? (iplShade / iplInvW) : 1);

                            // Solid fill.
                            if (!texture)
                            {
                                // Alpha-test the polygon. For partial transparency, we'll reject
                                // pixels in a particular pattern to create a see-through stipple
                                // effect.
                                if (material.color.alpha < 255)
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

                                pixelBuffer[pixelBufferIdx + 0] = (material.color.red   * shade);
                                pixelBuffer[pixelBufferIdx + 1] = (material.color.green * shade);
                                pixelBuffer[pixelBufferIdx + 2] = (material.color.blue  * shade);
                                pixelBuffer[pixelBufferIdx + 3] = 255;
                                if (depthBuffer) depthBuffer[depthBufferIdx] = depth;
                            }
                            // Textured fill.
                            else
                            {
                                switch (material.textureMapping)
                                {
                                    // Affine mapping for power-of-two textures.
                                    case "affine":
                                    {
                                        u = (iplU / iplInvW);
                                        v = (iplV / iplInvW);

                                        switch (material.uvWrapping)
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

                                                u *= texture.width;
                                                v *= texture.height;

                                                break;
                                            }
                                            case "repeat":
                                            {
                                                u -= Math.floor(u);
                                                v -= Math.floor(v);

                                                u *= texture.width;
                                                v *= texture.height;

                                                // Modulo for power-of-two. This will also flip the texture for
                                                // negative UV coordinates.
                                                u = (u & (texture.width - 1));
                                                v = (v & (texture.height - 1));

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
                                        u = (iplU / iplInvW);
                                        v = (iplV / iplInvW);

                                        u *= texture.width;
                                        v *= texture.height;
                
                                        // Wrap with repetition.
                                        /// FIXME: Why do we need to test for UV < 0 even when using positive
                                        /// but tiling UV coordinates? Doesn't render properly unless we do.
                                        if ((u < 0) ||
                                            (v < 0) ||
                                            (u >= texture.width) ||
                                            (v >= texture.height))
                                        {
                                            const uWasNeg = (u < 0);
                                            const vWasNeg = (v < 0);
                
                                            u = (Math.abs(u) % texture.width);
                                            v = (Math.abs(v) % texture.height);
                
                                            if (uWasNeg) u = (texture.width - u);
                                            if (vWasNeg) v = (texture.height - v);
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

                                        u = (ngonX * (texture.width / spanWidth));
                                        v = (ngonY * (texture.height / ngonHeight));

                                        // The texture image is flipped, so we need to flip V as well.
                                        v = (texture.height - v - 1);

                                        break;
                                    }
                                    default: Rngon.throw("Unknown texture-mapping mode."); break;
                                }

                                const texel = texture.pixels[(~~u) + (~~v) * texture.width];

                                // Alpha-test the texture. If the texel isn't fully opaque, skip it.
                                if (texel.alpha !== 255) continue;

                                // Alpha-test the polygon. For partial transparency, we'll reject
                                // pixels in a particular pattern to create a see-through stipple
                                // effect.
                                if (material.color.alpha < 255)
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

                                pixelBuffer[pixelBufferIdx + 0] = (texel.red   * material.color.unitRange.red   * shade);
                                pixelBuffer[pixelBufferIdx + 1] = (texel.green * material.color.unitRange.green * shade);
                                pixelBuffer[pixelBufferIdx + 2] = (texel.blue  * material.color.unitRange.blue  * shade);
                                pixelBuffer[pixelBufferIdx + 3] = 255;
                                if (depthBuffer) depthBuffer[depthBufferIdx] = depth;
                            }

                            // This part of the loop is reached only if we ended up drawing
                            // into the pixel at the current x,y screen location (i.e. if the
                            // pixel passed the depth test, the alpha test, and so on).
                            {
                                for (let b = 0; b < auxiliaryBuffers.length; b++)
                                {
                                    if (material.auxiliary[auxiliaryBuffers[b].property] !== null)
                                    {
                                        // Buffers are expected to consist of one element per pixel.
                                        auxiliaryBuffers[b].buffer[pixelBufferIdx/4] = material.auxiliary[auxiliaryBuffers[b].property];
                                    }
                                }

                                if (useShaders)
                                {
                                    const fragment = fragmentBuffer[depthBufferIdx];
                                    fragment.textureU = (iplU / iplInvW);
                                    fragment.textureV = (iplV / iplInvW);
                                    fragment.textureUScaled = ~~u;
                                    fragment.textureVScaled = ~~v;
                                    fragment.depth = (iplDepth / iplInvW);
                                    fragment.shade = (iplShade / iplInvW);
                                    fragment.worldX = (iplWorldX / iplInvW);
                                    fragment.worldY = (iplWorldY / iplInvW);
                                    fragment.worldZ = (iplWorldZ / iplInvW);
                                    fragment.normalX = ngon.normal.x;
                                    fragment.normalY = ngon.normal.y;
                                    fragment.normalZ = ngon.normal.z;
                                    fragment.ngonIdx = n;
                                    fragment.w = (1 / iplInvW);
                                }
                            }
                        }
                    }

                    // Update values that're interpolated vertically along the edges.
                    {
                        leftEdge.startX      += leftEdge.deltaX;
                        leftEdge.startDepth  += leftEdge.deltaDepth;
                        leftEdge.startShade  += leftEdge.deltaShade;
                        leftEdge.startU      += leftEdge.deltaU;
                        leftEdge.startV      += leftEdge.deltaV;
                        leftEdge.startInvW   += leftEdge.deltaInvW;

                        rightEdge.startX     += rightEdge.deltaX;
                        rightEdge.startDepth += rightEdge.deltaDepth;
                        rightEdge.startShade += rightEdge.deltaShade;
                        rightEdge.startU     += rightEdge.deltaU;
                        rightEdge.startV     += rightEdge.deltaV;
                        rightEdge.startInvW  += rightEdge.deltaInvW;

                        if (useShaders)
                        {
                            leftEdge.startWorldX  += leftEdge.deltaWorldX;
                            leftEdge.startWorldY  += leftEdge.deltaWorldY;
                            leftEdge.startWorldZ  += leftEdge.deltaWorldZ;

                            rightEdge.startWorldX += rightEdge.deltaWorldX;
                            rightEdge.startWorldY += rightEdge.deltaWorldY;
                            rightEdge.startWorldZ += rightEdge.deltaWorldZ;
                        }
                    }

                    // We can move onto the next edge when we're at the end of the current one.
                    if (y === (leftEdge.endY - 1)) leftEdge = leftEdges[++curLeftEdgeIdx];
                    if (y === (rightEdge.endY - 1)) rightEdge = rightEdges[++curRightEdgeIdx];
                }

                // Draw a wireframe around any n-gons that wish for one.
                if (Rngon.internalState.showGlobalWireframe ||
                    material.hasWireframe)
                {
                    for (let l = 1; l < leftVerts.length; l++)
                    {
                        Rngon.line_draw.into_pixel_buffer(leftVerts[l-1], leftVerts[l], material.wireframeColor, Rngon.internalState.useDepthBuffer);
                    }

                    for (let r = 1; r < rightVerts.length; r++)
                    {
                        Rngon.line_draw.into_pixel_buffer(rightVerts[r-1], rightVerts[r], material.wireframeColor, Rngon.internalState.useDepthBuffer);
                    }
                }
            }
        }
    }

    return;
}

// Create a set of stipple patterns for emulating transparency.
{
    Rngon.ngon_filler.stipple_patterns = [
        // ~1% transparent.
        {
            width: 8,
            height: 6,
            pixels: [0,1,1,1,0,1,1,1,
                     1,1,1,1,1,1,1,1,
                     1,1,1,1,1,1,1,1,
                     1,1,0,1,1,1,0,1,
                     1,1,1,1,1,1,1,1,
                     1,1,1,1,1,1,1,1],
        },

        {
            width: 4,
            height: 4,
            pixels: [0,1,0,1,
                     1,1,1,1,
                     1,0,1,0,
                     1,1,1,1],
        },

        // 50% transparent.
        {
            width: 2,
            height: 2,
            pixels: [1,0,
                     0,1],
        },
    ];

    // Append a reverse set of patterns to go from 50% to ~99% transparent.
    for (let i = (Rngon.ngon_filler.stipple_patterns.length - 2); i >= 0; i--)
    {
        Rngon.ngon_filler.stipple_patterns.push({
                width: Rngon.ngon_filler.stipple_patterns[i].width,
                height: Rngon.ngon_filler.stipple_patterns[i].height,
                pixels: Rngon.ngon_filler.stipple_patterns[i].pixels.map(p=>Number(!p)),
            });
    }
}
