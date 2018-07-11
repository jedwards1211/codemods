/* global atom */

const identifierFromFile = require('./identifierFromFile')
const { TextBuffer } = require("atom")
const pathsToTransformFilter = require('./pathsToTransformFilter')

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

module.exports = function () {
  const path = require('path')
  const modules = require('fs').readdirSync(__dirname)
  modules.forEach(name => {
    const file = path.resolve(__dirname, name)
    if (file !== __filename) delete require.cache[file]
  })
  return [
    {
      name: 'replace',
      description: 'find and replace while preserving case',
      variables: {
        find: {label: 'Find'},
        replace: {label: 'Replace'},
      },
      onSelected: ({text, selectedText, variableValues: {find, replace}}) => {
        const replaceAll = require('preserve-case').all
        if (selectedText.trim()) return {selectedText: replaceAll(selectedText, find, replace)}
        return {text: replaceAll(text, find, replace)}
      }
    },
    {
      name: 'regexp-replace',
      description: 'find with regexp and replace while preserving case',
      variables: {
        find: {label: 'Find'},
        replace: {label: 'Replace'},
      },
      onSelected: ({text, selectedText, variableValues: {find, replace}}) => {
        find = new RegExp(find)
        const replaceAll = require('preserve-case').all
        if (selectedText.trim()) return {selectedText: replaceAll(selectedText, find, replace)}
        return {text: replaceAll(text, find, replace)}
      }
    },
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
      name: 'temp',
      description: "Temporary",
      variables: {
        firstName: {label: 'First Name'},
        lastName: {label: 'Last Name'},
        foo: {},
        bar: {},
        baz: {},
        qux: {},
        glorm: {},
        blag: {},
        qlob: {},
        flaog: {},
        lnd98: {},
      },
      onSelected: ({text, selection}) => {
        return text
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
      name: 'reformatObjectExpression',
      description: "Break up object expression into multiple lines",
      onSelected: ({text, selection}) => {
        const j = require('jscodeshift').withParser('babylon')
        const root = j(text)
        const expressions = root.find(j.ObjectExpression).filter(
          pathInRange(text, selection)
        )
        require('./reformat')(expressions)
        return {text: root.toSource()}
      }
    },
    {
      name: 'reformatObjectTypeAnnotation',
      description: "Break up object type annotation into multiple lines",
      onSelected: ({text, selection}) => {
        const j = require('jscodeshift').withParser('babylon')
        const root = j(text)
        const expressions = root.find(j.ObjectTypeAnnotation).filter(
          pathInRange(text, selection)
        )
        require('./reformat')(expressions)
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
      name: 'removeSurroundingBlock',
      description: "remove surrounding block",
      onSelected: ({text, selection}) => {
        const j = require('jscodeshift').withParser('babylon')
        const root = j(text)
        require('./removeSurroundingBlock')(
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
      variables: {
        name: {label: 'component name', defaultValue: identifierFromFile(activeFile())},
      },
      onSelected: ({variableValues: {name}}) => {
        if (!name) throw new Error('You must select a name for the component')
        return {selectedText: require('./createInlineFSC')(name, activeFile())}
      },
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
      variables: {
        name: {label: 'component name', defaultValue: identifierFromFile(activeFile())},
      },
      onSelected: ({text, selection, variableValues: {name}}) => {
        if (!name) throw new Error('You must select a name for the component')
        const position = activeBuffer().characterIndexForPosition(selection.start)
        return {
          text: require('./addInlineMaterialUIFSC')({
            code: text,
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
      name: 'convertStringPropToTemplate',
      description: 'convert a JSX string prop to a template literal',
      onSelected: ({text, selection}) => {
        const j = require('jscodeshift').withParser('babylon')
        const root = j(text)
        require('./convertStringPropToTemplate')(
          root, pathInRange(text, selection)
        )
        return {text: root.toSource()}
      }
    },
    {
      name: 'sequelize-model',
      description: 'create a Sequelize model',
      variables: {
        name: {
          label: 'Name',
          defaultValue: identifierFromFile(activeFile()),
        },
        initAttributes: {
          label: 'InitAttributes (one per line, ending with ;)',
          defaultValue: '',
        },
        attributes: {
          label: 'Attributes (one per line, ending with ;)',
          defaultValue: `id: number;
createdAt: Date;
updatedAt: Date;`,
        },
      },
      onSelected: ({variableValues}) => ({
        text: require('./createSequelizeModel')(variableValues),
      })
    },
    {
      name: 'sequelize-join-model',
      description: 'create a Sequelize join model',
      variables: {
        name: {
          label: 'Name',
          defaultValue: identifierFromFile(activeFile()),
        },
        initAttributes: {
          label: 'InitAttributes (one per line, ending with ;)',
          defaultValue: '',
        },
        throughInitAttributes: {
          label: 'ThroughInitAttributes (one per line, ending with ;)',
          defaultValue: '',
        },
        attributes: {
          label: 'Attributes (one per line, ending with ;)',
          defaultValue: `id: number;
createdAt: Date;
updatedAt: Date;`,
        },
      },
      onSelected: ({variableValues}) => ({
        text: require('./createSequelizeJoinModel')(variableValues),
      })
    },
    {
      name: 'ienum',
      description: 'add inline enum',
      onSelected: ({selectedText}) => ({
        selectedText: require('./addEnum')(selectedText.trim() || null, activeFile()),
      }),
    },
    {
      name: 'enum',
      description: 'create enum file',
      variables: ({selectedText}) => ({
        name: {label: 'Name', defaultValue: selectedText || require('./identifierFromFile')(activeFile())},
        values: {label: 'Values (one per line, format: identifier [= value])', multiline: true},
      }),
      onSelected: ({selectedText, variableValues}) => ({
        selectedText: require('./createEnumFile')(
          variableValues.name,
          variableValues.values,
        ),
      }),
    },
    {
      name: 'api-method',
      description: 'add API method',
      variables: {
        name: {label: 'Name', defaultValue: identifierFromFile(activeFile())},
      },
      onSelected: ({text, selection, variableValues: {name}}) => {
        if (!name) throw new Error('You must select a name for the method')
        const position = activeBuffer().characterIndexForPosition(selection.start)
        const j = require('jscodeshift').withParser('babylon')
        const root = j(text)
        require('./addAPIMethod')(root, position, name)
        return {text: root.toSource()}
      },
    },
    {
      name: 'find-one-api-method',
      description: 'add findOne API method',
      variables: {
        name: {label: 'Name', defaultValue: identifierFromFile(activeFile())},
      },
      onSelected: ({text, selection, variableValues: {name}}) => {
        if (!name) throw new Error('You must select a name for the method')
        const position = activeBuffer().characterIndexForPosition(selection.start)
        const j = require('jscodeshift').withParser('babylon')
        const root = j(text)
        require('./addFindOneAPIMethod')(root, position, name)
        return {text: root.toSource()}
      },
    },
    {
      name: 'find-all-api-method',
      description: 'add findAll API method',
      variables: {
        name: {label: 'Name', defaultValue: identifierFromFile(activeFile())},
      },
      onSelected: ({text, selection, variableValues: {name}}) => {
        if (!name) throw new Error('You must select a name for the method')
        const position = activeBuffer().characterIndexForPosition(selection.start)
        const j = require('jscodeshift').withParser('babylon')
        const root = j(text)
        require('./addFindAllAPIMethod')(root, position, name)
        return {text: root.toSource()}
      },
    },
    {
      name: 'belongsTo',
      description: 'add sequelize belongsTo association',
      variables: {
        target: {label: 'target model (required)'},
        as: {label: 'as'},
        primaryKeyType: {label: 'primary key type', defaultValue: 'number'},
        options: {label: 'options', multiline: true},
      },
      onSelected: ({text, selection, variableValues}) => {
        const root = require('jscodeshift').withParser('babylon')(text)
        require('./addBelongsToAssociation')({
          root,
          position: activeBuffer().characterIndexForPosition(selection.start),
          ...variableValues,
        })
        return {text: root.toSource()}
      },
    },
    {
      name: 'belongsToMany',
      description: 'add sequelize belongsToMany association',
      variables: {
        target: {label: 'target model (required)'},
        through: {label: 'through model (required)'},
        as: {label: 'as'},
        asSingular: {label: 'asSingular'},
        asPlural: {label: 'asPlural'},
        primaryKeyType: {label: 'primary key type', defaultValue: 'number'},
        options: {label: 'options', multiline: true},
      },
      onSelected: ({text, selection, variableValues}) => {
        const root = require('jscodeshift').withParser('babylon')(text)
        require('./addBelongsToManyAssociation')({
          root,
          position: activeBuffer().characterIndexForPosition(selection.start),
          ...variableValues,
        })
        return {text: root.toSource()}
      },
    },
    {
      name: 'hasMany',
      description: 'add sequelize hasMany association',
      variables: {
        target: {label: 'target model (required)'},
        as: {label: 'as'},
        asSingular: {label: 'asSingular'},
        asPlural: {label: 'asPlural'},
        primaryKeyType: {label: 'primary key type', defaultValue: 'number'},
        options: {label: 'options', multiline: true},
      },
      onSelected: ({text, selection, variableValues}) => {
        const root = require('jscodeshift').withParser('babylon')(text)
        require('./addHasManyAssociation')({
          root,
          position: activeBuffer().characterIndexForPosition(selection.start),
          ...variableValues,
        })
        return {text: root.toSource()}
      },
    },
    {
      name: 'hasOne',
      description: 'add sequelize hasOne association',
      variables: {
        target: {label: 'target model (required)'},
        as: {label: 'as'},
        primaryKeyType: {label: 'primary key type', defaultValue: 'number'},
        options: {label: 'options', multiline: true},
      },
      onSelected: ({text, selection, variableValues}) => {
        const root = require('jscodeshift').withParser('babylon')(text)
        require('./addHasOneAssociation')({
          root,
          position: activeBuffer().characterIndexForPosition(selection.start),
          ...variableValues,
        })
        return {text: root.toSource()}
      },
    },
  ]
}
