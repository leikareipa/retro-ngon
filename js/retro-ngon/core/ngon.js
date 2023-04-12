/*
 * 2019 Tarpeeksi Hyvae Soft
 * 
 * Software: Retro n-gon renderer
 *
 */

// A single n-sided ngon.
export function ngon(
    vertices = [Rngon.vertex()],
    material = Rngon.material(),
    vertexNormals = Rngon.vector(0, 1, 0)
)
{
    Rngon.assert?.(
        (vertices instanceof Array),
        "Expected an array of vertices to make an ngon."
    );

    Rngon.assert?.(
        (material instanceof Object),
        "Expected an object containing user-supplied options."
    );

    // Combine default material options with the user-supplied ones.
    material = Rngon.material(material);

    // Assuming that only a single normal vector was provided, in which case, let's
    // duplicate that normal for all vertices.
    if (!Array.isArray(vertexNormals))
    {
        vertexNormals = new Array(vertices.length).fill().map(n=>Rngon.vector(vertexNormals.x, vertexNormals.y, vertexNormals.z));
    }

    const faceNormal = vertexNormals.reduce((faceNormal, vertexNormal)=>{
        faceNormal.x += vertexNormal.x;
        faceNormal.y += vertexNormal.y;
        faceNormal.z += vertexNormal.z;
        return faceNormal;
    }, Rngon.vector(0, 0, 0));

    Rngon.vector.normalize(faceNormal);

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

    const publicInterface = {
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

    return publicInterface;
}

ngon.perspective_divide = function(ngon)
{
    for (const vert of ngon.vertices)
    {
        Rngon.vertex.perspective_divide(vert);
    }
}

ngon.transform = function(ngon, matrix44)
{
    for (const vert of ngon.vertices)
    {
        Rngon.vertex.transform(vert, matrix44);
    }
}

// Clips all vertices against the sides of the viewport. Adapted from Benny
// Bobaganoosh's 3d software renderer, the source for which is available at
// https://github.com/BennyQBD/3DSoftwareRenderer.
const axes = ["x", "y", "z"];
const factors = [1, -1];
ngon.clip_to_viewport = function(ngon)
{
    for (const axis of axes)
    {
        for (const factor of factors)
        {
            if (!ngon.vertices.length)
            {
                break;
            }

            if (ngon.vertices.length == 1)
            {
                // If the point is fully inside the viewport, allow it to stay.
                if (( ngon.vertices[0].x <= ngon.vertices[0].w) &&
                    (-ngon.vertices[0].x <= ngon.vertices[0].w) &&
                    ( ngon.vertices[0].y <= ngon.vertices[0].w) &&
                    (-ngon.vertices[0].y <= ngon.vertices[0].w) &&
                    ( ngon.vertices[0].z <= ngon.vertices[0].w) &&
                    (-ngon.vertices[0].z <= ngon.vertices[0].w))
                {
                    break;
                }

                ngon.vertices.length = 0;

                break;
            }

            let prevVertex = ngon.vertices[ngon.vertices.length - ((ngon.vertices.length == 2)? 2 : 1)];
            let prevComponent = (prevVertex[axis] * factor);
            let isPrevVertexInside = (prevComponent <= prevVertex.w);
            
            // The vertices array will be modified in-place by appending the clipped vertices
            // onto the end of the array, then removing the previous ones.
            let k = 0;
            let numOriginalVertices = ngon.vertices.length;
            for (let i = 0; i < numOriginalVertices; i++)
            {
                const curComponent = (ngon.vertices[i][axis] * factor);
                const thisVertexIsInside = (curComponent <= ngon.vertices[i].w);

                // If either the current vertex or the previous vertex is inside but the other isn't,
                // and they aren't both inside, interpolate a new vertex between them that lies on
                // the clipping plane.
                if (thisVertexIsInside ^ isPrevVertexInside)
                {
                    const lerpStep = (prevVertex.w - prevComponent) /
                                    ((prevVertex.w - prevComponent) - (ngon.vertices[i].w - curComponent));

                    ngon.vertices[numOriginalVertices + k++] = Rngon.vertex(
                        Rngon.lerp(prevVertex.x, ngon.vertices[i].x, lerpStep),
                        Rngon.lerp(prevVertex.y, ngon.vertices[i].y, lerpStep),
                        Rngon.lerp(prevVertex.z, ngon.vertices[i].z, lerpStep),
                        Rngon.lerp(prevVertex.u, ngon.vertices[i].u, lerpStep),
                        Rngon.lerp(prevVertex.v, ngon.vertices[i].v, lerpStep),
                        Rngon.lerp(prevVertex.w, ngon.vertices[i].w, lerpStep),
                        Rngon.lerp(prevVertex.shade, ngon.vertices[i].shade, lerpStep),
                        Rngon.lerp(prevVertex.worldX, ngon.vertices[i].worldX, lerpStep),
                        Rngon.lerp(prevVertex.worldY, ngon.vertices[i].worldY, lerpStep),
                        Rngon.lerp(prevVertex.worldZ, ngon.vertices[i].worldZ, lerpStep),
                        Rngon.lerp(prevVertex.normalX, ngon.vertices[i].normalX, lerpStep),
                        Rngon.lerp(prevVertex.normalY, ngon.vertices[i].normalY, lerpStep),
                        Rngon.lerp(prevVertex.normalZ, ngon.vertices[i].normalZ, lerpStep)
                    );
                }
                
                if (thisVertexIsInside)
                {
                    ngon.vertices[numOriginalVertices + k++] = ngon.vertices[i];
                }

                prevVertex = ngon.vertices[i];
                prevComponent = curComponent;
                isPrevVertexInside = thisVertexIsInside;
            }

            ngon.vertices.splice(0, numOriginalVertices);
        }
    }

    return;
}
