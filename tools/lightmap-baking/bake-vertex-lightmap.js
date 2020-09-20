/*
 * 2020 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer
 * 
 */

"use strict";

importScripts("../../distributable/rngon.cat.js",
              "./bvh.js",
              "./ray.js");

onmessage = (message)=>
{
    message = message.data;

    if ((typeof message != "object") ||
        (typeof message.command != "string"))
    {
        postMessage({
            type: "error",
            errorString: "A worker thread received an invalid message.",
        });

        return;
    }

    switch (message.command)
    {
        case "start":
        {
            try
            {
                bake_vertex_lightmap(message.ngons, message.lights, message.epsilon);
            }
            catch (error)
            {
                postMessage({
                    type: "error",
                    errorMessage: error,
                });

                return;
            }

            // Flatten the vertices' shade values into a list that we can return.
            const vertexShadeMap = [];
            for (const ngon of message.ngons)
            {
                for (const vertex of ngon.vertices)
                {
                    vertexShadeMap.push(vertex.shade);
                }
            }

            postMessage({
                type: "finished",
                shadeMaps: vertexShadeMap,
            });

            break;
        }
        default:
        {
            postMessage({
                type: "error",
                errorString: "A worker thread received an unrecognized message.",
            });
    
            return;
        }
    }
}

// Modifies the given n-gons' vertex shade component based on the vertices' relation
// to the given light sources. Vertices that are directly visible to one or more lights
// will receive direct illumination, and vertices not directly illuminated will
// receive indirect illumination if facing directly-lit vertices.
//
// The vertices are expected to be in world space when calling this function.
function bake_vertex_lightmap(ngons = [Rngon.ngon()],
                              lights = [Rngon.light()],
                              epsilon = 0.00001)
{
    // The lightmapper operates exclusively on triangles, so convert all n-gons
    // into triangles.
    const triangles = ngons.reduce((triangles, ngon)=>
    {
        const initialVertex = ngon.vertices[0];

        for (let i = 1; i < (ngon.vertices.length - 1); i++)
        {
            const triangle = {
                vertices: [],
            };

            triangle.material = ngon.material;
            triangle.vertices[0] = initialVertex;
            triangle.vertices[1] = ngon.vertices[i];
            triangle.vertices[2] = ngon.vertices[i+1];

            triangle.vertices[0].normal = triangle.vertices[1].normal = triangle.vertices[2].normal = ngon.normal;
            triangle.vertices[0].shade = triangle.vertices[1].shade = triangle.vertices[2].shade = 0;

            triangles.push(triangle);
        }

        return triangles;
    }, []);

    const sceneBVH = bvh(triangles);
    const startTime = performance.now();
    let updateTimer = 0;
    let prevTimeLabel = "";

    // To each vertex in the scene, trace a ray from each light source, and
    // shade the vertex by the brightest of the light sources. From each vertex
    // thus lit, trace a ray individually to all other vertices in the scene to
    // distribute the light to them also (think of this as the first indirect
    // light bounce).
    //
    // Note that we (temporarily) store a vertex's shade in its W component.
    // This is done to save on having to create an extra array of shade values.
    for (const [i, triangle] of triangles.entries())
    {
        // Indicate to the user how much time remains in the baking.
        if (!updateTimer ||
            ((performance.now() - updateTimer) >= 1000))
        {
            const percentDone = (((i + 1) / triangles.length) * 100);
            const msElapsed = (performance.now() - startTime);
            const msRemaining = ((msElapsed / percentDone) * (100 - percentDone));
            const sRemaining = Math.round(msRemaining / 1000);
            const mRemaining = Math.round(sRemaining / 60);
            const hRemaining = Math.round(mRemaining / 60);

            const timeLabel = (()=>
            {
                if (!updateTimer) return `(n/a)`; // We don't have a reliable time estimate yet.
                if (sRemaining < 60) return `${sRemaining} sec`;
                if (mRemaining < 60) return `${mRemaining} min`;
                else return `${hRemaining} hr`;
            })();

            if (timeLabel != prevTimeLabel)
            {
                console.log(`Baking to vertices... ETA = ${timeLabel}`);
                prevTimeLabel = timeLabel;
            }

            updateTimer = performance.now();
        }

        const triangleMidpoint = Rngon.vector3(((triangle.vertices[0].x + triangle.vertices[1].x + triangle.vertices[2].x) / 3),
                                                ((triangle.vertices[0].y + triangle.vertices[1].y + triangle.vertices[2].y) / 3),
                                                ((triangle.vertices[0].z + triangle.vertices[1].z + triangle.vertices[2].z) / 3));

        for (const vertex of triangle.vertices)
        {
            const vertexNormal = {...vertex.normal};

            // Move each vertex slightly towards the triangle's midpoint, to avoid
            // spurious intersections at shared vertices.
            const adjustexVertexPos = Rngon.vector3(Rngon.lerp(vertex.x, triangleMidpoint.x, epsilon),
                                                    Rngon.lerp(vertex.y, triangleMidpoint.y, epsilon),
                                                    Rngon.lerp(vertex.z, triangleMidpoint.z, epsilon));
                                        
            for (const light of lights)
            {
                // We only need to consider lights that this vertex isn't facing
                // away from.
                {
                    const lightDirection = Rngon.vector3((vertex.x - light.position.x),
                                                            (vertex.y - light.position.y),
                                                            (vertex.z - light.position.z));

                    Rngon.vector3.normalize(lightDirection);

                    if (Rngon.vector3.dot(lightDirection, vertexNormal) >= 0)
                    {
                        if (triangle.material.isTwoSided)
                        {
                            Rngon.vector3.invert(vertexNormal);
                        }
                        else
                        {
                            continue;
                        }
                    }
                }

                // Calculate the amount of light falling on this vertex from
                // this light source.
                if (point_sees_point(Rngon.vector3((adjustexVertexPos.x + (vertexNormal.x * epsilon)),
                                                    (adjustexVertexPos.y + (vertexNormal.x * epsilon)),
                                                    (adjustexVertexPos.z + (vertexNormal.x * epsilon))),
                                        light.position,
                                        sceneBVH,
                                        epsilon))
                {
                    const infall = light.intensity *
                                    scatter_attenuation(vertex,
                                                        light.position,
                                                        light.attenuation);

                    vertex.shade = ((infall > vertex.shade)? infall : vertex.shade);
                }
            }

            // Distribute the vertex's light to the other vertices in the scene.
            // Note that this will have no effect on the shade of vertices that
            // have already received a brighter shade from some other vertex;
            // i.e. the light doesn't accumulate.
            if (vertex.shade > 0)
            {
                for (const dstTriangle of triangles)
                {
                    if (dstTriangle == triangle)
                    {
                        continue;
                    }

                    const dstTriangleMidpoint = Rngon.vector3((dstTriangle.vertices[0].x + dstTriangle.vertices[1].x + dstTriangle.vertices[2].x)/3,
                                                                (dstTriangle.vertices[0].y + dstTriangle.vertices[1].y + dstTriangle.vertices[2].y)/3,
                                                                (dstTriangle.vertices[0].z + dstTriangle.vertices[1].z + dstTriangle.vertices[2].z)/3);

                    for (const dstVertex of dstTriangle.vertices)
                    {
                        // To make indirect lighting more visually pronounced,
                        // we'll boost it by this multiplier.
                        const lightMultiplier = 256;

                        const dstVertexNormal = {...dstVertex.normal};

                        // We only need to consider destination vertices that point toward
                        // the source vertex, unless their material is two-sided (in which
                        // case one side is always considered to point toward the source).
                        if (Rngon.vector3.dot(vertexNormal, dstVertexNormal) >= 0)
                        {
                            if (dstTriangle.material.isTwoSided)
                            {
                                Rngon.vector3.invert(dstVertexNormal);
                            }
                            else
                            {
                                break;
                            }
                        }

                        if (dstVertex.shade > (vertex.shade * lightMultiplier))
                        {
                            continue;
                        }

                        // Move each vertex slightly towards the triangle's midpoint, to avoid
                        // spurious intersections at shared vertices.
                        const adjustexDstVertexPos = Rngon.vector3(Rngon.lerp(dstVertex.x, dstTriangleMidpoint.x, epsilon),
                                                                    Rngon.lerp(dstVertex.y, dstTriangleMidpoint.y, epsilon),
                                                                    Rngon.lerp(dstVertex.z, dstTriangleMidpoint.z, epsilon));

                        // Calculate the amount of light falling on this vertex from
                        // the source vertex.
                        if (point_sees_point(Rngon.vector3((adjustexDstVertexPos.x + (dstVertexNormal.x * epsilon)),
                                                            (adjustexDstVertexPos.y + (dstVertexNormal.y * epsilon)),
                                                            (adjustexDstVertexPos.z + (dstVertexNormal.z * epsilon))),
                                                Rngon.vector3((adjustexVertexPos.x + (vertexNormal.x * epsilon)),
                                                            (adjustexVertexPos.y + (vertexNormal.y * epsilon)),
                                                            (adjustexVertexPos.z + (vertexNormal.z * epsilon))),
                                                sceneBVH,
                                                epsilon))
                        {
                            const outLight = lightMultiplier *
                                                vertex.shade *
                                                scatter_attenuation(vertex, dstVertex, 1);

                            dstVertex.shade = ((dstVertex.shade < outLight)? outLight : dstVertex.shade);
                        }
                    }
                }
            }
        }
    }

    // Clip vertex shade to allowed limits.
    for (const triangle of triangles)
    {
        for (const vertex of triangle.vertices)
        {
            vertex.shade = Math.max(triangle.material.ambientLightLevel,
                                    Math.min(1, vertex.shade));
        }
    }

    return;
}

// Returns true if the position x1,y1,z1 is visible from x0,y0,z0 in the given
// scene of triangles; false otherwise. A point is considered to be visible from
// another if there is no occluding geometry between the points, i.e. if the
// distance from point A to the closest intersected triangle in the scene is
// greater than the distance from point A to point B.
function point_sees_point(pointA = Rngon.vector3(),
                          pointB = Rngon.vector3(),
                          sceneBVH,
                          epsilon)
{
    const pointDistance = Math.sqrt(((pointA.x - pointB.x) * (pointA.x - pointB.x)) +
                                    ((pointA.y - pointB.y) * (pointA.y - pointB.y)) +
                                    ((pointA.z - pointB.z) * (pointA.z - pointB.z)));

    const pointDirection = Rngon.vector3((pointB.x - pointA.x),
                                         (pointB.y - pointA.y),
                                         (pointB.z - pointA.z));

    Rngon.vector3.normalize(pointDirection);

    const intersection = ray(pointA, pointDirection).intersect_bvh(sceneBVH, epsilon, {ignoreTransparency: true});

    // The points aren't required to be part of the world's geometry, so in
    // the case that the ray hits no geometry (e.g. it was directed at the
    // sky), we consider there to be no occluding geometry between the two points.
    if (!intersection)
    {
        return true;
    }

    // Note: If the target XYZ coordinates are those of a triangle's vertex,
    // the closest intersection might be with that triangle - i.e. the
    // intersected distance might be 99.999...% equal to the distance between
    // the two points. So we use epsilon to try and counter any doubleing-point
    // inaccuracy in that case.
    return (intersection.distance > pointDistance);
}

// Returns a value in the range [0,1] representing the amount by which a quantity
// of light would be attenuated when arriving to point A from point B given also
// the surface normal n associated with point A. A custom distance attenuation
// factor can also be given; or set to 1 for the default value.
function scatter_attenuation(pointA = Rngon.vector3(),
                             pointB = Rngon.vector3(),
                             distanceAttenuationFactor)
{
    const surfaceAlbedo = 0.8;
    const pointDistance = Math.sqrt(((pointA.x - pointB.x) * (pointA.x - pointB.x)) +
                                    ((pointA.y - pointB.y) * (pointA.y - pointB.y)) +
                                    ((pointA.z - pointB.z) * (pointA.z - pointB.z)));

    const outDirection = Rngon.vector3((pointB.x - pointA.x),
                                       (pointB.y - pointA.y),
                                       (pointB.z - pointA.z));

    Rngon.vector3.normalize(outDirection);

    const distanceAttenuation = (1 / (1 + (pointDistance * distanceAttenuationFactor)));
    const brdf = (Rngon.vector3.dot(pointA.normal, outDirection) * (surfaceAlbedo / Math.PI));
    const pdf = (1 / (2 * Math.PI));
    const incidenceMul = Math.max(0, Math.min(1, (brdf / pdf)));
    const distanceMul = Math.max(0, Math.min(1, distanceAttenuation));

    return (incidenceMul * distanceMul);
}
