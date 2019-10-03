const addImports = require('jscodeshift-add-imports')
const j = require('jscodeshift').withParser('babylon')
const {statement} = j.template
const {lowerFirst} = require('lodash')

const hasFlowAnnotation = require('./hasFlowAnnotation')
const pathInProject = require('./pathInProject')

function shorthandProperty(key) {
  const prop = j.objectProperty(
    j.identifier(key),
    j.identifier(key)
  )
  prop.shorthand = true
  return prop
}

module.exports = function addStyles(root, filter = () => true, { file }) {
  const flow = hasFlowAnnotation(root)

  const {withStyles} = addImports(root, statement`import { withStyles } from '@material-ui/core/styles'`)
  let Theme
  if (flow) {
    ({Theme} = addImports(root, statement([`import { type Theme } from '${pathInProject(file, './src/universal/theme')}'`])))
  }

  const component = root.find(j.ArrowFunctionExpression).filter(filter).at(0)
  const variableDeclarator = component.closest(j.VariableDeclarator)
  const variableDeclaration = component.closest(j.VariableDeclaration)
  const exportNamedDeclaration = component.closest(j.ExportNamedDeclaration)
  const declaration = exportNamedDeclaration.size()
    ? exportNamedDeclaration
    : variableDeclaration.size()
    ? variableDeclaration
    : null

  if (!variableDeclarator.size()) throw new Error(`failed to find variable declarator`)

  const componentNameNode = variableDeclarator.nodes()[0].id
  const componentName = componentNameNode.name
  const componentNameWithStyles = `${componentName}WithStyles`

  const componentScope = component.paths()[0].scope.lookup(componentName)
  const componentNode = component.nodes()[0]

  const propsParam = componentNode.params[0]
  if (propsParam && propsParam.type === 'ObjectPattern') {
    propsParam.properties.push(shorthandProperty('classes'))
  } else if (propsParam && propsParam.type === 'Identifier') {
    const props = propsParam.name
    const destructuring = component.find(j.VariableDeclarator, {
      id: {
        type: 'ObjectPattern',
      },
      init: {
        name: props,
      },
    }).at(0)
    if (destructuring.size()) {
      destructuring.nodes()[0].id.properties.push(shorthandProperty('classes'))
    }
  }

  root.find(j.Identifier, {name: componentName}).forEach(path => {
    if (path.node === componentNameNode) return
    if (path.scope.lookup(componentName) === componentScope) {
      if (path.parent.node.type === 'ExportSpecifier') {
        path.parent.replace(j.exportSpecifier(
          j.identifier(componentNameWithStyles),
          j.identifier(componentName)
        ))
      } else {
        path.replace(j.identifier(componentNameWithStyles))
      }
    }
  })
  root.find(j.JSXIdentifier, {name: componentName}).forEach(path => {
    if (path.scope.lookup(componentName) === componentScope) {
      path.replace(j.jsxIdentifier(componentNameWithStyles))
    }
  })

  const styles = declaration.paths()[0].scope.lookup('styles')
    ? `${lowerFirst(componentName)}Styles`
    : 'styles'

  let afterStyles = declaration

  if (flow) {
    if (propsParam && propsParam.typeAnnotation) {
      const {typeAnnotation} = propsParam.typeAnnotation
      if (typeAnnotation) {
        const classesPropAnnotation = j.objectTypeProperty(
          j.identifier('classes'),
          j.genericTypeAnnotation(
            j.identifier('Classes'),
            j.typeParameterInstantiation([
              j.typeofTypeAnnotation(j.genericTypeAnnotation(j.identifier(styles), null))
            ])
          ),
          false
        )
        classesPropAnnotation.variance = j.variance('plus')
        if (typeAnnotation.type === 'GenericTypeAnnotation') {
          const propsTypeName = typeAnnotation.id.name
          const typeScope = componentScope.lookupType(propsTypeName)
          const propsTypeAlias = root.find(j.TypeAlias, {
            id: {name: propsTypeName}
          }).filter(path => path.scope === typeScope).at(0)
          if (propsTypeAlias.size()) afterStyles = propsTypeAlias
          const propsType = propsTypeAlias.find(j.ObjectTypeAnnotation).at(0)
          if (propsType.size()) {
            propsType.nodes()[0].properties.push(classesPropAnnotation)
          }
        } else if (typeAnnotation && typeAnnotation.type === 'ObjectTypeAnnotation') {
          typeAnnotation.properties.push(classesPropAnnotation)
        }
      }
    }
  }

  if (flow && !root.find(j.TypeAlias, {id: {name: 'Classes'}}).size()) {
    afterStyles.insertBefore(
      statement`type Classes<Styles> = $Call<<T>((any) => T) => { [$Keys<T>]: string }, Styles>`
    )
  }


  afterStyles.insertBefore(statement([`\n\nconst ${styles} = ${flow ? `(theme: ${Theme})` : 'theme'} => ({

})\n\n`]))
  if (exportNamedDeclaration.size()) {
    declaration.insertAfter(statement([`\n\nexport { ${componentName}WithStyles as ${componentName} }`]))
  }

  declaration.insertAfter(statement([`\n\nconst ${componentName}WithStyles = ${withStyles}(${styles})(${componentName})\n\n`]))

  if (exportNamedDeclaration.size()) {
    exportNamedDeclaration.replaceWith(path => path.node.declaration)
  }
}
