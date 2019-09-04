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

    const perspectiveMatrix = Rngon.matrix44.perspective((fov * Math.PI/180), (screenWidth / screenHeight), 1, 1000);
    const screenMatrix = Rngon.matrix44.ortho(screenWidth, screenHeight);

    function exposed_render_context()
    {
        return canvasElement.getContext("2d");
    }

    const publicInterface = Object.freeze(
    {
        width: screenWidth,
        height: screenHeight,

        wipe_clean: function()
        {
            const renderContext = exposed_render_context();
            renderContext.fillStyle = "transparent";
            renderContext.fillRect(0, 0, screenWidth, screenHeight);
        },

        // Returns a copy of the ngons transformed into screen-space for this render surface.
        // Takes as input the ngons to be transformed, an object matrix which contains the object's
        // transforms, and a camera matrix, which contains the camera's translation and rotation.
        transformed_ngons: function(ngons = [], objectMatrix = [], cameraMatrix = [], nearPlaneDistance)
        {
            const objectSpaceMatrix = Rngon.matrix44.matrices_multiplied(cameraMatrix, objectMatrix);
            const clipSpaceMatrix = Rngon.matrix44.matrices_multiplied(perspectiveMatrix, objectSpaceMatrix);
            const screenSpaceMatrix = Rngon.matrix44.matrices_multiplied(screenMatrix, clipSpaceMatrix);

            return ngon_transform_f(ngons, screenWidth, screenHeight, screenSpaceMatrix, nearPlaneDistance);
        },

        // Draw the given ngons onto this render surface.
        draw_ngons: function(ngons = [])
        {
            const renderContext = exposed_render_context();
            const pixelBuffer = renderContext.getImageData(0, 0, screenWidth, screenHeight);

            ngon_fill_f(ngons, pixelBuffer.data, auxiliaryBuffers, screenWidth, screenHeight);

            renderContext.putImageData(pixelBuffer, 0, 0);
        },
    });
    return publicInterface;
}
