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
        {title:"None",               function:null},
        {title:"On-screen display",  function:cs_osd},
        {title:"Pixels to ASCII",    function:cs_ascii},
        {title:"Rasterized overlay", function:cs_rasterized_overlay},
        {title:"Screen fade",        function:cs_screen_fade},
        {title:"Vignette",           function:cs_vignette},
    ],
    camera: undefined,
    Rngon: undefined,
    numTicks: 0,
};

function cs_vignette({context, image})
{
    context.putImageData(image, 0, 0);

    const vignetteScale = (image.width > image.height? image.width : image.height);
    const gradient = context.createRadialGradient(
        (image.width / 2),
        (image.height / 2),
        (vignetteScale * 0.4),
        (image.width / 2),
        (image.height / 2),
        (vignetteScale * 0.6)
    );
    gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
    gradient.addColorStop(0.5, "rgba(0, 0, 0, 0.1)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 1)");

    context.fillStyle = gradient;
    context.fillRect(0, 0, image.width, image.height);
}

function cs_screen_fade({context, image})
{
    context.putImageData(image, 0, 0);

    context.fillStyle = `rgba(0, 0, 0, ${Math.abs(Math.cos(this.numTicks/200))})`;
    context.fillRect(0, 0, image.width, image.height);
}

function cs_rasterized_overlay({context, image})
{
    context.putImageData(image, 0, 0);

    const numVertices = 7;
    const sideLen = (image.height / 5);
    const rotation = (this.numTicks / 100);

    context.globalAlpha = Math.abs(Math.cos(rotation*1.5));
    context.fillStyle = "gold";
    context.strokeStyle = "orange";
    context.lineWidth = (sideLen / 10);
    context.lineJoin = "round";

    context.beginPath();
    for (let i = 0, a = ((Math.PI * 2) / numVertices); i < numVertices; i++) {
        context.lineTo(
            ((image.width / 2) + (sideLen * Math.cos(i * a + rotation))),
            ((image.height / 2) + (sideLen * Math.sin(i * a + rotation)))
        );
    }
    context.closePath();
    context.fill();
    context.stroke();

    return;
}

const flogImg = new Image();
let isFlogImgLoaded = false;
flogImg.src = "./assets/flog.png";
flogImg.onload = ()=>{isFlogImgLoaded = true};
function cs_osd({context, image})
{
    context.putImageData(image, 0, 0);

    const fontSize = 9;

    const selfString = "Retro n-gon renderer";
    const versionString = `${this.Rngon.version.family}.${this.Rngon.version.major}.${this.Rngon.version.minor}`;
    context.font = `italic ${fontSize}px monospace`;
    context.fillStyle = "black";
    context.fillText(selfString, 1, fontSize+1);
    context.fillText(selfString, 2, fontSize+1);
    context.fillStyle = "lightgray";
    context.fillText(selfString, 1, fontSize);
    context.font = `${fontSize}px monospace`;
    context.fillStyle = "gold";
    context.fillText(versionString, context.measureText(selfString + " ").width, fontSize+1);

    if (isFlogImgLoaded) {
        context.drawImage(flogImg, 1, fontSize*3+3, 32, 32);
    }

    context.shadowOffsetY = 3;
    context.shadowBlur = 2;
    context.shadowColor = "rgba(0, 0, 0, 0.3)";
    let x = 0;
    `Resolution: ${image.width} × ${image.height}`.split("").forEach((ch, idx)=>{
        const offsetx = Math.cos((Math.cos(idx) - 0.5) + (this.numTicks * 0.15))*3;
        const offsety = Math.sin((Math.cos(idx) - 0.5) + (this.numTicks * 0.15))*3;
        context.fillStyle = "black";
        context.fillText(ch, x+offsetx+3, fontSize*2+offsety+4);
        x += context.measureText(ch).width;
    });
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
                case avg < 100: ch = "+"; break;
                case avg < 150: ch = "c"; break;
                default: ch = "a"; break;
            }

            context.fillText(ch, x, (y + (fontSize / 2)));
        }
    }
}
