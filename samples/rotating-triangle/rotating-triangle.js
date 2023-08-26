/*
 * 2020-2023 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer
 * 
 */

"use strict";

export const sample = {
    initialize: async function()
    {
        this.triangle = Rngon.ngon([
            Rngon.vertex(-30, -30, 0, 0, 0),
            Rngon.vertex( 30, -30, 0, 1, 0),
            Rngon.vertex( 30,  30, 0, 1, 1)], {
                textureMapping: "affine",
                isTwoSided: true,
                color: Rngon.color.lightgray,
                wireframeColor: Rngon.color.lightgray,
            },
            Rngon.vector(0, 0, -1),
        );
    },
    tick: function()
    {
        this.numTicks++;

        return {
            renderOptions: {
                useDepthBuffer: false,
            },
            renderPipeline: {
                vertexShader: function(ngon)
                {
                    const isFacingAway = (Rngon.vector.dot(ngon.normal, Rngon.vector(0, 0, -1)) < 0);
                    ngon.material.hasWireframe = isFacingAway;
                    ngon.material.hasFill = !isFacingAway;
                },
            },
            mesh: Rngon.mesh([this.triangle], {
                rotate: Rngon.vector(0, (-40 + this.rotationSpeed * this.numTicks), 0),
            }),
        };
    },
    rotationSpeed: 1,
    triangle: undefined,
    numTicks: 0,
};
