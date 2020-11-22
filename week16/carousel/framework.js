export function createElement (type, attributes, ...children) {
    let element
    if (typeof type === 'string') {// 原生dom节点
        // element = document.createElement(type)
        element = new ElementWraper(type)
    } else {
        element = new type
    }
    // element是个对象，用for in遍历它的属性
    for (let name in attributes) {
         element.setAttribute(name, attributes[name])
    }
    let processChildren = (children) => {
        // children是一个数组，用for of遍历
        for (let child of children) {
            if ((typeof child === 'object') && (child instanceof Array)) {
                processChildren(child)
                continue
            }
            if (typeof child === 'string') {
                // child = document.createTextNode(child)
                child = new TextWraper(child)
            }
            console.log(child)
            element.appendChild(child)
        }
    }
    processChildren(children)
    // 最后返回dom节点
    return element
}

export const STATE = Symbol('state')
export const ATTRIBUTE = Symbol('attribute')

export class Component {
    constructor (type) {
        // this.root = this.render()
        // 将attributes存起来
        this[ATTRIBUTE] = Object.create(null)
        this[STATE] = Object.create(null)
    }
    render () {
        return this.root
    }
    setAttribute (name, value) {
        this[ATTRIBUTE][name] = value
    }
    appendChild (child) {
        // this.root.appendChild(child)
        // appendChild都要改成mountTo，因为我们都用了wraper
        child.mountTo(this.root)
    }
    mountTo (parent) {
        if (!this.root) {
            this.render()
        }
        parent.appendChild(this.root)
    }
    triggerEvent (type, args) {
        this[ATTRIBUTE]['on' + type.replace(/^[\s\S]/, s => s.toUpperCase())](new CustomEvent(type, {detail: args}))
    }
}


// 普通的element是没有mountTo方法的，要加一个wraper
// ElementWraper把一个普通div也转换成带有mountTo方法的div
class ElementWraper extends Component {
    constructor (type) {
        super()
        this.root = document.createElement('div')
    }
    setAttribute (name, value) {
        this.root.setAttribute(name, value)
    }
}

class TextWraper extends Component {
    constructor (content) {
        super()
        this.root = document.createTextNode(content)
    }
}
