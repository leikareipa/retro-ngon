/*
 * 2020 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer
 * 
 */

"use strict";

export const sample_scene = (frameCount)=>
{
    const rotationSpeed = 1;

    const triangle = Rngon.ngon([Rngon.vertex(-30, -30, 0),
                                 Rngon.vertex(30, -30, 0),
                                 Rngon.vertex(30, 30, 0)],
                                {
                                    color: Rngon.color_rgba(255, 255, 0),
                                    texture: null,
                                });

    triangle.vertices[0].shade = 1;
    triangle.vertices[1].shade = 0.5;
    triangle.vertices[2].shade = 0.2;
                            
    return Rngon.mesh([triangle],
    {
        rotation: Rngon.rotation_vector(0, (-40 + rotationSpeed * frameCount), 0),
    });
};

export const sampleRenderOptions = {}
