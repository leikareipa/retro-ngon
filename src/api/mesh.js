/*
 * 2019 Tarpeeksi Hyvae Soft
 * 
 * Software: Retro n-gon renderer
 *
 */

import {validate_object} from "../core/schema.js";
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
    validate_object?.({ngons, transform}, mesh.schema.arguments);

    transform = {
        ...Mesh.defaultTransform,
        ...transform
    };

    const publicInterface = {
        $constructor: "Mesh",
        ngons,
        rotation: transform.rotation,
        translation: transform.translation,
        scale: transform.scaling,
    };

    validate_object?.(publicInterface, mesh.schema.interface);
    
    return publicInterface;
}

mesh.defaultTransform = {
    translation: Vector(0, 0, 0),
    rotation: Vector(0, 0, 0),
    scaling: Vector(1, 1, 1),
};

mesh.schema = {
    interface: {
        where: "in the return value of mesh()",
        allowAdditionalProperties: true,
        properties: {
            "$constructor": {
                value: "Mesh",
            },
            "ngons": [["Ngon"]],
            "rotation": ["Vector"],
            "translation": ["Vector"],
            "scale": ["Vector"],
        },
    },
    arguments: {
        where: "in arguments passed to mesh()",
        properties: {
            "ngons": [["Ngon"]],
            "transform": ["object"],
        },
    },
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