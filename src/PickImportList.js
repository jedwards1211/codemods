/* global atom */

const { SelectListView, TextEditorView } = require("atom-space-pen-views")

module.exports = class PickImportList extends SelectListView {
  static content() {
    return this.div({
      class: 'select-list'
    }, () => {
      this.div({
        class: 'identifier',
        outlet: 'identifierArea',
      })
      this.div({
        class: 'context',
        outlet: 'contextArea',
      })
      this.subview('filterEditorView', new TextEditorView({
        mini: true
      }))
      this.div({
        class: 'error-message',
        outlet: 'error'
      })
      this.div({
        class: 'loading',
        outlet: 'loadingArea'
      }, () => {
        this.span({
          class: 'loading-message',
          outlet: 'loading'
        })
        return this.span({
          class: 'badge',
          outlet: 'loadingBadge'
        })
      })
      return this.ol({
        class: 'list-group',
        outlet: 'list'
      })
    })
  }

  viewForItem({ code, ast }) {
    return `
      <li class="two-lines">
        <div class="primary-line">${ast.source.value}</div>
        <div class="secondary-line">${code}</div>
      </li>
    `
  }

  getEmptyMessage() {
    return "No transforms defined. Run 'morpher:open-your-transforms-file' to define some"
  }

  setContext({identifier, line, context}) {
    this.identifierArea.text(identifier)
    this.contextArea.text(`${line} | ${context}`)
  }

  setImports(imports) {
    this.setItems(
      imports.map(imp =>
        Object.assign({}, imp, {
          filterKey: `${imp.ast.source.value}`
        })
      )
    )
  }

  getFilterKey() {
    return "filterKey"
  }

  setOnSelected(onSelected) {
    this.onSelected = onSelected
  }

  async confirmed(imp) {
    if (this.onSelected) this.onSelected(imp)
    this.hide()
  }

  cancelled() {
    if (this.onSelected) this.onSelected(null)
    this.hide()
  }

  open() {
    if (!this.panel) {
      this.panel = atom.workspace.addModalPanel({ item: this })
    }

    this.storeFocusedElement()
    this.panel.show()
    this.focusFilterEditor()
  }

  hide() {
    if (this.panel) {
      this.panel.hide()
    }
    this.restoreFocus()
  }
}
