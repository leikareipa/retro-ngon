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

    const triangle = Rngon.ngon([Rngon.vertex(-0.5, -0.5, 0),
                                 Rngon.vertex(0.5, -0.5, 0),
                                 Rngon.vertex(0.5, 0.5, 0)],
                                {
                                    color: Rngon.color_rgba(255, 255, 0),
                                    texture: null,
                                    hasWireframe: true,
                                    wireframeColor: Rngon.color_rgba(20, 20, 20),
                                });
                            
    return Rngon.mesh([triangle],
    {
        rotation: Rngon.rotation_vector(0, (-40 + rotationSpeed * frameCount), 0),
        scaling: Rngon.scaling_vector(50, 50, 50)
    });
};

export const sampleRenderOptions = {}
