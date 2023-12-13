/*
 * 2019 Tarpeeksi Hyvae Soft
 * 
 * Software: Retro n-gon renderer
 *
 */

import {validate_object} from "../schema.mjs";
import {Matrix} from "./matrix.mjs";
import {Vector} from "./vector.mjs";
import {Ngon} from "./ngon.mjs";

export const meshDefaultTransform = {
    translate: Vector(0, 0, 0),
    rotate: Vector(0, 0, 0),
    scale: Vector(1, 1, 1),
};

const schema = {
    arguments: {
        where: "in arguments to Rngon::mesh()",
        properties: {
            "ngons": [["Ngon"]],
            "transform": ["object"],
        },
    },
    interface: {
        where: "in the return value of Rngon::mesh()",
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
export function Mesh(
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
    const translationMatrix = Matrix.translating(
        mesh.translate.x,
        mesh.translate.y,
        mesh.translate.z
    );

    const rotationMatrix = Matrix.rotating(
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
