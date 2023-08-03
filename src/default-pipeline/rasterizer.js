/*
 * 2019-2022 Tarpeeksi Hyvae Soft
 * 
 * Software: Retro n-gon renderer
 * 
 */

import {ngon as Ngon} from "../api/ngon.js";
import {vertex as Vertex} from "../api/vertex.js";
import {color as Color} from "../api/color.js";
import {material as Material} from "../api/material.js";
import {assert as Assert} from "../core/util.js";
import {lerp as Lerp} from "../core/util.js";

import {generic_fill} from "./raster-paths/generic-fill.js";
import {plain_solid_fill} from "./raster-paths/plain-solid-fill.js";
import {plain_textured_fill} from "./raster-paths/plain-textured-fill.js";
import {plain_textured_fill_with_color} from "./raster-paths/plain-textured-fill-with-color.js";

const maxNumVertsPerPolygon = 500;

// For rendering polygons, we'll sort the polygon's vertices into those on its left
// side and those on its right side.
const leftVerts = new Array(maxNumVertsPerPolygon);
const rightVerts = new Array(maxNumVertsPerPolygon);

// Edges connect a polygon's vertices and provide interpolation parameters for
// rasterization. For each horizontal span inside the polygon, we'll render pixels
// from the left edge to the right edge.
const leftEdges = new Array(maxNumVertsPerPolygon).fill().map(()=>edge_object_factory());
const rightEdges = new Array(maxNumVertsPerPolygon).fill().map(()=>edge_object_factory());

const vertexSorters = {
    verticalAscending: (vertA, vertB)=>((vertA.y === vertB.y)? 0 : ((vertA.y < vertB.y)? -1 : 1)),
    verticalDescending: (vertA, vertB)=>((vertA.y === vertB.y)? 0 : ((vertA.y > vertB.y)? -1 : 1))
}

// Rasterizes into the render state's pixel buffer all n-gons currently stored in the
// state's n-gon cache.
export function rasterizer(renderState)
{
    for (let n = 0; n < renderState.ngonCache.count; n++)
    {
        const ngon = renderState.ngonCache.ngons[n];

        switch (ngon.vertices.length)
        {
            case 0: continue;
            case 1: rasterizer.point(renderState, ngon.vertices[0], ngon.material, n); break;
            case 2: rasterizer.line(renderState, ngon.vertices[0], ngon.vertices[1], ngon.material.color); break;
            default: rasterizer.polygon(renderState, ngon, n); break;
        }
    }
    
    return;
}

// Rasterizes a polygon with 3+ vertices into the render state's pixel buffer.
rasterizer.polygon = function(
    renderState,
    ngon = Ngon(),
    ngonIdx = 0,
)
{
    Assert?.(
        (ngon.vertices.length >= 3),
        "Polygons must have 3 or more vertices"
    );

    Assert?.(
        (ngon.vertices.length < maxNumVertsPerPolygon),
        "Overflowing the vertex buffer"
    );

    const interpolatePerspective = renderState.usePerspectiveInterpolation;
    const useFragmentBuffer = renderState.useFragmentBuffer;
    const depthBuffer = (renderState.useDepthBuffer? renderState.depthBuffer.data : null);
    const renderWidth = renderState.pixelBuffer.width;
    const renderHeight = renderState.pixelBuffer.height;
    const material = ngon.material;
    const pixelBuffer32 = new Uint32Array(renderState.pixelBuffer.data.buffer);

    let numLeftVerts = 0;
    let numRightVerts = 0;
    let numLeftEdges = 0;
    let numRightEdges = 0;
    
    sort_vertices();
    define_edges();

    // Rasterize the polygon using the most appropriate raster shader.
    if (material.hasFill)
    {
        const rasterShaderArgs = {
            renderState,
            ngonIdx,
            leftEdges,
            rightEdges,
            numLeftEdges,
            numRightEdges,
            pixelBuffer32,
        };

        if (!renderState.modules.raster_shader?.(rasterShaderArgs))
        {
            let raster_fn = undefined;

            if (
                material.texture &&
                depthBuffer &&
                !useFragmentBuffer &&
                !material.allowAlphaReject &&
                !material.allowAlphaBlend &&
                (material.textureMapping === "affine") &&
                (material.textureFiltering !== "dither")
            ){
                if (
                    (material.color.red === 255) &&
                    (material.color.green === 255) &&
                    (material.color.blue === 255) &&
                    (material.textureFiltering === "none")
                ){
                    raster_fn = plain_textured_fill;
                }
                else
                {
                    raster_fn = plain_textured_fill_with_color;
                }
            }
            else if (
                !material.texture &&
                depthBuffer &&
                !useFragmentBuffer &&
                !material.allowAlphaReject &&
                !material.allowAlphaBlend
            ){
                raster_fn = plain_solid_fill;
            }
            else
            {
                raster_fn = generic_fill;
            }

            raster_fn(rasterShaderArgs);
        }
    }

    // Draw a wireframe around any n-gons that wish for one.
    if (renderState.showGlobalWireframe || material.hasWireframe)
    {
        for (let l = 1; l < numLeftVerts; l++)
        {
            rasterizer.line(renderState, leftVerts[l-1], leftVerts[l], material.wireframeColor);
        }

        for (let r = 1; r < numRightVerts; r++)
        {
            rasterizer.line(renderState, rightVerts[r-1], rightVerts[r], material.wireframeColor);
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

            const depth1 = (vert1.z / renderState.farPlaneDistance);
            const depth2 = (vert2.z / renderState.farPlaneDistance);
            const startDepth = (depth1 / w1);
            const deltaDepth = (((depth2 / w2) - (depth1 / w1)) / edgeHeight);

            const startShade = vert1.shade;
            const deltaShade = ((vert2.shade - vert1.shade) / edgeHeight);

            const u1 = (material.texture? vert1.u : 1);
            const v1 = (material.texture? (1 - vert1.v) : 1);
            const u2 = (material.texture? vert2.u : 1);
            const v2 = (material.texture? (1 - vert2.v) : 1);
            const startU = (u1 / w1);
            const deltaU = (((u2 / w2) - (u1 / w1)) / edgeHeight);
            const startV = (v1 / w1);
            const deltaV = (((v2 / w2) - (v1 / w1)) / edgeHeight);

            const startInvW = (1 / w1);
            const deltaInvW = (((1 / w2) - (1 / w1)) / edgeHeight);

            const edge = (isLeftEdge? leftEdges[numLeftEdges++] : rightEdges[numRightEdges++]);
            edge.top = startY;
            edge.bottom = endY;
            edge.x = startX;
            edge.delta.x = deltaX;
            edge.depth = startDepth;
            edge.delta.depth = deltaDepth;
            edge.shade = startShade;
            edge.delta.shade = deltaShade;
            edge.u = startU;
            edge.delta.u = deltaU;
            edge.v = startV;
            edge.delta.v = deltaV;
            edge.invW = startInvW;
            edge.delta.invW = deltaInvW;
            if (useFragmentBuffer)
            {
                edge.worldX = (vert1.worldX / w1);
                edge.delta.worldX = (((vert2.worldX / w2) - (vert1.worldX / w1)) / edgeHeight);
                edge.worldY = (vert1.worldY / w1);
                edge.delta.worldY = (((vert2.worldY / w2) - (vert1.worldY / w1)) / edgeHeight);
                edge.worldZ = (vert1.worldZ / w1);
                edge.delta.worldZ = (((vert2.worldZ / w2) - (vert1.worldZ / w1)) / edgeHeight);
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
            const lr = Lerp(topVert.x, bottomVert.x, ((ngon.vertices[i].y - topVert.y) / (bottomVert.y - topVert.y)));

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
}

// Rasterizes a line between the two given vertices into the render state's pixel buffer.
rasterizer.line = function(
    renderState,
    vert1 = Vertex(),
    vert2 = Vertex(),
    color = Color(),
    ignoreDepthBuffer = true
)
{
    if (color.alpha !== 255)
    {
        return;
    }

    const renderWidth = renderState.pixelBuffer.width;
    const renderHeight = renderState.pixelBuffer.height;

    // If the line is fully outside the screen.
    if (
        ((vert1.x < 0) && (vert2.x < 0)) ||
        ((vert1.x >= renderWidth) && (vert2.y >= renderWidth)) ||
        ((vert1.y < 0) && (vert2.y < 0)) ||
        ((vert1.y >= renderHeight) && (vert2.y < renderHeight))
    ){
        return;
    }
    
    const interpolatePerspective = renderState.usePerspectiveInterpolation;
    const farPlane = renderState.farPlaneDistance;
    const useFragmentBuffer = renderState.useFragmentBuffer;
    const depthBuffer = (renderState.useDepthBuffer? renderState.depthBuffer.data : null);
    const pixelBufferClamped8 = renderState.pixelBuffer.data;
    const pixelBuffer = new Uint32Array(pixelBufferClamped8.buffer);
 
    const startX = Math.floor(vert1.x);
    const startY = Math.floor(vert1.y);
    const endX = Math.floor(vert2.x);
    const endY = Math.ceil(vert2.y);
    let lineLength = Math.ceil(Math.sqrt((endX - startX) * (endX - startX) + (endY - startY) * (endY - startY)));

    // Establish interpolation parameters.
    const w1 = (interpolatePerspective? vert1.w : 1);
    const w2 = (interpolatePerspective? vert2.w : 1);
    const startDepth = (vert1.z / farPlane);
    const endDepth = (vert2.z / farPlane);
    const deltaDepth = (((endDepth / w2) - (startDepth / w1)) / lineLength);
    const deltaShade = (((vert2.shade / w2) - (vert1.shade / w2)) / lineLength);
    const deltaInvW = (((1 / w2) - (1 / w1)) / lineLength);
    let depth = (startDepth / w1);
    let shade = (vert1.shade / w1);
    let invW = (1 / w1);
    let worldX, worldY, worldZ, deltaWorldX, deltaWorldY, deltaWorldZ;
    if (useFragmentBuffer)
    {
        worldX = (vert1.worldX / w1);
        worldY = (vert1.worldY / w1);
        worldZ = (vert1.worldZ / w1);
        deltaWorldX = (((vert2.worldX / w2) - (vert1.worldX / w1)) / lineLength);
        deltaWorldY = (((vert2.worldY / w2) - (vert1.worldY / w1)) / lineLength);
        deltaWorldZ = (((vert2.worldZ / w2) - (vert1.worldZ / w1)) / lineLength);
    }
    
    // Render the line.
    let curX = startX;
    let curY = startY;
    const deltaX = ((endX - startX) / lineLength);
    const deltaY = ((endY - startY) / lineLength);
    while (lineLength--)
    {
        const x = ~~curX;
        const y = ~~curY;
        
        // Rasterize a pixel.
        if (
            (x >= 0) &&
            (y >= 0) &&
            (x < renderWidth) &&
            (y < renderHeight)
        ){
            const depthPersp = (depth / invW);
            const shadePersp = (shade / invW);
            const pixelBufferIdx = (x + y * renderWidth);

            if (
                ignoreDepthBuffer ||
                !depthBuffer ||
                (depthBuffer[pixelBufferIdx] > depthPersp)
            ){
                const red = (color.red * shadePersp);
                const green = (color.green * shadePersp);
                const blue = (color.blue * shadePersp);
                
                // If shade is > 1, the color values may exceed 255, in which case we write into
                // the clamped 8-bit view to get 'free' clamping.
                if (shadePersp > 1)
                {
                    const idx = (pixelBufferIdx * 4);
                    pixelBufferClamped8[idx+0] = red;
                    pixelBufferClamped8[idx+1] = green;
                    pixelBufferClamped8[idx+2] = blue;
                    pixelBufferClamped8[idx+3] = 255;
                }
                else
                {
                    pixelBuffer[pixelBufferIdx] = (
                        (255 << 24) +
                        (blue << 16) +
                        (green << 8) +
                        ~~red
                    );
                }

                if (depthBuffer && !ignoreDepthBuffer)
                {
                    depthBuffer[pixelBufferIdx] = depthPersp;
                }

                if (useFragmentBuffer)
                {
                    const fragment = renderState.fragmentBuffer.data[pixelBufferIdx];
                    fragment.ngonIdx = -1;
                    fragment.textureUScaled = undefined; // We don't support textures on lines.
                    fragment.textureVScaled = undefined;
                    fragment.depth = depth;
                    fragment.shade = shade;
                    fragment.worldX = worldX;
                    fragment.worldY = worldY;
                    fragment.worldZ = worldZ;
                    fragment.w = 1;
                }
            }
        }

        // Increment interpolated values.
        {
            curX += deltaX;
            curY += deltaY;
            depth += deltaDepth;
            shade += deltaShade;
            invW += deltaInvW;

            if (useFragmentBuffer)
            {
                worldX += deltaWorldX;
                worldY += deltaWorldY;
                worldZ += deltaWorldZ;
            }
        }
    }
};

rasterizer.point = function(
    renderState,
    vertex = Vertex(),
    material = Material(),
    ngonIdx = 0
)
{
    if (material.color.alpha != 255)
    {
        return;
    }

    const useFragmentBuffer = renderState.useFragmentBuffer;
    const depthBuffer = (renderState.useDepthBuffer? renderState.depthBuffer.data : null);
    const pixelBufferClamped8 = renderState.pixelBuffer.data;
    const pixelBuffer = new Uint32Array(pixelBufferClamped8.buffer);
    const renderWidth = renderState.pixelBuffer.width;
    const renderHeight = renderState.pixelBuffer.height;

    const x = Math.floor(vertex.x);
    const y = Math.floor(vertex.y);
    const pixelBufferIdx = (x + y * renderWidth);

    if ((x < 0) ||
        (y < 0) ||
        (x >= renderWidth) ||
        (y >= renderHeight))
    {
        return;
    }

    const depth = (vertex.z / renderState.farPlaneDistance);
    const shade = (material.renderVertexShade? vertex.shade : 1);
    const color = (material.texture? material.texture.pixels[0] : material.color);
    const red = (color.red * shade);
    const green = (color.green * shade);
    const blue = (color.blue * shade);

    if (depthBuffer && (depthBuffer[pixelBufferIdx] <= depth))
    {
        return;
    }
    
    // Write the pixel.
    {
        // If shade is > 1, the color values may exceed 255, in which case we write into
        // the clamped 8-bit view to get 'free' clamping.
        if (shade > 1)
        {
            const idx = (pixelBufferIdx * 4);
            pixelBufferClamped8[idx+0] = red;
            pixelBufferClamped8[idx+1] = green;
            pixelBufferClamped8[idx+2] = blue;
            pixelBufferClamped8[idx+3] = 255;
        }
        else
        {
            pixelBuffer[pixelBufferIdx] = (
                (255 << 24) +
                (blue << 16) +
                (green << 8) +
                red
            );
        }

        if (depthBuffer)
        {
            depthBuffer[pixelBufferIdx] = depth;
        }

        if (useFragmentBuffer)
        {
            const fragment = renderState.fragmentBuffer.data[pixelBufferIdx];
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
rasterizer.stipple = (function()
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

// Returns an empty polygon edge object. An edge represents an outer edge of a polygon,
// associated with values that are to be interpolated across the polygon during rasterization.
function edge_object_factory()
{
    return {
        // The top (smallest Y) and bottom (largest Y) extent of this edge, in screen coordinates.
        top: undefined,
        bottom: undefined,

        // The starting values of the properties associated with this edge, at the top of the edge.
        start: {
            x: undefined,
            depth: undefined,
            shade: undefined,
            u: undefined,
            v: undefined,
            invW: undefined,
            worldX: undefined,
            worldY: undefined,
            worldZ: undefined,
        },

        // For each property in 'start', a corresponding amount by which that value is changed per
        // horizontal pixel span from the top of the edge down.
        delta: {},
    }
}
