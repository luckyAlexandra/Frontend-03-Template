const css = require('css')

const EOF = Symbol('EOF')

const layout = require('./layout.js')

// 全局变量currentToken，因为在html里，tag不管有多复杂，它是当作一个token去处理的。随着状态机一个一个读进来字符的时候，逐步地构造token里的内容
let currentToken = null

// 全局的stack，首先往里push一个document节点，这是因为如果我们写的一个配对良好HTML片段的话，它最后整个的栈应该是空的，不方便我们把这棵树拿出来，所以我们让这个栈有一个初始的跟节点。
let stack = [{type: 'document', children: []}]
let currentTextNode = null

// 加入一个新的函数，addCSSRules，这里我们把css规则暂存到一个数组里
let rules = []
function addCSSRules (text) {
    var ast = css.parse(text)
    // console.log(JSON.stringify(ast, null, '     '))
    rules.push(...ast.stylesheet.rules)
}

function match (element, selector) {
    if (!selector || !element.attributes) {
        return false
    }

    if (selector.charAt(0) == '#') {
        var attr = element.attributes.filter(attr => attr.name == 'id') 
        if (attr && attr.value == selector.replace('#', '')) {
            return true
        }
    } else if (selector.charAt(0) == '.') {
        var attr = element.attributes.filter(attr => attr.name == 'class') 
        if (attr && attr.value == selector.replace('.', '')) {
            return true
        }
    } else {
        if (element.tagName == selector) {
            return true
        }
    }
    return false
}

// 计算specificity
function specificity (selector) {
    var p = [0, 0, 0, 0]
    var selectorParts = selector.split('')
    for (var part of selectorParts) {
        if (part.charAt(0) == '#') {
            p[1] += 1
        } else if (part.charAt(0) == '.') {
            p[2] += 1
        } else {
            p[3] += 1
        }
    }
    return p
}

// 比较specificity 
function compare (sp1, sp2) {
    if (sp1[0] - sp2[0]) {
        return sp1[0] - sp2[0]
    }
    if (sp1[1] - sp2[1]) {
        return sp1[1] - sp2[1]
    }
    if (sp1[2] - sp2[2]) {
        return sp1[2] - sp2[2]
    }
    return sp1[3] - sp2[3]
}


function computeCSS (element) {
    // 这个栈是会不断变化的，随着后续的解析，栈里面的元素会发生变化，就可能会被污染，所以这里用了slice把数组复制一遍
    // 我们会把父元素的序列进行一次reverse，因为检查一个选择器是否匹配当前元素，我们是一级一级去往它的父元素去找的
    var elements = stack.slice().reverse()

    if (!element.computedStyle) {
        element.computedStyle = {}
    }

    for (let rule of rules) {
        var selectorParts = rule.selectors[0].split(' ').reverse()
        if (!match(element, selectorParts[0])) {
            continue
        }

        let matched = false

        var j = 1
        for (var i = 0; i < elements.length; i++) {
            if (match(elements[i], selectorParts[j])) {
                j++
            }
        }

        if (j >= selectorParts.length) {
            matched = true
        }

        if (matched) {
            // 如果匹配到，我们要加入
            var sp = specificity(rule.selectors[0])
            var computedStyle = element.computedStyle
            for (var declaration of rule.declarations) {
                if (!computedStyle[declaration.property]) {
                    computedStyle[declaration.property] = {}
                }
                if (!computedStyle[declaration.property].specificity) {
                    computedStyle[declaration.property].value = declaration.value
                    computedStyle[declaration.property].specificity = sp
                } else if (compare(computedStyle[declaration.property].specificity, sp) < 0) {// 如果新的优先级更高, 则覆盖
                    computedStyle[declaration.property].value = declaration.value
                    computedStyle[declaration.property].specificity = sp
                }
            }
            // console.log(element.computedStyle)
        }
    }
}

// 状态机里面所有的状态创建完token以后，要在同一个出口给它输出，所以写一个全局的emit(token)
// emit(token)会接收到我们从状态机里产出的所有token，还有开始标签，结束标签，自封闭标签
function emit (token) {
    // console.log(token)
    // 我们用一个数组表示这个stack，那么它的栈顶就是最后一个元素
    let top = stack[stack.length - 1]

    if (token.type == 'startTag') {
        let element = {
            type: 'element',
            children: [],
            attributes: []
        }

        element.tagName = token.tagName

        for (let p in token) {
            if (p != 'type' && p != 'tagName') {
                element.attributes.push({
                    name: p,
                    value: token[p]
                })
            }
        }

        computeCSS(element)
        // console.log('element---->', element)

        // 与栈顶元素建立父子关系
        top.children.push(element)
        element.parent = top
        
        if (!token.isSelfClosing) {
            stack.push(element)
        }

        currentTextNode = null
    } else if (token.type == 'endTag') {
        if (top.tagName != token.tagName) {
            throw new Error('Tag start end doesn\'t match')
        } else {
            // ++++++++++遇到style标签，执行添加css规则的操作++++++++++++//
            if (top.tagName === 'style') {
                addCSSRules(top.children[0].content)
            }
            // layout时间，因为flex布局，是需要知道子元素的，所以可以认为子元素一定是发生在标签的结束标签之前
            layout(top)
            stack.pop()
        }
        currentTextNode = null
    } else if (token.type == 'text') {
        if (currentTextNode == null) { 
            currentTextNode = {
                type: 'text',
                content: ''
            }
            top.children.push(currentTextNode)
        }
        currentTextNode.content += token.content
    }
}

function data (c) {
    if (c === '<') {
        return tagOpen
    } else if (c == EOF) {
        emit({
            type: 'EOF'
        })
        return
    } else {
        // 其余认为是文本节点
        emit({
            type: 'text',
            content: c
        })
        return data
    }
}

// 是标签开始，不是开始标签，这时候我们还不知道是三种标签中的哪一种
function tagOpen (c) {
    if (c === '/') {// 结束标签的开头
        return endTagOpen 
    } else if (c.match(/^[a-zA-Z]$/)) {// 要么是开始标签，要么是自封闭标签
        // 给currentToken赋一个初值
        currentToken =  {
            type: 'startTag', // 这里不管是自封闭还是不是自封闭的，我们都称作startTag，如果是自封闭的，用一个额外的变量isSelfClosing来标识
            tagName: ''
        }
        return tagName(c)
    } else {
        return
    }
}

function endTagOpen (c) {
    if (c.match(/^[a-zA-Z]$/)) {
        // 创建endTag标签
        currentToken = {
            type: 'endTag',
            tagName: ''
        }
        return tagName(c)
    } else if (c === '>') {

    } else if (c == EOF) {

    } else {

    }
}

function tagName (c) {
    // tagName一定是以空白符结束的，在HTMl里有效的空白符一共有四种，分别是tab符，换行符(\n)，禁止符（\f, prohibited）和空格。
    if (c.match(/^[\t\n\f ]$/)) { // 遇到属性
        return beforeAttributeName
    } else if (c == '/') { // 标签结束
        return selfClosingStartTag
    } else if (c.match(/^[a-zA-Z]$/)) {// 还是在tagName里
        currentToken.tagName += c // 追加tagName
        return tagName 
    } else if (c == '>') {// 普通的开始标签
        emit(currentToken)
        return data
    } else {
        return tagName
    }
}

// beforeAttributeName暂时不去处理，实际上我们会期待遇到一个属性名，或者正斜杠之类的东西，我们暂时不处理属性，给它所有的可能型
function beforeAttributeName (c) {
    if (c.match(/^[\t\n\f ]$/)) { // 遇到属性
        return beforeAttributeName
    } else if (c == '/' || c == '>' || c == EOF) {
        return afterAttributeName(c)
    } else if (c == '=') {
        // return beforeAttributeName
    } else {
        // 创建一个attribute
        currentAttribute = {
            name: '',
            value: ''
        }
        return attributeName(c)
    }
}

function attributeName (c) {
    if (c.match(/^[\t\n\f ]$/) || c == '/' || c == '>' || c == EOF) {
        return afterAttributeName(c)
    } else if (c == '=') {
        return beforeAttributeValue
    } else if (c == '\u0000') {

    } else if (c == '"' || c == '\'' || c == '<') {

    } else {
        currentAttribute.name += c
        return attributeName
    }
}



function beforeAttributeValue (c) {
    if (c.match(/^[\t\n\f ]$/) || c == '/' || c == '>' || c == EOF) { 
        beforeAttributeValue
    } else if (c == '"') {
        return doubleQuotedAttributeValue
    } else if (c == '\'') {
        return singleQuotedAttributeValue
    } else if (c == '>') {
    } else {
        return unQuotedAttributeValue(c)
    }
}

function doubleQuotedAttributeValue (c) {
    if (c == '"') {
        currentToken[currentAttribute.name] = currentAttribute.value
        return afterQuotedAttributeValue
    } else if (c == '\u0000') {

    } else if (c == EOF) {

    } else {
        currentAttribute.value += c
        return doubleQuotedAttributeValue
    }
}

function singleQuotedAttributeValue (c) {
    if (c == '\'') {
        currentToken[currentAttribute.name] = currentAttribute.value
        return afterQuotedAttributeValue
    } else if (c == '\u0000') {

    } else if (c == EOF) {

    } else {
        currentAttribute.value += c
        return doubleQuotedAttributeValue
    }
}

function afterQuotedAttributeValue (c) {
    if (c.match(/^[\t\n\f ]$/)) {
        return beforeAttributeName
    } else if (c == '/') {
        return selfClosingStartTag
    } else if (c == '>') {
        currentToken[currentAttribute.name] = currentAttribute.value
        emit(currentToken)
        return data
    } else if (c == EOF) {

    } else {
        currentAttribute.value += c
        return doubleQuotedAttributeValue
    }
}

function unQuotedAttributeValue (c) {
    if (c.match(/^[\t\n\f ]$/)) {
        currentToken[currentAttribute.name] = currentAttribute.value
        return beforeAttributeName
    } else if (c == '/') {
        currentToken[currentAttribute.name] = currentAttribute.value
        return selfClosingStartTag
    } else if (c == '>') {
        currentToken[currentAttribute.name] = currentAttribute.value
        emit(currentToken)
        return data
    } else if (c == '\u0000') {

    } else if (c == '"' || c == '\'' || c == '<' || c == '=' || c == '`') {

    } else if (c == EOF) {

    } else {
        currentAttribute.value += c
        return unQuotedAttributeValue
    }
}


function selfClosingStartTag (c) {
    if (c == '>') {
        currentToken.isSelfClosing = true
        // todo 
        emit(currentToken)
        return data
    } else if (c == 'EOF') {
        return
    } else {

    }
}

function afterAttributeName (c) {
    if (c.match(/^[\t\n\f ]$/)) {
        return afterQuotedAttributeValue
    } else if (c == '/') {
        return selfClosingStartTag
    } else if (c == '=') {
        return beforeAttributeValue
    } else if (c == '>') {
        currentToken[currentAttribute.name] = currentAttribute.value
        emit(currentToken)
        return data
    } else if (c == EOF) {

    } else {
        currentToken[currentAttribute.name] = currentAttribute.value
        currentAttribute = {
            name: '',
            value: ''
        }
        return attributeName(c)
    }
}

module.exports.parseHTML = function parseHTML (html) {
    // state跟我们之前的状态机的代码是一样的
    // 首先给它一个初始状态，因为HTML标准里把初始状态叫做data，我们也叫data就可以了
    let state = data
    for (let c of html) {
        state = state(c)
    }
    // 最后用了一个小技巧，因为html最后是有一个文件终结的，而在文件终结的位置，比如说我们有一些文本节点，它可能仍然是面临着一个没有结束的状态，
    // 所以我们最后必须要额外给它一个字符，而这个字符不能是任何一个有效的字符，所以这里我们创建了一个Symbol
    // 这个Sym本身是没有任何Symbol的意义的，我们只是利用了Symbol的唯一性，创建了一个新的符号EOF，把它作为状态机的最后一个输入。
    state = state(EOF)
    // console.log('stack---->', stack[0])
    return stack[0]
    // console.log(html)
}