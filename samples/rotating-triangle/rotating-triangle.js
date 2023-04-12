/*
 * 2020 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer
 * 
 */

"use strict";

export const sample = {
    initialize: function(){},
    tick: function()
    {
        this.numTicks++;

        const rotationSpeed = 1;

        const triangle = Rngon.ngon([Rngon.vertex(-30, -30, 0),
                                     Rngon.vertex(30, -30, 0),
                                     Rngon.vertex(30, 30, 0)], {
            color: Rngon.color_rgba(255, 255, 0),
            texture: null,
        });

        triangle.vertices[0].shade = 1;
        triangle.vertices[1].shade = 0.5;
        triangle.vertices[2].shade = 0.2;

        return {
            mesh: Rngon.mesh([triangle], {
                rotation: Rngon.vector3(0, (-40 + rotationSpeed * this.numTicks), 0),
            }),
        };
    },
    numTicks: 0,
};
