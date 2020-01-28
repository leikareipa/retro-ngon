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
                const inv = (1 / Math.sqrt(sn));
                this.x *= inv;
                this.y *= inv;
                this.z *= inv;
            }
        },

        dot: function(other)
        {
            return ((this.x * other.x) + (this.y * other.y) + (this.z * other.z));
        },

        cross: function(other)
        {
            const c = Rngon.vector3();

            c.x = ((this.y * other.z) - (this.z * other.y));
            c.y = ((this.z * other.x) - (this.x * other.z));
            c.z = ((this.x * other.y) - (this.y * other.x));

            return c;
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
        u,
        v,
        w,

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
Rngon.ngon = function(vertices = [Rngon.vertex()], material = {}, normal = Rngon.vector3(0, 1, 0))
{
    Rngon.assert && (vertices instanceof Array) || Rngon.throw("Expected an array of vertices to make an ngon.");
    Rngon.assert && (material instanceof Object) || Rngon.throw("Expected an object containing user-supplied options.");

    Rngon.assert && (typeof Rngon.ngon.defaultMaterial.color !== "undefined" &&
                     typeof Rngon.ngon.defaultMaterial.texture !== "undefined" &&
                     typeof Rngon.ngon.defaultMaterial.hasWireframe !== "undefined" &&
                     typeof Rngon.ngon.defaultMaterial.wireframeColor !== "undefined")
                 || Rngon.throw("The default material object for ngon() is missing required properties.");

    // Combine default material options with the user-supplied ones.
    material =
    {
        ...Rngon.ngon.defaultMaterial,
        ...material
    };

    // If we get vertex U or V coordinates in the range [0,-x], we want to change 0 to
    // -eps to avoid incorrect rounding during texture-mapping.
    {
        const hasNegativeU = vertices.map(v=>v.u).some(u=>(u < 0));
        const hasNegativeV = vertices.map(v=>v.v).some(v=>(v < 0));

        if (hasNegativeU || hasNegativeV)
        {
            for (const vert of vertices)
            {
                if (hasNegativeU && vert.u === 0) vert.u = -Number.EPSILON;
                if (hasNegativeV && vert.v === 0) vert.v = -Number.EPSILON;
            }
        }
    }

    const returnObject =
    {
        vertices,
        material,
        normal,

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
                
                // The vertices array will be modified in-place by appending the clipped vertices
                // onto the end of the array, then removing the previous ones.
                let k = 0;
                let numOriginalVertices = this.vertices.length;
                for (let i = 0; i < numOriginalVertices; i++)
                {
                    const curComponent = this.vertices[i][axis] * factor;
                    const isThisVertexInside = (curComponent <= this.vertices[i].w);

                    // If either the current vertex or the previous vertex is inside but the other isn't,
                    // and they aren't both inside, interpolate a new vertex between them that lies on
                    // the clipping plane.
                    if (isThisVertexInside ^ isPrevVertexInside)
                    {
                        const lerpStep = (prevVertex.w - prevComponent) /
                                          ((prevVertex.w - prevComponent) - (this.vertices[i].w - curComponent));

                        this.vertices[numOriginalVertices + k++] = Rngon.vertex(Rngon.lerp(prevVertex.x, this.vertices[i].x, lerpStep),
                                                                                Rngon.lerp(prevVertex.y, this.vertices[i].y, lerpStep),
                                                                                Rngon.lerp(prevVertex.z, this.vertices[i].z, lerpStep),
                                                                                Rngon.lerp(prevVertex.u, this.vertices[i].u, lerpStep),
                                                                                Rngon.lerp(prevVertex.v, this.vertices[i].v, lerpStep),
                                                                                Rngon.lerp(prevVertex.w, this.vertices[i].w, lerpStep))
                    }
                    
                    if (isThisVertexInside)
                    {
                        this.vertices[numOriginalVertices + k++] = this.vertices[i];
                    }

                    prevVertex = this.vertices[i];
                    prevComponent = curComponent;
                    isPrevVertexInside = isThisVertexInside;
                }

                this.vertices.splice(0, numOriginalVertices);

                return;
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
    uvWrapping: "repeat",
    hasWireframe: false,
    isTwoSided: true,
    wireframeColor: Rngon.color_rgba(0, 0, 0),
    allowTransform: true,
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
