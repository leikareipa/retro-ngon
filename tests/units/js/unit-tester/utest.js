/*
 * Tarpeeksi Hyvae Soft 2018-2019
 *
 * A basic unit tester.
 *
 */

"use strict";

function unit_tests(title = "", tests_f = ()=>{/*Tests*/})
{
    // A list of objects giving the test result of each unit tested.
    // Something along the lines of [{unitName: "", passed: Boolean, error: "Set if !passes."}].
    const testResults = [title];

    // Run the tests.
    verify_tester_functionality();
    eval(tests_f.toString())();
    return testResults;

    function assert(condition, message)
    {
        if (!condition) throw Error(message);
    }

    // Calling this will cause the current unit to be marked as having failed its tests.
    function trip(message)
    {
        throw Error(message);
    }

    // Takes in an array of values; each of which is expected to evaluate to true.
    function expect_true(values = [()=>(1 === true)])
    {
        assert((values instanceof Array), "Expected an array of variables.");

        values.forEach((v, i)=>
        {
            if (v() !== true) trip("Expected all functions to return true, but " + v + " did not.");
        })
    }

    // Takes in an array of functions; the execution of each of the functions is
    // expected to throw, i.e. fail.
    //
    /// FIXME: Will pass if the code inside the function throws for any reason, not
    ///        necessarily just for the intended one. You'll want to be careful when
    ///        crafting these functions.
    function expect_fail(functions = [()=>{}])
    {
        assert((functions instanceof Array), "Expected an array of functions.");

        functions.forEach(fn=>
        {
            try
            {
                fn();
            }
            catch
            {
                return;
            }

            trip("Function expected to throw but did not: " + fn);
        });
    }

    // Make sure the unit tester's core functionality actually works.
    function verify_tester_functionality()
    {
        try
        {
            expect_true([()=>((1 + 1) === 2)]);
            expect_fail([()=>{const i = 0; i = 1;}]);

            expect_true([()=>(trunc4(14568.787566) === 14568.7876),
                         ()=>(trunc4(-14568.787566) === -14568.7876),
                         ()=>(trunc4(0.00001) === 0),
                         ()=>(trunc4(0.00005) === 0.0001)]);
        }
        catch (err)
        {
            window.alert("The unit tester does not appear to be functioning properly. As a precaution, testing has been halted.");
            window.alert("Error: \"" + err + "\"");
            throw 0; // Assume this isn't caught by anything in the code below, so we exit.
        }
    }

    // Truncates the given real value to four decimals.
    function trunc4(real = 0.0)
    {
        return (Math.round(real * 10000) / 10000);
    }

    // Expects to receive a function which will test all the relevant individual
    // elements of the given unit. If any of the tests throw, will assume that
    // the unit failed its tests. Will indicate in the HTML results table either
    // a pass or fail, accordingly, using the unit name provided.
    function unit(unitName = "", individual_tests_f = ()=>{})
    {
        assert((individual_tests_f instanceof Function), "Expected a function.");
        assert((unitName.length > 0), "No name string provided.");

        const result = {unitName, passed:true};

        try
        {
            individual_tests_f();
        }
        catch (err)
        {
            result.passed = false;
            result.error = err;
        }

        testResults.push(result);
    }
}
