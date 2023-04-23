/*
 * 2019 Tarpeeksi Hyvae Soft
 * 
 * Software: Retro n-gon renderer
 *
 */

import {assert as Assert} from "../core/util.js";
import {matrix44 as Matrix44} from "../core/matrix44";
import {vector as Vector} from "./vector.js";
import {mesh as Mesh} from "./mesh.js";
import {ngon as Ngon} from "./ngon.js";

// A collection of ngons, with shared translation and rotation.
export function mesh(
    ngons = [Ngon()],
    transform = {}
)
{
    Assert?.(
        (ngons instanceof Array),
        "Expected a list of ngons for creating an ngon mesh."
    );

    Assert?.(
        (transform instanceof Object),
        "Expected an object with transformation properties."
    );

    Assert?.(
        (typeof Mesh.defaultTransform?.rotation !== "undefined" &&
         typeof Mesh.defaultTransform?.translation !== "undefined" &&
         typeof Mesh.defaultTransform?.scaling !== "undefined"),
        "The default transforms object for mesh() is missing required properties."
    );

    transform = {
        ...Mesh.defaultTransform,
        ...transform
    };

    const publicInterface = {
        ngons,
        rotation: transform.rotation,
        translation: transform.translation,
        scale: transform.scaling,
    };
    
    return publicInterface;
}

mesh.defaultTransform = {
    translation: Vector(0, 0, 0),
    rotation: Vector(0, 0, 0),
    scaling: Vector(1, 1, 1),
};

mesh.object_space_matrix = function(mesh)
{
    const translationMatrix = Matrix44.translation(
        mesh.translation.x,
        mesh.translation.y,
        mesh.translation.z
    );

    const rotationMatrix = Matrix44.rotation(
        mesh.rotation.x,
        mesh.rotation.y,
        mesh.rotation.z
    );

    const scalingMatrix = Matrix44.scaling(
        mesh.scale.x,
        mesh.scale.y,
        mesh.scale.z
    );

    return Matrix44.multiply(Matrix44.multiply(translationMatrix, rotationMatrix), scalingMatrix);
}
