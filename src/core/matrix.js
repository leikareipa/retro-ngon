/*
 * 2019 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer
 * 
 * Adapted and modified from code written originally by Benny Bobaganoosh for his 3d software
 * renderer (https://github.com/BennyQBD/3DSoftwareRenderer). Full attribution:
 * {
 *     Copyright (c) 2014, Benny Bobaganoosh
 *     All rights reserved.
 *
 *     Redistribution and use in source and binary forms, with or without
 *     modification, are permitted provided that the following conditions are met:
 *
 *     1. Redistributions of source code must retain the above copyright notice, this
 *         list of conditions and the following disclaimer.
 *     2. Redistributions in binary form must reproduce the above copyright notice,
 *         this list of conditions and the following disclaimer in the documentation
 *         and/or other materials provided with the distribution.
 *
 *     THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 *     ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *     WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 *     DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 *     ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 *     (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 *     LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 *     ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 *     (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 *     SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 * }
 *
 */

import {assert as Assert} from "../core/assert.js";

const PI_180 = (Math.PI / 180);

// Provides manipulation of 4-by-4 matrices.
export const matrix = {
    scaling: function(x = 0, y = 0, z = 0)
    {
        return [
            x, 0, 0, 0,
            0, y, 0, 0,
            0, 0, z, 0,
            0, 0, 0, 1,
        ];
    },

    translation: function(x = 0, y = 0, z = 0)
    {
        return [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            x, y, z, 1,
        ];
    },

    rotation: function(x = 0, y = 0, z = 0)
    {
        // Degrees to radians.
        x *= PI_180;
        y *= PI_180;
        z *= PI_180;

        const sx = Math.sin(x);
        const cx = Math.cos(x);
        const sy = Math.sin(y);
        const cy = Math.cos(y);
        const sz = Math.sin(z);
        const cz = Math.cos(z);

        const mx = [
            1,   0,   0,  0,
            0,   cx, -sx, 0,
            0,   sx,  cx, 0,
            0,   0,   0,  1,
        ];

        const my = [
            cy,  0,   sy, 0,
            0,   1,   0,  0,
           -sy,  0,   cy, 0,
            0,   0,   0,  1,
        ];

        const mz = [
            cz, -sz,  0,  0,
            sz,  cz,  0,  0,
            0,   0,   1,  0,
            0,   0,   0,  1,
        ];

        const mResult = this.multiply(mx, this.multiply(my, mz));

        Assert?.(
            (mResult.length === 16),
            "Expected a 4 x 4 matrix."
        );

        return mResult;
    },

    perspective: function(fov = 0, aspectRatio = 0, zNear = 0, zFar = 0)
    {
        const fh = Math.tan(fov / 2);
        const zr = (zNear - zFar);

        return [
            (1 / (fh * aspectRatio)), 0,           0,                         0,
            0,                        (1 / fh),    0,                         0,
            0,                        0,           ((-zNear - zFar) / zr),    1,
            0,                        0,           (2 * zFar * (zNear / zr)), 0,
        ];
    },

    ortho: function(width = 0, height = 0)
    {
        const wh = (width / 2);
        const hh = (height / 2);

        return [
            wh,      0,      0, 0,
            0,      -hh,     0, 0,
            0,       0,      1, 0,
            wh-0.5,  hh-0.5, 0, 1,
        ];
    },
    
    multiply: function(m1 = [], m2 = [])
    {
        Assert?.(
            ((m1.length === 16) && (m2.length === 16)),
            "Expected 4 x 4 matrices."
        );

        let mResult = new Array(16);

        for (let i = 0; i < 4; i++)
        {
            for (let j = 0; j < 16; j += 4)
            {
                mResult[i+j] = (
                    (m1[i]    * m2[j])   +
                    (m1[i+4]  * m2[j+1]) +
                    (m1[i+8]  * m2[j+2]) +
                    (m1[i+12] * m2[j+3])
                );
            }
        }

        return mResult;
    },
}
