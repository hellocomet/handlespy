# Handlespy

Handlespy is a simple Node.js library to inspect Handlebars templates for required variables. It also provides a helper to verify that a payload contains all required variables.

## Installation

```sh
npm install handlespy
# or
yarn add handlespy
```

## Usage

```javascript
const { getRequiredVariables, getMissingVariables } = require('handlespy')

const template = `
A simple handlebar template containing a variable ({{someVariable}}) and a loop :

{{#each someLoop}}
- {{someProperty}}
{{/each}}
`

const requiredVariables = getRequiredVariables(template)
/*
[
  'someVariable',
  { loopVariable: 'someLoop', properties: [ 'someProperty' ] }
]
*/

const completePayload = {
  someVariable: 'Test',
  someLoop: [{ someProperty: 'Another test' }]
}

const incompletePayload = {
  // missing someVariable,
  someLoop: [
    { someProperty: 'Another test' },
    { unsupportedProperty: 'Final test' }, // someLoop[1] is missing the required someProperty
  ]
}

const test1 = getMissingVariables(completePayload, requiredVariables)
// []
const test2 = getMissingVariables(incompletePayload, requiredVariables)
/*
[ 'someVariable', 'someLoop[1].someProperty' ]
*/
```

## API

### getRequiredVariables

- expects : (String) A handlebars template
- returns : (Array) The required variables

Each item in the returned array can either be a string (denoting a simple variable), or an object (denoting an `each` loop) containing the following :

- loopVariable (String) : the name of the variable
- properties (Array) : the required properties on the looped variable
  - *loops can be nested, so `properties` can contain another object with `loopVariable` and `properties`*
  - *if only `this` is used in the loop, `properties` is an empty array*

### getMissingVariables

- expects :
  - (Object) The payload to check
  - One of the following :
    - (String) A handlebars template
    - (Array) or a required variables specification as returned by `getRequiredVariables`
- returns : (Array) The missing variables

Each item in the returned array is a string, which can be of either of the following formats :

- `missingVariable` : variable is missing in the payload
- `missingArray[]` : a variable, which is used in an `each` loop, is present in the payload but isn't an array
- `item[2].missingProperty` : an item in an array is missing a required properties

## Contributing

If you find any bug or missing functionality in handlespy, don't hesitate to create an issue ! If you can provide a PR with a failing test, this would help greatly in solving the issue :)

***

_Made with 💖 @ [comet](https://comet.co)_
