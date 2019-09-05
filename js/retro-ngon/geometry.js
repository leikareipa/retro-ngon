/*
 * Tarpeeksi Hyvae Soft 2019 /
 * Retro n-gon renderer
 *
 * Functions to do with space; like vectors, vertices, etc.
 *
 */

"use strict";

// NOTE: The returned object is not immutable.
Rngon.vector3 = function(x = 0, y = 0, z = 0)
{
    Rngon.assert && (typeof x === "number" && typeof y === "number" && typeof z === "number")
                 || Rngon.throw("Expected numbers as parameters to the vector3 factory.");

    const returnObject =
    {
        x,
        y,
        z,
    };

    return returnObject;
}

// Convenience aliases for vector3.
Rngon.translation_vector = Rngon.vector3;
Rngon.rotation_vector = (x, y, z)=>Rngon.vector3(Rngon.trig.deg(x), Rngon.trig.deg(y), Rngon.trig.deg(z));
Rngon.scaling_vector = Rngon.vector3;

// NOTE: The returned object is not immutable.
Rngon.vertex = function(x = 0, y = 0, z = 0, u = 0, v = 0, w = 1)
{
    Rngon.assert && (typeof x === "number" && typeof y === "number" && typeof z === "number" &&
                     typeof w === "number" && typeof u === "number" && typeof v === "number")
                 || Rngon.throw("Expected numbers as parameters to the vertex factory.");

    const returnObject =
    {
        x,
        y,
        z,
        w,
        u,
        v,

        // Transforms the vertex by the given 4x4 matrix.
        transform: function(m = [])
        {
            Rngon.assert && (m.length === 16)
                         || Rngon.throw("Expected a 4 x 4 matrix to transform the vertex by.");
            
            const x_ = ((m[0] * this.x) + (m[4] * this.y) + (m[ 8] * this.z) + (m[12] * this.w));
            const y_ = ((m[1] * this.x) + (m[5] * this.y) + (m[ 9] * this.z) + (m[13] * this.w));
            const z_ = ((m[2] * this.x) + (m[6] * this.y) + (m[10] * this.z) + (m[14] * this.w));
            const w_ = ((m[3] * this.x) + (m[7] * this.y) + (m[11] * this.z) + (m[15] * this.w));

            this.x = x_;
            this.y = y_;
            this.z = z_;
            this.w = w_;
        },

        // Applies perspective division to the vertex.
        perspective_divide: function()
        {
            this.x /= this.w;
            this.y /= this.w;
            this.z /= this.w;
        }
    };

    return returnObject;
}

// A single n-sided ngon.
// NOTE: The return object is not immutable.
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
    material =
    {
        ...Rngon.ngon.defaultMaterial,
        ...material
    };

    const returnObject =
    {
        vertices,
        material,

        // Returns clone of the n-gon such that its vertices are deep-copied. The material, however,
        // is copied by reference.
        clone: function()
        {
            return Rngon.ngon(this.vertices.map(v=>Rngon.vertex(v.x, v.y, v.z, v.u, v.v, v.w)), this.material);
        },

        // Clips all vertices against the sides of the viewport ([0, width) and [0, height)).
        // Adapted from Benny Bobaganoosh's 3d software renderer, whose source is available at
        // https://github.com/BennyQBD/3DSoftwareRenderer.
        //
        /// TODO: This is a sloppy implementation that gets the job done but could be improved on.
        clip_to_viewport: function(width, height)
        {
            if (vertices.length >= 1)
            {
                clip_on_axis.call(this, "x", 0, (width - 1));
                clip_on_axis.call(this, "y", 0, (height - 1));
            }

            return;

            function clip_on_axis(axis, min, max)
            {
                if (!this.vertices.length)
                {
                    return;
                }

                // Clip min.
                {
                    let prevVertex = this.vertices[this.vertices.length - 1];
                    let isPrevVertexInside = (prevVertex[axis] >= min);

                    this.vertices = this.vertices.reduce((clippedVerts, currentVert)=>
                    {
                        const isThisVertexInside = (currentVert[axis] >= min);

                        // If either the current vertex or the previous vertex is inside but the other isn't,
                        // and they aren't both inside, interpolate a new vertex between them that lies on
                        // the clipping plane.
                        if (isThisVertexInside ^ isPrevVertexInside)
                        {
                            const lerpStep = ((prevVertex[axis] - min) / ((prevVertex[axis] - min) - (currentVert[axis] - min) + 0.5));
                            clippedVerts.push(interpolated_vertex(prevVertex, currentVert, lerpStep));
                        }
                        
                        if (isThisVertexInside)
                        {
                            clippedVerts.push(currentVert);
                        }

                        prevVertex = currentVert;
                        isPrevVertexInside = (prevVertex[axis] >= min);

                        return clippedVerts;
                    }, []);
                }

                if (!this.vertices.length)
                {
                    return;
                }

                // Clip max.
                {
                    let prevVertex = this.vertices[this.vertices.length - 1];
                    let isPrevVertexInside = (prevVertex[axis] < max);

                    this.vertices = this.vertices.reduce((clippedVerts, currentVert)=>
                    {
                        const isThisVertexInside = (currentVert[axis] < max);

                        if (isThisVertexInside ^ isPrevVertexInside)
                        {
                            const lerpStep = ((prevVertex[axis] - max) / ((prevVertex[axis] - max) - (currentVert[axis] - max)));
                            clippedVerts.push(interpolated_vertex(prevVertex, currentVert, lerpStep));
                        }
                        
                        if (isThisVertexInside)
                        {
                            clippedVerts.push(currentVert);
                        }

                        prevVertex = currentVert;
                        isPrevVertexInside = (prevVertex[axis] < max);

                        return clippedVerts;
                    }, []);
                }

                return;

                function interpolated_vertex(vert1, vert2, lerpStep)
                {
                    return Rngon.vertex(Rngon.lerp(vert1.x, vert2.x, lerpStep),
                                        Rngon.lerp(vert1.y, vert2.y, lerpStep),
                                        Rngon.lerp(vert1.z, vert2.z, lerpStep),
                                        Rngon.lerp(vert1.u, vert2.u, lerpStep),
                                        Rngon.lerp(vert1.v, vert2.v, lerpStep),
                                        Rngon.lerp(vert1.w, vert2.w, lerpStep));
                }
            }
        },

        // Clips all vertices against the near plane. Adapted from Benny Bobaganoosh's 3d software
        // renderer, whose source is available at https://github.com/BennyQBD/3DSoftwareRenderer.
        clip_to_near_plane: function(nearPlaneDistance)
        {
            if (!nearPlaneDistance)
            {
                return;
            }

            if (vertices.length <= 0)
            {
                return;
            }

            let prevVertex = this.vertices[this.vertices.length - 1];
            let isPrevVertexInside = is_vertex_inside(prevVertex);

            this.vertices = this.vertices.reduce((clippedVerts, curVertex)=>
            {
                const isThisVertexInside = is_vertex_inside(curVertex);

                // If either the current vertex or the previous vertex is inside but the other isn't,
                // and they aren't both inside, interpolate a new vertex between them that lies on
                // the clipping plane.
                if (isThisVertexInside ^ isPrevVertexInside)
                {
                    const lerpStep = ((prevVertex.w - nearPlaneDistance) / ((prevVertex.w - nearPlaneDistance) - (curVertex.w - nearPlaneDistance)));

                    clippedVerts.push(Rngon.vertex(Rngon.lerp(prevVertex.x, curVertex.x, lerpStep),
                                                    Rngon.lerp(prevVertex.y, curVertex.y, lerpStep),
                                                    Rngon.lerp(prevVertex.z, curVertex.z, lerpStep),
                                                    Rngon.lerp(prevVertex.u, curVertex.u, lerpStep),
                                                    Rngon.lerp(prevVertex.v, curVertex.v, lerpStep),
                                                    Rngon.lerp(prevVertex.w, curVertex.w, lerpStep)));
                }
                
                if (isThisVertexInside)
                {
                    clippedVerts.push(curVertex);
                }

                prevVertex = curVertex;
                isPrevVertexInside = is_vertex_inside(prevVertex);

                return clippedVerts;
            }, []);

            function is_vertex_inside(vert)
            {
                return (vert.w >= nearPlaneDistance);
            }
        },

        perspective_divide: function()
        {
            this.vertices.forEach(vert=>
            {
                vert.perspective_divide();
            });
        },

        transform: function(matrix44)
        {
            this.vertices.forEach(vert=>
            {
                vert.transform(matrix44);
            });
        },
    };

    return returnObject;
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
        objectSpaceMatrix: function()
        {
            const translationMatrix = Rngon.matrix44.translate(this.translation.x,
                                                               this.translation.y,
                                                               this.translation.z);

            const rotationMatrix = Rngon.matrix44.rotate(this.rotation.x,
                                                         this.rotation.y,
                                                         this.rotation.z);

            const scalingMatrix = Rngon.matrix44.scale(this.scale.x,
                                                       this.scale.y,
                                                       this.scale.z);

            return Rngon.matrix44.matrices_multiplied(Rngon.matrix44.matrices_multiplied(translationMatrix, rotationMatrix), scalingMatrix);
        },
    };
    
    return publicInterface;
}

Rngon.mesh.defaultTransform = 
{
    translation: Rngon.translation_vector(0, 0, 0),
    rotation: Rngon.rotation_vector(0, 0, 0),
    scaling: Rngon.scaling_vector(1, 1, 1)
};
