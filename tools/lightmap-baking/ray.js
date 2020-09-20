/*
 * 2019, 2020 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer
 * 
 * Provides a ray object for a ray tracer.
 * 
 */

"use strict";

function ray(pos = Rngon.vector3(0, 0, 0), dir = Rngon.vector3(0, 0, 1))
{
    const publicInterface =
    {
        pos,
        dir,

        // Convenience functions for altering the ray's direction.
        aimAt:
        {
            // Points the ray at a random direction about the hemisphere of the
            // given normal.
            random_in_hemisphere: function(normal = Rngon.vector3())
            {
                let newDir = Rngon.vector3((Math.random() - Math.random()),
                                           (Math.random() - Math.random()),
                                           (Math.random() - Math.random()));

                Rngon.vector3.normalize(newDir);

                if (Rngon.vector3.dot(normal, newDir) < 0)
                {
                    newDir = Rngon.vector3((newDir.x * -1),
                                           (newDir.y * -1),
                                           (newDir.z * -1));
                }
                
                publicInterface.dir = newDir;
            },

            // Points the ray at a random direction about the hemisphere of the given
            // normal. The direction is cosine-weighted, i.e. more likely to be closer
            // to the normal.
            random_in_hemisphere_cosine_weighted: function(normal = Rngon.vector3())
            {
                const rand1 = Math.random();
                const rand2 = Math.random();

                // Adapted from http://www.rorydriscoll.com/2009/01/07/better-sampling/.
                // Get a cosine-weighted vector (x, y, z) about the hemisphere.
                const r = Math.sqrt(rand1);
                const theta = (2 * Math.PI * rand2);
                const x = (r * Math.cos(theta));
                const y = Math.sqrt(Math.max(0, 1 - rand1));
                const z = (r * Math.sin(theta));

                // Adapted from https://bheisler.github.io/post/writing-gpu-accelerated-path-tracer-part-2/.
                // Transform the cosine-weighted vector's hemisphere to the direction of
                // the normal.
                const t = (Math.abs(normal.x) > Math.abs(normal.y))
                          ? Rngon.vector3(normal.z, 0, -normal.x)
                          : Rngon.vector3(0, -normal.z, normal.y);
                Rngon.vector3.normalize(t);
                const b = Rngon.vector3.cross(normal, t);
                const newDir = Rngon.vector3((x * b.x + y * normal.x + z * t.x),
                                             (x * b.y + y * normal.y + z * t.y),
                                             (x * b.z + y * normal.z + z * t.z));
                Rngon.vector3.normalize(newDir);
                                
                publicInterface.dir = newDir;
            },
        },

        invert: function()
        {
            publicInterface.dir.x *= -1;
            publicInterface.dir.y *= -1;
            publicInterface.dir.z *= -1;
        },

        // Returns a ray moved forward from this position in this direction by the given amount.
        step: function(stepSize = 0, inDirection = this.dir)
        {
            publicInterface.pos.x = (publicInterface.pos.x + (inDirection.x * stepSize));
            publicInterface.pos.y = (publicInterface.pos.y + (inDirection.y * stepSize));
            publicInterface.pos.z = (publicInterface.pos.z + (inDirection.z * stepSize));
        },

        // Returns the ray's distance to its corresponding intersection point on the given
        // triangle; or null if the ray doesn't intersect the triangle. Adapted from Moller
        // & Trumbore 1997: "Fast, minimum storage ray/triangle intersection".
        intersect_triangle: function(triangle = Rngon.ngon(),
                                     options = {})
        {
            const ray = publicInterface;
            const epsilon = 0.00001;
            const noHit = [null, 0, 0];
        
            const e1 = Rngon.vector3((triangle.vertices[1].x - triangle.vertices[0].x),
                                     (triangle.vertices[1].y - triangle.vertices[0].y),
                                     (triangle.vertices[1].z - triangle.vertices[0].z));
        
            const e2 = Rngon.vector3((triangle.vertices[2].x - triangle.vertices[0].x),
                                     (triangle.vertices[2].y - triangle.vertices[0].y),
                                     (triangle.vertices[2].z - triangle.vertices[0].z));
        
            const pv = Rngon.vector3.cross(ray.dir, e2);
            const det = Rngon.vector3.dot(e1, pv);
            if ((det > -epsilon) && (det < epsilon)) return noHit;
        
            const invD = (1.0 / det);
            const tv = Rngon.vector3((ray.pos.x - triangle.vertices[0].x),
                                     (ray.pos.y - triangle.vertices[0].y),
                                     (ray.pos.z - triangle.vertices[0].z));
            const u = (Rngon.vector3.dot(tv, pv) * invD);
            if ((u < 0) || (u > 1)) return noHit;
        
            const qv = Rngon.vector3.cross(tv, e1);
            const v = (Rngon.vector3.dot(ray.dir, qv) * invD);
            if ((v < 0) || ((u + v) > 1)) return noHit;
        
            const distance = (Rngon.vector3.dot(e2, qv) * invD);
            if (distance <= 0) return noHit;

            // If we've been told to ignore transparency, we'll consider an intersection
            // valid even if it's over a transparent part of the triangle. Otherwise,
            // we'll ignore the intersection if it's over a transparent portion.
            if (!options.ignoreTransparency)
            {
                if (triangle.material.color.alpha < 255)
                {
                    return noHit;
                }

                if (triangle.material.texture)
                {
                    const w = (1 - u - v);
                    const texture = triangle.material.texture;

                    // Barycentric interpolation of texture UV coordinates.
                    let tu = ((triangle.vertices[0].u * w) +
                              (triangle.vertices[1].u * u) +
                              (triangle.vertices[2].u * v));
                    let tv = ((triangle.vertices[0].v * w) +
                              (triangle.vertices[1].v * u) +
                              (triangle.vertices[2].v * v));

                    [tu, tv] = uv_to_texel_coordinates(tu, tv, triangle.material);

                    const texel = texture.pixels[Math.round(tu) + Math.round(tv) * texture.width];

                    if (texel && (texel.alpha < 255))
                    {
                        return noHit;
                    }
                }
            }
        
            return [distance, u, v];
        },

        // Adapted from https://tavianator.com/fast-branchless-raybounding-box-intersections/.
        intersect_aabb: function(aabb)
        {
            const ray = publicInterface;

            const dirX = (1 / ray.dir.x);
            const dirY = (1 / ray.dir.y);
            const dirZ = (1 / ray.dir.z);

            const tx1 = (aabb.min.x - ray.pos.x) * dirX;
            const tx2 = (aabb.max.x - ray.pos.x) * dirX;
            let tmin = Math.min(tx1, tx2);
            let tmax = Math.max(tx1, tx2);

            const ty1 = (aabb.min.y - ray.pos.y) * dirY;
            const ty2 = (aabb.max.y - ray.pos.y) * dirY;
            tmin = Math.max(tmin, Math.min(ty1, ty2));
            tmax = Math.min(tmax, Math.max(ty1, ty2));

            const tz1 = (aabb.min.z - ray.pos.z) * dirZ;
            const tz2 = (aabb.max.z - ray.pos.z) * dirZ;
            tmin = Math.max(tmin, Math.min(tz1, tz2));
            tmax = Math.min(tmax, Math.max(tz1, tz2));

            return (tmax >= 0 && tmax >= tmin);
        },

        // Traces the ray recursively through the given BVH. Returns null if no triangle in
        // the BVH was intersected; and otherwise an object containing the triangle that was
        // intersected and the distance to the point of intersection on it along the ray.
        intersect_bvh: function(bvh, epsilon = 0, options = {})
        {
            const ray = this;

            const intersectionInfo = {
                triangle: null,
                distance: Infinity,
                u: 0,
                v: 0,
                w: 0,
            };

            (function trace(aabb = Wray.bvh_aabb())
            {
                if (aabb.isLeaf)
                {
                    for (const triangle of aabb.triangles)
                    {
                        const [distance, u, v] = ray.intersect_triangle(triangle, options);

                        // To avoid "self-intersection" at shared vertices (i.e. immediately
                        // intersecting another triangle at the point of the shared vertex), we
                        // require valid intersection distances to be slightly non-zero.*/
                        if ((distance > epsilon) &&
                            (distance < intersectionInfo.distance))
                        {
                            intersectionInfo.triangle = triangle;
                            intersectionInfo.distance = distance;
                            intersectionInfo.u = u;
                            intersectionInfo.v = v;
                            intersectionInfo.w = (1 - u - v);
                        }
                    }

                    return;
                }

                if (ray.intersect_aabb(aabb.mutable.left)) trace(aabb.mutable.left);
                if (ray.intersect_aabb(aabb.mutable.right)) trace(aabb.mutable.right);
            })(bvh.base);

            return (intersectionInfo.triangle === null? null : intersectionInfo);
        },
    };

    return publicInterface;
}

// Maps the given UV coordinates into the material's texel coordinates.
// (The code here should match that in ngon-fill.js.)
function uv_to_texel_coordinates(u, v, material)
{
    const texture = material.texture;

    Rngon.assert && (texture)
                 || Rngon.throw("The material must have a texture.");

    switch (material.textureMapping)
    {
        // Affine mapping for power-of-two textures.
        case "affine":
        {
            switch (material.uvWrapping)
            {
                case "clamp":
                {
                    const signU = Math.sign(u);
                    const signV = Math.sign(v);
                    const upperLimit = (1 - Number.EPSILON);

                    u = Math.max(0, Math.min(Math.abs(u), upperLimit));
                    v = Math.max(0, Math.min(Math.abs(v), upperLimit));

                    // Negative UV coordinates flip the texture.
                    if (signU === -1) u = (upperLimit - u);
                    if (signV === -1) v = (upperLimit - v);

                    u *= texture.width;
                    v *= texture.height;

                    break;
                }
                case "repeat":
                {
                    u -= Math.floor(u);
                    v -= Math.floor(v);

                    u *= texture.width;
                    v *= texture.height;

                    // Modulo for power-of-two. This will also flip the texture for
                    // negative UV coordinates.
                    u = (u & (texture.width - 1));
                    v = (v & (texture.height - 1));

                    break;
                }
                default: Rngon.throw("Unrecognized UV wrapping mode."); break;
            }

            break;
        }
        // Affine mapping for wrapping non-power-of-two textures.
        /// FIXME: This implementation is a bit kludgy.
        /// TODO: Add clamped UV wrapping mode (we can just use the one for
        /// power-of-two textures).
        case "affine-npot":
        {
            u *= texture.width;
            v *= texture.height;

            // Wrap with repetition.
            /// FIXME: Why do we need to test for UV < 0 even when using positive
            /// but tiling UV coordinates? Doesn't render properly unless we do.
            if ((u < 0) ||
                (v < 0) ||
                (u >= texture.width) ||
                (v >= texture.height))
            {
                const uWasNeg = (u < 0);
                const vWasNeg = (v < 0);

                u = (Math.abs(u) % texture.width);
                v = (Math.abs(v) % texture.height);

                if (uWasNeg) u = (texture.width - u);
                if (vWasNeg) v = (texture.height - v);
            }

            break;
        }
        // Screen-space UV mapping, as used e.g. in the DOS game Rally-Sport.
        case "ortho":
        {
            break;
        }
        default: Rngon.throw("Unknown texture-mapping mode."); break;
    }

    return [u, v];
}
