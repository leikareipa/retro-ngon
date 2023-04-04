/*
 * 2019-2022 Tarpeeksi Hyvae Soft
 * 
 * Software: Retro n-gon renderer
 * 
 */

import {generic_fill} from "./rasterize/raster-shader-generic-fill.js";
import {plain_solid_fill} from "./rasterize/raster-shader-plain-solid-fill.js";
import {plain_textured_fill} from "./rasterize/raster-shader-plain-textured-fill.js";

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

// Rasterizes into the internal pixel buffer all n-gons currently stored in the
// internal n-gon cache.
//
// Note: Consider this the inner render loop; it may contain ugly things like
// code repetition for the benefit of performance. If you'd like to refactor the
// code, please benchmark its effects on performance first - maintaining or
// improving performance would be great, losing performance would be bad.
//
export function rasterize(auxiliaryBuffers = [])
{
    for (let n = 0; n < Rngon.state.active.ngonCache.count; n++)
    {
        const ngon = Rngon.state.active.ngonCache.ngons[n];

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
rasterize.polygon = function(
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

    const interpolatePerspective = Rngon.state.active.usePerspectiveCorrectInterpolation;
    const usePixelShader = Rngon.state.active.usePixelShader;
    const useAuxiliaryBuffers = auxiliaryBuffers.length;
    const depthBuffer = (Rngon.state.active.useDepthBuffer? Rngon.state.active.depthBuffer.data : null);
    const renderWidth = Rngon.state.active.pixelBuffer.width;
    const renderHeight = Rngon.state.active.pixelBuffer.height;
    const usePalette = Rngon.state.active.usePalette;
    const material = ngon.material;
    const pixelBuffer32 = usePalette
        ? undefined
        : new Uint32Array(Rngon.state.active.pixelBuffer.data.buffer);

    let numLeftVerts = 0;
    let numRightVerts = 0;
    let numLeftEdges = 0;
    let numRightEdges = 0;
    
    sort_vertices();
    define_edges();

    if (material.hasFill)
    {
        const rasterShaderArgs = {
            ngon,
            ngonIdx,
            leftEdges,
            rightEdges,
            numLeftEdges,
            numRightEdges,
            pixelBuffer32,
            auxiliaryBuffers
        };

        // If none of the user-provided raster shaders accept this n-gon, we'll use one
        // of the built-in raster shaders.
        if (Rngon.state.active.rasterShaders.every(fn=>!fn(rasterShaderArgs)))
        {
            let raster_fn = generic_fill;

            if (
                material.texture &&
                depthBuffer &&
                !usePixelShader &&
                !material.allowAlphaReject &&
                !material.allowAlphaBlend &&
                (material.textureMapping === "affine") &&
                (material.textureFiltering === "none") &&
                (material.color.red === 255) &&
                (material.color.green === 255) &&
                (material.color.blue === 255)
            ){
                raster_fn = plain_textured_fill;
            }
            else if (
                !material.texture &&
                depthBuffer &&
                !usePixelShader &&
                !useAuxiliaryBuffers &&
                !material.allowAlphaReject &&
                !material.allowAlphaBlend
            ){
                raster_fn = plain_solid_fill;
            }

            raster_fn(rasterShaderArgs);
        }
    }

    // Draw a wireframe around any n-gons that wish for one.
    if (Rngon.state.active.showGlobalWireframe ||
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

            const depth1 = (vert1.z / Rngon.state.active.farPlaneDistance);
            const depth2 = (vert2.z / Rngon.state.active.farPlaneDistance);
            const startDepth = depth1/w1;
            const deltaDepth = ((depth2/w2 - depth1/w1) / edgeHeight);

            const startShade = vert1.shade;
            const deltaShade = ((vert2.shade - vert1.shade) / edgeHeight);

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
            edge.top = startY;
            edge.bottom = endY;
            edge.start.x = startX;
            edge.delta.x = deltaX;
            edge.start.depth = startDepth;
            edge.delta.depth = deltaDepth;
            edge.start.shade = startShade;
            edge.delta.shade = deltaShade;
            edge.start.u = startU;
            edge.delta.u = deltaU;
            edge.start.v = startV;
            edge.delta.v = deltaV;
            edge.start.invW = startInvW;
            edge.delta.invW = deltaInvW;
            if (usePixelShader)
            {
                edge.start.worldX = vert1.worldX/w1;
                edge.delta.worldX = ((vert2.worldX/w2 - vert1.worldX/w1) / edgeHeight);
                edge.start.worldY = vert1.worldY/w1;
                edge.delta.worldY = ((vert2.worldY/w2 - vert1.worldY/w1) / edgeHeight);
                edge.start.worldZ = vert1.worldZ/w1;
                edge.delta.worldZ = ((vert2.worldZ/w2 - vert1.worldZ/w1) / edgeHeight);
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
}

// Rasterizes a line between the two given vertices into the render's pixel buffer.
rasterize.line = function(
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
    
    const interpolatePerspective = Rngon.state.active.usePerspectiveCorrectInterpolation;
    const farPlane = Rngon.state.active.farPlaneDistance;
    const usePixelShader = Rngon.state.active.usePixelShader;
    const depthBuffer = (Rngon.state.active.useDepthBuffer? Rngon.state.active.depthBuffer.data : null);
    const pixelBufferClamped8 = Rngon.state.active.pixelBuffer.data;
    const pixelBuffer = new Uint32Array(pixelBufferClamped8.buffer);
    const renderWidth = Rngon.state.active.pixelBuffer.width;
    const renderHeight = Rngon.state.active.pixelBuffer.height;
 
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

        const pixelBufferIdx = (x + y * renderWidth);
        const depth = (startDepth / startInvW);
        const shade = (startShade / startInvW);
        const red = (color.red * shade);
        const green = (color.green * shade);
        const blue = (color.blue * shade);

        // Draw the pixel.
        if (ignoreDepthBuffer ||
            !depthBuffer ||
            (depthBuffer[pixelBufferIdx] > depth))
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

            if (depthBuffer && !ignoreDepthBuffer)
            {
                depthBuffer[pixelBufferIdx] = depth;
            }

            if (usePixelShader)
            {
                const fragment = Rngon.state.active.fragmentBuffer.data[pixelBufferIdx];
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

rasterize.point = function(
    vertex = Rngon.vertex(),
    material = Rngon.material(),
    ngonIdx = 0
)
{
    if (material.color.alpha != 255)
    {
        return;
    }

    const usePixelShader = Rngon.state.active.usePixelShader;
    const depthBuffer = (Rngon.state.active.useDepthBuffer? Rngon.state.active.depthBuffer.data : null);
    const pixelBufferClamped8 = Rngon.state.active.pixelBuffer.data;
    const pixelBuffer = new Uint32Array(pixelBufferClamped8.buffer);
    const renderWidth = Rngon.state.active.pixelBuffer.width;
    const renderHeight = Rngon.state.active.pixelBuffer.height;

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

    const depth = (vertex.z / Rngon.state.active.farPlaneDistance);
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

        if (usePixelShader)
        {
            const fragment = Rngon.state.active.fragmentBuffer.data[pixelBufferIdx];
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
rasterize.stipple = (function()
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
