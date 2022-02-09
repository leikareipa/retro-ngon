/*
 * 2022 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer / render sample
 * 
 */

"use strict";

import {scene} from "./assets/scene.rngon-model.js";
import {first_person_camera} from "../first-person-camera/camera.js";

export const sample = {
    initialize: function()
    {
        this.camera = first_person_camera("canvas", {
            position: {x:-70, y:33, z:-7},
            direction: {x:7, y:90, z:0},
            movementSpeed: 0.05,
        });

        // To allow the pixel shader functions access to the Rngon namespace.
        this.Rngon = Rngon;

        scene.initialize();
    },
    tick: function()
    {
        this.numTicks++;
        this.camera.update();

        return {
            mesh: this.Rngon.mesh(scene.ngons, {
                scaling: this.Rngon.scaling_vector(25, 25, 25)
            }),
            renderOptions: {
                contextShader: parent.ACTIVE_SHADER.function
                    ? parent.ACTIVE_SHADER.function.bind(this)
                    : null,
                cameraDirection: this.camera.direction,
                cameraPosition: this.camera.position,
            },
        };
    },
    shaders: [
        {title:"None",              function:null},
        {title:"On-screen display", function:cs_osd},
        {title:"Pixels to ASCII",  function:cs_ascii},
    ],
    camera: undefined,
    Rngon: undefined,
    numTicks: 0,
};

const flogImg = new Image();
let isFlogImgLoaded = false;
flogImg.src = "./assets/flog.png";
flogImg.onload = ()=>{isFlogImgLoaded = true};
function cs_osd({context, image})
{
    context.putImageData(image, 0, 0);

    const fontSize = 9;
    context.font = `${fontSize}px monospace`;

    const versionString = `${this.Rngon.version.family}.${this.Rngon.version.major}.${this.Rngon.version.minor}`;
    context.fillStyle = "whitesmoke";
    context.fillText(`Retro n-gon renderer, ${versionString}`, 0, fontSize-1);
    context.fillStyle = "black";
    context.fillText(`Retro n-gon renderer, ${versionString}`, 0, fontSize);

    let x = 0;
    `Resolution: ${image.width} × ${image.height}`.split("").forEach((ch, idx)=>{
        const offsetx = Math.cos((Math.cos(idx) - 0.5) + (this.numTicks * 0.2))*2;
        const offsety = Math.sin((Math.cos(idx) - 0.5) + (this.numTicks * 0.2))*2;
        context.fillStyle = "darkblue";
        context.fillText(ch, x+offsetx+2, fontSize*2+offsety+2);
        x += context.measureText(ch).width;
    });

    if (isFlogImgLoaded) {
        context.drawImage(flogImg, 1, fontSize*3, 32, 32);
    }
}

function cs_ascii({context, image})
{
    const fontSize = 9;
    context.font = `${fontSize}px monospace`;
    context.fillStyle = "#404040";
    
    const chSpacing = 6;
    for (let y = 0; y < image.height; y += chSpacing)
    {
        for (let x = 0; x < image.width; x += chSpacing)
        {
            const bufferIdx = (x + y * image.width);
            
            const r = image.data[(bufferIdx * 4) + 0];
            const g = image.data[(bufferIdx * 4) + 1];
            const b = image.data[(bufferIdx * 4) + 2];
            const avg = ((r + g + b) / 3);

            let ch;
            switch (true) {
                case avg < 50: ch = "."; break;
                case avg < 150: ch = "c"; break;
                default: ch = "a"; break;
            }

            context.fillText(ch, x, (y + (fontSize / 2)));
        }
    }
}
