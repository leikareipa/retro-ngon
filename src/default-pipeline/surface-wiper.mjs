/*
 * 2019, 2020 ArtisaaniSoft
 * 
 * Software: Retro n-gon renderer
 * 
 */

// Resets the render surface's buffers to their initial contents.
export function surface_wiper(renderContext)
{
    renderContext.pixelBuffer.data.fill(0);

    /// TODO: Wipe the fragment buffer.

    if (renderContext.useDepthBuffer)
    {
        renderContext.depthBuffer.clear();
    }

    return;
}
