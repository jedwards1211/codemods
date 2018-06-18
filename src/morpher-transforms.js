/* global atom */

const { TextBuffer } = require("atom")
const { upperFirst } = require('lodash')
const pathsToTransformFilter = require('./pathsToTransformFilter')

function processSelected(handler) {
  return (input) => {
    const {text, selection} = input
    const buffer = new TextBuffer({ text })
    const selectedText = buffer.getTextInRange(selection)
    const result = handler(Object.assign(input, {selectedText}))
    if (result.selectedText) {
      buffer.setTextInRange(selection, result.selectedText)
      result.text = buffer.getText()
    }
    return result
  }
}

function getCharacterIndexRange(text, selection) {
  if (!(text instanceof TextBuffer)) text = new TextBuffer({text})
  return {
    start: text.characterIndexForPosition(selection.start),
    end: text.characterIndexForPosition(selection.end),
  }
}

function pathInRange(text, selection) {
  const {start, end} = getCharacterIndexRange(text, selection)
  return pathsToTransformFilter(start, end)
}

function activeBuffer() {
  const activeEditor = atom.workspace.getActiveTextEditor()
  if (!activeEditor) throw new Error("There's no active editor to perform a transform on")
  return activeEditor.getBuffer()
}

function activeFile() {
  return activeBuffer().file.path
}

function sequelizeAssociationTransform(name) {
  return {
    name,
    description: `Add Sequelize ${name} Association`,
    onSelected({text, selection}) {
      const buffer = new TextBuffer({ text })
      const selectedText = buffer.getTextInRange(selection)

      const options = eval(`({${selectedText}})`)
      options.position = buffer.characterIndexForPosition(selection.start)

      buffer.setTextInRange(selection, '')

      const addBelongsToAssociation = require(`./add${upperFirst(name)}Association`)
      const j = require('jscodeshift').withParser('babylon')
      options.root = j(buffer.getText())

      addBelongsToAssociation(options)

      return {text: options.root.toSource()}
    }
  }
}

module.exports = function () {
  const path = require('path')
  const modules = require('fs').readdirSync(__dirname)
  modules.forEach(name => {
    const file = path.resolve(__dirname, name)
    if (file !== __filename) delete require.cache[file]
  })
  return [
    {
      name: 'convertLambdaToReturn',
      description: "Convert simple lambda functions to block with return statement",
      onSelected: ({text, selection}) => {
        const j = require('jscodeshift').withParser('babylon')
        const root = j(text)
        const lambdas = root.find(j.ArrowFunctionExpression).filter(
          pathInRange(text, selection)
        )
        require('./convertLambdaToReturn')(lambdas)
        return {text: root.toSource()}
      }
    },
    {
      name: 'convertLambdaToSimple',
      description: "Convert lambda functions with single to return statement to simple",
      onSelected: ({text, selection}) => {
        const j = require('jscodeshift').withParser('babylon')
        const root = j(text)
        const lambdas = root.find(j.ArrowFunctionExpression).filter(
          pathInRange(text, selection)
        )
        require('./convertLambdaToSimple')(lambdas)
        return {text: root.toSource()}
      }
    },
    {
      name: 'convertLambdaToFunction',
      description: "Convert lambda to a function",
      onSelected: ({text, selection}) => {
        const j = require('jscodeshift').withParser('babylon')
        const root = j(text)
        const lambdas = root.find(j.ArrowFunctionExpression).filter(
          pathInRange(text, selection)
        )
        require('./convertLambdaToFunction')(lambdas)
        return {text: root.toSource()}
      }
    },
    {
      name: 'convertFSCToComponent',
      description: "Convert React Stateless Function Component to a Component class",
      onSelected: ({text, selection}) => {
        const j = require('jscodeshift').withParser('babylon')
        const root = j(text)
        require('./convertFSCToComponent')(
          root, pathInRange(text, selection)
        )
        return {text: root.toSource()}
      }
    },
    {
      name: 'defun',
      description: 'Default Function export',
      onSelected: () => ({
        text: require('./createExportDefaultFunction')(activeFile()),
      })
    },
    {
      name: 'mui-fsc',
      description: 'Functional Stateless Component styled with Material UI',
      onSelected: () => ({
        text: require('./createMaterialUIFSC')(activeFile()),
      })
    },
    {
      name: 'mui-comp',
      description: 'React Component styled with Material UI',
      onSelected: () => ({
        text: require('./createMaterialUIComponent')(activeFile()),
      })
    },
    {
      name: 'fsc',
      description: 'React Functional Stateless component',
      onSelected: () => ({
        text: require('./createFSC')(activeFile()),
      })
    },
    {
      name: 'ifsc',
      description: 'inline React Functional Stateless component',
      onSelected: processSelected(({selectedText}) => ({
        selectedText: require('./createInlineFSC')(selectedText.trim() || null, activeFile()),
      })),
    },
    {
      name: 'comp',
      description: 'React Component',
      onSelected: () => ({
        text: require('./createReactComponent')(activeFile()),
      })
    },
    {
      name: 'mui-ifsc',
      description: 'inline Material UI styled functional stateless component',
      onSelected: ({text, selection}) => {
        const buffer = new TextBuffer({ text })
        const name = buffer.getTextInRange(selection).trim()
        if (!name) throw new Error('You must select a name for the component')
        const position = buffer.characterIndexForPosition(selection.start)
        buffer.setTextInRange(selection, '')
        return {
          text: require('./addInlineMaterialUIFSC')({
            code: buffer.getText(),
            file: activeFile(),
            name,
            position,
          })
        }
      }
    },
    {
      name: 'addStylesToComponent',
      description: 'add Material UI styles to a component',
      onSelected: ({text, selection}) => {
        const j = require('jscodeshift').withParser('babylon')
        const root = j(text)
        require('./addStylesToComponent')(
          root, activeFile(), pathInRange(text, selection)
        )
        return {text: root.toSource()}
      }
    },
    {
      name: 'sequelize-model',
      description: 'create a Sequelize model',
      onSelected: () => ({
        text: require('./createSequelizeModel')(activeFile()),
      })
    },
    {
      name: 'sequelize-join-model',
      description: 'create a Sequelize join model',
      onSelected: () => ({
        text: require('./createSequelizeJoinModel')(activeFile()),
      })
    },
    {
      name: 'enum',
      description: 'add enum',
      onSelected: processSelected(({selectedText}) => ({
        selectedText: require('./addEnum')(selectedText.trim() || null, activeFile()),
      })),
    },
    {
      name: 'api-method',
      description: 'add API method',
      onSelected: ({text, selection}) => {
        const buffer = new TextBuffer({ text })
        const name = buffer.getTextInRange(selection).trim()
        if (!name) throw new Error('You must select a name for the method')
        const position = buffer.characterIndexForPosition(selection.start)
        buffer.setTextInRange(selection, '')
        const j = require('jscodeshift').withParser('babylon')
        const root = j(buffer.getText())
        require('./addAPIMethod')(root, position, name)
        return {
          text: root.toSource(),
        }
      },
    },
    ...[
      'belongsTo',
      'belongsToMany',
      'hasMany',
      'hasOne',
    ].map(sequelizeAssociationTransform),
  ]
}
