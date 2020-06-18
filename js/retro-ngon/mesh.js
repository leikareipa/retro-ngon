/*
 * 2019 Tarpeeksi Hyvae Soft
 * 
 * Software: Retro n-gon renderer
 *
 */

"use strict";

// A collection of ngons, with shared translation and rotation.
// NOTE: Expects to remain immutable.
Rngon.mesh = function(ngons = [Rngon.ngon()], transform = {})
{
    Rngon.assert && (ngons instanceof Array) || Rngon.throw("Expected a list of ngons for creating an ngon mesh.");
    Rngon.assert && (transform instanceof Object) || Rngon.throw("Expected an object with transformation properties.");

    Rngon.assert && (typeof Rngon.mesh.defaultTransform.rotation !== "undefined" &&
                     typeof Rngon.mesh.defaultTransform.translation !== "undefined" &&
                     typeof Rngon.mesh.defaultTransform.scaling !== "undefined")
                 || Rngon.throw("The default transforms object for mesh() is missing required properties.");

    // Combine default transformations with the user-supplied ones.
    transform =
    {
        ...Rngon.mesh.defaultTransform,
        ...transform
    };

    const publicInterface =
    {
        ngons,
        rotation: transform.rotation,
        translation: transform.translation,
        scale: transform.scaling,
    };
    
    return publicInterface;
}

Rngon.mesh.defaultTransform = 
{
    translation: Rngon.translation_vector(0, 0, 0),
    rotation: Rngon.rotation_vector(0, 0, 0),
    scaling: Rngon.scaling_vector(1, 1, 1)
};

Rngon.mesh.object_space_matrix = function(m)
{
    const translationMatrix = Rngon.matrix44.translate(m.translation.x,
                                                       m.translation.y,
                                                       m.translation.z);

    const rotationMatrix = Rngon.matrix44.rotate(m.rotation.x,
                                                 m.rotation.y,
                                                 m.rotation.z);

    const scalingMatrix = Rngon.matrix44.scale(m.scale.x,
                                               m.scale.y,
                                               m.scale.z);

    return Rngon.matrix44.matrices_multiplied(Rngon.matrix44.matrices_multiplied(translationMatrix, rotationMatrix), scalingMatrix);
}
