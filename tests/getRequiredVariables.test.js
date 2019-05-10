const { getRequiredVariables } = require('../')

describe('Handlebars template parser to list required variables', () => {
  it('should return an empty array if there are no variables in the template', () => {
    const template = 'some poor variable-less text'
    const requiredVariables = getRequiredVariables(template)
    expect(requiredVariables).toEqual([])
  })

  it('should detect variables in the top level and conditions', () => {
    const template = `
    This is some text and should be ignored, except for the {{foo}} variable.

    {{#if bar}}
      The bar variable should have been detected, as should {{baz}}
    {{/if}}
    
    {{#if qub.property}}
      Nested conditions don't scare that crazy parser {{sob}}
      {{#if madLad}}
        Let's get {{deep}}
      {{/if}}
    {{/if}}

    {{#unless carlos}}
      Everybody loves {{bitconnect}}, although even {{my.wife}} doesn't {{believe.in.me}} :(
    {{/unless}}

    Text after conditions and i'm not even {{scared}}
    `

    const requiredVariables = getRequiredVariables(template)
    const expectedVariables = [
      'bar',
      'baz',
      'believe.in.me',
      'bitconnect',
      'carlos',
      'deep',
      'foo',
      'madLad',
      'my.wife',
      'qub.property',
      'scared',
      'sob',
    ]
    expect(requiredVariables.sort()).toEqual(expectedVariables)
  })

  it('should handle if...else if constructs', () => {
    const template = `
    {{#if foo}}
      display {{something}}
    {{else if bar}}
      display {{otherthing}}
    {{else}}
      display {{nothing}}
    {{/if}}
    `

    const requiredVariables = getRequiredVariables(template)
    const expectedVariables = [
      'bar',
      'foo',
      'nothing',
      'otherthing',
      'something',
    ]
    expect(requiredVariables.sort()).toEqual(expectedVariables)
  })

  it('should handle each...else if constructs', () => {
    const template = `
    {{#each foo}}
      display {{this}}
    {{else}}
      display {{otherthing}}
    {{/each}}
    `

    const [elseVariable] = getRequiredVariables(template)
    expect(elseVariable).toBe('otherthing')
  })

  it('should detect variables in `each` loops', () => {
    const template = `
    This is some text and should be ignored, except for the {{fumanchu}} variable.

    {{#each foo}}
      For each element in 'foo' array, we should find :
        * a {{bar}}
        * a {{baz}}
        * an array of qubs :
        {{#each qub}}
          * each qub also has a {{pogo}}
          * not to be confused with its {{fnord}}
        {{/each}}
    {{/each}}`

    const requiredVariables = getRequiredVariables(template)
    // expected structure of requiredVariables :
    // [
    //   "fumanchu",
    //   {
    //     loopVariable: "foo",
    //     properties: ["bar", "baz", {
    //       loopVariable: "qub",
    //       properties: ["pogo", "fnord"]
    //     }]
    //   }
    // ]
    const [fumanchu, foo] = requiredVariables
    expect(fumanchu).toBe('fumanchu')
    const { loopVariable: fooVariable, properties: fooProperties } = foo
    const [bar, baz, qub] = fooProperties
    const { loopVariable: qubVariable, properties: qubProperties } = qub
    expect(fooVariable).toBe('foo')
    expect(bar).toBe('bar')
    expect(baz).toBe('baz')
    expect(qubVariable).toBe('qub')
    expect(qubProperties).toEqual(['pogo', 'fnord'])
  })

  it('should treat loops over a simple string array as a loopVariable with no properties', () => {
    const template = `
    {{#each foo}}
      <p>{{this}}</p>
    {{/each}}
    `
    const [foo] = getRequiredVariables(template)

    expect(foo.loopVariable).toBe('foo')
    expect(foo.properties.length).toBe(0)
  })
})
