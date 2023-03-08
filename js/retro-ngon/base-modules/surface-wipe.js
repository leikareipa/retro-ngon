/*
 * 2019, 2020 Tarpeeksi Hyvae Soft
 * 
 * Software: Retro n-gon renderer
 * 
 */

// Resets the render surface's buffers to their initial contents.
export function surface_wipe()
{
    Rngon.state.active.pixelBuffer.data.fill(0);

    /// TODO: Wipe the fragment buffer.

    if (Rngon.state.active.useDepthBuffer)
    {
        Rngon.state.active.depthBuffer.data.fill(Rngon.state.active.depthBuffer.clearValue);
    }

    return;
}
