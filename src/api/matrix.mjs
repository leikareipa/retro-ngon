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

import {validate_object} from "../schema.mjs";

const schema = {
    arguments: {
        where: "in arguments to Rngon::matrix()",
        properties: {
            "data": {
                type: [["number"]],
                value(dataArray)
                {
                    if (dataArray.length !== 16) {
                        return "Matrices must be 4 x 4"
                    }
                },
            },
        },
    },
    interface: {
        where: "in the return value of Rngon::matrix()",
        properties: {
            "$constructor": {
                value: "Matrix",
            },
            "data": {
                type: [["number"]],
                value(dataArray)
                {
                    if (dataArray.length !== 16) {
                        return "Matrices must be 4 x 4"
                    }
                },
            },
        },
    },
};

export function Matrix(...data)
{
    if (!data.length)
    {
        data.push(
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
        );
    }
    
    validate_object?.({data}, schema.arguments);

    const publicInterface = {
        $constructor: "Matrix",
        data,
    };

    validate_object?.(publicInterface, schema.interface);
    
    return publicInterface;
}

Matrix.multiply = function(m1 = Matrix(), m2 = Matrix())
{
    let result = Matrix();

    for (let i = 0; i < 4; i++)
    {
        for (let j = 0; j < 16; j += 4)
        {
            result.data[i+j] = (
                (m1.data[i]    * m2.data[j])   +
                (m1.data[i+4]  * m2.data[j+1]) +
                (m1.data[i+8]  * m2.data[j+2]) +
                (m1.data[i+12] * m2.data[j+3])
            );
        }
    }

    return result;
};

Matrix.scaling = function(x = 0, y = 0, z = 0)
{
    return Matrix(
        x, 0, 0, 0,
        0, y, 0, 0,
        0, 0, z, 0,
        0, 0, 0, 1,
    );
};

Matrix.translating = function(x = 0, y = 0, z = 0)
{
    return Matrix(
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        x, y, z, 1,
    );
};

Matrix.rotating = function(x = 0, y = 0, z = 0)
{
    // Degrees to radians.
    const PI_180 = (Math.PI / 180);
    x *= PI_180;
    y *= PI_180;
    z *= PI_180;

    const sx = Math.sin(x);
    const cx = Math.cos(x);
    const sy = Math.sin(y);
    const cy = Math.cos(y);
    const sz = Math.sin(z);
    const cz = Math.cos(z);

    const mx = Matrix(
        1,   0,   0,  0,
        0,   cx, -sx, 0,
        0,   sx,  cx, 0,
        0,   0,   0,  1,
    );

    const my = Matrix(
        cy,  0,   sy, 0,
        0,   1,   0,  0,
       -sy,  0,   cy, 0,
        0,   0,   0,  1,
    );

    const mz = Matrix(
        cz, -sz,  0,  0,
        sz,  cz,  0,  0,
        0,   0,   1,  0,
        0,   0,   0,  1,
    );

    return Matrix.multiply(mx, Matrix.multiply(my, mz));
};
