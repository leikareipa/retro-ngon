/*
 * Tarpeeksi Hyvae Soft 2019 /
 * Retro n-gon renderer
 * 
 */

"use strict"

// Will create a HTML5 canvas element inside the given container, and render into it
// the given ngon meshes.
RNGon.render = function(canvasElementId,
                        meshes = [RNGon.mesh()],
                        scaleFactor = 1,
                        cameraPos = RNGon.vector3(0, 0, 0),
                        cameraDir = RNGon.vector3(0, 0, 0))
{
    const renderSurface = RNGon.canvas(canvasElementId, RNGon.ngon_filler, RNGon.ngon_transformer, scaleFactor);

    // Returns true if any horizontal part of the render surface DOM container is within the page's
    // visible region (accounting for the user having possibly scrolled the page up/down to cause
    // the container to have moved out of view).
    function is_surface_in_view()
    {
        const viewHeight = window.innerHeight;
        const containerRect = document.getElementById(canvasElementId).getBoundingClientRect();
        k_assert((containerRect != null), "Couldn't find the canvas container element.");

        return Boolean((containerRect.top > -containerRect.height) &&
                       (containerRect.top < viewHeight));
    }

    // Render a single frame onto the render surface.
    if (is_surface_in_view())
    {
        renderSurface.wipe_clean();

        // Transform.
        const transformedNgons = [];
        {
            const cameraMatrix = RNGon.matrix44.matrices_multiplied(RNGon.matrix44.translate(cameraPos.x, cameraPos.y, cameraPos.z),
                                                                    RNGon.matrix44.rotate(cameraDir.x, cameraDir.y, cameraDir.z));

            meshes.forEach((mesh)=>
            {
                transformedNgons.push(...renderSurface.transformed_ngons(mesh.ngons, mesh.objectSpaceMatrix, cameraMatrix));
            });

            // Sort the transformed ngons by depth, since we don't do depth testing.
            transformedNgons.sort((ngonA, ngonB)=>
            {
                let a = 0;
                let b = 0;
                ngonA.vertices.forEach(v => (a += v.z));
                ngonB.vertices.forEach(v => (b += v.z));

                // Ngons aren't guaranteed to have the same number of vertices each,
                // so factor out the vertex count.
                a /= ngonA.vertices.length;
                b /= ngonB.vertices.length;
                
                return ((a === b)? 0 : ((a < b)? 1 : -1));
            });
        }

        // Rasterize.
        renderSurface.draw_ngons(transformedNgons);
    }
};
