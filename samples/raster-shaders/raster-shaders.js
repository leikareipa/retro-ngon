/*
 * 2022 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer / render sample
 * 
 */

"use strict";

import {scene} from "./assets/scene.rngon-model.js";
import {first_person_camera} from "../first-person-camera/camera.js";

export const sample = {
    initialize: function()
    {
        this.camera = first_person_camera("canvas", {
            position: {x:-70, y:33, z:-7},
            direction: {x:7, y:90, z:0},
            movementSpeed: 0.05,
        });

        // To allow the shader functions access to the Rngon namespace.
        this.Rngon = Rngon;

        scene.initialize();
    },
    tick: function()
    {
        this.numTicks++;
        this.camera.update();

        return {
            renderOptions: {
                rasterShaders: [parent.ACTIVE_SHADER.function?.bind(this)],
                cameraDirection: this.camera.direction,
                cameraPosition: this.camera.position,
            },
            mesh: this.Rngon.mesh(scene.ngons, {
                scaling: this.Rngon.vector(25, 25, 25)
            }),
        };
    },
    shaders: [
        {title:"None",          function:null},
        {title:"Scanlines",     function:rs_scanlines},
        {title:"POV light",     function:rs_pov_light},
        {title:"Top glow",      function:rs_top_glow},
        {title:"Wireframe",     function:rs_wireframe},
    ],
    camera: undefined,
    Rngon: undefined,
    numTicks: 0,
};

// Modifies edge shade values and returns false to have the renderer use a default rasterizer
// to draw them.
function rs_top_glow({
    leftEdges,
    rightEdges,
    numLeftEdges,
    numRightEdges,
})
{
    if (!numLeftEdges || !numRightEdges) return;

    const renderHeight = this.Rngon.state.active.pixelBuffer.height;
    const edges = [...leftEdges.slice(0, numLeftEdges), ...rightEdges.slice(0, numRightEdges)];

    for (const edge of edges)
    {
        const height = (edge.bottom - edge.top);
        const shadeTop = (1 - (edge.top / renderHeight));
        const shadeBottom = (1 - (edge.bottom / renderHeight));
        edge.start.shade = shadeTop;
        edge.delta.shade = ((shadeBottom - shadeTop) / height);
    }

    return false;
}

// Modifies edge shade values and returns false to have the renderer use a default rasterizer
// to draw them.
function rs_pov_light({
    leftEdges,
    rightEdges,
    numLeftEdges,
    numRightEdges,
})
{
    const edges = [...leftEdges.slice(0, numLeftEdges), ...rightEdges.slice(0, numRightEdges)];

    for (const edge of edges)
    {
        const height = (edge.bottom - edge.top);
        const shadeTop = Math.min(1, Math.max(0, (1 - edge.start.depth / edge.start.invW*8)));
        const shadeBottom = Math.min(1, Math.max(0, (1 - (edge.start.depth + (edge.delta.depth * height)) / (edge.start.invW + (edge.delta.invW * height))*8)));
        edge.start.shade = shadeTop;
        edge.delta.shade = ((shadeBottom - shadeTop) / height);
    }

    return false;
}

function rs_wireframe({
    leftEdges,
    rightEdges,
    numLeftEdges,
    numRightEdges,
})
{
    if (!numLeftEdges || !numRightEdges) return;

    for (let i = 0; i < numLeftEdges; i++)
    {
        const e = leftEdges[i];
        this.Rngon.baseModules.rasterize.line(
            this.Rngon.vertex(e.start.x, e.top),
            this.Rngon.vertex((e.start.x + (e.delta.x * (e.bottom - e.top))), e.bottom),
        );
    }

    for (let i = 0; i < numRightEdges; i++)
    {
        const e = rightEdges[i];
        this.Rngon.baseModules.rasterize.line(
            this.Rngon.vertex(e.start.x, e.top),
            this.Rngon.vertex((e.start.x + (e.delta.x * (e.bottom - e.top))), e.bottom),
        );
    }

    // Connect top vertices.
    if (Math.min(leftEdges[0].top, rightEdges[0].top) > 0)
    {
        const e1 = leftEdges[0];
        const e2 = rightEdges[0];
        this.Rngon.baseModules.rasterize.line(
            this.Rngon.vertex(e1.start.x, e1.top),
            this.Rngon.vertex(e2.start.x, e2.top),
        );
    }

    // Connect bottom vertices.
    {
        const e1 = leftEdges[numLeftEdges-1];
        const e2 = rightEdges[numRightEdges-1];
        this.Rngon.baseModules.rasterize.line(
            this.Rngon.vertex((e1.start.x + (e1.delta.x * (e1.bottom - e1.top))), e1.bottom),
            this.Rngon.vertex((e2.start.x + (e2.delta.x * (e2.bottom - e2.top))), e2.bottom),
        );
    }

    return true;
}

function rs_scanlines({
    ngon,
    leftEdges,
    rightEdges,
    numLeftEdges,
    numRightEdges,
})
{
    const pixelBufferClamped8 = this.Rngon.state.active.pixelBuffer.data;
    const pixelBufferWidth = this.Rngon.state.active.pixelBuffer.width;
    const depthBuffer = (this.Rngon.state.active.useDepthBuffer
        ? this.Rngon.state.active.depthBuffer.data
        : null
    );
    const material = ngon.material;

    let curLeftEdgeIdx = 0;
    let curRightEdgeIdx = 0;
    let leftEdge = leftEdges[curLeftEdgeIdx];
    let rightEdge = rightEdges[curRightEdgeIdx];
    
    if (!numLeftEdges || !numRightEdges) return;

    const ngonStartY = leftEdges[0].top;
    const ngonEndY = leftEdges[numLeftEdges-1].bottom;
    
    // Rasterize the n-gon in horizontal pixel spans over its height.
    for (let y = ngonStartY; y < ngonEndY; y++)
    {
        const spanStartX = Math.min(pixelBufferWidth, Math.max(0, Math.round(leftEdge.start.x)));
        const spanEndX = Math.min(pixelBufferWidth, Math.max(0, Math.ceil(rightEdge.start.x)));
        const spanWidth = ((spanEndX - spanStartX) + 1);

        if (spanWidth > 0)
        {
            const deltaDepth = ((rightEdge.start.depth - leftEdge.start.depth) / spanWidth);
            let iplDepth = (leftEdge.start.depth - deltaDepth);

            const deltaShade = ((rightEdge.start.shade - leftEdge.start.shade) / spanWidth);
            let iplShade = (leftEdge.start.shade - deltaShade);

            const deltaInvW = ((rightEdge.start.invW - leftEdge.start.invW) / spanWidth);
            let iplInvW = (leftEdge.start.invW - deltaInvW);

            let pixelBufferIdx = ((spanStartX + y * pixelBufferWidth) - 1);

            for (let x = spanStartX; x < spanEndX; x++)
            {
                iplDepth += deltaDepth;
                iplShade += deltaShade;
                iplInvW += deltaInvW;
                pixelBufferIdx++;

                const depth = (iplDepth / iplInvW);
                if (depthBuffer[pixelBufferIdx] <= depth) continue;

                const shade = ((material.renderVertexShade? iplShade : 1) * ((y % 2)? 1 : 0.85));
                const red   = (material.color.red   * shade);
                const green = (material.color.green * shade);
                const blue  = (material.color.blue  * shade);

                depthBuffer[pixelBufferIdx] = depth;

                const idx = (pixelBufferIdx * 4);
                pixelBufferClamped8[idx+0] = red;
                pixelBufferClamped8[idx+1] = green;
                pixelBufferClamped8[idx+2] = blue;
                pixelBufferClamped8[idx+3] = 255;
            }
        }

        // Update values that're interpolated vertically along the edges.
        {
            leftEdge.start.x      += leftEdge.delta.x;
            leftEdge.start.depth  += leftEdge.delta.depth;
            leftEdge.start.shade  += leftEdge.delta.shade;
            leftEdge.start.invW   += leftEdge.delta.invW;

            rightEdge.start.x     += rightEdge.delta.x;
            rightEdge.start.depth += rightEdge.delta.depth;
            rightEdge.start.shade += rightEdge.delta.shade;
            rightEdge.start.invW  += rightEdge.delta.invW;
        }

        // We can move onto the next edge when we're at the end of the current one.
        if (y === (leftEdge.bottom - 1)) leftEdge = leftEdges[++curLeftEdgeIdx];
        if (y === (rightEdge.bottom - 1)) rightEdge = rightEdges[++curRightEdgeIdx];
    }

    return true;
}
