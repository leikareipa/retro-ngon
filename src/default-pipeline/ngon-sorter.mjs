/*
 * 2023 ArtisaaniSoft
 * 
 * Software: Retro n-gon renderer
 * 
 */

export function ngon_sorter(renderContext)
{
    // Sort in reverse painter order if using a depth buffer, and otherwise
    // don't sort. The reverse painter sort helps improve performance with
    // a depth buffer as it allows early rejection of occluded pixels.
    if (renderContext.useDepthBuffer)
    {
        renderContext.screenSpaceNgons.sort((ngonA, ngonB)=>{
            const a = (ngonA.vertices.reduce((acc, v)=>(acc + v.z), 0) / ngonA.vertices.length);
            const b = (ngonB.vertices.reduce((acc, v)=>(acc + v.z), 0) / ngonB.vertices.length);
            return ((a === b)? 0 : ((a > b)? 1 : -1));
        });
    }

    return;
}
