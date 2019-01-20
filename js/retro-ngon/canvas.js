/*
 * Tarpeeksi Hyvae Soft 2019 /
 * Retro n-gon renderer
 *
 */

"use strict"

// Provides an interface for interacting with a HTML5 canvas element for 3d rendering.
Rngon.canvas = function(canvasElementId = "",              // The DOM id of the canvas element.
                        ngon_fill_f = function(){},        // A function that rasterizes the given ngons onto the canvas.
                        ngon_transform_f = function(){},   // A function that transforms the given ngons into screen-space for the canvas.
                        scaleFactor = 1)
{
    k_assert((typeof scaleFactor === "number"), "Expected the scale factor to be a numeric value.");
    k_assert((typeof ngon_fill_f === "function" && typeof ngon_transform_f === "function"), "Expected ngon manipulation functions to be provided.");

    const canvasElement = document.getElementById(canvasElementId);
    k_assert((canvasElement !== null), "Can't find the given canvas element.");

    // The pixel dimensions of the render surface.
    const surfaceWidth = Math.floor(parseInt(window.getComputedStyle(canvasElement).getPropertyValue("width")) * scaleFactor);
    const surfaceHeight = Math.floor(parseInt(window.getComputedStyle(canvasElement).getPropertyValue("height")) * scaleFactor);
    k_assert(!isNaN(surfaceWidth) && !isNaN(surfaceHeight), "Failed to extract the canvas size.");
    canvasElement.setAttribute("width", surfaceWidth);
    canvasElement.setAttribute("height", surfaceHeight);

    const perspectiveMatrix = Rngon.matrix44.perspective(0.75, (surfaceWidth / surfaceHeight), 1, 1000);
    const canvasSpaceMatrix = Rngon.matrix44.screen_space(surfaceWidth, surfaceHeight);

    function exposed_render_context()
    {
        return canvasElement.getContext("2d");
    }

    const publicInterface = Object.freeze(
    {
        width: surfaceWidth,
        height: surfaceHeight,

        wipe_clean: function()
        {
            const renderContext = exposed_render_context();
            renderContext.fillStyle = "transparent";
            renderContext.fillRect(0, 0, surfaceWidth, surfaceHeight);
        },

        // Returns a copy of the ngons transformed into screen-space for this render surface.
        // Takes as input the ngons to be transformed, an object matrix which contains the object's
        // transforms, and a camera matrix, which contains the camera's translation and rotation.
        transformed_ngons: function(ngons = [], objectMatrix = [], cameraMatrix = [])
        {
            const objectSpaceMatrix = Rngon.matrix44.matrices_multiplied(cameraMatrix, objectMatrix);
            const clipSpaceMatrix = Rngon.matrix44.matrices_multiplied(perspectiveMatrix, objectSpaceMatrix);
            const screenSpaceMatrix = Rngon.matrix44.matrices_multiplied(canvasSpaceMatrix, clipSpaceMatrix);

            return ngon_transform_f(ngons, clipSpaceMatrix, screenSpaceMatrix);
        },

        // Draw the given ngons onto this render surface.
        draw_ngons: function(ngons = [])
        {
            ngon_fill_f(ngons, exposed_render_context(), surfaceWidth, surfaceHeight);
        },
    });
    return publicInterface;
}
