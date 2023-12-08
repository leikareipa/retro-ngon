/*
 * 2019-2022 Tarpeeksi Hyvae Soft
 * 
 * Software: Retro n-gon renderer
 * 
 */

import {Ngon} from "../api/ngon.mjs";
import {Vertex} from "../api/vertex.mjs";
import {Color} from "../api/color.mjs";
import {Assert} from "../assert.mjs";

import {poly_generic_fill} from "./raster-paths/polygon/generic-fill.mjs";
import {poly_plain_solid_fill} from "./raster-paths/polygon/plain-solid-fill.mjs";
import {poly_plain_textured_fill} from "./raster-paths/polygon/plain-textured-fill.mjs";
import {poly_plain_textured_fill_with_color} from "./raster-paths/polygon/plain-textured-fill-with-color.mjs";
import {line_generic_fill} from "./raster-paths/line/generic-fill.mjs";
import {line_plain_fill} from "./raster-paths/line/plain-fill.mjs";
import {point_generic_fill} from "./raster-paths/point/generic-fill.mjs";
import {point_plain_fill} from "./raster-paths/point/plain-fill.mjs";

const maxNumVertsPerPolygon = 500;

// For rendering polygons, we'll sort the polygon's vertices into those on its left
// side and those on its right side.
const leftVerts = new Array(maxNumVertsPerPolygon);
const rightVerts = new Array(maxNumVertsPerPolygon);

// Edges connect a polygon's vertices and provide interpolation parameters for
// rasterization. For each horizontal span inside the polygon, we'll render pixels
// from the left edge to the right edge.
const leftEdges = new Array(maxNumVertsPerPolygon).fill().map(()=>({
    top: undefined,
    bottom: undefined,
    start: {},
    delta: {},
}));
const rightEdges = new Array(maxNumVertsPerPolygon).fill().map(()=>({
    top: undefined,
    bottom: undefined,
    start: {},
    delta: {},
}));

const vertexSorters = {
    verticalAscending: (vertA, vertB)=>((vertA.y === vertB.y)? 0 : ((vertA.y < vertB.y)? -1 : 1)),
    verticalDescending: (vertA, vertB)=>((vertA.y === vertB.y)? 0 : ((vertA.y > vertB.y)? -1 : 1))
}

function lerp(x, y, interval)
{
    return (x + (interval * (y - x)));
}

// Rasterizes into the render state's pixel buffer all n-gons currently stored in the
// state's n-gon cache.
export function rasterizer(renderState)
{
    for (const ngon of renderState.screenSpaceNgons)
    {
        Assert?.(ngon.vertices.length, "Encountered an n-gon with 0 vertices");
        
        switch (ngon.vertices.length)
        {
            case 0: continue;
            case 1: rasterizer.point(renderState, ngon.vertices[0], ngon.material.color); break;
            case 2: rasterizer.line(renderState, ngon.vertices[0], ngon.vertices[1], ngon.material.color, ngon.material.renderVertexShade); break;
            default: rasterizer.polygon(renderState, ngon); break;
        }
    }
    
    return;
}

// Rasterizes a polygon with 3+ vertices into the render state's pixel buffer.
rasterizer.polygon = function(
    renderState,
    ngon = Ngon(),
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

    const useFragmentBuffer = renderState.useFragmentBuffer;
    const fragments = renderState.fragments;
    const depthBuffer = (renderState.useDepthBuffer? renderState.depthBuffer.data : null);
    const renderWidth = renderState.pixelBuffer.width;
    const renderHeight = renderState.pixelBuffer.height;
    const material = ngon.material;

    let numLeftVerts = 0;
    let numRightVerts = 0;
    let numLeftEdges = 0;
    let numRightEdges = 0;
    
    sort_vertices();
    define_edges();

    // Rasterize the polygon using the most appropriate raster path.
    if (material.hasFill)
    {
        let raster_fn = poly_generic_fill;

        if (
            material.texture &&
            depthBuffer &&
            !(fragments.worldX || fragments.worldY || fragments.worldZ) &&
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
                raster_fn = poly_plain_textured_fill;
            }
            else
            {
                raster_fn = poly_plain_textured_fill_with_color;
            }
        }
        else if (
            !material.texture &&
            depthBuffer &&
            !(fragments.worldX || fragments.worldY || fragments.worldZ) &&
            !material.allowAlphaReject &&
            !material.allowAlphaBlend
        ){
            raster_fn = poly_plain_solid_fill;
        }

        raster_fn({
            renderState,
            ngon,
            leftEdges,
            rightEdges,
            numLeftEdges,
            numRightEdges,
        });
    }

    // Draw a wireframe around any n-gons that wish for one.
    if (renderState.showGlobalWireframe || material.hasWireframe)
    {
        for (let l = 1; l < numLeftVerts; l++)
        {
            rasterizer.line(renderState, leftVerts[l-1], leftVerts[l], material.wireframeColor, material.renderVertexShade);
        }

        for (let r = 1; r < numRightVerts; r++)
        {
            rasterizer.line(renderState, rightVerts[r-1], rightVerts[r], material.wireframeColor, material.renderVertexShade);
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
            if (edgeHeight === 0)
            {
                return;
            }

            const startX = Math.min(renderWidth, Math.max(0, Math.floor(vert1.x)));
            const endX = Math.min(renderWidth, Math.max(0, Math.floor(vert2.x)));
            const deltaX = ((endX - startX) / edgeHeight);

            const u1 = (material.texture? vert1.u : 1);
            const v1 = (material.texture? (1 - vert1.v) : 1);
            const u2 = (material.texture? vert2.u : 1);
            const v2 = (material.texture? (1 - vert2.v) : 1);

            const w1 = vert1.w;
            const w2 = vert2.w;

            const edge = (isLeftEdge? leftEdges[numLeftEdges++] : rightEdges[numRightEdges++]);
            edge.top = startY;
            edge.bottom = endY;
            edge.x = startX;
            edge.delta.x = deltaX;
            edge.depth = ((vert1.z / renderState.farPlaneDistance) / w1);
            edge.delta.depth = ((((vert2.z / renderState.farPlaneDistance) / w2) - edge.depth) / edgeHeight);
            edge.shade = (vert1.shade / w1);
            edge.delta.shade = (((vert2.shade / w2) - edge.shade) / edgeHeight);
            edge.u = (u1 / w1);
            edge.delta.u = (((u2 / w2) - edge.u) / edgeHeight);
            edge.v = (v1 / w1);
            edge.delta.v = (((v2 / w2) - edge.v) / edgeHeight);
            edge.invW = (1 / w1);
            edge.delta.invW = (((1 / w2) - edge.invW) / edgeHeight);
            
            if (useFragmentBuffer)
            {
                edge.worldX = (vert1.worldX / w1);
                edge.delta.worldX = (((vert2.worldX / w2) - edge.worldX) / edgeHeight);
                edge.worldY = (vert1.worldY / w1);
                edge.delta.worldY = (((vert2.worldY / w2) - edge.worldY) / edgeHeight);
                edge.worldZ = (vert1.worldZ / w1);
                edge.delta.worldZ = (((vert2.worldZ / w2) - edge.worldZ) / edgeHeight);
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
            const lr = lerp(topVert.x, bottomVert.x, ((ngon.vertices[i].y - topVert.y) / (bottomVert.y - topVert.y)));

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
// Assumes the vertices are in screen space.
rasterizer.line = function(
    renderState,
    vert1 = Vertex(),
    vert2 = Vertex(),
    color = Color(),
    renderShade = true,
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
        ((vert1.x >= renderWidth) && (vert2.x >= renderWidth)) ||
        ((vert1.y < 0) && (vert2.y < 0)) ||
        ((vert1.y >= renderHeight) && (vert2.y < renderHeight))
    ){
        return;
    }

    // Rasterize the line using the most appropriate raster path.
    {
        let raster_fn = line_generic_fill;

        if (
            !renderState.useDepthBuffer &&
            (!renderShade || ((vert1.shade === 1) && (vert2.shade === 1)))
        ){
            raster_fn = line_plain_fill;
        }

        raster_fn(renderState, vert1, vert2, color, renderShade);
    }

    return;
};

// Rasterizes the given vertex as a point into the render state's pixel buffer.
// Assumes the vertex is in screen space.
rasterizer.point = function(
    renderState,
    vert = Vertex(),
    color = Color(),
)
{
    if (color.alpha != 255)
    {
        return;
    }

    const renderWidth = renderState.pixelBuffer.width;
    const renderHeight = renderState.pixelBuffer.height;

    // If the point is fully outside the screen.
    if (
        (vert.x < 0) ||
        (vert.y < 0) ||
        (vert.x >= renderWidth) ||
        (vert.y >= renderHeight)
    ){
        return;
    }

    // Rasterize the point using the most appropriate raster path.
    {
        let raster_fn = point_generic_fill;

        if (
            !renderState.useDepthBuffer &&
            (vert.shade === 1)
        ){
            raster_fn = point_plain_fill;
        }

        raster_fn(renderState, vert, color);
    }

    return;
}

// For emulating alpha blending with stipple patterns.
rasterizer.stipple_test = (function()
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
