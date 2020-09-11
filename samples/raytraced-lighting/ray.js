/*
 * 2019, 2020 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer
 * 
 * Provides a ray object for a ray tracer.
 * 
 */

"use strict";

export function ray(pos = Rngon.vector3(0, 0, 0), dir = Rngon.vector3(0, 0, 1))
{
    const publicInterface =
    {
        pos,
        dir,

        // Returns the ray's distance to its corresponding intersection point on the given
        // triangle; or null if the ray doesn't intersect the triangle. Adapted from Moller
        // & Trumbore 1997: "Fast, minimum storage ray/triangle intersection".
        intersect_triangle: function(triangle = Rngon.ngon())
        {
            const ray = this;
            const epsilon = 0.00001;
            const noHit = Infinity;
        
            const e1 = Rngon.vector3((triangle.vertices[1].worldX - triangle.vertices[0].worldX),
                                     (triangle.vertices[1].worldY - triangle.vertices[0].worldY),
                                     (triangle.vertices[1].worldZ - triangle.vertices[0].worldZ));
        
            const e2 = Rngon.vector3((triangle.vertices[2].worldX - triangle.vertices[0].worldX),
                                     (triangle.vertices[2].worldY - triangle.vertices[0].worldY),
                                     (triangle.vertices[2].worldZ - triangle.vertices[0].worldZ));
        
            const pv = Rngon.vector3.cross(ray.dir, e2);
            const det = Rngon.vector3.dot(e1, pv);
            if ((det > -epsilon) && (det < epsilon)) return noHit;
        
            const invD = (1.0 / det);
            const tv = Rngon.vector3((ray.pos.x - triangle.vertices[0].worldX),
                                     (ray.pos.y - triangle.vertices[0].worldY),
                                     (ray.pos.z - triangle.vertices[0].worldZ));
            const u = (Rngon.vector3.dot(tv, pv) * invD);
            if ((u < 0) || (u > 1)) return noHit;
        
            const qv = Rngon.vector3.cross(tv, e1);
            const v = (Rngon.vector3.dot(ray.dir, qv) * invD);
            if ((v < 0) || ((u + v) > 1)) return noHit;
        
            const distance = (Rngon.vector3.dot(e2, qv) * invD);
            if (distance <= 0) return noHit; 
        
            return distance;
        },

        // Adapted from https://tavianator.com/fast-branchless-raybounding-box-intersections/.
        intersect_aabb: function(aabb)
        {
            const ray = this;

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
        intersect_bvh: function(bvh, epsilon = 0)
        {
            const ray = this;

            const intersectionInfo = {
                triangle: null,
                distance: Infinity,
            };

            (function trace(aabb)
            {
                if (aabb.isLeaf)
                {
                    for (const triangle of aabb.triangles)
                    {
                        const distance = ray.intersect_triangle(triangle);

                        // To avoid "self-intersection" at shared vertices (i.e. immediately
                        // intersecting another triangle at the point of the shared vertex), we
                        // require valid intersection distances to be slightly non-zero.*/
                        if ((distance > epsilon) &&
                            (distance < intersectionInfo.distance))
                        {
                            intersectionInfo.triangle = triangle;
                            intersectionInfo.distance = distance;
                        }
                    }

                    return;
                }

                if (ray.intersect_aabb(aabb.mutable.left)) trace(aabb.mutable.left);
                if (ray.intersect_aabb(aabb.mutable.right)) trace(aabb.mutable.right);
            })(bvh.base);

            return ((intersectionInfo.triangle === null)? null : intersectionInfo);
        },
    };

    return publicInterface;
}
