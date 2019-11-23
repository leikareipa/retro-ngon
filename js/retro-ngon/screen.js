/*
 * Tarpeeksi Hyvae Soft 2019 /
 * Retro n-gon renderer
 * 
 * A surface for rendering onto. Maps onto a HTML5 canvas.
 *
 */

"use strict";

Rngon.screen = function(canvasElementId = "",              // The DOM id of the canvas element.
                        ngon_fill_f = function(){},        // A function that rasterizes the given ngons onto the canvas.
                        ngon_transform_f = function(){},   // A function that transforms the given ngons into screen-space for the canvas.
                        scaleFactor = 1,
                        fov = 43,
                        nearPlane = 1,
                        farPlane = 1000,
                        auxiliaryBuffers = [])
{
    Rngon.assert && (typeof scaleFactor === "number") || Rngon.throw("Expected the scale factor to be a numeric value.");
    Rngon.assert && (typeof ngon_fill_f === "function" && typeof ngon_transform_f === "function")
                 || Rngon.throw("Expected ngon-manipulation functions to be provided.");

    const canvasElement = document.getElementById(canvasElementId);
    Rngon.assert && (canvasElement !== null) || Rngon.throw("Can't find the given canvas element.");

    // The pixel dimensions of the render surface.
    const screenWidth = Math.floor(parseInt(window.getComputedStyle(canvasElement).getPropertyValue("width")) * scaleFactor);
    const screenHeight = Math.floor(parseInt(window.getComputedStyle(canvasElement).getPropertyValue("height")) * scaleFactor);
    Rngon.assert && (!isNaN(screenWidth) && !isNaN(screenHeight)) || Rngon.throw("Failed to extract the canvas size.");
    canvasElement.setAttribute("width", screenWidth);
    canvasElement.setAttribute("height", screenHeight);

    const perspectiveMatrix = Rngon.matrix44.perspective((fov * Math.PI/180), (screenWidth / screenHeight), nearPlane, farPlane);
    const screenSpaceMatrix = Rngon.matrix44.ortho((screenWidth + 1), (screenHeight + 1));

    const renderContext = canvasElement.getContext("2d");

    if ((Rngon.internalState.pixelBuffer.width != screenWidth) ||
        (Rngon.internalState.pixelBuffer.height != screenHeight))
    {
        Rngon.internalState.pixelBuffer = new ImageData(screenWidth, screenHeight);
    }

    if (Rngon.internalState.useDepthBuffer &&
        (Rngon.internalState.depthBuffer.width != screenWidth) ||
        (Rngon.internalState.depthBuffer.height != screenHeight) ||
        !Rngon.internalState.depthBuffer.buffer.length)
    {
        Rngon.internalState.depthBuffer.width = screenWidth;
        Rngon.internalState.depthBuffer.height = screenHeight;
        Rngon.internalState.depthBuffer.buffer = new Array(Rngon.internalState.depthBuffer.width * Rngon.internalState.depthBuffer.height); 
    }

    const publicInterface = Object.freeze(
    {
        width: screenWidth,
        height: screenHeight,

        wipe_clean: function()
        {
            Rngon.internalState.pixelBuffer.data.fill(0);

            if (Rngon.internalState.useDepthBuffer)
            {
                Rngon.internalState.depthBuffer.buffer.fill(Rngon.internalState.depthBuffer.clearValue);
            }
        },

        // Returns a copy of the ngons transformed into screen-space for this render surface.
        // Takes as input the ngons to be transformed, an object matrix which contains the object's
        // transforms, a camera matrix, which contains the camera's translation and rotation, and
        // a vector containing the camera's raw world position.
        transform_ngons: function(ngons = [], objectMatrix = [], cameraMatrix = [], cameraPos)
        {
            const viewSpaceMatrix = Rngon.matrix44.matrices_multiplied(cameraMatrix, objectMatrix);
            const clipSpaceMatrix = Rngon.matrix44.matrices_multiplied(perspectiveMatrix, viewSpaceMatrix);

            ngon_transform_f(ngons, clipSpaceMatrix, screenSpaceMatrix, cameraPos);
        },

        // Draw all n-gons currently stored in the internal n-gon cache onto the render surface.
        rasterize_ngon_cache: function()
        {
            ngon_fill_f(auxiliaryBuffers);
            renderContext.putImageData(Rngon.internalState.pixelBuffer, 0, 0);
        },
    });

    return publicInterface;
}
