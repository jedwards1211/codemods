/* global atom */

const j = require("jscodeshift").withParser("babylon")
const requireGlob = require("require-glob")
const { map } = require("lodash")

const morpherUtils = require("./morpher-utils")
const {
  identifierFromFile,
  pathInRange,
  activeBuffer,
  activeFile,
  jscodeshiftTransform
} = morpherUtils

module.exports = function () {
  const path = require("path")
  const modules = require("fs").readdirSync(__dirname)
  modules.forEach(name => {
    const file = path.resolve(__dirname, name)
    if (file !== __filename) delete require.cache[file]
  })
  return [
    {
      name: "replace",
      description: "find and replace while preserving case",
      variables: {
        find: { label: "Find" },
        replace: { label: "Replace" }
      },
      onSelected: ({
        text,
        selectedText,
        variableValues: { find, replace }
      }) => {
        const replaceAll = require("preserve-case").all
        if (selectedText.trim())
          return { selectedText: replaceAll(selectedText, find, replace) }
        return { text: replaceAll(text, find, replace) }
      }
    },
    {
      name: "regexp-replace",
      description: "find with regexp and replace while preserving case",
      variables: {
        find: { label: "Find" },
        replace: { label: "Replace" }
      },
      onSelected: ({
        text,
        selectedText,
        variableValues: { find, replace }
      }) => {
        find = new RegExp(find)
        const replaceAll = require("preserve-case").all
        if (selectedText.trim())
          return { selectedText: replaceAll(selectedText, find, replace) }
        return { text: replaceAll(text, find, replace) }
      }
    },
    {
      name: "convertLambdaToReturn",
      description:
        "Convert simple lambda functions to block with return statement",
      onSelected: jscodeshiftTransform(({ text, selection, root }) => {
        const lambdas = root
          .find(j.ArrowFunctionExpression)
          .filter(pathInRange(text, selection))
        require("./convertLambdaToReturn")(lambdas)
      })
    },
    {
      name: "temp",
      description: "Temporary",
      variables: {
        firstName: { label: "First Name" },
        lastName: { label: "Last Name" },
        foo: {},
        bar: {},
        baz: {},
        qux: {},
        glorm: {},
        blag: {},
        qlob: {},
        flaog: {},
        lnd98: {}
      },
      onSelected: ({ text, selection }) => {
        return text
      }
    },
    {
      name: "convertLambdaToSimple",
      description:
        "Convert lambda functions with single to return statement to simple",
      onSelected: jscodeshiftTransform(({ text, selection, root }) => {
        const lambdas = root
          .find(j.ArrowFunctionExpression)
          .filter(pathInRange(text, selection))
        require("./convertLambdaToSimple")(lambdas)
      })
    },
    {
      name: "convertLambdaToFunction",
      description: "Convert lambda to a function",
      onSelected: jscodeshiftTransform(({ text, selection, root }) => {
        const lambdas = root
          .find(j.ArrowFunctionExpression)
          .filter(pathInRange(text, selection))
        require("./convertLambdaToFunction")(lambdas)
      })
    },
    {
      name: "reformatObjectExpression",
      description: "Break up object expression into multiple lines",
      onSelected: jscodeshiftTransform(({ text, selection, root }) => {
        const expressions = root
          .find(j.ObjectExpression)
          .filter(pathInRange(text, selection))
        require("./reformat")(expressions)
      })
    },
    {
      name: "reformatObjectTypeAnnotation",
      description: "Break up object type annotation into multiple lines",
      onSelected: jscodeshiftTransform(({ text, selection, root }) => {
        const expressions = root
          .find(j.ObjectTypeAnnotation)
          .filter(pathInRange(text, selection))
        require("./reformat")(expressions)
      })
    },
    {
      name: "convertFSCToComponent",
      description:
        "Convert React Stateless Function Component to a Component class",
      onSelected: jscodeshiftTransform(({ text, selection, root }) => {
        require("./convertFSCToComponent")(root, pathInRange(text, selection))
      })
    },
    {
      name: "removeSurroundingBlock",
      description: "remove surrounding block",
      onSelected: jscodeshiftTransform(({ text, selection, root }) => {
        require("./removeSurroundingBlock")(root, pathInRange(text, selection))
      })
    },
    {
      name: "defun",
      description: "Default Function export",
      onSelected: () => ({
        text: require("./createExportDefaultFunction")(activeFile())
      })
    },
    {
      name: "mui-fsc",
      description: "Functional Stateless Component styled with Material UI",
      onSelected: () => ({
        text: require("./createMaterialUIFSC")(activeFile())
      })
    },
    {
      name: "mui-comp",
      description: "React Component styled with Material UI",
      onSelected: () => ({
        text: require("./createMaterialUIComponent")(activeFile())
      })
    },
    {
      name: "fsc",
      description: "React Functional Stateless component",
      onSelected: () => ({
        text: require("./createFSC")(activeFile())
      })
    },
    {
      name: "ufsc",
      description: "Untyped React Functional Stateless component",
      onSelected: () => ({
        text: require("./createUntypedFSC")(activeFile())
      })
    },
    {
      name: "ufsc-with-styles",
      description: "Untyped React Functional Stateless component with styles",
      onSelected: () => ({
        text: require("./createUntypedFSCWithStyles")(activeFile())
      })
    },
    {
      name: "ifsc",
      description: "inline React Functional Stateless component",
      variables: {
        name: {
          label: "component name",
          defaultValue: identifierFromFile(activeFile())
        }
      },
      onSelected: ({ variableValues: { name } }) => {
        if (!name) throw new Error("You must select a name for the component")
        return {
          selectedText: require("./createInlineFSC")(name, activeFile())
        }
      }
    },
    {
      name: "comp",
      description: "React Component",
      onSelected: () => ({
        text: require("./createReactComponent")(activeFile())
      })
    },
    {
      name: "ucomp",
      description: "Untyped React Component",
      onSelected: () => ({
        text: require("./createUntypedReactComponent")(activeFile())
      })
    },
    {
      name: "mui-ifsc",
      description: "inline Material UI styled functional stateless component",
      variables: {
        name: {
          label: "component name",
          defaultValue: identifierFromFile(activeFile())
        }
      },
      onSelected: ({ text, selection, variableValues: { name } }) => {
        if (!name) throw new Error("You must select a name for the component")
        const position = activeBuffer().characterIndexForPosition(
          selection.start
        )
        return {
          text: require("./addInlineMaterialUIFSC")({
            code: text,
            file: activeFile(),
            name,
            position
          })
        }
      }
    },
    {
      name: "apollo-fsc",
      description: "create apollo query functional stateless component",
      variables: {
        name: {
          label: "component name",
          defaultValue: identifierFromFile(activeFile())
        }
      },
      onSelected: ({ text, variableValues: { name } }) => {
        if (!name) throw new Error("You must select a name for the component")
        return {
          text: require("./createApolloContainer")({
            file: activeFile(),
            name
          })
        }
      }
    },
    {
      name: "apollo-ifsc",
      description: "create inline apollo query functional stateless component",
      variables: {
        name: {
          label: "component name",
          defaultValue: identifierFromFile(activeFile())
        }
      },
      onSelected: async ({ text, selection, variableValues: { name } }) => {
        if (!name) throw new Error("You must select a name for the component")
        return {
          text: await require("./createInlineApolloContainer")({
            file: activeFile(),
            name,
            position: activeBuffer().characterIndexForPosition(selection.start)
          })
        }
      }
    },
    {
      name: "convertStringPropToTemplate",
      description: "convert a JSX string prop to a template literal",
      onSelected: jscodeshiftTransform(({ text, selection, root }) => {
        require("./convertStringPropToTemplate")(
          root,
          pathInRange(text, selection)
        )
      })
    },
    {
      name: "sequelize-model",
      description: "create a Sequelize model",
      variables: {
        name: {
          label: "Name",
          defaultValue: identifierFromFile(activeFile())
        },
        initAttributes: {
          label: "InitAttributes (one per line, ending with ;)",
          defaultValue: "",
          multiline: true
        },
        attributes: {
          label: "Attributes (one per line, ending with ;)",
          defaultValue: `id: number;
createdAt: Date;
updatedAt: Date;`,
          multiline: true
        }
      },
      onSelected: ({ variableValues }) => ({
        text: require("./createSequelizeModel")(variableValues)
      })
    },
    {
      name: "sequelize-join-model",
      description: "create a Sequelize join model",
      variables: {
        name: {
          label: "Name",
          defaultValue: identifierFromFile(activeFile())
        },
        initAttributes: {
          label: "InitAttributes (one per line, ending with ;)",
          defaultValue: "",
          multiline: true
        },
        throughInitAttributes: {
          label: "ThroughInitAttributes (one per line, ending with ;)",
          defaultValue: "",
          multiline: true
        },
        attributes: {
          label: "Attributes (one per line, ending with ;)",
          defaultValue: `id: number;
createdAt: Date;
updatedAt: Date;`,
          multiline: true
        }
      },
      onSelected: ({ variableValues }) => ({
        text: require("./createSequelizeJoinModel")(variableValues)
      })
    },
    {
      name: "ienum",
      description: "add inline enum",
      onSelected: ({ selectedText }) => ({
        selectedText: require("./addEnum")(
          selectedText.trim() || null,
          activeFile()
        )
      })
    },
    {
      name: "enum",
      description: "create enum file",
      variables: ({ selectedText }) => ({
        name: {
          label: "Name",
          defaultValue:
            selectedText || require("./identifierFromFile")(activeFile())
        },
        values: {
          label: "Values (one per line, format: identifier [= value])",
          multiline: true
        }
      }),
      onSelected: ({ selectedText, variableValues }) => ({
        selectedText: require("./createEnumFile")(
          variableValues.name,
          variableValues.values
        )
      })
    },
    {
      name: "api-method",
      description: "add API method",
      variables: {
        name: { label: "Name", defaultValue: identifierFromFile(activeFile()) },
        options: { label: "Input Options", multiline: true },
        returnType: { label: "Return Type" },
        result: { label: "Result Properties (if no Return Type)", multiline: true },
        appContextType: { label: "AppContext type(s)" }
      },
      onSelected: jscodeshiftTransform(
        ({ text, selection, variableValues, root }) => {
          if (!variableValues.name)
            throw new Error("You must select a name for the method")
          const position = activeBuffer().characterIndexForPosition(
            selection.start
          )
          require("./addAPIMethod")(root, position, {...variableValues, file: activeFile()})
        }
      )
    },
    {
      name: "find-one-api-method",
      description: "add findOne API method",
      variables: {
        name: { label: "Name", defaultValue: identifierFromFile(activeFile()) },
        appContextType: { label: "AppContext type(s)" },
      },
      onSelected: jscodeshiftTransform(
        ({ text, selection, variableValues: { name, appContextType }, root }) => {
          if (!name) throw new Error("You must select a name for the method")
          const position = activeBuffer().characterIndexForPosition(
            selection.start
          )
          require("./addFindOneAPIMethod")(root, position, { modelName: name, appContextType, file: activeFile() })
        }
      )
    },
    {
      name: "find-all-api-method",
      description: "add findAll API method",
      variables: {
        name: { label: "Name", defaultValue: identifierFromFile(activeFile()) },
        appContextType: { label: "AppContext type(s)" },
      },
      onSelected: jscodeshiftTransform(
        ({ text, selection, variableValues: { name, appContextType }, root }) => {
          if (!name) throw new Error("You must select a name for the method")
          const position = activeBuffer().characterIndexForPosition(
            selection.start
          )
          require("./addFindAllAPIMethod")(root, position, { modelName: name, appContextType, file: activeFile() })
        }
      )
    },
    {
      name: "belongsTo",
      description: "add sequelize belongsTo association",
      variables: {
        target: { label: "target model (required)" },
        as: { label: "as" },
        primaryKeyType: { label: "primary key type", defaultValue: "number" },
        options: { label: "options", multiline: true }
      },
      onSelected: jscodeshiftTransform(
        ({ text, selection, variableValues, root }) => {
          require("./addBelongsToAssociation")({
            root,
            position: activeBuffer().characterIndexForPosition(selection.start),
            ...variableValues
          })
        }
      )
    },
    {
      name: "belongsToMany",
      description: "add sequelize belongsToMany association",
      variables: {
        target: { label: "target model (required)" },
        through: { label: "through model (required)" },
        as: { label: "as" },
        asSingular: { label: "asSingular" },
        asPlural: { label: "asPlural" },
        primaryKeyType: { label: "primary key type", defaultValue: "number" },
        options: { label: "options", multiline: true }
      },
      onSelected: jscodeshiftTransform(
        ({ text, selection, variableValues, root }) => {
          require("./addBelongsToManyAssociation")({
            root,
            position: activeBuffer().characterIndexForPosition(selection.start),
            ...variableValues
          })
        }
      )
    },
    {
      name: "hasMany",
      description: "add sequelize hasMany association",
      variables: {
        target: { label: "target model (required)" },
        as: { label: "as" },
        asSingular: { label: "asSingular" },
        asPlural: { label: "asPlural" },
        primaryKeyType: { label: "primary key type", defaultValue: "number" },
        options: { label: "options", multiline: true }
      },
      onSelected: jscodeshiftTransform(
        ({ text, selection, variableValues, root }) => {
          require("./addHasManyAssociation")({
            root,
            position: activeBuffer().characterIndexForPosition(selection.start),
            ...variableValues
          })
        }
      )
    },
    {
      name: "hasOne",
      description: "add sequelize hasOne association",
      variables: {
        target: { label: "target model (required)" },
        as: { label: "as" },
        primaryKeyType: { label: "primary key type", defaultValue: "number" },
        options: { label: "options", multiline: true }
      },
      onSelected: jscodeshiftTransform(
        ({ text, selection, variableValues, root }) => {
          require("./addHasOneAssociation")({
            root,
            position: activeBuffer().characterIndexForPosition(selection.start),
            ...variableValues
          })
        }
      )
    },
    {
      name: "add-graphql-flow-types",
      description: "add generated flow types for GraphQL queries",
      variables: {
        schemaFile: { label: "Schema File (relative to project root)" },
        server: { label: "GraphQL Server URL" }
      },
      onSelected: async ({ text, variableValues }) => {
        let { schemaFile, server } = variableValues
        if (schemaFile) {
          schemaFile = require("path").resolve(
            require("find-root")(activeFile()),
            schemaFile
          )
        }
        const root = await require("./addGraphQLFlowTypes")({
          file: activeFile(),
          schemaFile,
          server
        })
        return { text: root.toSource() }
      }
    },
    {
      name: "wrapWithChildFunctionComponent",
      description: "wrap JSX Element with child function component",
      variables: {
        name: { label: "Wrapper Component Name" },
        props: { label: "child function arguments" }
      },
      onSelected: jscodeshiftTransform(
        ({ text, selection, variableValues: { name, props }, root }) => {
          require("./wrapWithChildFunctionComponent")({
            root,
            filter: pathInRange(text, selection),
            name,
            props
          })
        }
      )
    },
    {
      name: "wrapWithJSXElement",
      description: "wrap JSX Element with another element",
      variables: {
        name: { label: "Wrapper Component Name" }
      },
      onSelected: jscodeshiftTransform(
        ({ text, selection, variableValues: { name }, root }) => {
          require("./wrapWithJSXElement")({
            root,
            filter: pathInRange(text, selection),
            name
          })
        }
      )
    },
    {
      name: "unwrapJSXElement",
      description: "replace a JSX Element with its children",
      onSelected: jscodeshiftTransform(({ text, selection, root }) => {
        require("./unwrapJSXElement")({
          root,
          filter: pathInRange(text, selection)
        })
      })
    },
    {
      name: "fix-apollo-update-fn",
      description: "TEMP, fix apollo update function",
      onSelected: jscodeshiftTransform(({ text, selection, root }) => {
        require("./fixApolloUpdateFn")({
          root,
          file: activeFile(),
          filter: pathInRange(text, selection)
        })
      })
    },
    {
      name: "autoimports",
      description: "automatically add imports",
      onSelected: async ({ text, selection }) => {
        const root = await require("./autoimports")({
          file: activeFile(),
          text
        })
        return { text: root.toSource() }
      }
    },
    {
      name: "action-creator",
      description: "Redux action creator",
      variables: {
        name: { label: "action name" }
      },
      onSelected: ({ variableValues: { name } }) => {
        if (!name) throw new Error("You must select a name for the action")
        return { selectedText: require("./createActionCreator")(name) }
      }
    },
    ...map(requireGlob.sync("./morpher-transforms/*.js"), (props, name) => {
      if (typeof props === 'function') props = props(morpherUtils)
      return {
        name,
        onSelected: props.transformAst
          ? jscodeshiftTransform(props.transformAst)
          : props.onSelected,
        ...props
      }
    })
  ]
}
