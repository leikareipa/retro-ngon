/*
 * 2019 Tarpeeksi Hyvae Soft
 * 
 * Software: Retro n-gon renderer
 *
 */

// A collection of ngons, with shared translation and rotation.
export function mesh(
    ngons = [Rngon.ngon()],
    transform = {}
)
{
    Rngon.assert?.(
        (ngons instanceof Array),
        "Expected a list of ngons for creating an ngon mesh."
    );

    Rngon.assert?.(
        (transform instanceof Object),
        "Expected an object with transformation properties."
    );

    mesh.defaultTransform = (
        mesh.defaultTransform ||
        {
            translation: Rngon.translation_vector(0, 0, 0),
            rotation: Rngon.rotation_vector(0, 0, 0),
            scaling: Rngon.scaling_vector(1, 1, 1),
        }
    );

    Rngon.assert?.(
        (typeof Rngon.mesh.defaultTransform?.rotation !== "undefined" &&
         typeof Rngon.mesh.defaultTransform?.translation !== "undefined" &&
         typeof Rngon.mesh.defaultTransform?.scaling !== "undefined"),
        "The default transforms object for mesh() is missing required properties."
    );

    transform = {
        ...Rngon.mesh.defaultTransform,
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

mesh.object_space_matrix = function(mesh)
{
    const translationMatrix = Rngon.matrix44.translation(
        mesh.translation.x,
        mesh.translation.y,
        mesh.translation.z
    );

    const rotationMatrix = Rngon.matrix44.rotation(
        mesh.rotation.x,
        mesh.rotation.y,
        mesh.rotation.z
    );

    const scalingMatrix = Rngon.matrix44.scaling(
        mesh.scale.x,
        mesh.scale.y,
        mesh.scale.z
    );

    return Rngon.matrix44.multiply(Rngon.matrix44.multiply(translationMatrix, rotationMatrix), scalingMatrix);
}
