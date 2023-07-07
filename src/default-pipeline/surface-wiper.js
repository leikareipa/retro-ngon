/*
 * 2019, 2020 Tarpeeksi Hyvae Soft
 * 
 * Software: Retro n-gon renderer
 * 
 */

// Resets the render surface's buffers to their initial contents.
export function surface_wiper(renderState)
{
    renderState.pixelBuffer.data.fill(0);

    /// TODO: Wipe the fragment buffer.

    if (renderState.useDepthBuffer)
    {
        renderState.depthBuffer.data.fill(renderState.depthBuffer.clearValue);
    }

    return;
}
