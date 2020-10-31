"use strict";

// Draws a line between the two given vertices into the render's pixel buffer.
Rngon.line_draw = function(vert1 = Rngon.vertex(),
                           vert2 = Rngon.vertex(),
                           lineColor = null,
                           ngonIdx = 0,
                           ignoreDepthBuffer = false)
{
    const pixelBuffer = Rngon.internalState.pixelBuffer.data;
    const depthBuffer = (Rngon.internalState.useDepthBuffer? Rngon.internalState.depthBuffer.data : null);
    const fragmentBuffer = (Rngon.internalState.usePixelShader? Rngon.internalState.fragmentBuffer.data : null);
    const renderWidth = Rngon.internalState.pixelBuffer.width;
    const renderHeight = Rngon.internalState.pixelBuffer.height;
    const interpolatePerspective = Rngon.internalState.usePerspectiveCorrectInterpolation;

    let x0 = Math.round(vert1.x);
    let y0 = Math.round(vert1.y);
    const x1 = Math.round(vert2.x);
    const y1 = Math.round(vert2.y);
    const lineLength = Math.sqrt((x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0));

    // Establish interpolation parameters.
    const w1 = (interpolatePerspective? vert1.w : 1);
    const w2 = (interpolatePerspective? vert2.w : 1);
    const depth1 = (vert1.z / Rngon.internalState.farPlaneDistance);
    const depth2 = (vert2.z / Rngon.internalState.farPlaneDistance);
    let startDepth = depth1/w1;
    const deltaDepth = ((depth2/w2 - depth1/w1) / lineLength);
    let startShade = vert1.shade/w1;
    const deltaShade = ((vert2.shade/w2 - vert1.shade/w1) / lineLength);
    let startInvW = 1/w1;
    const deltaInvW = ((1/w2 - 1/w1) / lineLength);
    if (fragmentBuffer)
    {
        var startWorldX = vert1.worldX/w1;
        var deltaWorldX = ((vert2.worldX/w2 - vert1.worldX/w1) / lineLength);

        var startWorldY = vert1.worldY/w1;
        var deltaWorldY = ((vert2.worldY/w2 - vert1.worldY/w1) / lineLength);

        var startWorldZ = vert1.worldZ/w1;
        var deltaWorldZ = ((vert2.worldZ/w2 - vert1.worldZ/w1) / lineLength);
    }

    // Bresenham line algo. Adapted from https://stackoverflow.com/a/4672319.
    {
        let dx = Math.abs(x1 - x0);
        let dy = Math.abs(y1 - y0);
        const sx = ((x0 < x1)? 1 : -1);
        const sy = ((y0 < y1)? 1 : -1); 
        let err = (((dx > dy)? dx : -dy) / 2);

        const maxNumSteps = (renderWidth + renderHeight);
        let numSteps = 0;
        
        while (++numSteps < maxNumSteps)
        {
            put_pixel(x0, y0);

            if ((x0 === x1) && (y0 === y1))
            {
                break;
            }

            // Increment interpolated values.
            {
                startDepth += deltaDepth;
                startShade += deltaShade;
                startInvW += deltaInvW;

                if (fragmentBuffer)
                {
                    startWorldX += deltaWorldX;
                    startWorldY += deltaWorldY;
                    startWorldZ += deltaWorldZ;
                }
            }

            const e2 = err;
            if (e2 > -dx)
            {
                err -= dy;
                x0 += sx;
            }
            if (e2 < dy)
            {
                err += dx;
                y0 += sy;
            }
        }

        function put_pixel(x, y)
        {
            const idx = ((x + y * renderWidth) * 4);
            const depthBufferIdx = (idx / 4);

            if ((x < 0) || (x >= renderWidth) ||
                (y < 0) || (y >= renderHeight))
            {
                return;
            }
            
            const depth = (startDepth / startInvW);
            const shade = (startShade / startInvW);

            // Depth test.
            if (!ignoreDepthBuffer && depthBuffer && (depthBuffer[depthBufferIdx] <= depth)) return;

            // Alpha test.
            if (lineColor.alpha !== 255) return;

            // Draw the pixel.
            {
                pixelBuffer[idx + 0] = (shade * lineColor.red);
                pixelBuffer[idx + 1] = (shade * lineColor.green);
                pixelBuffer[idx + 2] = (shade * lineColor.blue);
                pixelBuffer[idx + 3] = 255;

                if (depthBuffer)
                {
                    depthBuffer[depthBufferIdx] = depth;
                }

                if (fragmentBuffer)
                {
                    const fragment = fragmentBuffer[depthBufferIdx];
                    fragment.ngonIdx = ngonIdx;
                    fragment.textureUScaled = undefined; // We don't support textures on lines.
                    fragment.textureVScaled = undefined;
                    fragment.depth = (startDepth / startInvW);
                    fragment.shade = (startShade / startInvW);
                    fragment.worldX = (startWorldX / startInvW);
                    fragment.worldY = (startWorldY / startInvW);
                    fragment.worldZ = (startWorldZ / startInvW);
                    fragment.w = (1 / startInvW);
                }
            }

            return;
        }
    }
};
