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

        // Transforms the vector by the given 4x4 matrix.
        transform: function(m = [])
        {
            Rngon.assert && (m.length === 16)
                            || Rngon.throw("Expected a 4 x 4 matrix to transform the vector by.");
            
            const x_ = ((m[0] * this.x) + (m[4] * this.y) + (m[ 8] * this.z));
            const y_ = ((m[1] * this.x) + (m[5] * this.y) + (m[ 9] * this.z));
            const z_ = ((m[2] * this.x) + (m[6] * this.y) + (m[10] * this.z));

            this.x = x_;
            this.y = y_;
            this.z = z_;
        },

        normalize: function()
        {
            const sn = ((this.x * this.x) + (this.y * this.y) + (this.z * this.z));

            if (sn != 0 && sn != 1)
            {
                const inv = (1.0 / Math.sqrt(sn));
                this.x *= inv;
                this.y *= inv;
                this.z *= inv;
            }
        },
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

        // For perspective-correct texturing.
        uPers: 0,
        vPers: 0,
        uvwPers: 0,

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
        
        // Clips all vertices against the sides of the viewport. Adapted from Benny
        // Bobaganoosh's 3d software renderer, the source for which is available at
        // https://github.com/BennyQBD/3DSoftwareRenderer.
        clip_to_viewport: function()
        {
            clip_on_axis.call(this, "x", 1);
            clip_on_axis.call(this, "x", -1);
            clip_on_axis.call(this, "y", 1);
            clip_on_axis.call(this, "y", -1);
            clip_on_axis.call(this, "z", 1);
            clip_on_axis.call(this, "z", -1);

            return;

            function clip_on_axis(axis, factor)
            {
                if (!this.vertices.length)
                {
                    return;
                }

                let prevVertex = this.vertices[this.vertices.length - 1];
                let prevComponent = prevVertex[axis] * factor;
                let isPrevVertexInside = (prevComponent <= prevVertex.w);

                this.vertices = this.vertices.reduce((clippedVerts, currentVert)=>
                {
                    const curComponent = currentVert[axis] * factor;
                    const isThisVertexInside = (curComponent <= currentVert.w);

                    // If either the current vertex or the previous vertex is inside but the other isn't,
                    // and they aren't both inside, interpolate a new vertex between them that lies on
                    // the clipping plane.
                    if (isThisVertexInside ^ isPrevVertexInside)
                    {
                        const lerpStep = (prevVertex.w - prevComponent) /
                                          ((prevVertex.w - prevComponent) - (currentVert.w - curComponent));
                    
                        clippedVerts.push(interpolated_vertex(prevVertex, currentVert, lerpStep));
                    }
                    
                    if (isThisVertexInside)
                    {
                        clippedVerts.push(currentVert);
                    }

                    prevVertex = currentVert;
                    prevComponent = curComponent;
                    isPrevVertexInside = isThisVertexInside;

                    return clippedVerts;
                }, []);

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

        perspective_divide: function()
        {
            for (const vert of this.vertices)
            {
                vert.perspective_divide();
            }
        },

        transform: function(matrix44)
        {
            for (const vert of this.vertices)
            {
                vert.transform(matrix44);
            }
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
