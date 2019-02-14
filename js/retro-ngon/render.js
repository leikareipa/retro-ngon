/*
 * Tarpeeksi Hyvae Soft 2019 /
 * Retro n-gon renderer
 * 
 */

"use strict";

// Will create a HTML5 canvas element inside the given container, and render into it
// the given ngon meshes.
Rngon.render = function(canvasElementId,
                        meshes = [Rngon.mesh()],
                        cameraPos = Rngon.vector3(0, 0, 0),
                        cameraDir = Rngon.vector3(0, 0, 0),
                        scaleFactor = 1,
                        options =
                        {
                            depthSort:"painter",
                        })
{
    const renderSurface = Rngon.canvas(canvasElementId, Rngon.ngon_filler, Rngon.ngon_transformer, scaleFactor);

    // Returns true if any horizontal part of the render surface DOM container is within the page's
    // visible region (accounting for the user having possibly scrolled the page up/down to cause
    // the container to have moved out of view).
    function is_surface_in_view()
    {
        const viewHeight = window.innerHeight;
        const containerRect = document.getElementById(canvasElementId).getBoundingClientRect();
        Rngon.assert((containerRect != null), "Couldn't find the canvas container element.");

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
            const cameraMatrix = Rngon.matrix44.matrices_multiplied(Rngon.matrix44.translate(cameraPos.x, cameraPos.y, cameraPos.z),
                                                                    Rngon.matrix44.rotate(cameraDir.x, cameraDir.y, cameraDir.z));

            meshes.forEach((mesh)=>
            {
                transformedNgons.push(...renderSurface.transformed_ngons(mesh.ngons, mesh.objectSpaceMatrix, cameraMatrix));
            });

            // Apply depth sorting to the transformed ngons.
            switch (options.depthSort)
            {
                case "none": break;

                // Painter's algorithm, i.e. sort by depth.
                case "painter":
                {
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

                    break;
                }
                
                default: Rngon.assert(0, "Unknown depth sort option."); break;
            }
        }

        // Rasterize.
        renderSurface.draw_ngons(transformedNgons);
    }
};
