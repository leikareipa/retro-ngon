/*
 * Tarpeeksi Hyvae Soft 2019 /
 * Retro n-gon renderer
 *
 * Functions to do with space; like vectors, vertices, etc.
 *
 */

"use strict";

// NOTE: Expects to remain immutable.
Rngon.vector3 = function(x = 0, y = 0, z = 0)
{
    Rngon.assert && (typeof x === "number" && typeof y === "number" && typeof z === "number")
                 || Rngon.throw("Expected numbers as parameters to the vector3 factory.");

    const publicInterface = Object.freeze(
    {
        x,
        y,
        z,

        cross: function(other = {})
        {
            return Rngon.vector3(((y * other.z) - (z * other.y)),
                                 ((z * other.x) - (x * other.z)),
                                 ((x * other.y) - (y * other.x)));
        },

        // Returns a normalized copy of the vector.
        normalized: function()
        {
            const sn = ((x * x) + (y * y) + (z * z));

            if (sn != 0 && sn != 1)
            {
                const inv = (1.0 / Math.sqrt(sn));
                return Rngon.vector3((x * inv), (y * inv), (z * inv));
            }
            else return Rngon.vector3(x, y, z);
        },
    });

    return publicInterface;
}

// Convenience aliases for vector3.
Rngon.translation_vector = Rngon.vector3;
Rngon.rotation_vector = (x, y, z)=>Rngon.vector3(Rngon.trig.deg(x), Rngon.trig.deg(y), Rngon.trig.deg(z));
Rngon.scaling_vector = Rngon.vector3;

// NOTE: Expects to remain immutable.
Rngon.vertex = function(x = 0, y = 0, z = 0, u = 0, v = 0, w = 1)
{
    Rngon.assert && (typeof x === "number" && typeof y === "number" && typeof z === "number" &&
                     typeof w === "number" && typeof u === "number" && typeof v === "number")
                 || Rngon.throw("Expected numbers as parameters to the vertex factory.");

    const publicInterface = Object.freeze(
    {
        x,
        y,
        z,
        w,
        u,
        v,

        // Returns a copy of the vertex transformed by the given matrix.
        transformed: function(m = [])
        {
            Rngon.assert && (m.length === 16)
                         || Rngon.throw("Expected a 4 x 4 matrix to transform the vertex by.");
            
            const x_ = ((m[0] * x) + (m[4] * y) + (m[ 8] * z) + (m[12] * w));
            const y_ = ((m[1] * x) + (m[5] * y) + (m[ 9] * z) + (m[13] * w));
            const z_ = ((m[2] * x) + (m[6] * y) + (m[10] * z) + (m[14] * w));
            const w_ = ((m[3] * x) + (m[7] * y) + (m[11] * z) + (m[15] * w));

            return Rngon.vertex(x_, y_, z_, u, v, w_);
        },

        // Returns a copy of the vertex with perspective division applied.
        perspective_divided: function()
        {
            return Rngon.vertex((x/w), (y/w), (z/w), u, v, w);
        }
    });

    return publicInterface;
}

// A single n-sided ngon.
// NOTE: Expects to remain immutable.
Rngon.ngon = function(vertices = [Rngon.vertex()], material = {})
{
    Rngon.assert && (vertices instanceof Array) || Rngon.throw("Expected an array of vertices to make an ngon.");
    Rngon.assert && (material instanceof Object) || Rngon.throw("Expected an object containing user-supplied options.");

    Rngon.assert && (typeof Rngon.ngon.defaultMaterial.color !== "undefined" &&
                     typeof Rngon.ngon.defaultMaterial.texture !== "undefined" &&
                     typeof Rngon.ngon.defaultMaterial.hasSolidFill !== "undefined" &&
                     typeof Rngon.ngon.defaultMaterial.hasWireframe !== "undefined" &&
                     typeof Rngon.ngon.defaultMaterial.wireframeColor !== "undefined")
                 || Rngon.throw("The default material object for ngon() is missing required properties.");

    // Combine default material options with the user-supplied ones.
    material = Object.freeze(
    {
        ...Rngon.ngon.defaultMaterial,
        ...material
    });

    vertices = Object.freeze(vertices);

    const publicInterface = Object.freeze(
    {
        vertices,
        material,

        // Returns a copy of the n-gon such that its vertices have been clipped against the
        // near plane. Adapted from Benny Bobaganoosh's 3d software renderer, whose source
        // is available at https://github.com/BennyQBD/3DSoftwareRenderer.
        clipped_to_near_plane: function(nearPlaneDistance)
        {
            if (!nearPlaneDistance)
            {
                return this;
            }

            const clipped = (()=>
            {
                if (vertices.length <= 0)
                {
                    return {verts:[]};
                }
                else if (vertices.length === 1)
                {
                    return {verts:(is_vertex_inside(vertices[0])? vertices : [])};
                }
                else
                {
                    return vertices.reduce((clipped, v)=>
                    {
                        const isThisVertexInside = is_vertex_inside(v);

                        // If either the current vertex or the previous vertex is inside but the other isn't,
                        // and they aren't both inside, interpolate a new vertex between them that lies on
                        // the clipping plane.
                        if (isThisVertexInside ^ clipped.isPrevVertexInside)
                        {
                            const lerpStep = ((clipped.prevVertex.w - nearPlaneDistance) / ((clipped.prevVertex.w - nearPlaneDistance) - (v.w - nearPlaneDistance)));

                            clipped.verts.push(Rngon.vertex(Rngon.lerp(clipped.prevVertex.x, v.x, lerpStep),
                                                            Rngon.lerp(clipped.prevVertex.y, v.y, lerpStep),
                                                            Rngon.lerp(clipped.prevVertex.z, v.z, lerpStep),
                                                            Rngon.lerp(clipped.prevVertex.u, v.u, lerpStep),
                                                            Rngon.lerp(clipped.prevVertex.v, v.v, lerpStep),
                                                            Rngon.lerp(clipped.prevVertex.w, v.w, lerpStep)));
                        }
                        
                        if (isThisVertexInside)
                        {
                            clipped.verts.push(v);
                        }

                        return {verts:clipped.verts, prevVertex:v, isPrevVertexInside:isThisVertexInside};
                    }, {verts:[], prevVertex:vertices[vertices.length-1], isPrevVertexInside:is_vertex_inside(vertices[vertices.length-1])});
                }

                function is_vertex_inside(vert)
                {
                    return (vert.w >= nearPlaneDistance);
                }
            })();

            return Rngon.ngon(clipped.verts, material);
        },

        perspective_divided: function()
        {
            // First clip the n-gon's vertices against the near plane, then apply perspective
            // division to them.
            return Rngon.ngon(vertices.map(v=>v.perspective_divided()), material);
        },

        transformed: function(matrix44)
        {
            return Rngon.ngon(vertices.map(vertex=>vertex.transformed(matrix44)), material);
        },
    });
    return publicInterface;
}

Rngon.ngon.defaultMaterial = 
{
    color: Rngon.color_rgba(255, 255, 255, 255),
    texture: null,
    textureMapping: "ortho",
    hasSolidFill: true,
    hasWireframe: false,
    wireframeColor: Rngon.color_rgba(0, 0, 0),
    auxiliary: {},
};

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
    transform = Object.freeze(
    {
        ...Rngon.mesh.defaultTransform,
        ...transform
    });

    // A matrix by which the ngons of this mesh should be transformed to get the ngons into
    // the mesh's object space.
    const objectSpaceMatrix = (()=>
    {
        const translationMatrix = Rngon.matrix44.translate(transform.translation.x,
                                                           transform.translation.y,
                                                           transform.translation.z);
        const rotationMatrix = Rngon.matrix44.rotate(transform.rotation.x,
                                                     transform.rotation.y,
                                                     transform.rotation.z);
        const scalingMatrix = Rngon.matrix44.scale(transform.scaling.x,
                                                   transform.scaling.y,
                                                   transform.scaling.z);

        return Rngon.matrix44.matrices_multiplied(Rngon.matrix44.matrices_multiplied(translationMatrix, rotationMatrix), scalingMatrix);
    })();

    ngons = Object.freeze(ngons);
    
    const publicInterface = Object.freeze(
    {
        ngons,
        rotation: transform.rotation,
        translation: transform.translation,
        scale: transform.scaling,
        objectSpaceMatrix,
    });
    return publicInterface;
}

Rngon.mesh.defaultTransform = 
{
    translation: Rngon.translation_vector(0, 0, 0),
    rotation: Rngon.rotation_vector(0, 0, 0),
    scaling: Rngon.scaling_vector(1, 1, 1)
};
