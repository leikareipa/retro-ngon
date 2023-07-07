/*
 * 2023 Tarpeeksi Hyvae Soft
 *
 * Software: Retro n-gon renderer
 * 
 * Sample usage:
 * 
 *   const schema = {
 *     where: "in arguments passed to color()",
 *     properties: {                    // The properties to be validated.
 *       "red": ["number"],             // red is required to be of type number.
 *       "green": {
 *         optional: true,              // green is allowed to not exist.
 *         type: ["number", "string"]   // green, if it exists, is required to be of type number or string.
 *       },
 *       "blue": {
 *         subschema: {                 // blue is an object.
 *           "x": ["number"],           // blue.x is required to be of type number.
 *           "y": [["string"]],         // blue.y is required to be an array whose elements are of type string.
 *         }
 *       },
 *     },
 *   }
 * 
 *   validate_object({red: 255, blue: 109}, schema);
 *
 */

import {assert as Assert} from "./util.js";

// Compares the properties of the specified object against the given schema.
//
// Throws with a descriptive error message if the validation fails.
//
// Note: Call this function using optional chaining - "validate_object?.()" - so
// it doesn't get invoked in production builds.
export const validate_object = IS_PRODUCTION_BUILD? undefined
: function(object, schema, schemaProperties = schema.properties, propertyChain = "")
{
    Assert?.(
        (object && (typeof object === "object")),
        "Schemas can't be evaluated for non-object types."
    );

    Assert?.(
        ((schema && (typeof schema === "object")) &&
         (schemaProperties && (typeof schemaProperties === "object")) &&
         (typeof propertyChain === "string")),
        "Malformed schema."
    );

    // Require all non-optional properties to be present in the object.
    {
        const objectKeys = Object.keys(object);
        const missingProperties = (
            Object.keys(schemaProperties)
            .filter(k=>!objectKeys.includes(k))
            .filter(k=>!schemaProperties[k].optional)
        );

        if (missingProperties.length)
        {
            throw new Error(`Missing '${missingProperties.map(p=>(propertyChain + p)).join("', '")}' ${schema.where}`);
        }
    }

    for (const [objectKey, objectValue] of Object.entries(object))
    {
        if (!schemaProperties.hasOwnProperty(objectKey))
        {
            if (schema.allowAdditionalProperties)
            {
                continue;
            }
            else
            {
                throw new Error(`Unsupported property '${propertyChain + objectKey}' ${schema.where}`);
            }
        }

        const schemaAcceptedTypes = (schemaProperties[objectKey]?.type || schemaProperties[objectKey]);
        const objectValueType = type_of_value(objectValue);

        // The schema either requires a specific value or comes with a function that evaluates the value.
        if (schemaProperties[objectKey].hasOwnProperty?.("value"))
        {
            const valueEvaluator = schemaProperties[objectKey].value;

            switch (typeof valueEvaluator)
            {
                case "function":
                {
                    const ret = valueEvaluator(objectValue);

                    if (typeof ret === "string")
                    {
                        throw new Error(ret);
                    }

                    break;
                }
                default:
                {
                    if (objectValue !== valueEvaluator)
                    {
                        throw new Error(`The property '${propertyChain + objectKey}' ${schema.where} doesn't evaluate to "${schemaProperties[objectKey].value}"`);
                    }

                    break;
                }
            }
        }
        // The schema is recursive to evaluate a sub-object.
        else if (schemaProperties[objectKey].hasOwnProperty?.("subschema"))
        {
            if (objectValueType.toLowerCase() !== "object")
            {
                throw new TypeError(`The property '${propertyChain + objectKey}' ${schema.where} must be of type Object`);
            }

            validate_object(objectValue, schema, schemaProperties[objectKey].subschema, `${propertyChain}${objectKey}.`);
        }
        // The schema lists an array of one or more supported types.
        else if (Array.isArray(schemaAcceptedTypes))
        {
            // The value to be validated is an array, so we validate the types of its
            // elements.
            if (objectValueType === "array")
            {
                const arrayTypes = schemaAcceptedTypes.filter(el=>Array.isArray(el));
                let allElementsMatchSchema = false;

                for (let arrayType of arrayTypes)
                {
                    arrayType = arrayType.map(e=>e.toLowerCase());
                    allElementsMatchSchema = objectValue.every(el=>(arrayType.includes(type_of_value(el).toLowerCase())));
                    
                    if (allElementsMatchSchema)
                    {
                        break;
                    }
                }

                if (!allElementsMatchSchema)
                {
                    throw new TypeError(`The array '${propertyChain + objectKey}' ${schema.where} contains one or more unsupported element types`);
                }
            }
            else
            {
                const stringTypes = schemaAcceptedTypes.filter(v=>(typeof v === "string")).map(e=>e.toLowerCase());

                if (!stringTypes.includes(objectValueType.toLowerCase()))
                {
                    throw new TypeError(`The property '${propertyChain + objectKey}' ${schema.where} is of unsupported type ${objectValueType}`);
                }
            }
        }
    }

    // Returns a string representation of the type of the given value,
    // e.g. "Object", "String", "HTMLCanvasElement".
    function type_of_value(value)
    {
        return (
            (value === null)? "null"
            : Array.isArray(value)? "array"
            : (typeof value?.$constructor === "string")? value.$constructor
            : (typeof value?.constructor === "function")? value.constructor.name
            : typeof value
        );
    }
}
