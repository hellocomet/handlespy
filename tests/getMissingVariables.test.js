const { getMissingVariables } = require('../')

describe('Checking a payload for required variables', () => {
  it('should accept a handlebars template as spec, and pass it through getRequiredVariables', () => {
    const template = 'A simple template with variables {{oneVariable}} and {{anotherVariable}}'
    const correctPayload = {
      oneVariable: 'foo',
      anotherVariable: 'bar',
    }
    const incorrectPayload = {
      oneVariable: 'foo',
    }

    expect(getMissingVariables(correctPayload, template)).toEqual([])
    expect(getMissingVariables(incorrectPayload, template)).toEqual(['anotherVariable'])
  })

  it('should check for top level variables', () => {
    const requiredVariables = [
      'foo',
      'bar',
      'baz.qub',
      'baz.fnord.foo',
    ]
    const correctPayload = {
      foo: 'Test',
      bar: null,
      baz: {
        qub: 0,
        fnord: { foo: true },
      },
    }
    const incorrectPayload = {
      foo: 'Test',
      bar: null,
      baz: { qub: 0 },
    }

    expect(getMissingVariables(correctPayload, requiredVariables)).toEqual([])
    expect(getMissingVariables(incorrectPayload, requiredVariables)).toEqual(['baz.fnord.foo'])
  })

  it('should check in arrays for variables required in loops', () => {
    const requiredVariables = [
      'foo',
      {
        loopVariable: 'bar',
        properties: [
          'baz',
          'qub',
          {
            loopVariable: 'fnord',
            properties: ['kaa', 'splosh'],
          },
        ],
      },
      'carlos',
    ]

    const missingVariablesPayload = {
      foo: 'Test',
      bar: [{ baz: true, qub: 'Yolo' }],
    }

    const notArrayPayload = {
      foo: 'Test',
      bar: [{
        baz: true,
        qub: 'This one has a valid fnord',
        fnord: [{ kaa: 'melott', splosh: 'splish' }],
      }, {
        baz: true,
        qub: 'This one has an invalid fnord',
        fnord: 'not an array',
      }],
    }

    const correctPayload = {
      foo: 'Test',
      bar: [{
        baz: true,
        qub: 'Yolo',
        fnord: [{ kaa: 'melott', splosh: 'splish' }],
      }],
      carlos: '🙏',
    }

    expect(getMissingVariables(missingVariablesPayload, requiredVariables)).toEqual(['bar[0].fnord', 'carlos'])
    expect(getMissingVariables(notArrayPayload, requiredVariables)).toEqual(['bar[1].fnord[]', 'carlos'])
    expect(getMissingVariables(correctPayload, requiredVariables)).toEqual([])
  })

  it('should not be tripped by simple array loops with no properties', () => {
    const requiredVariables = [
      'foo',
      {
        loopVariable: 'bar',
        properties: [],
      },
    ]

    const missingVariablePayload = { foo: 1 }

    const notArrayPayload = { foo: 1, bar: 'not an array' }

    const correctPayload = {
      foo: 2,
      bar: ['simple', 'array', 'with', 'strings'],
    }

    expect(getMissingVariables(missingVariablePayload, requiredVariables)).toEqual(['bar'])
    expect(getMissingVariables(notArrayPayload, requiredVariables)).toEqual(['bar[]'])
    expect(getMissingVariables(correctPayload, requiredVariables)).toEqual([])
  })
})
