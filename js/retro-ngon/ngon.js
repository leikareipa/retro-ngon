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
    Rngon.vector3.normalize(faceNormal);

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

        // A value in the range [0,1] that defines which mip level of this
        // n-gon's texture (if it has a texture) should be used when rendering.
        // A value of 0 is the maximum-resolution (base) mip level, 1 is the
        // lowest-resolution (1 x 1) mip level.
        mipLevel: 0,
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

Rngon.ngon.perspective_divide = function(ngon)
{
    for (const vert of ngon.vertices)
    {
        Rngon.vertex.perspective_divide(vert);
    }
},

Rngon.ngon.transform = function(ngon, matrix44)
{
    for (const vert of ngon.vertices)
    {
        Rngon.vertex.transform(vert, matrix44);
    }
},

// Clips all vertices against the sides of the viewport. Adapted from Benny
// Bobaganoosh's 3d software renderer, the source for which is available at
// https://github.com/BennyQBD/3DSoftwareRenderer.
Rngon.ngon.clip_to_viewport = function(ngon)
{
    clip_on_axis("x", 1);
    clip_on_axis("x", -1);
    clip_on_axis("y", 1);
    clip_on_axis("y", -1);
    clip_on_axis("z", 1);
    clip_on_axis("z", -1);

    return;

    function clip_on_axis(axis, factor)
    {
        if (!ngon.vertices.length)
        {
            return;
        }

        let prevVertex = ngon.vertices[ngon.vertices.length - 1];
        let prevComponent = prevVertex[axis] * factor;
        let isPrevVertexInside = (prevComponent <= prevVertex.w);
        
        // The vertices array will be modified in-place by appending the clipped vertices
        // onto the end of the array, then removing the previous ones.
        let k = 0;
        let numOriginalVertices = ngon.vertices.length;
        for (let i = 0; i < numOriginalVertices; i++)
        {
            const curComponent = ngon.vertices[i][axis] * factor;
            const isThisVertexInside = (curComponent <= ngon.vertices[i].w);

            // If either the current vertex or the previous vertex is inside but the other isn't,
            // and they aren't both inside, interpolate a new vertex between them that lies on
            // the clipping plane.
            if (isThisVertexInside ^ isPrevVertexInside)
            {
                const lerpStep = (prevVertex.w - prevComponent) /
                                  ((prevVertex.w - prevComponent) - (ngon.vertices[i].w - curComponent));

                if (Rngon.internalState.usePixelShaders)
                {
                    ngon.vertices[numOriginalVertices + k++] = Rngon.vertex(Rngon.lerp(prevVertex.x, ngon.vertices[i].x, lerpStep),
                                                                            Rngon.lerp(prevVertex.y, ngon.vertices[i].y, lerpStep),
                                                                            Rngon.lerp(prevVertex.z, ngon.vertices[i].z, lerpStep),
                                                                            Rngon.lerp(prevVertex.u, ngon.vertices[i].u, lerpStep),
                                                                            Rngon.lerp(prevVertex.v, ngon.vertices[i].v, lerpStep),
                                                                            Rngon.lerp(prevVertex.w, ngon.vertices[i].w, lerpStep),
                                                                            Rngon.lerp(prevVertex.shade, ngon.vertices[i].shade, lerpStep),
                                                                            Rngon.lerp(prevVertex.worldX, ngon.vertices[i].worldX, lerpStep),
                                                                            Rngon.lerp(prevVertex.worldY, ngon.vertices[i].worldY, lerpStep),
                                                                            Rngon.lerp(prevVertex.worldZ, ngon.vertices[i].worldZ, lerpStep));
                }
                else
                {
                    ngon.vertices[numOriginalVertices + k++] = Rngon.vertex(Rngon.lerp(prevVertex.x, ngon.vertices[i].x, lerpStep),
                                                                            Rngon.lerp(prevVertex.y, ngon.vertices[i].y, lerpStep),
                                                                            Rngon.lerp(prevVertex.z, ngon.vertices[i].z, lerpStep),
                                                                            Rngon.lerp(prevVertex.u, ngon.vertices[i].u, lerpStep),
                                                                            Rngon.lerp(prevVertex.v, ngon.vertices[i].v, lerpStep),
                                                                            Rngon.lerp(prevVertex.w, ngon.vertices[i].w, lerpStep),
                                                                            Rngon.lerp(prevVertex.shade, ngon.vertices[i].shade, lerpStep));
                }
            }
            
            if (isThisVertexInside)
            {
                ngon.vertices[numOriginalVertices + k++] = ngon.vertices[i];
            }

            prevVertex = ngon.vertices[i];
            prevComponent = curComponent;
            isPrevVertexInside = isThisVertexInside;
        }

        ngon.vertices.splice(0, numOriginalVertices);

        return;
    }
}
