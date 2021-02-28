/*
 * 2019, 2020 Tarpeeksi Hyvae Soft
 * 
 * Software: Retro n-gon renderer
 * 
 */

"use strict";

Rngon.baseModules = (Rngon.baseModules || {});

{ // A block to limit the scope of the unit-global variables we set up, below.

// We'll sort the n-gon's vertices into those on its left side and those on its
// right side.
const leftVerts = new Array(500);
const rightVerts = new Array(500);

// Then we'll organize the sorted vertices into edges (lines between given two
// vertices). Once we've got the edges figured out, we can render the n-gon by filling
// in the spans between its edges.
const leftEdges = new Array(500).fill().map(e=>({}));
const rightEdges = new Array(500).fill().map(e=>({}));

let numLeftVerts = 0;
let numRightVerts = 0;
let numLeftEdges = 0;
let numRightEdges = 0;

const settings = {
    interpolatePerspective: undefined,
    usePixelShader: undefined,
    fragmentBuffer: undefined,
    pixelBuffer: undefined,
    depthBuffer: undefined,
    renderWidth: undefined,
    renderHeight: undefined,
    auxiliaryBuffers: undefined,
};

const vertexSorters = {
    verticalAscending: (vertA, vertB)=>((vertA.y === vertB.y)? 0 : ((vertA.y < vertB.y)? -1 : 1)),
    verticalDescending: (vertA, vertB)=>((vertA.y === vertB.y)? 0 : ((vertA.y > vertB.y)? -1 : 1))
}

// Rasterizes into the internal pixel buffer all n-gons currently stored in the
// internal n-gon cache.
//
// Note: Consider this the inner render loop; it may contain ugly things like
// code repetition for the benefit of performance. If you'd like to refactor the
// code, please benchmark its effects on performance first - maintaining or
// improving performance would be great, losing performance would be bad.
//
Rngon.baseModules.rasterize = function(auxiliaryBuffers = [])
{
    settings.interpolatePerspective = Rngon.internalState.usePerspectiveCorrectInterpolation;
    settings.usePixelShader = Rngon.internalState.usePixelShader;
    settings.fragmentBuffer = Rngon.internalState.fragmentBuffer.data;
    settings.pixelBuffer = Rngon.internalState.pixelBuffer.data;
    settings.depthBuffer = (Rngon.internalState.useDepthBuffer? Rngon.internalState.depthBuffer.data : null);
    settings.renderWidth = Rngon.internalState.pixelBuffer.width;
    settings.renderHeight = Rngon.internalState.pixelBuffer.height;
    settings.auxiliaryBuffers = auxiliaryBuffers;

    for (let n = 0; n < Rngon.internalState.ngonCache.count; n++)
    {
        const ngon = Rngon.internalState.ngonCache.ngons[n];

        // In theory, we should never receive n-gons that have no vertices, but let's check
        // to make sure.
        if (ngon.vertices.length <= 0)
        {
            continue;
        }
        else if (ngon.vertices.length == 1)
        {
            Rngon.baseModules.rasterize.point(ngon.vertices[0], ngon.material, n);

            continue;
        }
        else if (ngon.vertices.length == 2)
        {
            Rngon.baseModules.rasterize.line(ngon.vertices[0], ngon.vertices[1], ngon.material.color, n, false);

            continue;
        }
        else
        {
            Rngon.baseModules.rasterize.polygon(ngon, n);

            continue;
        }
    }

    return;
}

Rngon.baseModules.rasterize.polygon = function(ngon = Rngon.ngon(),
                                               ngonIdx = 0)
{
    Rngon.assert && (ngon.vertices.length < leftVerts.length)
                 || Rngon.throw("Overflowing the vertex buffer");

    numLeftVerts = 0;
    numRightVerts = 0;
    numLeftEdges = 0;
    numRightEdges = 0;

    const material = ngon.material;
    let texture = (material.texture || null);
    let textureMipLevel = null;
    let textureMipLevelIdx = 0;
    
    if (material.texture)
    {
        const numMipLevels = texture.mipLevels.length;
        textureMipLevelIdx = Math.max(0, Math.min((numMipLevels - 1), Math.round((numMipLevels - 1) * ngon.mipLevel)));
        textureMipLevel = texture.mipLevels[textureMipLevelIdx];
    }

    // Generic algorithm for n-sided convex polygons.
    {
        // Sort the vertices by height from smallest Y to largest Y.
        ngon.vertices.sort(vertexSorters.verticalAscending);

        const topVert = ngon.vertices[0];
        const bottomVert = ngon.vertices[ngon.vertices.length-1];

        leftVerts[numLeftVerts++] = topVert;
        rightVerts[numRightVerts++] = topVert;

        // Trace a line along XY between the top-most vertex and the bottom-most vertex;
        // and for the intervening vertices, find whether they're to the left or right of
        // that line on X. Being on the left means the vertex is on the n-gon's left side,
        // otherwise it's on the right side.
        for (let i = 1; i < (ngon.vertices.length - 1); i++)
        {
            const lr = Rngon.lerp(topVert.x, bottomVert.x, ((ngon.vertices[i].y - topVert.y) / (bottomVert.y - topVert.y)));

            if (ngon.vertices[i].x >= lr)
            {
                rightVerts[numRightVerts++] = ngon.vertices[i];
            }
            else
            {
                leftVerts[numLeftVerts++] = ngon.vertices[i];
            }
        }

        leftVerts[numLeftVerts++] = bottomVert;
        rightVerts[numRightVerts++] = bottomVert;
    }

    // Create edges out of the vertices.
    {
        for (let l = 1; l < numLeftVerts; l++) add_edge(leftVerts[l-1], leftVerts[l], true);
        for (let r = 1; r < numRightVerts; r++) add_edge(rightVerts[r-1], rightVerts[r], false);

        function add_edge(vert1, vert2, isLeftEdge)
        {
            const startY = Math.min(settings.renderHeight, Math.max(0, Math.round(vert1.y)));
            const endY = Math.min(settings.renderHeight, Math.max(0, Math.round(vert2.y)));
            const edgeHeight = (endY - startY);
            
            // Ignore horizontal edges.
            if (edgeHeight === 0) return;

            const w1 = settings.interpolatePerspective? vert1.w : 1;
            const w2 = settings.interpolatePerspective? vert2.w : 1;

            const startX = Math.min(settings.renderWidth, Math.max(0, Math.round(vert1.x)));
            const endX = Math.min(settings.renderWidth, Math.max(0, Math.ceil(vert2.x)));
            const deltaX = ((endX - startX) / edgeHeight);

            const depth1 = (vert1.z / Rngon.internalState.farPlaneDistance);
            const depth2 = (vert2.z / Rngon.internalState.farPlaneDistance);
            const startDepth = depth1/w1;
            const deltaDepth = ((depth2/w2 - depth1/w1) / edgeHeight);

            const startShade = vert1.shade/w1;
            const deltaShade = ((vert2.shade/w2 - vert1.shade/w1) / edgeHeight);

            const u1 = (material.texture? vert1.u : 1);
            const v1 = (material.texture? vert1.v : 1);
            const u2 = (material.texture? vert2.u : 1);
            const v2 = (material.texture? vert2.v : 1);
            const startU = u1/w1;
            const deltaU = ((u2/w2 - u1/w1) / edgeHeight);
            const startV = v1/w1;
            const deltaV = ((v2/w2 - v1/w1) / edgeHeight);

            const startInvW = 1/w1;
            const deltaInvW = ((1/w2 - 1/w1) / edgeHeight);

            const edge = (isLeftEdge? leftEdges[numLeftEdges++] : rightEdges[numRightEdges++]);
            edge.startY = startY;
            edge.endY = endY;
            edge.startX = startX;
            edge.deltaX = deltaX;
            edge.startDepth = startDepth;
            edge.deltaDepth = deltaDepth;
            edge.startShade = startShade;
            edge.deltaShade = deltaShade;
            edge.startU = startU;
            edge.deltaU = deltaU;
            edge.startV = startV;
            edge.deltaV = deltaV;
            edge.startInvW = startInvW;
            edge.deltaInvW = deltaInvW;

            if (settings.usePixelShader)
            {
                edge.startWorldX = vert1.worldX/w1;
                edge.deltaWorldX = ((vert2.worldX/w2 - vert1.worldX/w1) / edgeHeight);

                edge.startWorldY = vert1.worldY/w1;
                edge.deltaWorldY = ((vert2.worldY/w2 - vert1.worldY/w1) / edgeHeight);

                edge.startWorldZ = vert1.worldZ/w1;
                edge.deltaWorldZ = ((vert2.worldZ/w2 - vert1.worldZ/w1) / edgeHeight);
            }
        }
    }

    // Draw the n-gon. On each horizontal raster line, there will be two edges: left and right.
    // We'll render into the pixel buffer each horizontal span that runs between the two edges.
    if (material.hasFill)
    {
        let curLeftEdgeIdx = 0;
        let curRightEdgeIdx = 0;
        let leftEdge = leftEdges[curLeftEdgeIdx];
        let rightEdge = rightEdges[curRightEdgeIdx];
        
        if (!numLeftEdges || !numRightEdges) return;

        // Note: We assume the n-gon's vertices to be sorted by increasing Y.
        const ngonStartY = leftEdges[0].startY;
        const ngonEndY = leftEdges[numLeftEdges-1].endY;
        
        // Rasterize the n-gon in horizontal pixel spans over its height.
        for (let y = ngonStartY; y < ngonEndY; y++)
        {
            const spanStartX = Math.min(settings.renderWidth, Math.max(0, Math.round(leftEdge.startX)));
            const spanEndX = Math.min(settings.renderWidth, Math.max(0, Math.round(rightEdge.startX)));
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

                if (settings.usePixelShader)
                {
                    var deltaWorldX = ((rightEdge.startWorldX - leftEdge.startWorldX) / spanWidth);
                    var iplWorldX = (leftEdge.startWorldX - deltaWorldX);

                    var deltaWorldY = ((rightEdge.startWorldY - leftEdge.startWorldY) / spanWidth);
                    var iplWorldY = (leftEdge.startWorldY - deltaWorldY);

                    var deltaWorldZ = ((rightEdge.startWorldZ - leftEdge.startWorldZ) / spanWidth);
                    var iplWorldZ = (leftEdge.startWorldZ - deltaWorldZ);
                }

                // Assumes the pixel buffer consists of 4 elements per pixel (e.g. RGBA).
                let pixelBufferIdx = (((spanStartX + y * settings.renderWidth) * 4) - 4);

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

                    if (settings.usePixelShader)
                    {
                        iplWorldX += deltaWorldX;
                        iplWorldY += deltaWorldY;
                        iplWorldZ += deltaWorldZ;
                    }

                    const depth = (iplDepth / iplInvW);

                    // Depth test.
                    if (settings.depthBuffer && (settings.depthBuffer[depthBufferIdx] <= depth)) continue;

                    const shade = (material.renderVertexShade? (iplShade / iplInvW) : 1);

                    // The color we'll write into the pixel buffer for this pixel; assuming
                    // it passes the alpha test, the depth test, etc.
                    let red = 0;
                    let green = 0;
                    let blue = 0;

                    // Solid fill.
                    if (!texture)
                    {
                        // Note: We assume that the triangle transformer has already culled away
                        // n-gons whose base color alpha is less than 255; so we don't test for
                        // material.allowAlphaReject.

                        if (material.allowAlphaBlend &&
                            Rngon.baseModules.rasterize.stipple(material.color.alpha, x, y))
                        {
                            continue;
                        }

                        red   = (material.color.red   * shade);
                        green = (material.color.green * shade);
                        blue  = (material.color.blue  * shade);
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

                                        u *= textureMipLevel.width;
                                        v *= textureMipLevel.height;

                                        break;
                                    }
                                    case "repeat":
                                    {
                                        u -= Math.floor(u);
                                        v -= Math.floor(v);

                                        u *= textureMipLevel.width;
                                        v *= textureMipLevel.height;

                                        // Modulo for power-of-two. This will also flip the texture for
                                        // negative UV coordinates.
                                        u = (u & (textureMipLevel.width - 1));
                                        v = (v & (textureMipLevel.height - 1));

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

                                u *= textureMipLevel.width;
                                v *= textureMipLevel.height;
        
                                // Wrap with repetition.
                                /// FIXME: Why do we need to test for UV < 0 even when using positive
                                /// but tiling UV coordinates? Doesn't render properly unless we do.
                                if ((u < 0) ||
                                    (v < 0) ||
                                    (u >= textureMipLevel.width) ||
                                    (v >= textureMipLevel.height))
                                {
                                    const uWasNeg = (u < 0);
                                    const vWasNeg = (v < 0);
        
                                    u = (Math.abs(u) % textureMipLevel.width);
                                    v = (Math.abs(v) % textureMipLevel.height);
        
                                    if (uWasNeg) u = (textureMipLevel.width - u);
                                    if (vWasNeg) v = (textureMipLevel.height - v);
                                }
        
                                break;
                            }
                            // Screen-space UV mapping, as used e.g. in the DOS game Rally-Sport.
                            case "ortho":
                            {
                                const ngonHeight = (ngonEndY - ngonStartY);

                                // Pixel coordinates relative to the polygon.
                                const ngonX = (x - spanStartX + 1);
                                const ngonY = (y - ngonStartY + 1);

                                u = (ngonX * (textureMipLevel.width / spanWidth));
                                v = (ngonY * (textureMipLevel.height / ngonHeight));

                                // The texture image is flipped, so we need to flip V as well.
                                v = (textureMipLevel.height - v);

                                break;
                            }
                            default: Rngon.throw("Unknown texture-mapping mode."); break;
                        }

                        const texel = textureMipLevel.pixels[(~~u) + (~~v) * textureMipLevel.width];

                        // Make sure we gracefully exit if accessing the texture out of bounds.
                        if (!texel)
                        {
                            continue;
                        }

                        if (material.allowAlphaReject &&
                            (texel.alpha !== 255))
                        {
                            continue;
                        }

                        if (material.allowAlphaBlend &&
                            Rngon.baseModules.rasterize.stipple(material.color.alpha, x, y))
                        {
                            continue;
                        }

                        red   = (texel.red   * material.color.unitRange.red   * shade);
                        green = (texel.green * material.color.unitRange.green * shade);
                        blue  = (texel.blue  * material.color.unitRange.blue  * shade);
                    }

                    // The pixel passed its alpha test, depth test, etc., and should be drawn
                    // on screen.
                    {
                        settings.pixelBuffer[pixelBufferIdx + 0] = red;
                        settings.pixelBuffer[pixelBufferIdx + 1] = green;
                        settings.pixelBuffer[pixelBufferIdx + 2] = blue;
                        settings.pixelBuffer[pixelBufferIdx + 3] = 255;

                        if (settings.depthBuffer)
                        {
                            settings.depthBuffer[depthBufferIdx] = depth;
                        }

                        for (let b = 0; b < settings.auxiliaryBuffers.length; b++)
                        {
                            if (material.auxiliary[settings.auxiliaryBuffers[b].property] !== null)
                            {
                                // Buffers are expected to consist of one element per pixel.
                                settings.auxiliaryBuffers[b].buffer[depthBufferIdx] = material.auxiliary[settings.auxiliaryBuffers[b].property];
                            }
                        }

                        if (settings.usePixelShader)
                        {
                            const fragment = settings.fragmentBuffer[depthBufferIdx];
                            fragment.ngonIdx = ngonIdx;
                            fragment.textureUScaled = ~~u;
                            fragment.textureVScaled = ~~v;
                            fragment.depth = (iplDepth / iplInvW);
                            fragment.shade = (iplShade / iplInvW);
                            fragment.worldX = (iplWorldX / iplInvW);
                            fragment.worldY = (iplWorldY / iplInvW);
                            fragment.worldZ = (iplWorldZ / iplInvW);
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

                if (settings.usePixelShader)
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
    }

    // Draw a wireframe around any n-gons that wish for one.
    if (Rngon.internalState.showGlobalWireframe ||
        material.hasWireframe)
    {
        for (let l = 1; l < numLeftVerts; l++)
        {
            Rngon.baseModules.rasterize.line(leftVerts[l-1], leftVerts[l], material.wireframeColor, ngonIdx, true);
        }

        for (let r = 1; r < numRightVerts; r++)
        {
            Rngon.baseModules.rasterize.line(rightVerts[r-1], rightVerts[r], material.wireframeColor, ngonIdx, true);
        }
    }

    return;
}

// Draws a line between the two given vertices into the render's pixel buffer.
Rngon.baseModules.rasterize.line = function(vert1 = Rngon.vertex(),
                                            vert2 = Rngon.vertex(),
                                            color = Rngon.color_rgba(),
                                            ngonIdx = 0,
                                            ignoreDepthBuffer = false)
{
    let x0 = Math.round(vert1.x);
    let y0 = Math.round(vert1.y);
    const x1 = Math.round(vert2.x);
    const y1 = Math.round(vert2.y);
    const lineLength = Math.sqrt((x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0));

    // Establish interpolation parameters.
    const w1 = (settings.interpolatePerspective? vert1.w : 1);
    const w2 = (settings.interpolatePerspective? vert2.w : 1);
    const depth1 = (vert1.z / Rngon.internalState.farPlaneDistance);
    const depth2 = (vert2.z / Rngon.internalState.farPlaneDistance);
    let startDepth = depth1/w1;
    const deltaDepth = ((depth2/w2 - depth1/w1) / lineLength);
    let startShade = vert1.shade/w1;
    const deltaShade = ((vert2.shade/w2 - vert1.shade/w1) / lineLength);
    let startInvW = 1/w1;
    const deltaInvW = ((1/w2 - 1/w1) / lineLength);
    if (settings.fragmentBuffer)
    {
        var startWorldX = vert1.worldX/w1;
        var deltaWorldX = ((vert2.worldX/w2 - vert1.worldX/w1) / lineLength);

        var startWorldY = vert1.worldY/w1;
        var deltaWorldY = ((vert2.worldY/w2 - vert1.worldY/w1) / lineLength);

        var startWorldZ = vert1.worldZ/w1;
        var deltaWorldZ = ((vert2.worldZ/w2 - vert1.worldZ/w1) / lineLength);
    }

    // Bresenham line algo. Adapted from https://stackoverflow.com/a/4672319.
    {
        let dx = Math.abs(x1 - x0);
        let dy = Math.abs(y1 - y0);
        const sx = ((x0 < x1)? 1 : -1);
        const sy = ((y0 < y1)? 1 : -1); 
        let err = (((dx > dy)? dx : -dy) / 2);

        const maxNumSteps = (settings.renderWidth + settings.renderHeight);
        let numSteps = 0;
        
        while (++numSteps < maxNumSteps)
        {
            put_pixel(x0, y0);

            if ((x0 === x1) && (y0 === y1))
            {
                break;
            }

            // Increment interpolated values.
            {
                startDepth += deltaDepth;
                startShade += deltaShade;
                startInvW += deltaInvW;

                if (settings.fragmentBuffer)
                {
                    startWorldX += deltaWorldX;
                    startWorldY += deltaWorldY;
                    startWorldZ += deltaWorldZ;
                }
            }

            const e2 = err;
            if (e2 > -dx)
            {
                err -= dy;
                x0 += sx;
            }
            if (e2 < dy)
            {
                err += dx;
                y0 += sy;
            }
        }

        function put_pixel(x, y)
        {
            const idx = ((x + y * settings.renderWidth) * 4);
            const depthBufferIdx = (idx / 4);

            if ((x < 0) || (x >= settings.renderWidth) ||
                (y < 0) || (y >= settings.renderHeight))
            {
                return;
            }
            
            const depth = (startDepth / startInvW);
            const shade = (startShade / startInvW);

            // Depth test.
            if (!ignoreDepthBuffer && settings.depthBuffer && (settings.depthBuffer[depthBufferIdx] <= depth)) return;

            // Alpha test.
            if (color.alpha !== 255) return;

            // Draw the pixel.
            {
                settings.pixelBuffer[idx + 0] = (shade * color.red);
                settings.pixelBuffer[idx + 1] = (shade * color.green);
                settings.pixelBuffer[idx + 2] = (shade * color.blue);
                settings.pixelBuffer[idx + 3] = 255;

                if (settings.depthBuffer)
                {
                    settings.depthBuffer[depthBufferIdx] = depth;
                }

                if (settings.fragmentBuffer)
                {
                    const fragment = settings.fragmentBuffer[depthBufferIdx];
                    fragment.ngonIdx = ngonIdx;
                    fragment.textureUScaled = undefined; // We don't support textures on lines.
                    fragment.textureVScaled = undefined;
                    fragment.depth = (startDepth / startInvW);
                    fragment.shade = (startShade / startInvW);
                    fragment.worldX = (startWorldX / startInvW);
                    fragment.worldY = (startWorldY / startInvW);
                    fragment.worldZ = (startWorldZ / startInvW);
                    fragment.w = (1 / startInvW);
                }
            }

            return;
        }
    }
};

Rngon.baseModules.rasterize.point = function(vertex = Rngon.vertex(),
                                             material = {},
                                             ngonIdx = 0)
{
    const x = Math.min((settings.renderWidth - 1), Math.max(0, Math.round(vertex.x)));
    const y = Math.min((settings.renderHeight - 1), Math.max(0, Math.round(vertex.y)));
    const idx = ((x + y * settings.renderWidth) * 4);
    const depthBufferIdx = (idx / 4);
    
    const depth = (vertex.z / Rngon.internalState.farPlaneDistance);
    const shade = (material.renderVertexShade? vertex.shade : 1);

    // Alpha test.
    if (material.color.alpha !== 255) return;

    // Depth test.
    if (settings.depthBuffer && (settings.depthBuffer[depthBufferIdx] <= depth)) return;

    const color = (material.texture? material.texture.pixels[0] : material.color);
    
    // Write the pixel.
    {
        settings.pixelBuffer[idx + 0] = (shade * color.red);
        settings.pixelBuffer[idx + 1] = (shade * color.green);
        settings.pixelBuffer[idx + 2] = (shade * color.blue);
        settings.pixelBuffer[idx + 3] = 255;

        if (settings.depthBuffer)
        {
            settings.depthBuffer[depthBufferIdx] = depth;
        }

        if (settings.usePixelShader)
        {
            const fragment = settings.fragmentBuffer[depthBufferIdx];
            fragment.ngonIdx = ngonIdx;
            fragment.textureUScaled = 0;
            fragment.textureVScaled = 0;
            fragment.depth = depth;
            fragment.shade = shade;
            fragment.worldX = vertex.worldX;
            fragment.worldY = vertex.worldY;
            fragment.worldZ = vertex.worldZ;
            fragment.w = vertex.w;
        }
    }

    return;
}

// For emulating pixel transparency with stipple patterns.
Rngon.baseModules.rasterize.stipple = (function()
{
    const patterns = [
        // ~99% transparent.
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

        // ~70% transparent.
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

    // Append a reverse set of patterns to go from 50% to 0% transparent.
    for (let i = (patterns.length - 2); i >= 0; i--)
    {
        patterns.push({
            width: patterns[i].width,
            height: patterns[i].height,
            pixels: patterns[i].pixels.map(p=>Number(!p)),
        });
    }

    // Returns a function that returns true if the given screen pixel coordinate
    // should be transparent at the given alpha level (0-255); false otherwise.
    return function(alpha, screenX, screenY)
    {
        // Full transparency.
        if (alpha <= 0)
        {
            return true;
        }
        // Full opaqueness.
        else if (alpha >= 255)
        {
            return false;
        }
        // Partial transparency.
        else
        {
            const patternIdx = Math.floor(alpha / (256 / patterns.length));
            const pattern = patterns[patternIdx];
            const pixelIdx = ((screenX % pattern.width) + (screenY % pattern.height) * pattern.width);

            if (pattern.pixels[pixelIdx])
            {
                return true;
            }
        }

        return false;
    };
})();

}
