/*
 * Most recent known filename: js/rsed/utest/utest.js
 *
 * Tarpeeksi Hyvae Soft 2018, 2019
 *
 * Basic unit testing, relying on try/catch.
 * 
 * The functions of note are require(), reject(), and run_tests(). The first two will
 * throw on conditional failure, so you'll want to call them on the code you want
 * to test; and the third takes as an argument a function which contains calls to
 * the first two on the data to be tested, runs it, and construcst a HTML report on
 * the results.
 * 
 * The function you may want to pass to run_tests() could be something like this:
 * 
 *      tests_fn = function()
 *      {
 *          unit_tester.test_unit("Unit 1", function()
 *          {
 *              unit_tester.require((1 === 1), "Expected to pass.");
 *              unit_tester.reject((1 === 2), "Expected to fail.");
 *          });
 * 
 *          unit_tester.test_unit("Unit 2", function()
 *          {
 *              unit_tester.reject((1 === 2), "Expected to fail.");
 *          });
 *      };
 * 
 * In that case, the HTML report would include entries called 'Unit 1' and 'Unit 2',
 * which correspond to units of code by those name, along with information about
 * whether all of the tests for that unit in the function passed or whether any
 * one of them failed.
 *
 */

"use strict"

k_assert = function(condition = false, explanation = "(no reason given)")
{
    if (!condition) throw Error(explanation);
}

const unit_tester = Object.freeze(
{
    // The HTML element into which we'll print the test results.
    resultsTable: document.createElement("table"),

    // A list of all the tests performed.
    testList: [],

    // Used by tests to evaluate conditions which must be true.
    require: function(condition = false, failMessage = "")
    {
        k_assert((failMessage.length > 0), "Empty fail strings are discouraged.");
        
        if (!condition)
        {
            throw Error(failMessage);
        }

        unit_tester.testList.push(failMessage);
    },

    // Used by tests to evaluate conditions which must be false. In practice, this
    // means passing in a function which attempts to perform illegal actions, like
    // initializing objects with values out of bounds. If something down the pipeline
    // throws on it, this will catch and consider it a success; otherwise the program
    // is considered to have failed to reject an illegal condition.
    //
    /// FIXME: Will return 'pass' by not throwing if code inside the illegal function
    ///        throws for any reason, including for just not working at all. For the
    ///        moment, you'll want to first verify with require() that the code works
    ///        with non-illegal operations.
    reject: function(illegal_f = Function, failMessage = "")
    {
        k_assert((illegal_f instanceof Function), "Expected a function.");
        k_assert((failMessage.length > 0), "Empty fail strings are discouraged.");

        let rejected = false;
        try
        {
            illegal_f();
        }
        catch (err)
        {
            rejected = true;
        }
        if (!rejected) throw Error(failMessage);

        unit_tester.testList.push(failMessage);
    },

    // Truncates the given real value to four decimals. (The tests here only care
    // about accuracy down to four digits.)
    tr4: function(real = 0.0)
    {
        return (Math.round(real * 10000) / 10000);
    },

    // Test the helper functions etc. that belong to the unit tester, to verify that
    // they work as expected.
    verify_tester_functionality: function()
    {
        try
        {
            unit_tester.require(((1 + 1) === 2), "This should never fail.");
            unit_tester.reject(function(){ const i = 0; i = 1; }, "This should always fail.");

            unit_tester.require((unit_tester.tr4(14568.787566) === 14568.7876), "Truncating a positive value.");
            unit_tester.require((unit_tester.tr4(-14568.787566) === -14568.7876), "Truncating a negative value.");
            unit_tester.require((unit_tester.tr4(0.00001) === 0), "Truncation rounding down.");
            unit_tester.require((unit_tester.tr4(0.00005) === 0.0001), "Truncation rounding up.");
        }
        catch (err)
        {
            window.alert("The unit tester does not appear to be functioning properly. As a precaution, testing has been halted.");
            throw 0; // Assume this isn't caught by anything in the code below, so we exit.
        }
    },

    // Expects to receive a function which will test all the relevant individual
    // elements of the given unit. If any of the tests throw, will assume that
    // the unit failed its tests. Will indicate in the HTML results table either
    // a pass or fail, accordingly, using the unit name provided.
    test_unit: function(unitName = "", individual_tests_f = Function)
    {
        k_assert((individual_tests_f instanceof Function), "Expected a function.");
        k_assert((unitName.length > 0), "No name string provided.");

        unit_tester.testList.length = 0;
        
        // Create a new row in the results table, for showing the name of this
        // unit, and whether its test(s) passed or failed.
        const resultsElement = document.createElement("tr");

        // Run the tests, and add the result onto the table row.
        {
            // Give the test result a colored tag, which is either 'pass' or 'fail';
            const tagElement = document.createElement("td");

            let resultText = unitName;
            tagElement.className = "tag_test_success";

            // Run the tests.
            try
            {
                individual_tests_f();
            }
            catch (err)
            {
                resultText = unitName + " - Fails on:";
                tagElement.className = "tag_test_fail";

                // If we failed, indicate the first throw's error message, as well.
                {
                    var errorElement = document.createElement("ul");
                    const errorList = document.createElement("li");

                    errorElement.className = "small_text";

                    errorList.appendChild(document.createTextNode(err.message));
                    errorElement.appendChild(errorList);
                }

                /// Re-throw to trickle down to the debugger.
                //throw err;
            }

            tagElement.appendChild(document.createTextNode(resultText));
            if (errorElement != null)
            {
                tagElement.appendChild(errorElement);
            }
            resultsElement.appendChild(tagElement);

            // Make the result tag clickable: when you click it, it expands to show a list of all
            // the individual tests performed. When you click it again, it hides the list.
            const list = unit_tester.testList.slice(0); // Get a closure copy of the test list.
            const originalHeight = tagElement.offsetHeight;
            let expandTag = false;
            const clicker = function()
            {
                expandTag = !expandTag;
                if (expandTag)
                {
                    // Create a list of all the tests performed.
                    let listElement = document.createElement("ul");
                    list.forEach((listItem)=>
                    {
                        const testList = document.createElement("li");
                        listElement.className = "small_text";
 
                        testList.appendChild(document.createTextNode(listItem));
                        listElement.appendChild(testList);
                    });

                    // Append the list element, but keep it hidden from view. This lets us first get its
                    // height without disturbing the document layout, and then use it to animate a transition
                    // of the tag's height to accommodate the list.
                    listElement.style.display = "block";
                    listElement.style.visibility = "hidden";
                    listElement.style.position = "absolute";
                    tagElement.appendChild(listElement);

                    // Resize the tag (this'll trigger a transition), and unhide the list about once
                    // the transition is finished.
                    tagElement.style.height = (listElement.clientHeight + tagElement.clientHeight).toString() + "px";
                    setTimeout(()=>
                               {
                                   listElement.style.visibility = "visible";
                                   listElement.style.visibility = "relative";
                               }, 250);
                }
                else
                {
                    // Collapse the tag and hide the list of tests.
                    tagElement.innerHTML = unitName; /// FIXME: Don't use innerHTML.
                    setTimeout(()=>{tagElement.style.height = originalHeight;}, 10);
                }
            }

            // Enable the click show/hide functionality only for labels that indicate a passing
            // test. Failed tests automatically expand to show the name of the first test that failed.
            if (tagElement.className === "tag_test_success")
            {
                tagElement.onclick = clicker;
            }
        }

        // Add the row onto the results table. We're done with this unit's tests.
        unit_tester.resultsTable.appendChild(resultsElement);
    },

    // Initialize the HTML table for printing out the results.
    initialize_html_report: function(testName)
    {
        unit_tester.resultsTable.className = "results_table";
        unit_tester.resultsTable.style.display = "none";
        document.body.appendChild(unit_tester.resultsTable);

        // Create convenience functions for manipulating the look of the results table.
        {
            // Add vertical spacing into the table.
            unit_tester.resultsTable.insert_vspacer = function(height = "0px")
            {
                const spacer = document.createElement("td");
                spacer.style.paddingBottom = height;
                
                unit_tester.resultsTable.appendChild(spacer);
            }

            // Add a horizontal line into the table.
            unit_tester.resultsTable.insert_hline = function()
            {
                const spacer = document.createElement("td");
                spacer.style.paddingBottom = "23px";
                spacer.style.borderTop = "1px dashed";
                
                unit_tester.resultsTable.appendChild(spacer);
            }

            // Adds the display name of the totality of the tests at the top of the table.
            unit_tester.resultsTable.insert_header = function(text = "")
            {
                k_assert((text.length > 0), "No header text given.");
                
                const header = document.createElement("tr");
                const data = document.createElement("td");
                const dataText = document.createTextNode(text);
                
                data.className = "large_text";
                data.style.textAlign = "left";

                data.appendChild(dataText);
                header.appendChild(data);
                unit_tester.resultsTable.appendChild(header);

                unit_tester.resultsTable.insert_vspacer("14px")
            }
        }

        unit_tester.resultsTable.insert_header("Unit tests for \"" + testName + "\"");
    },

    finalize_html_report: function()
    {
        unit_tester.resultsTable.insert_vspacer("21px");

        // Add a date stamp at the bottom of the report.
        const row = document.createElement("tr");
        row.className = "date_stamp";
        const data = document.createElement("td");
        data.appendChild(document.createTextNode("Tests completed on " + Date() + "."));
        row.appendChild(data);
        unit_tester.resultsTable.appendChild(row);

        unit_tester.resultsTable.style.display = "inline-table";
    },

    // Call this with a function containing the unit tests you want run.
    run_tests: function(testName = "", tests_f = Function,)
    {
        k_assert((tests_f instanceof Function), "Expected a function containing the unit tests to run.");
        k_assert((testName.length > 0), "Empty test names are discouraged.");

        unit_tester.initialize_html_report(testName);
        unit_tester.verify_tester_functionality();
        tests_f();
        unit_tester.finalize_html_report();
    },
});
