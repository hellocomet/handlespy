const handlebars = require('handlebars')

// These handlebars expressions denote conditional blocks
const conditionStatements = ['if', 'unless']

/**
 * Filters top level variables from a handlebars AST
 * And returns an array of their names
 * @param {Object[]} ast
 * @returns {String[]}
 */
const getTopLevelVariables = ast => ast
  .filter(statement => statement.type === 'MustacheStatement' && statement.path.type === 'PathExpression')
  .map(statement => statement.path.original)

/**
 * Filters top level conditional blocks from a handlebars AST
 * @param {Object[]} ast
 * @returns {Object[]}
 */
const getConditionalBlocks = ast => ast
  .filter(statement => statement.type === 'BlockStatement' && conditionStatements.includes(statement.path.original))

const getEachBlocks = ast => ast
  .filter(statement => statement.type === 'BlockStatement' && statement.path.original === 'each')

/**
 * Recursively traverses a handlebars AST and returns
 * a list of all required variables
 * @param {Object} program
 * @returns {String[]}
 */
function traverseAst(program) {
  if (program) {
    const { body } = program
    // Handle top level variables
    const topLevelVariables = getTopLevelVariables(body)
    // Recursively handle conditions
    const conditions = getConditionalBlocks(body)
    const conditionVariables = conditions.map(statement => statement.params[0].original)
    const nestedConditionVariables = []
    conditions.forEach((statement) => {
      nestedConditionVariables.push(...traverseAst(statement.program))
      nestedConditionVariables.push(...traverseAst(statement.inverse))
    })
    // Recursively handle loops
    const loopBlocks = getEachBlocks(body)
    const loopVariables = []
    loopBlocks.forEach((statement) => {
      const loopVariable = statement.params[0].original
      const thisLoopNestedVariables = traverseAst(statement.program)
      nestedConditionVariables.push(...traverseAst(statement.inverse))
      // For each looped variable, we return an object containing :
      // { loopVariable: 'variableName', properties: ['array', 'of', 'required', 'properties'] }
      // if `loopVariable` is a simple array of strings, properties will be empty
      loopVariables.push({
        loopVariable,
        properties: thisLoopNestedVariables.filter(variable => variable !== 'this'),
      })
    })

    // Deduplicates using a Set
    const deduped = new Set([
      ...topLevelVariables,
      ...conditionVariables,
      ...nestedConditionVariables,
      ...loopVariables,
    ])
    // Spread back to an array
    return [...deduped]
  }
  return []
}

/**
 * Detect all variables needed to render the steps of a conversation
 * @param {Object[]} markdown
 * @returns {String[]}
 */
function getRequiredVariables(markdown) {
  const ast = handlebars.parse(markdown)
  return traverseAst(ast)
}

module.exports = getRequiredVariables
