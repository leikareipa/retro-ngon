/*
 * 2019, 2020 Tarpeeksi Hyvae Soft
 * 
 * Software: Retro n-gon renderer
 * 
 */

"use strict";

Rngon.baseModules = (Rngon.baseModules || {});

// Resets the render surface's buffers to their initial contents.
Rngon.baseModules.surface_wipe = function()
{
    Rngon.internalState.pixelBuffer.data.fill(0);

    /// TODO: Wipe the fragment buffer.

    if (Rngon.internalState.useDepthBuffer)
    {
        Rngon.internalState.depthBuffer.data.fill(Rngon.internalState.depthBuffer.clearValue);
    }

    return;
}
