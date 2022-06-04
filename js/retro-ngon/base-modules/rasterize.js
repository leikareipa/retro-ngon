/*
 * 2019-2022 Tarpeeksi Hyvae Soft
 * 
 * Software: Retro n-gon renderer
 * 
 */

"use strict";

Rngon.baseModules = (Rngon.baseModules || {});

{ // A block to limit the scope of the file-global variables we set up, below.

const maxNumVertsPerPolygon = 500;

// For rendering polygons, we'll sort the polygon's vertices into those on its left
// side and those on its right side.
const leftVerts = new Array(maxNumVertsPerPolygon);
const rightVerts = new Array(maxNumVertsPerPolygon);

// Edges connect a polygon's vertices and provide interpolation parameters for
// rasterization. For each horizontal span inside the polygon, we'll render pixels
// from the left edge to the right edge.
const leftEdges = new Array(maxNumVertsPerPolygon).fill().map(e=>({}));
const rightEdges = new Array(maxNumVertsPerPolygon).fill().map(e=>({}));

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
            Rngon.baseModules.rasterize.polygon(ngon, n, auxiliaryBuffers);
            continue;
        }
    }

    return;
}

// Rasterizes a polygon with 3+ vertices into the render's pixel buffer.
Rngon.baseModules.rasterize.polygon = function(
    ngon = Rngon.ngon(),
    ngonIdx = 0,
    auxiliaryBuffers = []
)
{
    Rngon.assert?.(
        (ngon.vertices.length >= 3),
        "Polygons must have 3 or more vertices"
    );

    Rngon.assert?.(
        (ngon.vertices.length < maxNumVertsPerPolygon),
        "Overflowing the vertex buffer"
    );

    const interpolatePerspective = Rngon.internalState.usePerspectiveCorrectInterpolation;
    const usePixelShader = Rngon.internalState.usePixelShader;
    const usePhongShading = (ngon.material.vertexShading === "phong");
    const useAuxiliaryBuffers = auxiliaryBuffers.length;
    const fragmentBuffer = Rngon.internalState.fragmentBuffer.data;
    const pixelBuffer = Rngon.internalState.pixelBuffer.data;
    const depthBuffer = (Rngon.internalState.useDepthBuffer? Rngon.internalState.depthBuffer.data : null);
    const renderWidth = Rngon.internalState.pixelBuffer.width;
    const renderHeight = Rngon.internalState.pixelBuffer.height;

    let numLeftVerts = 0;
    let numRightVerts = 0;
    let numLeftEdges = 0;
    let numRightEdges = 0;

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

    sort_vertices();

    define_edges();

    if (material.hasFill)
    {
        if (
            texture &&
            depthBuffer &&
            !usePhongShading &&
            !usePixelShader &&
            !material.allowAlphaReject &&
            !material.allowAlphaBlend &&
            (material.textureMapping == "affine") &&
            (material.color.red == 255) &&
            (material.color.green == 255) &&
            (material.color.blue == 255)
        ){
            plain_textured_fill();
        }
        else if (
            !texture &&
            depthBuffer &&
            !usePhongShading &&
            !usePixelShader &&
            !useAuxiliaryBuffers &&
            !material.allowAlphaReject &&
            !material.allowAlphaBlend
        ){
            plain_solid_fill();
        }
        else
        {
            fill();
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

    // Defines the edges connecting the polygon's vertices on the left and right sides of
    // the polygon. Each edge is associated with interpolation parameters for rasterization.
    function define_edges()
    {
        for (let l = 1; l < numLeftVerts; l++) add_edge(leftVerts[l-1], leftVerts[l], true);
        for (let r = 1; r < numRightVerts; r++) add_edge(rightVerts[r-1], rightVerts[r], false);

        function add_edge(vert1, vert2, isLeftEdge)
        {
            const startY = Math.min(renderHeight, Math.max(0, Math.floor(vert1.y)));
            const endY = Math.min(renderHeight, Math.max(0, Math.floor(vert2.y)));
            const edgeHeight = (endY - startY);
            
            // Ignore horizontal edges.
            if (edgeHeight === 0) return;

            const w1 = interpolatePerspective? vert1.w : 1;
            const w2 = interpolatePerspective? vert2.w : 1;

            const startX = Math.min(renderWidth, Math.max(0, Math.floor(vert1.x)));
            const endX = Math.min(renderWidth, Math.max(0, Math.floor(vert2.x)));
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

            if (usePhongShading)
            {
                edge.startNx = vert1.normalX/w1;
                edge.deltaNx = ((vert2.normalX/w2 - vert1.normalX/w1) / edgeHeight);
                edge.startNy = vert1.normalY/w1;
                edge.deltaNy = ((vert2.normalY/w2 - vert1.normalY/w1) / edgeHeight);
                edge.startNz = vert1.normalZ/w1;
                edge.deltaNz = ((vert2.normalZ/w2 - vert1.normalZ/w1) / edgeHeight);
            }

            if (usePixelShader || usePhongShading)
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

    // Generic vertex-sorting algorithm for n-sided convex polygons. Sorts the vertices
    // into two arrays, left and right. The left array contains all vertices that are on
    // the left-hand side of a line across the polygon from the highest to the lowest
    // vertex, and the right array has the rest.
    function sort_vertices()
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

    // Fills the current polygon, with certain performance-increasing assumptions made about it.
    // The polygon and render state must fulfill the following criteria:
    // - Depth buffering enabled
    // - No pixel shader
    // - No Phong shading
    // - No alpha operations
    // - Textured
    // - White material color
    // - Only affine texture-mapping
    function plain_textured_fill()
    {
        let curLeftEdgeIdx = 0;
        let curRightEdgeIdx = 0;
        let leftEdge = leftEdges[curLeftEdgeIdx];
        let rightEdge = rightEdges[curRightEdgeIdx];
        
        if (!numLeftEdges || !numRightEdges) return;

        // Note: We assume the n-gon's vertices to be sorted by increasing Y.
        const ngonStartY = leftEdges[0].startY;
        const ngonEndY = leftEdges[numLeftEdges-1].endY;

        for (let y = ngonStartY; y < ngonEndY; y++)
        {
            const spanStartX = Math.min(renderWidth, Math.max(0, Math.round(leftEdge.startX)));
            const spanEndX = Math.min(renderWidth, Math.max(0, Math.ceil(rightEdge.startX)));
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

                // Assumes the pixel buffer consists of 4 elements per pixel (e.g. RGBA).
                let pixelBufferIdx = (((spanStartX + y * renderWidth) * 4) - 4);

                // Assumes the depth buffer consists of 1 element per pixel.
                let depthBufferIdx = (pixelBufferIdx / 4);

                // Draw the span into the pixel buffer.
                for (let x = spanStartX; x < spanEndX; x++)
                {
                    // Update values that're interpolated horizontally along the span.
                    iplDepth += deltaDepth;
                    iplShade += deltaShade;
                    iplU += deltaU;
                    iplV += deltaV;
                    iplInvW += deltaInvW;
                    pixelBufferIdx += 4;
                    depthBufferIdx++;

                    const depth = (iplDepth / iplInvW);

                    if (depthBuffer[depthBufferIdx] <= depth) continue;

                    // Texture UV coordinates.
                    let u = (iplU / iplInvW);
                    let v = (iplV / iplInvW);

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

                    const texel = textureMipLevel.pixels[(~~u) + (~~v) * textureMipLevel.width];
                    
                    // Make sure we gracefully exit if accessing the texture out of bounds.
                    if (!texel)
                    {
                        continue;
                    }

                    const shade = (material.renderVertexShade? (iplShade / iplInvW) : 1);

                    pixelBuffer[pixelBufferIdx + 0] = (texel.red * shade);
                    pixelBuffer[pixelBufferIdx + 1] = (texel.green * shade);
                    pixelBuffer[pixelBufferIdx + 2] = (texel.blue * shade);
                    pixelBuffer[pixelBufferIdx + 3] = 255;
                    depthBuffer[depthBufferIdx] = depth;
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
            }

            // We can move onto the next edge when we're at the end of the current one.
            if (y === (leftEdge.endY - 1)) leftEdge = leftEdges[++curLeftEdgeIdx];
            if (y === (rightEdge.endY - 1)) rightEdge = rightEdges[++curRightEdgeIdx];
        }

        return;
    }

    // Fills the current non-textured polygon, with certain performance-enhancing
    // assumptions. The polygon and render state must fulfill the following criteria:
    // - No texture
    // - No pixel shader
    // - No Phong shading
    // - No alpha operations
    // - No auxiliary buffers
    // - Depth buffering enabled
    function plain_solid_fill()
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
            const spanStartX = Math.min(renderWidth, Math.max(0, Math.round(leftEdge.startX)));
            const spanEndX = Math.min(renderWidth, Math.max(0, Math.ceil(rightEdge.startX)));
            const spanWidth = ((spanEndX - spanStartX) + 1);

            if (spanWidth > 0)
            {
                const deltaDepth = ((rightEdge.startDepth - leftEdge.startDepth) / spanWidth);
                let iplDepth = (leftEdge.startDepth - deltaDepth);

                const deltaShade = ((rightEdge.startShade - leftEdge.startShade) / spanWidth);
                let iplShade = (leftEdge.startShade - deltaShade);

                const deltaInvW = ((rightEdge.startInvW - leftEdge.startInvW) / spanWidth);
                let iplInvW = (leftEdge.startInvW - deltaInvW);

                // Assumes the pixel buffer consists of 4 elements per pixel (e.g. RGBA).
                let pixelBufferIdx = (((spanStartX + y * renderWidth) * 4) - 4);

                // Assumes the depth buffer consists of 1 element per pixel.
                let depthBufferIdx = (pixelBufferIdx / 4);

                // Draw the span into the pixel buffer.
                for (let x = spanStartX; x < spanEndX; x++)
                {
                    // Update values that're interpolated horizontally along the span.
                    iplDepth += deltaDepth;
                    iplShade += deltaShade;
                    iplInvW += deltaInvW;
                    pixelBufferIdx += 4;
                    depthBufferIdx++;

                    const depth = (iplDepth / iplInvW);
                    if (depthBuffer[depthBufferIdx] <= depth) continue;

                    // The color we'll write into the pixel buffer for this pixel; assuming
                    // it passes the alpha test, the depth test, etc.
                    const shade = (material.renderVertexShade? (iplShade / iplInvW) : 1);
                    const red   = (material.color.red   * shade);
                    const green = (material.color.green * shade);
                    const blue  = (material.color.blue  * shade);

                    // The pixel passed its alpha test, depth test, etc., and should be drawn
                    // on screen.
                    {
                        pixelBuffer[pixelBufferIdx + 0] = red;
                        pixelBuffer[pixelBufferIdx + 1] = green;
                        pixelBuffer[pixelBufferIdx + 2] = blue;
                        pixelBuffer[pixelBufferIdx + 3] = 255;
                        depthBuffer[depthBufferIdx] = depth;
                    }
                }
            }

            // Update values that're interpolated vertically along the edges.
            {
                leftEdge.startX      += leftEdge.deltaX;
                leftEdge.startDepth  += leftEdge.deltaDepth;
                leftEdge.startShade  += leftEdge.deltaShade;
                leftEdge.startInvW   += leftEdge.deltaInvW;

                rightEdge.startX     += rightEdge.deltaX;
                rightEdge.startDepth += rightEdge.deltaDepth;
                rightEdge.startShade += rightEdge.deltaShade;
                rightEdge.startInvW  += rightEdge.deltaInvW;
            }

            // We can move onto the next edge when we're at the end of the current one.
            if (y === (leftEdge.endY - 1)) leftEdge = leftEdges[++curLeftEdgeIdx];
            if (y === (rightEdge.endY - 1)) rightEdge = rightEdges[++curRightEdgeIdx];
        }

        return;
    }

    // Fills the current polygon.
    function fill()
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
            const spanStartX = Math.min(renderWidth, Math.max(0, Math.round(leftEdge.startX)));
            const spanEndX = Math.min(renderWidth, Math.max(0, Math.ceil(rightEdge.startX)));
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

                if (usePhongShading)
                {
                    var deltaNx = ((rightEdge.startNx - leftEdge.startNx) / spanWidth);
                    var iplNx = (leftEdge.startNx - deltaNx);

                    var deltaNy = ((rightEdge.startNy - leftEdge.startNy) / spanWidth);
                    var iplNy = (leftEdge.startNy - deltaNy);

                    var deltaNz = ((rightEdge.startNz - leftEdge.startNz) / spanWidth);
                    var iplNz = (leftEdge.startNz - deltaNz);
                }

                if (usePixelShader || usePhongShading)
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

                    if (usePhongShading)
                    {
                        iplNx += deltaNx;
                        iplNy += deltaNy;
                        iplNz += deltaNz;
                    }

                    if (usePixelShader || usePhongShading)
                    {
                        iplWorldX += deltaWorldX;
                        iplWorldY += deltaWorldY;
                        iplWorldZ += deltaWorldZ;
                    }

                    const depth = (iplDepth / iplInvW);

                    // Depth test.
                    if (depthBuffer && (depthBuffer[depthBufferIdx] <= depth)) continue;

                    let shade = (material.renderVertexShade? (iplShade / iplInvW) : 1);
                    let shadeHighlight = 0;

                    if (usePhongShading)
                    {
                        shade = material.ambientLightLevel;

                        const worldPosX = (iplWorldX / iplInvW);
                        const worldPosY = (iplWorldY / iplInvW);
                        const worldPosZ = (iplWorldZ / iplInvW);

                        const N = Rngon.vector3((iplNx / iplInvW), (iplNy / iplInvW), (iplNz / iplInvW));
                        Rngon.vector3.normalize(N)
                        
                        const V = Rngon.vector3(
                            (Rngon.internalState.cameraPosition.x - worldPosX),
                            (Rngon.internalState.cameraPosition.y - worldPosY),
                            (Rngon.internalState.cameraPosition.z - worldPosZ)
                        );
                        Rngon.vector3.normalize(V);

                        for (const light of Rngon.internalState.lights)
                        {
                            if (shade >= light.clip)
                            {
                                continue;
                            }

                            const distance = Math.sqrt(
                                ((worldPosX - light.position.x) * (worldPosX - light.position.x)) +
                                ((worldPosY - light.position.y) * (worldPosY - light.position.y)) +
                                ((worldPosZ - light.position.z) * (worldPosZ - light.position.z))
                            );

                            const distanceMul = (1 / (1 + (light.attenuation * distance)));

                            const L = Rngon.vector3(
                                (light.position.x - worldPosX),
                                (light.position.y - worldPosY),
                                (light.position.z - worldPosZ)
                            );
                            Rngon.vector3.normalize(L);

                            const dotNL = Math.max(0, Math.min(1, Rngon.vector3.dot(N, L)));

                            const R = Rngon.vector3.sub(Rngon.vector3.mul_scalar(N, (2 * dotNL)), L);
                            Rngon.vector3.normalize(R);

                            const Kd = (Math.max(0, dotNL) * distanceMul * light.intensity);
                            const Ks = (material.specularity? Math.pow(Math.max(0, Math.min(1, Rngon.vector3.dot(V, R))), material.specularity) : 0);

                            shade = Math.max(shade, Math.min(light.clip, Kd));
                            shadeHighlight = Math.max(shadeHighlight, (Ks * 255));
                        }
                    }

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
                        
                        red   = ((material.color.red   * shade) + shadeHighlight);
                        green = ((material.color.green * shade) + shadeHighlight);
                        blue  = ((material.color.blue  * shade) + shadeHighlight);
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
                        pixelBuffer[pixelBufferIdx + 0] = red;
                        pixelBuffer[pixelBufferIdx + 1] = green;
                        pixelBuffer[pixelBufferIdx + 2] = blue;
                        pixelBuffer[pixelBufferIdx + 3] = 255;

                        if (depthBuffer)
                        {
                            depthBuffer[depthBufferIdx] = depth;
                        }

                        if (usePixelShader)
                        {
                            const fragment = fragmentBuffer[depthBufferIdx];
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

                        for (let b = 0; b < auxiliaryBuffers.length; b++)
                        {
                            if (material.auxiliary[auxiliaryBuffers[b].property] !== null)
                            {
                                // Buffers are expected to consist of one element per pixel.
                                auxiliaryBuffers[b].buffer[depthBufferIdx] = material.auxiliary[auxiliaryBuffers[b].property];
                            }
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

                if (usePhongShading)
                {
                    leftEdge.startNx += leftEdge.deltaNx;
                    leftEdge.startNy += leftEdge.deltaNy;
                    leftEdge.startNz += leftEdge.deltaNz;

                    rightEdge.startNx += rightEdge.deltaNx;
                    rightEdge.startNy += rightEdge.deltaNy;
                    rightEdge.startNz += rightEdge.deltaNz;
                }

                if (usePixelShader || usePhongShading)
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

        return;
    }
}

// Rasterizes a line between the two given vertices into the render's pixel buffer.
Rngon.baseModules.rasterize.line = function(
    vert1 = Rngon.vertex(),
    vert2 = Rngon.vertex(),
    color = Rngon.color_rgba(),
    ngonIdx = 0,
    ignoreDepthBuffer = false
)
{
    if (color.alpha !== 255)
    {
        return;
    }
    
    const interpolatePerspective = Rngon.internalState.usePerspectiveCorrectInterpolation;
    const farPlane = Rngon.internalState.farPlaneDistance;
    const usePixelShader = Rngon.internalState.usePixelShader;
    const depthBuffer = (Rngon.internalState.useDepthBuffer? Rngon.internalState.depthBuffer.data : null);
    const pixelBuffer = Rngon.internalState.pixelBuffer.data;
    const renderWidth = Rngon.internalState.pixelBuffer.width;
    const renderHeight = Rngon.internalState.pixelBuffer.height;
 
    const startX = Math.floor(vert1.x);
    const startY = Math.floor(vert1.y);
    const endX = Math.floor(vert2.x);
    const endY = Math.ceil(vert2.y);
    let lineLength = Math.round(Math.sqrt((endX - startX) * (endX - startX) + (endY - startY) * (endY - startY)));
    const deltaX = ((endX - startX) / lineLength);
    const deltaY = ((endY - startY) / lineLength);
    let curX = startX;
    let curY = startY;

    // Establish interpolation parameters.
    const w1 = (interpolatePerspective? vert1.w : 1);
    const w2 = (interpolatePerspective? vert2.w : 1);
    const depth1 = (vert1.z / farPlane);
    const depth2 = (vert2.z / farPlane);
    let startDepth = depth1/w1;
    const deltaDepth = ((depth2/w2 - depth1/w1) / lineLength);
    let startShade = vert1.shade/w1;
    const deltaShade = ((vert2.shade/w2 - vert1.shade/w1) / lineLength);
    let startInvW = 1/w1;
    const deltaInvW = ((1/w2 - 1/w1) / lineLength);
    if (usePixelShader)
    {
        var startWorldX = vert1.worldX/w1;
        var deltaWorldX = ((vert2.worldX/w2 - vert1.worldX/w1) / lineLength);

        var startWorldY = vert1.worldY/w1;
        var deltaWorldY = ((vert2.worldY/w2 - vert1.worldY/w1) / lineLength);

        var startWorldZ = vert1.worldZ/w1;
        var deltaWorldZ = ((vert2.worldZ/w2 - vert1.worldZ/w1) / lineLength);
    }

    while (lineLength--)
    {
        const x = Math.floor(curX);
        const y = Math.floor(curY);

        put_pixel(x, y);

        // Increment interpolated values.
        {
            curX += deltaX;
            curY += deltaY;
            startDepth += deltaDepth;
            startShade += deltaShade;
            startInvW += deltaInvW;

            if (usePixelShader)
            {
                startWorldX += deltaWorldX;
                startWorldY += deltaWorldY;
                startWorldZ += deltaWorldZ;
            }
        }
    }

    function put_pixel(x, y)
    {
        if ((x < 0) ||
            (y < 0) ||
            (x >= renderWidth) ||
            (y >= renderHeight))
        {
            return;
        }

        const idx = ((x + y * renderWidth) * 4);
        const depthBufferIdx = (idx / 4);
        const depth = (startDepth / startInvW);
        const shade = (startShade / startInvW);

        // Draw the pixel.
        if (ignoreDepthBuffer ||
            !depthBuffer ||
            (depthBuffer[depthBufferIdx] > depth))
        {
            pixelBuffer[idx + 0] = (shade * color.red);
            pixelBuffer[idx + 1] = (shade * color.green);
            pixelBuffer[idx + 2] = (shade * color.blue);
            pixelBuffer[idx + 3] = 255;

            if (depthBuffer && !ignoreDepthBuffer)
            {
                depthBuffer[depthBufferIdx] = depth;
            }

            if (usePixelShader)
            {
                const fragment = Rngon.internalState.fragmentBuffer.data[depthBufferIdx];
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
};

Rngon.baseModules.rasterize.point = function(
    vertex = Rngon.vertex(),
    material = {},
    ngonIdx = 0
)
{
    if (material.color.alpha != 255)
    {
        return;
    }

    const usePixelShader = Rngon.internalState.usePixelShader;
    const depthBuffer = (Rngon.internalState.useDepthBuffer? Rngon.internalState.depthBuffer.data : null);
    const pixelBuffer = Rngon.internalState.pixelBuffer.data;
    const renderWidth = Rngon.internalState.pixelBuffer.width;
    const renderHeight = Rngon.internalState.pixelBuffer.height;

    const x = Math.floor(vertex.x);
    const y = Math.floor(vertex.y);
    const idx = ((x + y * renderWidth) * 4);
    const depthBufferIdx = (idx / 4);

    if ((x < 0) ||
        (y < 0) ||
        (x >= renderWidth) ||
        (y >= renderHeight))
    {
        return;
    }

    const depth = (vertex.z / Rngon.internalState.farPlaneDistance);
    const shade = (material.renderVertexShade? vertex.shade : 1);
    const color = (material.texture? material.texture.pixels[0] : material.color);

    if (depthBuffer && (depthBuffer[depthBufferIdx] <= depth))
    {
        return;
    }
    
    // Write the pixel.
    {
        pixelBuffer[idx + 0] = (shade * color.red);
        pixelBuffer[idx + 1] = (shade * color.green);
        pixelBuffer[idx + 2] = (shade * color.blue);
        pixelBuffer[idx + 3] = 255;

        if (depthBuffer)
        {
            depthBuffer[depthBufferIdx] = depth;
        }

        if (usePixelShader)
        {
            const fragment = Rngon.internalState.fragmentBuffer.data[depthBufferIdx];
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
