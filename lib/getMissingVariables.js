const { isUndefined, isString, isArray, get } = require('lodash')
const getRequiredVariables = require('./getRequiredVariables')

/**
 * Recursively checks a payload to see if it contains all the required variables
 * Returns an array of missing keys :
 * [
 *   'missingVariable',         // variable is missing in payload
 *   'missingArray[]',          // variable is used in an `each` loop but isn't an array
 *   'item[2].missingProperty', // an item in an array doesn't have the required properties
 * ]
 * @param {Object}            payload - the payload you want to check
 * @param {String[]|Object[]} spec    - the handlebars template, or a required variables spec as returned by `getRequiredVariables`
 * @returns {String[]}
 */
function getMissingVariables(payload, spec) {
  const missingKeys = []
  const requiredVariables = isArray(spec)
    ? spec
    : getRequiredVariables(spec)
  requiredVariables.forEach((variable) => {
    // If variable is a string, simply check that a variable with this name exists in payload
    if (isString(variable)) {
      if (isUndefined(get(payload, variable))) {
        missingKeys.push(variable)
      }
      return
    }
    // Variable is an object, specifying an array that will be looped with `each`
    const { loopVariable, properties } = variable
    const payloadArray = get(payload, loopVariable)
    // Check that the variable exists and is an array
    if (isUndefined(payloadArray)) {
      missingKeys.push(loopVariable)
      return
    }
    if (!isArray(payloadArray)) {
      missingKeys.push(`${loopVariable}[]`)
      return
    }
    // Recursively check every element in the array
    payloadArray.forEach((el, idx) => {
      const missingInElement = getMissingVariables(el, properties)
      missingKeys.push(...missingInElement.map(elVariable => `${loopVariable}[${idx}].${elVariable}`))
    })
  })
  return missingKeys
}

module.exports = getMissingVariables
