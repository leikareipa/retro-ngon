/*
 * 2019, 2020 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer
 * 
 * Builds a bounding volume hierarchy (BVH) for a given mesh of triangles.
 * 
 */

"use strict";

// Returns an axis-aligned bounding box for the given array of triangles. Intended to
// be used as nodes in a BVH tree, hence the 'isLeaf' parameter is used to determine
// whether this AABB is a leaf node.
function bvh_aabb(mesh = [Rngon.ngon()], isLeaf = false)
{
    const [min, max] = (()=>
    {
        const min = Rngon.vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
        const max = Rngon.vector3(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);

        for (const triangle of mesh)
        {
            for (const vertex of triangle.vertices)
            {
                min.x = Math.min(min.x, vertex.x);
                min.y = Math.min(min.y, vertex.y);
                min.z = Math.min(min.z, vertex.z);

                max.x = Math.max(max.x, vertex.x);
                max.y = Math.max(max.y, vertex.y);
                max.z = Math.max(max.z, vertex.z);
            }
        }

        return [min, max];
    })();

    const publicInterface = Object.freeze(
    {
        min,
        max,
        isLeaf,
        triangles: Object.freeze(isLeaf? mesh : []),
        volume: ((2.0 * (max.z - min.z) * (max.x - min.x)) +
                 (2.0 * (max.z - min.z) * (max.y - min.y)) +
                 (2.0 * (max.x - min.x) * (max.y - min.y))),

        mutable:
        {
            // The left and right AABBs into which this AABB's triangles are split
            // in the BVH tree.
            left: null,
            right: null,
        },
    });
    return publicInterface;
}

// Recursively splits the given mesh into smaller and smaller bounding boxes.
export function bvh(mesh = [Rngon.ngon()])
{
    Rngon.assert && Array.isArray(mesh)
                 || Rngon.throw("Expected an array of triangles for creating a BVH.");

    // The time at which construction for this BVH began. We'll use this to time how long
    // the construction took.
    const startTime = Date.now();

    // An AABB encompassing the entire mesh and from which further splits are made.
    const baseAABB = bvh_aabb(mesh, false);
    
    // How many splits we're allowed to do, at most, before declaring a leaf node and stopping.
    const maxDepth = 30;

    // A split must have at most this many triangles in it to be eligible to act as a leaf.
    const minNumTris = 3;

    // Recursively split the mesh into smaller and smaller AABBs.
    (function split(parentAABB = bvh_aabb(), mesh = [Rngon.ngon()], depth = 0)
    {
        if (parentAABB.isLeaf) return;

        // Split the AABB into two new AABBs (termed left/right, here, though the split could
        // be along one of a number of axes).
        {
            // Decide on which axis to split on.
            const axesAvailable = ["x", "y", "z"];
            const splitAxis = axesAvailable[depth % axesAvailable.length];
            const leftMin = parentAABB.min;
            const leftMax = (()=> // Propose random split positions along the chosen axis and use the one that has the lowest cost.
            {
                const numSplits = 5;
                const costNodeIntersection = 1;
                const costTriangleIntersection = 5;

                let leftMax = parentAABB.max;
                let lowestSplitCost = Infinity;

                for (let i = 0; i < numSplits; i++)
                {
                    const proposedSplitStart = (parentAABB.min[splitAxis] + ((parentAABB.max[splitAxis] - parentAABB.min[splitAxis]) * Math.random()));
                    const proposedLeftMin = parentAABB.min;
                    const proposedLeftMax = (()=>
                    {
                        switch (splitAxis)
                        {
                            case "x": return Rngon.vector3(proposedSplitStart, parentAABB.max.y, parentAABB.max.z);
                            case "y": return Rngon.vector3(parentAABB.max.x, proposedSplitStart, parentAABB.max.z);
                            case "z": return Rngon.vector3(parentAABB.max.x, parentAABB.max.y, proposedSplitStart);
                            default: Rngon.throw("Unknown BVH split direction."); return Rngon.vector3(0, 0, 0);
                        }
                    })();

                    const leftMesh = mesh.filter(triangle=>is_triangle_fully_inside_box(triangle, proposedLeftMin, proposedLeftMax));
                    const rightMesh = mesh.filter(triangle=>!is_triangle_fully_inside_box(triangle, proposedLeftMin, proposedLeftMax));
        
                    const costOfSplit = (costNodeIntersection +
                                         (bvh_aabb(leftMesh).volume * leftMesh.length * costTriangleIntersection) +
                                         (bvh_aabb(rightMesh).volume * rightMesh.length * costTriangleIntersection));

                    if (costOfSplit < lowestSplitCost)
                    {
                        lowestSplitCost = costOfSplit;
                        leftMax = proposedLeftMax;
                    }
                }

                return leftMax;
            })();

            // Distribute the parent AABB's triangles between the two new AABBs that the parent was split into.
            const leftMesh = mesh.filter(triangle=>is_triangle_fully_inside_box(triangle, leftMin, leftMax));
            const rightMesh = mesh.filter(triangle=>!is_triangle_fully_inside_box(triangle, leftMin, leftMax));
            Rngon.assert && ((leftMesh.length + rightMesh.length) === mesh.length)
                         || Rngon.throw("Triangles have gone missing during AABB splitting.");

            // Recurse to split each of the two new AABBs further into two more, etc.
            parentAABB.mutable.left = bvh_aabb(leftMesh, Boolean(((depth + 1) >= maxDepth) || (leftMesh.length <= minNumTris)));
            parentAABB.mutable.right = bvh_aabb(rightMesh, Boolean(((depth + 1) >= maxDepth) || (rightMesh.length <= minNumTris)));
            split(parentAABB.mutable.left, leftMesh, depth + 1);
            split(parentAABB.mutable.right, rightMesh, depth + 1);

            // Returns true if the given triangle is fully inside the given AABB; otherwise returns false.
            function is_triangle_fully_inside_box(triangle = Rngon.ngon(), min = Rngon.vector3(), max = Rngon.vector3())
            {
                return triangle.vertices.every(vertex=>
                {
                    return Boolean(vertex.x >= min.x && vertex.x <= max.x &&
                                   vertex.y >= min.y && vertex.y <= max.y &&
                                   vertex.z >= min.z && vertex.z <= max.z);
                });
            };
        }
    })(baseAABB, mesh, 1);

    const publicInterface = Object.freeze(
    {
        base: baseAABB,
        triangles: Object.freeze(mesh),
        constructionTimeMs: (Date.now() - startTime),
    });

    return publicInterface;
}
