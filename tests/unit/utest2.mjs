/*
 * 2023 ArtisaaniSoft
 *
 * Software: Retro n-gon renderer
 * 
 * 
 * Console-based Node.js app for running unit tests.
 *
 */

import self from "./self.test.mjs";
import matrix from "./matrix.test.mjs";
import vertex from "./vertex.test.mjs";
import vector from "./vector.test.mjs";
import ngon from "./ngon.test.mjs";
import mesh from "./mesh.test.mjs";
test_unit("self", self);
test_unit("Matrix", matrix);
test_unit("Vertex", vertex);
test_unit("Vector", vector);
test_unit("Ngon", ngon);
test_unit("Mesh", mesh);

function test_unit(unitName = "", run = ()=>{})
{
    process.stdout.write(` ....  ${unitName}  `);
    process.stdout.clearLine();
    process.stdout.cursorTo(0);

    try {
        run();
        process.stdout.write(`\x1b[37m\x1b[42m PASS \x1b[0m ${unitName}\n`);
    }
    catch (error) {
        process.stdout.write(`\x1b[37m\x1b[41m FAIL \x1b[0m ${unitName}\n`);
        console.error(error);
    }
}

// Throws if not all input functions return true.
export function good(...testFns)
{
    for (const fn of testFns) {
        if (fn() !== true) {
            throw new Error("Not true: " + fn);
        }
    }
}

// Throws if not all input functions throw or return false.
export function bad(...testFns)
{
    for (const fn of testFns) {
        try {
            if (fn() === false) {
                throw true;
            }
        }
        catch {
            continue;
        }

        throw new Error("Does not fail: " + fn);
    }
}

// Truncates the given real value to four decimals.
export function tr4(real = 0.0)
{
    return (~~(real * 10000) / 10000);
}
