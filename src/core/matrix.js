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

import {assert as Assert} from "../core/util.js";
import {trig as Trig} from "../core/trig.js";

// Provides manipulation of 4-by-4 matrices.
export const matrix = {
    scaling: function(x = 0, y = 0, z = 0)
    {
        return Object.freeze([
            x, 0, 0, 0,
            0, y, 0, 0,
            0, 0, z, 0,
            0, 0, 0, 1,
        ]);
    },

    translation: function(x = 0, y = 0, z = 0)
    {
        return Object.freeze([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            x, y, z, 1,
        ]);
    },

    rotation: function(x = 0, y = 0, z = 0)
    {
        x = Trig.deg(x);
        y = Trig.deg(y);
        z = Trig.deg(z);
        const cos = Trig.cos;
        const sin = Trig.sin;

        const mx = [
            1,       0,       0,       0,
            0,       cos(x),  -sin(x), 0,
            0,       sin(x),  cos(x),  0,
            0,       0,       0,       1,
        ];

        const my = [
            cos(y),  0,       sin(y),  0,
            0,       1,       0,       0,
            -sin(y), 0,       cos(y),  0,
            0,       0,       0,       1,
        ];

        const mz = [
            cos(z),  -sin(z), 0,       0,
            sin(z),  cos(z),  0,       0,
            0,       0,       1,       0,
            0,       0,       0,       1,
        ];

        const temp = this.multiply(my, mz);
        const mResult = this.multiply(mx, temp);

        Assert?.(
            (mResult.length === 16),
            "Expected a 4 x 4 matrix."
        );

        return Object.freeze(mResult);
    },

    perspective: function(fov = 0, aspectRatio = 0, zNear = 0, zFar = 0)
    {
        const fovHalf = Math.tan(fov / 2);
        const zRange = (zNear - zFar);

        return Object.freeze([
            (1 / (fovHalf * aspectRatio)), 0,             0,                             0,
            0,                             (1 / fovHalf), 0,                             0,
            0,                             0,             ((-zNear - zFar) / zRange),    1,
            0,                             0,             (2 * zFar * (zNear / zRange)), 0,
        ]);
    },

    ortho: function(width = 0, height = 0)
    {
        return Object.freeze([
            (width/2),     0,              0, 0,
            0,             -(height/2),    0, 0,
            0,             0,              1, 0,
            (width/2)-0.5, (height/2)-0.5, 0, 1,
        ]);
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
            for (let j = 0; j < 4; j++)
            {
                mResult[i + (j * 4)] = (
                    (m1[i + (0 * 4)] * m2[0 + (j * 4)]) +
                    (m1[i + (1 * 4)] * m2[1 + (j * 4)]) +
                    (m1[i + (2 * 4)] * m2[2 + (j * 4)]) +
                    (m1[i + (3 * 4)] * m2[3 + (j * 4)])
                );
            }
        }

        return Object.freeze(mResult);
    },
}
