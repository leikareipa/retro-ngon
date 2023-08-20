/*
 * 2019 Tarpeeksi Hyvae Soft
 * 
 * Software: Retro n-gon renderer
 *
 */

import {validate_object} from "../core/schema.js";
import {matrix as Matrix} from "../core/matrix.js";
import {vector as Vector} from "./vector.js";
import {ngon as Ngon} from "./ngon.js";

export const meshDefaultTransform = {
    translate: Vector(0, 0, 0),
    rotate: Vector(0, 0, 0),
    scale: Vector(1, 1, 1),
};

const schema = {
    arguments: {
        where: "in arguments passed to mesh()",
        properties: {
            "ngons": [["Ngon"]],
            "transform": ["object"],
        },
    },
    interface: {
        where: "in the return value of mesh()",
        allowAdditionalProperties: true,
        properties: {
            "$constructor": {
                value: "Mesh",
            },
            "ngons": [["Ngon"]],
            "rotate": ["Vector"],
            "translate": ["Vector"],
            "scale": ["Vector"],
        },
    },
};

// A collection of ngons, with shared translation and rotation.
export function mesh(
    ngons = [Ngon()],
    transform = {}
)
{
    validate_object?.({ngons, transform}, schema.arguments);

    const publicInterface = {
        $constructor: "Mesh",
        ngons,
        ...meshDefaultTransform,
        ...transform
    };

    validate_object?.(publicInterface, schema.interface);
    
    return publicInterface;
}

export function mesh_to_object_space_matrix(mesh)
{
    const translationMatrix = Matrix.translation(
        mesh.translate.x,
        mesh.translate.y,
        mesh.translate.z
    );

    const rotationMatrix = Matrix.rotation(
        mesh.rotate.x,
        mesh.rotate.y,
        mesh.rotate.z
    );

    const scalingMatrix = Matrix.scaling(
        mesh.scale.x,
        mesh.scale.y,
        mesh.scale.z
    );

    return Matrix.multiply(Matrix.multiply(translationMatrix, rotationMatrix), scalingMatrix);
}
