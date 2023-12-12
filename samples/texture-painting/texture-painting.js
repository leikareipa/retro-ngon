/*
 * 2023 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer
 * 
 */

export const sample = {
    initialize: async function()
    {
        this.texture = await Rngon.texture.load("../samples/shared/textures/wood.rngon-texture.json");

        {
            const canvasEl = document.getElementById("canvas");
            
            canvasEl.addEventListener("mousemove", (event)=>{
                if (this.mousePos)
                {
                    this.mousePos = {
                        x: (event.clientX * this.renderScale - 0.5),
                        y: (event.clientY * this.renderScale - 0.5),
                    };
                }
            });
         
            canvasEl.addEventListener("mousedown", (event)=>{
                this.mousePos = this.prevMousePos = {
                    x: (event.clientX * this.renderScale - 0.5),
                    y: (event.clientY * this.renderScale - 0.5),
                };
            });
         
            canvasEl.addEventListener("mouseup", ()=>{
                this.mousePos = this.prevMousePos = undefined;
            });
        }

        this.triangle = Rngon.ngon([
            Rngon.vertex(-40, -40, 0, 0, 0),
            Rngon.vertex( 40, -40, 0, 1, 0),
            Rngon.vertex( 40,  40, 0, 1, 1)], {
                textureMapping: "affine",
                isTwoSided: true,
                isTwoSided: true,

                texture: this.texture,
            },
            Rngon.vector(0, 0, -1),
        );
    },
    tick: function(defaultRenderOptions)
    {
        this.renderScale = defaultRenderOptions.resolution;
        this.numTicks++;

        if (this.mousePos)
        {
            paint.call(this);
            this.prevMousePos = this.mousePos;
        }

        return {
            mesh: Rngon.mesh([this.triangle]),
            renderOptions: {
                useDepthBuffer: false,
                useFragmentBuffer: true,
                fragments: {
                    textureUScaled: true,
                    textureVScaled: true,
                },
            },
        };
    },
    mousePos: undefined,
    prevMousePos: undefined,
    renderScale: 1,
    rotationSpeed: 0.5,
    triangle: undefined,
    texture: undefined,
    numTicks: 0,
};

// Draws a line into the texture between the previous and current mouse positions.
function paint()
{
    if (!this.mousePos || !this.prevMousePos)
    {
        return;
    }

    const {x:startX, y:startY} = this.prevMousePos;
    const {x:endX, y:endY} = this.mousePos;
    
    let lineLength = Math.ceil(Math.sqrt((endX - startX)**2 + (endY - startY)**2));
    const deltaX = ((endX - startX) / lineLength);
    const deltaY = ((endY - startY) / lineLength);

    let realX = startX;
    let realY = startY;
    while (lineLength-- >= 0)
    {
        const x = ~~realX;
        const y = ~~realY;
        
        const fragmentIdx = (x + y * Rngon.context.default.fragmentBuffer.width);
        const fragment = Rngon.context.default.fragmentBuffer.data[fragmentIdx];
        if (!fragment)
        {
            continue;
        }

        const {textureUScaled:texelU, textureVScaled:texelV} = fragment;
        if (![typeof texelU, typeof texelV].includes("undefined"))
        {
            const texelIdx = (texelU + texelV * this.texture.width);
            this.texture.pixels[texelIdx*4+0] = 255;
            this.texture.pixels[texelIdx*4+1] = 255;
            this.texture.pixels[texelIdx*4+2] = 255;
        }

        realX += deltaX;
        realY += deltaY;
    }

    // Since we modified the texture's pixels, we should call texture.regenerate_mipmaps() to
    // update all of the texture's mip levels with the new pixel data. However, in
    // this rendering sample, we only ever display the first mip level (which is
    // the base image), so we can save some performance by not refreshing the other
    // mip levels.
    //
    //this.texture.regenerate_mipmaps();
}
