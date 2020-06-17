/*
 * 2019 Tarpeeksi Hyvae Soft
 * 
 * Software: Retro n-gon renderer
 *
 */

"use strict";

// A single n-sided ngon.
// NOTE: The return object is not immutable.
Rngon.ngon = function(vertices = [Rngon.vertex()], material = {}, vertexNormals = Rngon.vector3(0, 1, 0))
{
    Rngon.assert && (vertices instanceof Array) || Rngon.throw("Expected an array of vertices to make an ngon.");
    Rngon.assert && (material instanceof Object) || Rngon.throw("Expected an object containing user-supplied options.");

    Rngon.assert && (typeof Rngon.ngon.defaultMaterial.color !== "undefined" &&
                     typeof Rngon.ngon.defaultMaterial.texture !== "undefined" &&
                     typeof Rngon.ngon.defaultMaterial.hasWireframe !== "undefined" &&
                     typeof Rngon.ngon.defaultMaterial.wireframeColor !== "undefined")
                 || Rngon.throw("The default material object for ngon() is missing required properties.");

    // Assuming that only a single normal vector was provided, in which case, let's
    // duplicate that normal for all vertices.
    if (!Array.isArray(vertexNormals))
    {
        vertexNormals = new Array(vertices.length).fill().map(n=>Rngon.vector3(vertexNormals.x, vertexNormals.y, vertexNormals.z));
    }

    const faceNormal = vertexNormals.reduce((faceNormal, vertexNormal)=>
    {
        faceNormal.x += vertexNormal.x;
        faceNormal.y += vertexNormal.y;
        faceNormal.z += vertexNormal.z;

        return faceNormal;
    }, Rngon.vector3(0, 0, 0));
    faceNormal.normalize();

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
        vertexNormals,
        normal: faceNormal,
        material,

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
                                                                                Rngon.lerp(prevVertex.w, this.vertices[i].w, lerpStep),
                                                                                Rngon.lerp(prevVertex.worldX, this.vertices[i].worldX, lerpStep),
                                                                                Rngon.lerp(prevVertex.worldY, this.vertices[i].worldY, lerpStep),
                                                                                Rngon.lerp(prevVertex.worldZ, this.vertices[i].worldZ, lerpStep),
                                                                                Rngon.lerp(prevVertex.shade, this.vertices[i].shade, lerpStep))
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
    vertexShading: "none",
    renderVertexShade: true,
    ambientLightLevel: 0,
    hasWireframe: false,
    isTwoSided: true,
    wireframeColor: Rngon.color_rgba(0, 0, 0),
    allowTransform: true,
    auxiliary: {},
};
