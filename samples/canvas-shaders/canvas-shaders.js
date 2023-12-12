/*
 * 2022 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer / render sample
 * 
 */

"use strict";

import {scene} from "./scene.js";
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
                scale: this.Rngon.vector(25, 25, 25)
            }),
            renderOptions: {
                cameraDirection: this.camera.direction,
                cameraPosition: this.camera.position,
            },
            renderPipeline: {
                canvasShader: (
                    parent.ACTIVE_SHADER.function
                        ? parent.ACTIVE_SHADER.function.bind(this)
                        : undefined
                ),
            },
        };
    },
    shaders: [
        {title:"None",               function:undefined},
        {title:"On-screen display",  function:cs_osd},
        {title:"Rasterized overlay", function:cs_rasterized_overlay},
        {title:"Screen fade",        function:cs_screen_fade},
        {title:"Radial fade",        function:cs_radial_fade},
        {title:"Shake",              function:cs_shake},
    ],
    camera: undefined,
    Rngon: undefined,
    numTicks: 0,
};

function cs_radial_fade(canvasContext, image)
{
    canvasContext.putImageData(image, 0, 0);

    const longerImageSide = (image.width > image.height? image.width : image.height);
    const vignetteScale = (Math.abs(Math.tan(this.numTicks / 75)) * longerImageSide);
    const gradient = canvasContext.createRadialGradient(
        (image.width / 2),
        (image.height / 2),
        0,
        (image.width / 2),
        (image.height / 2),
        vignetteScale
    );
    gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 1)");
    canvasContext.fillStyle = gradient;
    canvasContext.fillRect(0, 0, image.width, image.height);
}

function cs_screen_fade(canvasContext, image)
{
    canvasContext.putImageData(image, 0, 0);
    canvasContext.fillStyle = `rgba(0, 0, 0, ${Math.abs(Math.cos(this.numTicks/100))})`;
    canvasContext.fillRect(0, 0, image.width, image.height);
}

function cs_rasterized_overlay(canvasContext, image)
{
    canvasContext.putImageData(image, 0, 0);

    const numVertices = 7;
    const sideLen = (image.height / 5);
    const rotation = (this.numTicks / 100);

    canvasContext.globalAlpha = Math.abs(Math.cos(rotation*1.5));
    canvasContext.fillStyle = "gold";
    canvasContext.strokeStyle = "orange";
    canvasContext.lineWidth = (sideLen / 10);
    canvasContext.lineJoin = "round";

    canvasContext.beginPath();
    for (let i = 0, a = ((Math.PI * 2) / numVertices); i < numVertices; i++) {
        canvasContext.lineTo(
            ((image.width / 2) + (sideLen * Math.cos(i * a + rotation))),
            ((image.height / 2) + (sideLen * Math.sin(i * a + rotation)))
        );
    }
    canvasContext.closePath();
    canvasContext.fill();
    canvasContext.stroke();

    return;
}

const flogImg = new Image();
let isFlogImgLoaded = false;
flogImg.src = "./flog.png";
flogImg.onload = ()=>{isFlogImgLoaded = true};
function cs_osd(canvasContext, image)
{
    canvasContext.putImageData(image, 0, 0);

    const fontSize = 9;
    canvasContext.shadowOffsetX = 1;
    canvasContext.shadowOffsetY = 1;
    canvasContext.shadowBlur = 0;
    canvasContext.shadowColor = "rgba(0, 0, 0, 1)";
    canvasContext.font = `bold ${fontSize}px monospace`;
    canvasContext.textAlign = "center";

    canvasContext.fillStyle = "white";
    canvasContext.fillText("Retro n-gon renderer", (image.width / 2), fontSize*2);
    canvasContext.fillStyle = "gold";
    canvasContext.fillText(`${this.Rngon.version.major}.${this.Rngon.version.minor}`, (image.width / 2), fontSize*3.25);
    
    canvasContext.fillStyle = "white";
    canvasContext.font = `italic ${fontSize}px monospace`;
    const str = `Resolution: ${image.width} × ${image.height}`;
    let x = ((image.width / 2) - (canvasContext.measureText(str).width / 2));
    str.split("").forEach((ch, idx)=>{
        const offsetx = Math.cos((Math.cos(idx) - 0.5) + (this.numTicks * 0.15))*3;
        const offsety = Math.sin((Math.cos(idx) - 0.5) + (this.numTicks * 0.15))*3;
        canvasContext.fillText(ch, x+offsetx+5, fontSize*5+offsety);
        x += canvasContext.measureText(ch).width;
    });

    if (isFlogImgLoaded) {
        canvasContext.drawImage(flogImg, ((image.width / 2) - (flogImg.width / 2)), fontSize*7);
    }
}

function cs_shake(canvasContext, image)
{
    canvasContext.putImageData(
        image,
        Math.cos(this.numTicks/5)*10,
        Math.sin(this.numTicks/10)*10
    );
}
