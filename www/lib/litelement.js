// Copyright 2018-2020 the Deno authors. All rights reserved. MIT license.

// This is a specialised implementation of a System module loader.

"use strict";

// @ts-nocheck
/* eslint-disable */
let System, __instantiate;
(() => {
  const r = new Map();

  System = {
    register(id, d, f) {
      r.set(id, { d, f, exp: {} });
    },
  };
  async function dI(mid, src) {
    let id = mid.replace(/\.\w+$/i, "");
    if (id.includes("./")) {
      const [o, ...ia] = id.split("/").reverse(),
        [, ...sa] = src.split("/").reverse(),
        oa = [o];
      let s = 0,
        i;
      while ((i = ia.shift())) {
        if (i === "..") s++;
        else if (i === ".") break;
        else oa.push(i);
      }
      if (s < sa.length) oa.push(...sa.slice(s));
      id = oa.reverse().join("/");
    }
    return r.has(id) ? gExpA(id) : import(mid);
  }

  function gC(id, main) {
    return {
      id,
      import: (m) => dI(m, id),
      meta: { url: id, main },
    };
  }

  function gE(exp) {
    return (id, v) => {
      v = typeof id === "string" ? { [id]: v } : id;
      for (const [id, value] of Object.entries(v)) {
        Object.defineProperty(exp, id, {
          value,
          writable: true,
          enumerable: true,
        });
      }
    };
  }

  function rF(main) {
    for (const [id, m] of r.entries()) {
      const { f, exp } = m;
      const { execute: e, setters: s } = f(gE(exp), gC(id, id === main));
      delete m.f;
      m.e = e;
      m.s = s;
    }
  }

  async function gExpA(id) {
    if (!r.has(id)) return;
    const m = r.get(id);
    if (m.s) {
      const { d, e, s } = m;
      delete m.s;
      delete m.e;
      for (let i = 0; i < s.length; i++) s[i](await gExpA(d[i]));
      const r = e();
      if (r) await r;
    }
    return m.exp;
  }

  function gExp(id) {
    if (!r.has(id)) return;
    const m = r.get(id);
    if (m.s) {
      const { d, e, s } = m;
      delete m.s;
      delete m.e;
      for (let i = 0; i < s.length; i++) s[i](gExp(d[i]));
      e();
    }
    return m.exp;
  }
  __instantiate = (m, a) => {
    System = __instantiate = undefined;
    rF(m);
    return a ? gExpA(m) : gExp(m);
  };
})();

System.register("lit-html/lib/dom", [], function (exports_1, context_1) {
    "use strict";
    var isCEPolyfill, reparentNodes, removeNodes;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [],
        execute: function () {
            exports_1("isCEPolyfill", isCEPolyfill = typeof window !== 'undefined' &&
                window.customElements != null &&
                window.customElements.polyfillWrapFlushCallback !==
                    undefined);
            exports_1("reparentNodes", reparentNodes = (container, start, end = null, before = null) => {
                while (start !== end) {
                    const n = start.nextSibling;
                    container.insertBefore(start, before);
                    start = n;
                }
            });
            exports_1("removeNodes", removeNodes = (container, start, end = null) => {
                while (start !== end) {
                    const n = start.nextSibling;
                    container.removeChild(start);
                    start = n;
                }
            });
        }
    };
});
System.register("lit-html/lib/template", [], function (exports_2, context_2) {
    "use strict";
    var marker, nodeMarker, markerRegex, boundAttributeSuffix, Template, endsWith, isTemplatePartActive, createMarker, lastAttributeNameRegex;
    var __moduleName = context_2 && context_2.id;
    return {
        setters: [],
        execute: function () {
            exports_2("marker", marker = `{{lit-${String(Math.random()).slice(2)}}}`);
            exports_2("nodeMarker", nodeMarker = `<!--${marker}-->`);
            exports_2("markerRegex", markerRegex = new RegExp(`${marker}|${nodeMarker}`));
            exports_2("boundAttributeSuffix", boundAttributeSuffix = '$lit$');
            Template = class Template {
                constructor(result, element) {
                    this.parts = [];
                    this.element = element;
                    const nodesToRemove = [];
                    const stack = [];
                    const walker = document.createTreeWalker(element.content, 133, null, false);
                    let lastPartIndex = 0;
                    let index = -1;
                    let partIndex = 0;
                    const { strings, values: { length } } = result;
                    while (partIndex < length) {
                        const node = walker.nextNode();
                        if (node === null) {
                            walker.currentNode = stack.pop();
                            continue;
                        }
                        index++;
                        if (node.nodeType === 1) {
                            if (node.hasAttributes()) {
                                const attributes = node.attributes;
                                const { length } = attributes;
                                let count = 0;
                                for (let i = 0; i < length; i++) {
                                    if (endsWith(attributes[i].name, boundAttributeSuffix)) {
                                        count++;
                                    }
                                }
                                while (count-- > 0) {
                                    const stringForPart = strings[partIndex];
                                    const name = lastAttributeNameRegex.exec(stringForPart)[2];
                                    const attributeLookupName = name.toLowerCase() + boundAttributeSuffix;
                                    const attributeValue = node.getAttribute(attributeLookupName);
                                    node.removeAttribute(attributeLookupName);
                                    const statics = attributeValue.split(markerRegex);
                                    this.parts.push({ type: 'attribute', index, name, strings: statics });
                                    partIndex += statics.length - 1;
                                }
                            }
                            if (node.tagName === 'TEMPLATE') {
                                stack.push(node);
                                walker.currentNode = node.content;
                            }
                        }
                        else if (node.nodeType === 3) {
                            const data = node.data;
                            if (data.indexOf(marker) >= 0) {
                                const parent = node.parentNode;
                                const strings = data.split(markerRegex);
                                const lastIndex = strings.length - 1;
                                for (let i = 0; i < lastIndex; i++) {
                                    let insert;
                                    let s = strings[i];
                                    if (s === '') {
                                        insert = createMarker();
                                    }
                                    else {
                                        const match = lastAttributeNameRegex.exec(s);
                                        if (match !== null && endsWith(match[2], boundAttributeSuffix)) {
                                            s = s.slice(0, match.index) + match[1] +
                                                match[2].slice(0, -boundAttributeSuffix.length) + match[3];
                                        }
                                        insert = document.createTextNode(s);
                                    }
                                    parent.insertBefore(insert, node);
                                    this.parts.push({ type: 'node', index: ++index });
                                }
                                if (strings[lastIndex] === '') {
                                    parent.insertBefore(createMarker(), node);
                                    nodesToRemove.push(node);
                                }
                                else {
                                    node.data = strings[lastIndex];
                                }
                                partIndex += lastIndex;
                            }
                        }
                        else if (node.nodeType === 8) {
                            if (node.data === marker) {
                                const parent = node.parentNode;
                                if (node.previousSibling === null || index === lastPartIndex) {
                                    index++;
                                    parent.insertBefore(createMarker(), node);
                                }
                                lastPartIndex = index;
                                this.parts.push({ type: 'node', index });
                                if (node.nextSibling === null) {
                                    node.data = '';
                                }
                                else {
                                    nodesToRemove.push(node);
                                    index--;
                                }
                                partIndex++;
                            }
                            else {
                                let i = -1;
                                while ((i = node.data.indexOf(marker, i + 1)) !== -1) {
                                    this.parts.push({ type: 'node', index: -1 });
                                    partIndex++;
                                }
                            }
                        }
                    }
                    for (const n of nodesToRemove) {
                        n.parentNode.removeChild(n);
                    }
                }
            };
            exports_2("Template", Template);
            endsWith = (str, suffix) => {
                const index = str.length - suffix.length;
                return index >= 0 && str.slice(index) === suffix;
            };
            exports_2("isTemplatePartActive", isTemplatePartActive = (part) => part.index !== -1);
            exports_2("createMarker", createMarker = () => document.createComment(''));
            exports_2("lastAttributeNameRegex", lastAttributeNameRegex = /([ \x09\x0a\x0c\x0d])([^\0-\x1F\x7F-\x9F "'>=/]+)([ \x09\x0a\x0c\x0d]*=[ \x09\x0a\x0c\x0d]*(?:[^ \x09\x0a\x0c\x0d"'`<>=]*|"[^"]*|'[^']*))$/);
        }
    };
});
System.register("lit-html/lib/modify-template", ["lit-html/lib/template"], function (exports_3, context_3) {
    "use strict";
    var template_js_1, walkerNodeFilter, countNodes, nextActiveIndexInTemplateParts;
    var __moduleName = context_3 && context_3.id;
    function removeNodesFromTemplate(template, nodesToRemove) {
        const { element: { content }, parts } = template;
        const walker = document.createTreeWalker(content, walkerNodeFilter, null, false);
        let partIndex = nextActiveIndexInTemplateParts(parts);
        let part = parts[partIndex];
        let nodeIndex = -1;
        let removeCount = 0;
        const nodesToRemoveInTemplate = [];
        let currentRemovingNode = null;
        while (walker.nextNode()) {
            nodeIndex++;
            const node = walker.currentNode;
            if (node.previousSibling === currentRemovingNode) {
                currentRemovingNode = null;
            }
            if (nodesToRemove.has(node)) {
                nodesToRemoveInTemplate.push(node);
                if (currentRemovingNode === null) {
                    currentRemovingNode = node;
                }
            }
            if (currentRemovingNode !== null) {
                removeCount++;
            }
            while (part !== undefined && part.index === nodeIndex) {
                part.index = currentRemovingNode !== null ? -1 : part.index - removeCount;
                partIndex = nextActiveIndexInTemplateParts(parts, partIndex);
                part = parts[partIndex];
            }
        }
        nodesToRemoveInTemplate.forEach((n) => n.parentNode.removeChild(n));
    }
    exports_3("removeNodesFromTemplate", removeNodesFromTemplate);
    function insertNodeIntoTemplate(template, node, refNode = null) {
        const { element: { content }, parts } = template;
        if (refNode === null || refNode === undefined) {
            content.appendChild(node);
            return;
        }
        const walker = document.createTreeWalker(content, walkerNodeFilter, null, false);
        let partIndex = nextActiveIndexInTemplateParts(parts);
        let insertCount = 0;
        let walkerIndex = -1;
        while (walker.nextNode()) {
            walkerIndex++;
            const walkerNode = walker.currentNode;
            if (walkerNode === refNode) {
                insertCount = countNodes(node);
                refNode.parentNode.insertBefore(node, refNode);
            }
            while (partIndex !== -1 && parts[partIndex].index === walkerIndex) {
                if (insertCount > 0) {
                    while (partIndex !== -1) {
                        parts[partIndex].index += insertCount;
                        partIndex = nextActiveIndexInTemplateParts(parts, partIndex);
                    }
                    return;
                }
                partIndex = nextActiveIndexInTemplateParts(parts, partIndex);
            }
        }
    }
    exports_3("insertNodeIntoTemplate", insertNodeIntoTemplate);
    return {
        setters: [
            function (template_js_1_1) {
                template_js_1 = template_js_1_1;
            }
        ],
        execute: function () {
            walkerNodeFilter = 133;
            countNodes = (node) => {
                let count = (node.nodeType === 11) ? 0 : 1;
                const walker = document.createTreeWalker(node, walkerNodeFilter, null, false);
                while (walker.nextNode()) {
                    count++;
                }
                return count;
            };
            nextActiveIndexInTemplateParts = (parts, startIndex = -1) => {
                for (let i = startIndex + 1; i < parts.length; i++) {
                    const part = parts[i];
                    if (template_js_1.isTemplatePartActive(part)) {
                        return i;
                    }
                }
                return -1;
            };
        }
    };
});
System.register("lit-html/lib/directive", [], function (exports_4, context_4) {
    "use strict";
    var directives, directive, isDirective;
    var __moduleName = context_4 && context_4.id;
    return {
        setters: [],
        execute: function () {
            directives = new WeakMap();
            exports_4("directive", directive = (f) => ((...args) => {
                const d = f(...args);
                directives.set(d, true);
                return d;
            }));
            exports_4("isDirective", isDirective = (o) => {
                return typeof o === 'function' && directives.has(o);
            });
        }
    };
});
System.register("lit-html/lib/part", [], function (exports_5, context_5) {
    "use strict";
    var noChange, nothing;
    var __moduleName = context_5 && context_5.id;
    return {
        setters: [],
        execute: function () {
            exports_5("noChange", noChange = {});
            exports_5("nothing", nothing = {});
        }
    };
});
System.register("lit-html/lib/template-instance", ["lit-html/lib/dom", "lit-html/lib/template"], function (exports_6, context_6) {
    "use strict";
    var dom_js_1, template_js_2, TemplateInstance;
    var __moduleName = context_6 && context_6.id;
    return {
        setters: [
            function (dom_js_1_1) {
                dom_js_1 = dom_js_1_1;
            },
            function (template_js_2_1) {
                template_js_2 = template_js_2_1;
            }
        ],
        execute: function () {
            TemplateInstance = class TemplateInstance {
                constructor(template, processor, options) {
                    this.__parts = [];
                    this.template = template;
                    this.processor = processor;
                    this.options = options;
                }
                update(values) {
                    let i = 0;
                    for (const part of this.__parts) {
                        if (part !== undefined) {
                            part.setValue(values[i]);
                        }
                        i++;
                    }
                    for (const part of this.__parts) {
                        if (part !== undefined) {
                            part.commit();
                        }
                    }
                }
                _clone() {
                    const fragment = dom_js_1.isCEPolyfill ?
                        this.template.element.content.cloneNode(true) :
                        document.importNode(this.template.element.content, true);
                    const stack = [];
                    const parts = this.template.parts;
                    const walker = document.createTreeWalker(fragment, 133, null, false);
                    let partIndex = 0;
                    let nodeIndex = 0;
                    let part;
                    let node = walker.nextNode();
                    while (partIndex < parts.length) {
                        part = parts[partIndex];
                        if (!template_js_2.isTemplatePartActive(part)) {
                            this.__parts.push(undefined);
                            partIndex++;
                            continue;
                        }
                        while (nodeIndex < part.index) {
                            nodeIndex++;
                            if (node.nodeName === 'TEMPLATE') {
                                stack.push(node);
                                walker.currentNode = node.content;
                            }
                            if ((node = walker.nextNode()) === null) {
                                walker.currentNode = stack.pop();
                                node = walker.nextNode();
                            }
                        }
                        if (part.type === 'node') {
                            const part = this.processor.handleTextExpression(this.options);
                            part.insertAfterNode(node.previousSibling);
                            this.__parts.push(part);
                        }
                        else {
                            this.__parts.push(...this.processor.handleAttributeExpressions(node, part.name, part.strings, this.options));
                        }
                        partIndex++;
                    }
                    if (dom_js_1.isCEPolyfill) {
                        document.adoptNode(fragment);
                        customElements.upgrade(fragment);
                    }
                    return fragment;
                }
            };
            exports_6("TemplateInstance", TemplateInstance);
        }
    };
});
System.register("lit-html/lib/template-result", ["lit-html/lib/dom", "lit-html/lib/template"], function (exports_7, context_7) {
    "use strict";
    var dom_js_2, template_js_3, policy, commentMarker, TemplateResult, SVGTemplateResult;
    var __moduleName = context_7 && context_7.id;
    return {
        setters: [
            function (dom_js_2_1) {
                dom_js_2 = dom_js_2_1;
            },
            function (template_js_3_1) {
                template_js_3 = template_js_3_1;
            }
        ],
        execute: function () {
            policy = window.trustedTypes &&
                trustedTypes.createPolicy('lit-html', { createHTML: (s) => s });
            commentMarker = ` ${template_js_3.marker} `;
            TemplateResult = class TemplateResult {
                constructor(strings, values, type, processor) {
                    this.strings = strings;
                    this.values = values;
                    this.type = type;
                    this.processor = processor;
                }
                getHTML() {
                    const l = this.strings.length - 1;
                    let html = '';
                    let isCommentBinding = false;
                    for (let i = 0; i < l; i++) {
                        const s = this.strings[i];
                        const commentOpen = s.lastIndexOf('<!--');
                        isCommentBinding = (commentOpen > -1 || isCommentBinding) &&
                            s.indexOf('-->', commentOpen + 1) === -1;
                        const attributeMatch = template_js_3.lastAttributeNameRegex.exec(s);
                        if (attributeMatch === null) {
                            html += s + (isCommentBinding ? commentMarker : template_js_3.nodeMarker);
                        }
                        else {
                            html += s.substr(0, attributeMatch.index) + attributeMatch[1] +
                                attributeMatch[2] + template_js_3.boundAttributeSuffix + attributeMatch[3] +
                                template_js_3.marker;
                        }
                    }
                    html += this.strings[l];
                    return html;
                }
                getTemplateElement() {
                    const template = document.createElement('template');
                    let value = this.getHTML();
                    if (policy !== undefined) {
                        value = policy.createHTML(value);
                    }
                    template.innerHTML = value;
                    return template;
                }
            };
            exports_7("TemplateResult", TemplateResult);
            SVGTemplateResult = class SVGTemplateResult extends TemplateResult {
                getHTML() {
                    return `<svg>${super.getHTML()}</svg>`;
                }
                getTemplateElement() {
                    const template = super.getTemplateElement();
                    const content = template.content;
                    const svgElement = content.firstChild;
                    content.removeChild(svgElement);
                    dom_js_2.reparentNodes(content, svgElement.firstChild);
                    return template;
                }
            };
            exports_7("SVGTemplateResult", SVGTemplateResult);
        }
    };
});
System.register("lit-html/lib/parts", ["lit-html/lib/directive", "lit-html/lib/dom", "lit-html/lib/part", "lit-html/lib/template-instance", "lit-html/lib/template-result", "lit-html/lib/template"], function (exports_8, context_8) {
    "use strict";
    var directive_js_1, dom_js_3, part_js_1, template_instance_js_1, template_result_js_1, template_js_4, isPrimitive, isIterable, AttributeCommitter, AttributePart, NodePart, BooleanAttributePart, PropertyCommitter, PropertyPart, eventOptionsSupported, EventPart, getOptions;
    var __moduleName = context_8 && context_8.id;
    return {
        setters: [
            function (directive_js_1_1) {
                directive_js_1 = directive_js_1_1;
            },
            function (dom_js_3_1) {
                dom_js_3 = dom_js_3_1;
            },
            function (part_js_1_1) {
                part_js_1 = part_js_1_1;
            },
            function (template_instance_js_1_1) {
                template_instance_js_1 = template_instance_js_1_1;
            },
            function (template_result_js_1_1) {
                template_result_js_1 = template_result_js_1_1;
            },
            function (template_js_4_1) {
                template_js_4 = template_js_4_1;
            }
        ],
        execute: function () {
            exports_8("isPrimitive", isPrimitive = (value) => {
                return (value === null ||
                    !(typeof value === 'object' || typeof value === 'function'));
            });
            exports_8("isIterable", isIterable = (value) => {
                return Array.isArray(value) ||
                    !!(value && value[Symbol.iterator]);
            });
            AttributeCommitter = class AttributeCommitter {
                constructor(element, name, strings) {
                    this.dirty = true;
                    this.element = element;
                    this.name = name;
                    this.strings = strings;
                    this.parts = [];
                    for (let i = 0; i < strings.length - 1; i++) {
                        this.parts[i] = this._createPart();
                    }
                }
                _createPart() {
                    return new AttributePart(this);
                }
                _getValue() {
                    const strings = this.strings;
                    const l = strings.length - 1;
                    const parts = this.parts;
                    if (l === 1 && strings[0] === '' && strings[1] === '') {
                        const v = parts[0].value;
                        if (typeof v === 'symbol') {
                            return String(v);
                        }
                        if (typeof v === 'string' || !isIterable(v)) {
                            return v;
                        }
                    }
                    let text = '';
                    for (let i = 0; i < l; i++) {
                        text += strings[i];
                        const part = parts[i];
                        if (part !== undefined) {
                            const v = part.value;
                            if (isPrimitive(v) || !isIterable(v)) {
                                text += typeof v === 'string' ? v : String(v);
                            }
                            else {
                                for (const t of v) {
                                    text += typeof t === 'string' ? t : String(t);
                                }
                            }
                        }
                    }
                    text += strings[l];
                    return text;
                }
                commit() {
                    if (this.dirty) {
                        this.dirty = false;
                        this.element.setAttribute(this.name, this._getValue());
                    }
                }
            };
            exports_8("AttributeCommitter", AttributeCommitter);
            AttributePart = class AttributePart {
                constructor(committer) {
                    this.value = undefined;
                    this.committer = committer;
                }
                setValue(value) {
                    if (value !== part_js_1.noChange && (!isPrimitive(value) || value !== this.value)) {
                        this.value = value;
                        if (!directive_js_1.isDirective(value)) {
                            this.committer.dirty = true;
                        }
                    }
                }
                commit() {
                    while (directive_js_1.isDirective(this.value)) {
                        const directive = this.value;
                        this.value = part_js_1.noChange;
                        directive(this);
                    }
                    if (this.value === part_js_1.noChange) {
                        return;
                    }
                    this.committer.commit();
                }
            };
            exports_8("AttributePart", AttributePart);
            NodePart = class NodePart {
                constructor(options) {
                    this.value = undefined;
                    this.__pendingValue = undefined;
                    this.options = options;
                }
                appendInto(container) {
                    this.startNode = container.appendChild(template_js_4.createMarker());
                    this.endNode = container.appendChild(template_js_4.createMarker());
                }
                insertAfterNode(ref) {
                    this.startNode = ref;
                    this.endNode = ref.nextSibling;
                }
                appendIntoPart(part) {
                    part.__insert(this.startNode = template_js_4.createMarker());
                    part.__insert(this.endNode = template_js_4.createMarker());
                }
                insertAfterPart(ref) {
                    ref.__insert(this.startNode = template_js_4.createMarker());
                    this.endNode = ref.endNode;
                    ref.endNode = this.startNode;
                }
                setValue(value) {
                    this.__pendingValue = value;
                }
                commit() {
                    if (this.startNode.parentNode === null) {
                        return;
                    }
                    while (directive_js_1.isDirective(this.__pendingValue)) {
                        const directive = this.__pendingValue;
                        this.__pendingValue = part_js_1.noChange;
                        directive(this);
                    }
                    const value = this.__pendingValue;
                    if (value === part_js_1.noChange) {
                        return;
                    }
                    if (isPrimitive(value)) {
                        if (value !== this.value) {
                            this.__commitText(value);
                        }
                    }
                    else if (value instanceof template_result_js_1.TemplateResult) {
                        this.__commitTemplateResult(value);
                    }
                    else if (value instanceof Node) {
                        this.__commitNode(value);
                    }
                    else if (isIterable(value)) {
                        this.__commitIterable(value);
                    }
                    else if (value === part_js_1.nothing) {
                        this.value = part_js_1.nothing;
                        this.clear();
                    }
                    else {
                        this.__commitText(value);
                    }
                }
                __insert(node) {
                    this.endNode.parentNode.insertBefore(node, this.endNode);
                }
                __commitNode(value) {
                    if (this.value === value) {
                        return;
                    }
                    this.clear();
                    this.__insert(value);
                    this.value = value;
                }
                __commitText(value) {
                    const node = this.startNode.nextSibling;
                    value = value == null ? '' : value;
                    const valueAsString = typeof value === 'string' ? value : String(value);
                    if (node === this.endNode.previousSibling &&
                        node.nodeType === 3) {
                        node.data = valueAsString;
                    }
                    else {
                        this.__commitNode(document.createTextNode(valueAsString));
                    }
                    this.value = value;
                }
                __commitTemplateResult(value) {
                    const template = this.options.templateFactory(value);
                    if (this.value instanceof template_instance_js_1.TemplateInstance &&
                        this.value.template === template) {
                        this.value.update(value.values);
                    }
                    else {
                        const instance = new template_instance_js_1.TemplateInstance(template, value.processor, this.options);
                        const fragment = instance._clone();
                        instance.update(value.values);
                        this.__commitNode(fragment);
                        this.value = instance;
                    }
                }
                __commitIterable(value) {
                    if (!Array.isArray(this.value)) {
                        this.value = [];
                        this.clear();
                    }
                    const itemParts = this.value;
                    let partIndex = 0;
                    let itemPart;
                    for (const item of value) {
                        itemPart = itemParts[partIndex];
                        if (itemPart === undefined) {
                            itemPart = new NodePart(this.options);
                            itemParts.push(itemPart);
                            if (partIndex === 0) {
                                itemPart.appendIntoPart(this);
                            }
                            else {
                                itemPart.insertAfterPart(itemParts[partIndex - 1]);
                            }
                        }
                        itemPart.setValue(item);
                        itemPart.commit();
                        partIndex++;
                    }
                    if (partIndex < itemParts.length) {
                        itemParts.length = partIndex;
                        this.clear(itemPart && itemPart.endNode);
                    }
                }
                clear(startNode = this.startNode) {
                    dom_js_3.removeNodes(this.startNode.parentNode, startNode.nextSibling, this.endNode);
                }
            };
            exports_8("NodePart", NodePart);
            BooleanAttributePart = class BooleanAttributePart {
                constructor(element, name, strings) {
                    this.value = undefined;
                    this.__pendingValue = undefined;
                    if (strings.length !== 2 || strings[0] !== '' || strings[1] !== '') {
                        throw new Error('Boolean attributes can only contain a single expression');
                    }
                    this.element = element;
                    this.name = name;
                    this.strings = strings;
                }
                setValue(value) {
                    this.__pendingValue = value;
                }
                commit() {
                    while (directive_js_1.isDirective(this.__pendingValue)) {
                        const directive = this.__pendingValue;
                        this.__pendingValue = part_js_1.noChange;
                        directive(this);
                    }
                    if (this.__pendingValue === part_js_1.noChange) {
                        return;
                    }
                    const value = !!this.__pendingValue;
                    if (this.value !== value) {
                        if (value) {
                            this.element.setAttribute(this.name, '');
                        }
                        else {
                            this.element.removeAttribute(this.name);
                        }
                        this.value = value;
                    }
                    this.__pendingValue = part_js_1.noChange;
                }
            };
            exports_8("BooleanAttributePart", BooleanAttributePart);
            PropertyCommitter = class PropertyCommitter extends AttributeCommitter {
                constructor(element, name, strings) {
                    super(element, name, strings);
                    this.single =
                        (strings.length === 2 && strings[0] === '' && strings[1] === '');
                }
                _createPart() {
                    return new PropertyPart(this);
                }
                _getValue() {
                    if (this.single) {
                        return this.parts[0].value;
                    }
                    return super._getValue();
                }
                commit() {
                    if (this.dirty) {
                        this.dirty = false;
                        this.element[this.name] = this._getValue();
                    }
                }
            };
            exports_8("PropertyCommitter", PropertyCommitter);
            PropertyPart = class PropertyPart extends AttributePart {
            };
            exports_8("PropertyPart", PropertyPart);
            eventOptionsSupported = false;
            (() => {
                try {
                    const options = {
                        get capture() {
                            eventOptionsSupported = true;
                            return false;
                        }
                    };
                    window.addEventListener('test', options, options);
                    window.removeEventListener('test', options, options);
                }
                catch (_e) {
                }
            })();
            EventPart = class EventPart {
                constructor(element, eventName, eventContext) {
                    this.value = undefined;
                    this.__pendingValue = undefined;
                    this.element = element;
                    this.eventName = eventName;
                    this.eventContext = eventContext;
                    this.__boundHandleEvent = (e) => this.handleEvent(e);
                }
                setValue(value) {
                    this.__pendingValue = value;
                }
                commit() {
                    while (directive_js_1.isDirective(this.__pendingValue)) {
                        const directive = this.__pendingValue;
                        this.__pendingValue = part_js_1.noChange;
                        directive(this);
                    }
                    if (this.__pendingValue === part_js_1.noChange) {
                        return;
                    }
                    const newListener = this.__pendingValue;
                    const oldListener = this.value;
                    const shouldRemoveListener = newListener == null ||
                        oldListener != null &&
                            (newListener.capture !== oldListener.capture ||
                                newListener.once !== oldListener.once ||
                                newListener.passive !== oldListener.passive);
                    const shouldAddListener = newListener != null && (oldListener == null || shouldRemoveListener);
                    if (shouldRemoveListener) {
                        this.element.removeEventListener(this.eventName, this.__boundHandleEvent, this.__options);
                    }
                    if (shouldAddListener) {
                        this.__options = getOptions(newListener);
                        this.element.addEventListener(this.eventName, this.__boundHandleEvent, this.__options);
                    }
                    this.value = newListener;
                    this.__pendingValue = part_js_1.noChange;
                }
                handleEvent(event) {
                    if (typeof this.value === 'function') {
                        this.value.call(this.eventContext || this.element, event);
                    }
                    else {
                        this.value.handleEvent(event);
                    }
                }
            };
            exports_8("EventPart", EventPart);
            getOptions = (o) => o &&
                (eventOptionsSupported ?
                    { capture: o.capture, passive: o.passive, once: o.once } :
                    o.capture);
        }
    };
});
System.register("lit-html/lib/template-factory", ["lit-html/lib/template"], function (exports_9, context_9) {
    "use strict";
    var template_js_5, templateCaches;
    var __moduleName = context_9 && context_9.id;
    function templateFactory(result) {
        let templateCache = templateCaches.get(result.type);
        if (templateCache === undefined) {
            templateCache = {
                stringsArray: new WeakMap(),
                keyString: new Map()
            };
            templateCaches.set(result.type, templateCache);
        }
        let template = templateCache.stringsArray.get(result.strings);
        if (template !== undefined) {
            return template;
        }
        const key = result.strings.join(template_js_5.marker);
        template = templateCache.keyString.get(key);
        if (template === undefined) {
            template = new template_js_5.Template(result, result.getTemplateElement());
            templateCache.keyString.set(key, template);
        }
        templateCache.stringsArray.set(result.strings, template);
        return template;
    }
    exports_9("templateFactory", templateFactory);
    return {
        setters: [
            function (template_js_5_1) {
                template_js_5 = template_js_5_1;
            }
        ],
        execute: function () {
            exports_9("templateCaches", templateCaches = new Map());
        }
    };
});
System.register("lit-html/lib/render", ["lit-html/lib/dom", "lit-html/lib/parts", "lit-html/lib/template-factory"], function (exports_10, context_10) {
    "use strict";
    var dom_js_4, parts_js_1, template_factory_js_1, parts, render;
    var __moduleName = context_10 && context_10.id;
    return {
        setters: [
            function (dom_js_4_1) {
                dom_js_4 = dom_js_4_1;
            },
            function (parts_js_1_1) {
                parts_js_1 = parts_js_1_1;
            },
            function (template_factory_js_1_1) {
                template_factory_js_1 = template_factory_js_1_1;
            }
        ],
        execute: function () {
            exports_10("parts", parts = new WeakMap());
            exports_10("render", render = (result, container, options) => {
                let part = parts.get(container);
                if (part === undefined) {
                    dom_js_4.removeNodes(container, container.firstChild);
                    parts.set(container, part = new parts_js_1.NodePart(Object.assign({ templateFactory: template_factory_js_1.templateFactory }, options)));
                    part.appendInto(container);
                }
                part.setValue(result);
                part.commit();
            });
        }
    };
});
System.register("lit-html/lib/default-template-processor", ["lit-html/lib/parts"], function (exports_11, context_11) {
    "use strict";
    var parts_js_2, DefaultTemplateProcessor, defaultTemplateProcessor;
    var __moduleName = context_11 && context_11.id;
    return {
        setters: [
            function (parts_js_2_1) {
                parts_js_2 = parts_js_2_1;
            }
        ],
        execute: function () {
            DefaultTemplateProcessor = class DefaultTemplateProcessor {
                handleAttributeExpressions(element, name, strings, options) {
                    const prefix = name[0];
                    if (prefix === '.') {
                        const committer = new parts_js_2.PropertyCommitter(element, name.slice(1), strings);
                        return committer.parts;
                    }
                    if (prefix === '@') {
                        return [new parts_js_2.EventPart(element, name.slice(1), options.eventContext)];
                    }
                    if (prefix === '?') {
                        return [new parts_js_2.BooleanAttributePart(element, name.slice(1), strings)];
                    }
                    const committer = new parts_js_2.AttributeCommitter(element, name, strings);
                    return committer.parts;
                }
                handleTextExpression(options) {
                    return new parts_js_2.NodePart(options);
                }
            };
            exports_11("DefaultTemplateProcessor", DefaultTemplateProcessor);
            exports_11("defaultTemplateProcessor", defaultTemplateProcessor = new DefaultTemplateProcessor());
        }
    };
});
System.register("lit-html/lit-html", ["lit-html/lib/default-template-processor", "lit-html/lib/template-result", "lit-html/lib/directive", "lit-html/lib/dom", "lit-html/lib/part", "lit-html/lib/parts", "lit-html/lib/render", "lit-html/lib/template-factory", "lit-html/lib/template-instance", "lit-html/lib/template"], function (exports_12, context_12) {
    "use strict";
    var default_template_processor_js_1, template_result_js_2, html, svg;
    var __moduleName = context_12 && context_12.id;
    return {
        setters: [
            function (default_template_processor_js_1_1) {
                default_template_processor_js_1 = default_template_processor_js_1_1;
                exports_12({
                    "DefaultTemplateProcessor": default_template_processor_js_1_1["DefaultTemplateProcessor"],
                    "defaultTemplateProcessor": default_template_processor_js_1_1["defaultTemplateProcessor"]
                });
            },
            function (template_result_js_2_1) {
                template_result_js_2 = template_result_js_2_1;
                exports_12({
                    "SVGTemplateResult": template_result_js_2_1["SVGTemplateResult"],
                    "TemplateResult": template_result_js_2_1["TemplateResult"]
                });
            },
            function (directive_js_2_1) {
                exports_12({
                    "directive": directive_js_2_1["directive"],
                    "isDirective": directive_js_2_1["isDirective"]
                });
            },
            function (dom_js_5_1) {
                exports_12({
                    "removeNodes": dom_js_5_1["removeNodes"],
                    "reparentNodes": dom_js_5_1["reparentNodes"]
                });
            },
            function (part_js_2_1) {
                exports_12({
                    "noChange": part_js_2_1["noChange"],
                    "nothing": part_js_2_1["nothing"]
                });
            },
            function (parts_js_3_1) {
                exports_12({
                    "AttributeCommitter": parts_js_3_1["AttributeCommitter"],
                    "AttributePart": parts_js_3_1["AttributePart"],
                    "BooleanAttributePart": parts_js_3_1["BooleanAttributePart"],
                    "EventPart": parts_js_3_1["EventPart"],
                    "isIterable": parts_js_3_1["isIterable"],
                    "isPrimitive": parts_js_3_1["isPrimitive"],
                    "NodePart": parts_js_3_1["NodePart"],
                    "PropertyCommitter": parts_js_3_1["PropertyCommitter"],
                    "PropertyPart": parts_js_3_1["PropertyPart"]
                });
            },
            function (render_js_1_1) {
                exports_12({
                    "parts": render_js_1_1["parts"],
                    "render": render_js_1_1["render"]
                });
            },
            function (template_factory_js_2_1) {
                exports_12({
                    "templateCaches": template_factory_js_2_1["templateCaches"],
                    "templateFactory": template_factory_js_2_1["templateFactory"]
                });
            },
            function (template_instance_js_2_1) {
                exports_12({
                    "TemplateInstance": template_instance_js_2_1["TemplateInstance"]
                });
            },
            function (template_js_6_1) {
                exports_12({
                    "createMarker": template_js_6_1["createMarker"],
                    "isTemplatePartActive": template_js_6_1["isTemplatePartActive"],
                    "Template": template_js_6_1["Template"]
                });
            }
        ],
        execute: function () {
            if (typeof window !== 'undefined') {
                (window['litHtmlVersions'] || (window['litHtmlVersions'] = [])).push('1.3.0');
            }
            exports_12("html", html = (strings, ...values) => new template_result_js_2.TemplateResult(strings, values, 'html', default_template_processor_js_1.defaultTemplateProcessor));
            exports_12("svg", svg = (strings, ...values) => new template_result_js_2.SVGTemplateResult(strings, values, 'svg', default_template_processor_js_1.defaultTemplateProcessor));
        }
    };
});
System.register("lit-html/lib/shady-render", ["lit-html/lib/dom", "lit-html/lib/modify-template", "lit-html/lib/render", "lit-html/lib/template-factory", "lit-html/lib/template-instance", "lit-html/lib/template", "lit-html/lit-html"], function (exports_13, context_13) {
    "use strict";
    var dom_js_6, modify_template_js_1, render_js_2, template_factory_js_3, template_instance_js_3, template_js_7, getTemplateCacheKey, compatibleShadyCSSVersion, shadyTemplateFactory, TEMPLATE_TYPES, removeStylesFromLitTemplates, shadyRenderSet, prepareTemplateStyles, render;
    var __moduleName = context_13 && context_13.id;
    return {
        setters: [
            function (dom_js_6_1) {
                dom_js_6 = dom_js_6_1;
            },
            function (modify_template_js_1_1) {
                modify_template_js_1 = modify_template_js_1_1;
            },
            function (render_js_2_1) {
                render_js_2 = render_js_2_1;
            },
            function (template_factory_js_3_1) {
                template_factory_js_3 = template_factory_js_3_1;
            },
            function (template_instance_js_3_1) {
                template_instance_js_3 = template_instance_js_3_1;
            },
            function (template_js_7_1) {
                template_js_7 = template_js_7_1;
            },
            function (lit_html_js_1_1) {
                exports_13({
                    "html": lit_html_js_1_1["html"],
                    "svg": lit_html_js_1_1["svg"],
                    "TemplateResult": lit_html_js_1_1["TemplateResult"]
                });
            }
        ],
        execute: function () {
            getTemplateCacheKey = (type, scopeName) => `${type}--${scopeName}`;
            compatibleShadyCSSVersion = true;
            if (typeof window.ShadyCSS === 'undefined') {
                compatibleShadyCSSVersion = false;
            }
            else if (typeof window.ShadyCSS.prepareTemplateDom === 'undefined') {
                console.warn(`Incompatible ShadyCSS version detected. ` +
                    `Please update to at least @webcomponents/webcomponentsjs@2.0.2 and ` +
                    `@webcomponents/shadycss@1.3.1.`);
                compatibleShadyCSSVersion = false;
            }
            exports_13("shadyTemplateFactory", shadyTemplateFactory = (scopeName) => (result) => {
                const cacheKey = getTemplateCacheKey(result.type, scopeName);
                let templateCache = template_factory_js_3.templateCaches.get(cacheKey);
                if (templateCache === undefined) {
                    templateCache = {
                        stringsArray: new WeakMap(),
                        keyString: new Map()
                    };
                    template_factory_js_3.templateCaches.set(cacheKey, templateCache);
                }
                let template = templateCache.stringsArray.get(result.strings);
                if (template !== undefined) {
                    return template;
                }
                const key = result.strings.join(template_js_7.marker);
                template = templateCache.keyString.get(key);
                if (template === undefined) {
                    const element = result.getTemplateElement();
                    if (compatibleShadyCSSVersion) {
                        window.ShadyCSS.prepareTemplateDom(element, scopeName);
                    }
                    template = new template_js_7.Template(result, element);
                    templateCache.keyString.set(key, template);
                }
                templateCache.stringsArray.set(result.strings, template);
                return template;
            });
            TEMPLATE_TYPES = ['html', 'svg'];
            removeStylesFromLitTemplates = (scopeName) => {
                TEMPLATE_TYPES.forEach((type) => {
                    const templates = template_factory_js_3.templateCaches.get(getTemplateCacheKey(type, scopeName));
                    if (templates !== undefined) {
                        templates.keyString.forEach((template) => {
                            const { element: { content } } = template;
                            const styles = new Set();
                            Array.from(content.querySelectorAll('style')).forEach((s) => {
                                styles.add(s);
                            });
                            modify_template_js_1.removeNodesFromTemplate(template, styles);
                        });
                    }
                });
            };
            shadyRenderSet = new Set();
            prepareTemplateStyles = (scopeName, renderedDOM, template) => {
                shadyRenderSet.add(scopeName);
                const templateElement = !!template ? template.element : document.createElement('template');
                const styles = renderedDOM.querySelectorAll('style');
                const { length } = styles;
                if (length === 0) {
                    window.ShadyCSS.prepareTemplateStyles(templateElement, scopeName);
                    return;
                }
                const condensedStyle = document.createElement('style');
                for (let i = 0; i < length; i++) {
                    const style = styles[i];
                    style.parentNode.removeChild(style);
                    condensedStyle.textContent += style.textContent;
                }
                removeStylesFromLitTemplates(scopeName);
                const content = templateElement.content;
                if (!!template) {
                    modify_template_js_1.insertNodeIntoTemplate(template, condensedStyle, content.firstChild);
                }
                else {
                    content.insertBefore(condensedStyle, content.firstChild);
                }
                window.ShadyCSS.prepareTemplateStyles(templateElement, scopeName);
                const style = content.querySelector('style');
                if (window.ShadyCSS.nativeShadow && style !== null) {
                    renderedDOM.insertBefore(style.cloneNode(true), renderedDOM.firstChild);
                }
                else if (!!template) {
                    content.insertBefore(condensedStyle, content.firstChild);
                    const removes = new Set();
                    removes.add(condensedStyle);
                    modify_template_js_1.removeNodesFromTemplate(template, removes);
                }
            };
            exports_13("render", render = (result, container, options) => {
                if (!options || typeof options !== 'object' || !options.scopeName) {
                    throw new Error('The `scopeName` option is required.');
                }
                const scopeName = options.scopeName;
                const hasRendered = render_js_2.parts.has(container);
                const needsScoping = compatibleShadyCSSVersion &&
                    container.nodeType === 11 &&
                    !!container.host;
                const firstScopeRender = needsScoping && !shadyRenderSet.has(scopeName);
                const renderContainer = firstScopeRender ? document.createDocumentFragment() : container;
                render_js_2.render(result, renderContainer, Object.assign({ templateFactory: shadyTemplateFactory(scopeName) }, options));
                if (firstScopeRender) {
                    const part = render_js_2.parts.get(renderContainer);
                    render_js_2.parts.delete(renderContainer);
                    const template = part.value instanceof template_instance_js_3.TemplateInstance ?
                        part.value.template :
                        undefined;
                    prepareTemplateStyles(scopeName, renderContainer, template);
                    dom_js_6.removeNodes(container, container.firstChild);
                    container.appendChild(renderContainer);
                    render_js_2.parts.set(container, part);
                }
                if (!hasRendered && needsScoping) {
                    window.ShadyCSS.styleElement(container.host);
                }
            });
        }
    };
});
System.register("lit-element/lib/updating-element", [], function (exports_14, context_14) {
    "use strict";
    var _a, defaultConverter, notEqual, defaultPropertyDeclaration, STATE_HAS_UPDATED, STATE_UPDATE_REQUESTED, STATE_IS_REFLECTING_TO_ATTRIBUTE, STATE_IS_REFLECTING_TO_PROPERTY, finalized, UpdatingElement;
    var __moduleName = context_14 && context_14.id;
    return {
        setters: [],
        execute: function () {
            window.JSCompiler_renameProperty =
                (prop, _obj) => prop;
            exports_14("defaultConverter", defaultConverter = {
                toAttribute(value, type) {
                    switch (type) {
                        case Boolean:
                            return value ? '' : null;
                        case Object:
                        case Array:
                            return value == null ? value : JSON.stringify(value);
                    }
                    return value;
                },
                fromAttribute(value, type) {
                    switch (type) {
                        case Boolean:
                            return value !== null;
                        case Number:
                            return value === null ? null : Number(value);
                        case Object:
                        case Array:
                            return JSON.parse(value);
                    }
                    return value;
                }
            });
            exports_14("notEqual", notEqual = (value, old) => {
                return old !== value && (old === old || value === value);
            });
            defaultPropertyDeclaration = {
                attribute: true,
                type: String,
                converter: defaultConverter,
                reflect: false,
                hasChanged: notEqual
            };
            STATE_HAS_UPDATED = 1;
            STATE_UPDATE_REQUESTED = 1 << 2;
            STATE_IS_REFLECTING_TO_ATTRIBUTE = 1 << 3;
            STATE_IS_REFLECTING_TO_PROPERTY = 1 << 4;
            finalized = 'finalized';
            UpdatingElement = class UpdatingElement extends HTMLElement {
                constructor() {
                    super();
                    this.initialize();
                }
                static get observedAttributes() {
                    this.finalize();
                    const attributes = [];
                    this._classProperties.forEach((v, p) => {
                        const attr = this._attributeNameForProperty(p, v);
                        if (attr !== undefined) {
                            this._attributeToPropertyMap.set(attr, p);
                            attributes.push(attr);
                        }
                    });
                    return attributes;
                }
                static _ensureClassProperties() {
                    if (!this.hasOwnProperty(JSCompiler_renameProperty('_classProperties', this))) {
                        this._classProperties = new Map();
                        const superProperties = Object.getPrototypeOf(this)._classProperties;
                        if (superProperties !== undefined) {
                            superProperties.forEach((v, k) => this._classProperties.set(k, v));
                        }
                    }
                }
                static createProperty(name, options = defaultPropertyDeclaration) {
                    this._ensureClassProperties();
                    this._classProperties.set(name, options);
                    if (options.noAccessor || this.prototype.hasOwnProperty(name)) {
                        return;
                    }
                    const key = typeof name === 'symbol' ? Symbol() : `__${name}`;
                    const descriptor = this.getPropertyDescriptor(name, key, options);
                    if (descriptor !== undefined) {
                        Object.defineProperty(this.prototype, name, descriptor);
                    }
                }
                static getPropertyDescriptor(name, key, options) {
                    return {
                        get() {
                            return this[key];
                        },
                        set(value) {
                            const oldValue = this[name];
                            this[key] = value;
                            this
                                .requestUpdateInternal(name, oldValue, options);
                        },
                        configurable: true,
                        enumerable: true
                    };
                }
                static getPropertyOptions(name) {
                    return this._classProperties && this._classProperties.get(name) ||
                        defaultPropertyDeclaration;
                }
                static finalize() {
                    const superCtor = Object.getPrototypeOf(this);
                    if (!superCtor.hasOwnProperty(finalized)) {
                        superCtor.finalize();
                    }
                    this[finalized] = true;
                    this._ensureClassProperties();
                    this._attributeToPropertyMap = new Map();
                    if (this.hasOwnProperty(JSCompiler_renameProperty('properties', this))) {
                        const props = this.properties;
                        const propKeys = [
                            ...Object.getOwnPropertyNames(props),
                            ...(typeof Object.getOwnPropertySymbols === 'function') ?
                                Object.getOwnPropertySymbols(props) :
                                []
                        ];
                        for (const p of propKeys) {
                            this.createProperty(p, props[p]);
                        }
                    }
                }
                static _attributeNameForProperty(name, options) {
                    const attribute = options.attribute;
                    return attribute === false ?
                        undefined :
                        (typeof attribute === 'string' ?
                            attribute :
                            (typeof name === 'string' ? name.toLowerCase() : undefined));
                }
                static _valueHasChanged(value, old, hasChanged = notEqual) {
                    return hasChanged(value, old);
                }
                static _propertyValueFromAttribute(value, options) {
                    const type = options.type;
                    const converter = options.converter || defaultConverter;
                    const fromAttribute = (typeof converter === 'function' ? converter : converter.fromAttribute);
                    return fromAttribute ? fromAttribute(value, type) : value;
                }
                static _propertyValueToAttribute(value, options) {
                    if (options.reflect === undefined) {
                        return;
                    }
                    const type = options.type;
                    const converter = options.converter;
                    const toAttribute = converter && converter.toAttribute ||
                        defaultConverter.toAttribute;
                    return toAttribute(value, type);
                }
                initialize() {
                    this._updateState = 0;
                    this._updatePromise =
                        new Promise((res) => this._enableUpdatingResolver = res);
                    this._changedProperties = new Map();
                    this._saveInstanceProperties();
                    this.requestUpdateInternal();
                }
                _saveInstanceProperties() {
                    this.constructor
                        ._classProperties.forEach((_v, p) => {
                        if (this.hasOwnProperty(p)) {
                            const value = this[p];
                            delete this[p];
                            if (!this._instanceProperties) {
                                this._instanceProperties = new Map();
                            }
                            this._instanceProperties.set(p, value);
                        }
                    });
                }
                _applyInstanceProperties() {
                    this._instanceProperties.forEach((v, p) => this[p] = v);
                    this._instanceProperties = undefined;
                }
                connectedCallback() {
                    this.enableUpdating();
                }
                enableUpdating() {
                    if (this._enableUpdatingResolver !== undefined) {
                        this._enableUpdatingResolver();
                        this._enableUpdatingResolver = undefined;
                    }
                }
                disconnectedCallback() {
                }
                attributeChangedCallback(name, old, value) {
                    if (old !== value) {
                        this._attributeToProperty(name, value);
                    }
                }
                _propertyToAttribute(name, value, options = defaultPropertyDeclaration) {
                    const ctor = this.constructor;
                    const attr = ctor._attributeNameForProperty(name, options);
                    if (attr !== undefined) {
                        const attrValue = ctor._propertyValueToAttribute(value, options);
                        if (attrValue === undefined) {
                            return;
                        }
                        this._updateState = this._updateState | STATE_IS_REFLECTING_TO_ATTRIBUTE;
                        if (attrValue == null) {
                            this.removeAttribute(attr);
                        }
                        else {
                            this.setAttribute(attr, attrValue);
                        }
                        this._updateState = this._updateState & ~STATE_IS_REFLECTING_TO_ATTRIBUTE;
                    }
                }
                _attributeToProperty(name, value) {
                    if (this._updateState & STATE_IS_REFLECTING_TO_ATTRIBUTE) {
                        return;
                    }
                    const ctor = this.constructor;
                    const propName = ctor._attributeToPropertyMap.get(name);
                    if (propName !== undefined) {
                        const options = ctor.getPropertyOptions(propName);
                        this._updateState = this._updateState | STATE_IS_REFLECTING_TO_PROPERTY;
                        this[propName] =
                            ctor._propertyValueFromAttribute(value, options);
                        this._updateState = this._updateState & ~STATE_IS_REFLECTING_TO_PROPERTY;
                    }
                }
                requestUpdateInternal(name, oldValue, options) {
                    let shouldRequestUpdate = true;
                    if (name !== undefined) {
                        const ctor = this.constructor;
                        options = options || ctor.getPropertyOptions(name);
                        if (ctor._valueHasChanged(this[name], oldValue, options.hasChanged)) {
                            if (!this._changedProperties.has(name)) {
                                this._changedProperties.set(name, oldValue);
                            }
                            if (options.reflect === true &&
                                !(this._updateState & STATE_IS_REFLECTING_TO_PROPERTY)) {
                                if (this._reflectingProperties === undefined) {
                                    this._reflectingProperties = new Map();
                                }
                                this._reflectingProperties.set(name, options);
                            }
                        }
                        else {
                            shouldRequestUpdate = false;
                        }
                    }
                    if (!this._hasRequestedUpdate && shouldRequestUpdate) {
                        this._updatePromise = this._enqueueUpdate();
                    }
                }
                requestUpdate(name, oldValue) {
                    this.requestUpdateInternal(name, oldValue);
                    return this.updateComplete;
                }
                async _enqueueUpdate() {
                    this._updateState = this._updateState | STATE_UPDATE_REQUESTED;
                    try {
                        await this._updatePromise;
                    }
                    catch (e) {
                    }
                    const result = this.performUpdate();
                    if (result != null) {
                        await result;
                    }
                    return !this._hasRequestedUpdate;
                }
                get _hasRequestedUpdate() {
                    return (this._updateState & STATE_UPDATE_REQUESTED);
                }
                get hasUpdated() {
                    return (this._updateState & STATE_HAS_UPDATED);
                }
                performUpdate() {
                    if (!this._hasRequestedUpdate) {
                        return;
                    }
                    if (this._instanceProperties) {
                        this._applyInstanceProperties();
                    }
                    let shouldUpdate = false;
                    const changedProperties = this._changedProperties;
                    try {
                        shouldUpdate = this.shouldUpdate(changedProperties);
                        if (shouldUpdate) {
                            this.update(changedProperties);
                        }
                        else {
                            this._markUpdated();
                        }
                    }
                    catch (e) {
                        shouldUpdate = false;
                        this._markUpdated();
                        throw e;
                    }
                    if (shouldUpdate) {
                        if (!(this._updateState & STATE_HAS_UPDATED)) {
                            this._updateState = this._updateState | STATE_HAS_UPDATED;
                            this.firstUpdated(changedProperties);
                        }
                        this.updated(changedProperties);
                    }
                }
                _markUpdated() {
                    this._changedProperties = new Map();
                    this._updateState = this._updateState & ~STATE_UPDATE_REQUESTED;
                }
                get updateComplete() {
                    return this._getUpdateComplete();
                }
                _getUpdateComplete() {
                    return this._updatePromise;
                }
                shouldUpdate(_changedProperties) {
                    return true;
                }
                update(_changedProperties) {
                    if (this._reflectingProperties !== undefined &&
                        this._reflectingProperties.size > 0) {
                        this._reflectingProperties.forEach((v, k) => this._propertyToAttribute(k, this[k], v));
                        this._reflectingProperties = undefined;
                    }
                    this._markUpdated();
                }
                updated(_changedProperties) {
                }
                firstUpdated(_changedProperties) {
                }
            };
            exports_14("UpdatingElement", UpdatingElement);
            _a = finalized;
            UpdatingElement[_a] = true;
        }
    };
});
System.register("lit-element/lib/decorators", [], function (exports_15, context_15) {
    "use strict";
    var legacyCustomElement, standardCustomElement, customElement, standardProperty, legacyProperty, legacyQuery, standardQuery, standardEventOptions, legacyEventOptions, ElementProto, legacyMatches;
    var __moduleName = context_15 && context_15.id;
    function property(options) {
        return (protoOrDescriptor, name) => (name !== undefined) ?
            legacyProperty(options, protoOrDescriptor, name) :
            standardProperty(options, protoOrDescriptor);
    }
    exports_15("property", property);
    function internalProperty(options) {
        return property({ attribute: false, hasChanged: options === null || options === void 0 ? void 0 : options.hasChanged });
    }
    exports_15("internalProperty", internalProperty);
    function query(selector, cache) {
        return (protoOrDescriptor, name) => {
            const descriptor = {
                get() {
                    return this.renderRoot.querySelector(selector);
                },
                enumerable: true,
                configurable: true,
            };
            if (cache) {
                const key = typeof name === 'symbol' ? Symbol() : `__${name}`;
                descriptor.get = function () {
                    if (this[key] === undefined) {
                        (this[key] =
                            this.renderRoot.querySelector(selector));
                    }
                    return this[key];
                };
            }
            return (name !== undefined) ?
                legacyQuery(descriptor, protoOrDescriptor, name) :
                standardQuery(descriptor, protoOrDescriptor);
        };
    }
    exports_15("query", query);
    function queryAsync(selector) {
        return (protoOrDescriptor, name) => {
            const descriptor = {
                async get() {
                    await this.updateComplete;
                    return this.renderRoot.querySelector(selector);
                },
                enumerable: true,
                configurable: true,
            };
            return (name !== undefined) ?
                legacyQuery(descriptor, protoOrDescriptor, name) :
                standardQuery(descriptor, protoOrDescriptor);
        };
    }
    exports_15("queryAsync", queryAsync);
    function queryAll(selector) {
        return (protoOrDescriptor, name) => {
            const descriptor = {
                get() {
                    return this.renderRoot.querySelectorAll(selector);
                },
                enumerable: true,
                configurable: true,
            };
            return (name !== undefined) ?
                legacyQuery(descriptor, protoOrDescriptor, name) :
                standardQuery(descriptor, protoOrDescriptor);
        };
    }
    exports_15("queryAll", queryAll);
    function eventOptions(options) {
        return ((protoOrDescriptor, name) => (name !== undefined) ?
            legacyEventOptions(options, protoOrDescriptor, name) :
            standardEventOptions(options, protoOrDescriptor));
    }
    exports_15("eventOptions", eventOptions);
    function queryAssignedNodes(slotName = '', flatten = false, selector = '') {
        return (protoOrDescriptor, name) => {
            const descriptor = {
                get() {
                    const slotSelector = `slot${slotName ? `[name=${slotName}]` : ':not([name])'}`;
                    const slot = this.renderRoot.querySelector(slotSelector);
                    let nodes = slot && slot.assignedNodes({ flatten });
                    if (nodes && selector) {
                        nodes = nodes.filter((node) => node.nodeType === Node.ELEMENT_NODE &&
                            node.matches ?
                            node.matches(selector) :
                            legacyMatches.call(node, selector));
                    }
                    return nodes;
                },
                enumerable: true,
                configurable: true,
            };
            return (name !== undefined) ?
                legacyQuery(descriptor, protoOrDescriptor, name) :
                standardQuery(descriptor, protoOrDescriptor);
        };
    }
    exports_15("queryAssignedNodes", queryAssignedNodes);
    return {
        setters: [],
        execute: function () {
            legacyCustomElement = (tagName, clazz) => {
                window.customElements.define(tagName, clazz);
                return clazz;
            };
            standardCustomElement = (tagName, descriptor) => {
                const { kind, elements } = descriptor;
                return {
                    kind,
                    elements,
                    finisher(clazz) {
                        window.customElements.define(tagName, clazz);
                    }
                };
            };
            exports_15("customElement", customElement = (tagName) => (classOrDescriptor) => (typeof classOrDescriptor === 'function') ?
                legacyCustomElement(tagName, classOrDescriptor) :
                standardCustomElement(tagName, classOrDescriptor));
            standardProperty = (options, element) => {
                if (element.kind === 'method' && element.descriptor &&
                    !('value' in element.descriptor)) {
                    return Object.assign(Object.assign({}, element), { finisher(clazz) {
                            clazz.createProperty(element.key, options);
                        } });
                }
                else {
                    return {
                        kind: 'field',
                        key: Symbol(),
                        placement: 'own',
                        descriptor: {},
                        initializer() {
                            if (typeof element.initializer === 'function') {
                                this[element.key] = element.initializer.call(this);
                            }
                        },
                        finisher(clazz) {
                            clazz.createProperty(element.key, options);
                        }
                    };
                }
            };
            legacyProperty = (options, proto, name) => {
                proto.constructor
                    .createProperty(name, options);
            };
            legacyQuery = (descriptor, proto, name) => {
                Object.defineProperty(proto, name, descriptor);
            };
            standardQuery = (descriptor, element) => ({
                kind: 'method',
                placement: 'prototype',
                key: element.key,
                descriptor,
            });
            standardEventOptions = (options, element) => {
                return Object.assign(Object.assign({}, element), { finisher(clazz) {
                        Object.assign(clazz.prototype[element.key], options);
                    } });
            };
            legacyEventOptions = (options, proto, name) => {
                Object.assign(proto[name], options);
            };
            ElementProto = Element.prototype;
            legacyMatches = ElementProto.msMatchesSelector || ElementProto.webkitMatchesSelector;
        }
    };
});
System.register("lit-element/lib/css-tag", [], function (exports_16, context_16) {
    "use strict";
    var supportsAdoptingStyleSheets, constructionToken, CSSResult, unsafeCSS, textFromCSSResult, css;
    var __moduleName = context_16 && context_16.id;
    return {
        setters: [],
        execute: function () {
            exports_16("supportsAdoptingStyleSheets", supportsAdoptingStyleSheets = (window.ShadowRoot) &&
                (window.ShadyCSS === undefined || window.ShadyCSS.nativeShadow) &&
                ('adoptedStyleSheets' in Document.prototype) &&
                ('replace' in CSSStyleSheet.prototype));
            constructionToken = Symbol();
            CSSResult = class CSSResult {
                constructor(cssText, safeToken) {
                    if (safeToken !== constructionToken) {
                        throw new Error('CSSResult is not constructable. Use `unsafeCSS` or `css` instead.');
                    }
                    this.cssText = cssText;
                }
                get styleSheet() {
                    if (this._styleSheet === undefined) {
                        if (supportsAdoptingStyleSheets) {
                            this._styleSheet = new CSSStyleSheet();
                            this._styleSheet.replaceSync(this.cssText);
                        }
                        else {
                            this._styleSheet = null;
                        }
                    }
                    return this._styleSheet;
                }
                toString() {
                    return this.cssText;
                }
            };
            exports_16("CSSResult", CSSResult);
            exports_16("unsafeCSS", unsafeCSS = (value) => {
                return new CSSResult(String(value), constructionToken);
            });
            textFromCSSResult = (value) => {
                if (value instanceof CSSResult) {
                    return value.cssText;
                }
                else if (typeof value === 'number') {
                    return value;
                }
                else {
                    throw new Error(`Value passed to 'css' function must be a 'css' function result: ${value}. Use 'unsafeCSS' to pass non-literal values, but
            take care to ensure page security.`);
                }
            };
            exports_16("css", css = (strings, ...values) => {
                const cssText = values.reduce((acc, v, idx) => acc + textFromCSSResult(v) + strings[idx + 1], strings[0]);
                return new CSSResult(cssText, constructionToken);
            });
        }
    };
});
System.register("lit-element/lit-element", ["lit-html/lib/shady-render", "lit-element/lib/updating-element", "lit-element/lib/decorators", "lit-html/lit-html", "lit-element/lib/css-tag"], function (exports_17, context_17) {
    "use strict";
    var shady_render_js_1, updating_element_js_1, css_tag_js_1, renderNotImplemented, LitElement;
    var __moduleName = context_17 && context_17.id;
    var exportedNames_1 = {
        "html": true,
        "svg": true,
        "TemplateResult": true,
        "SVGTemplateResult": true,
        "LitElement": true
    };
    function exportStar_1(m) {
        var exports = {};
        for (var n in m) {
            if (n !== "default" && !exportedNames_1.hasOwnProperty(n)) exports[n] = m[n];
        }
        exports_17(exports);
    }
    return {
        setters: [
            function (shady_render_js_1_1) {
                shady_render_js_1 = shady_render_js_1_1;
            },
            function (updating_element_js_1_1) {
                updating_element_js_1 = updating_element_js_1_1;
                exportStar_1(updating_element_js_1_1);
            },
            function (decorators_js_1_1) {
                exportStar_1(decorators_js_1_1);
            },
            function (lit_html_js_2_1) {
                exports_17({
                    "html": lit_html_js_2_1["html"],
                    "svg": lit_html_js_2_1["svg"],
                    "TemplateResult": lit_html_js_2_1["TemplateResult"],
                    "SVGTemplateResult": lit_html_js_2_1["SVGTemplateResult"]
                });
            },
            function (css_tag_js_1_1) {
                css_tag_js_1 = css_tag_js_1_1;
                exportStar_1(css_tag_js_1_1);
            }
        ],
        execute: function () {
            (window['litElementVersions'] || (window['litElementVersions'] = []))
                .push('2.4.0');
            renderNotImplemented = {};
            LitElement = class LitElement extends updating_element_js_1.UpdatingElement {
                static getStyles() {
                    return this.styles;
                }
                static _getUniqueStyles() {
                    if (this.hasOwnProperty(JSCompiler_renameProperty('_styles', this))) {
                        return;
                    }
                    const userStyles = this.getStyles();
                    if (Array.isArray(userStyles)) {
                        const addStyles = (styles, set) => styles.reduceRight((set, s) => Array.isArray(s) ? addStyles(s, set) : (set.add(s), set), set);
                        const set = addStyles(userStyles, new Set());
                        const styles = [];
                        set.forEach((v) => styles.unshift(v));
                        this._styles = styles;
                    }
                    else {
                        this._styles = userStyles === undefined ? [] : [userStyles];
                    }
                    this._styles = this._styles.map((s) => {
                        if (s instanceof CSSStyleSheet && !css_tag_js_1.supportsAdoptingStyleSheets) {
                            const cssText = Array.prototype.slice.call(s.cssRules)
                                .reduce((css, rule) => css + rule.cssText, '');
                            return css_tag_js_1.unsafeCSS(cssText);
                        }
                        return s;
                    });
                }
                initialize() {
                    super.initialize();
                    this.constructor._getUniqueStyles();
                    this.renderRoot = this.createRenderRoot();
                    if (window.ShadowRoot && this.renderRoot instanceof window.ShadowRoot) {
                        this.adoptStyles();
                    }
                }
                createRenderRoot() {
                    return this.attachShadow({ mode: 'open' });
                }
                adoptStyles() {
                    const styles = this.constructor._styles;
                    if (styles.length === 0) {
                        return;
                    }
                    if (window.ShadyCSS !== undefined && !window.ShadyCSS.nativeShadow) {
                        window.ShadyCSS.ScopingShim.prepareAdoptedCssText(styles.map((s) => s.cssText), this.localName);
                    }
                    else if (css_tag_js_1.supportsAdoptingStyleSheets) {
                        this.renderRoot.adoptedStyleSheets =
                            styles.map((s) => s instanceof CSSStyleSheet ? s : s.styleSheet);
                    }
                    else {
                        this._needsShimAdoptedStyleSheets = true;
                    }
                }
                connectedCallback() {
                    super.connectedCallback();
                    if (this.hasUpdated && window.ShadyCSS !== undefined) {
                        window.ShadyCSS.styleElement(this);
                    }
                }
                update(changedProperties) {
                    const templateResult = this.render();
                    super.update(changedProperties);
                    if (templateResult !== renderNotImplemented) {
                        this.constructor
                            .render(templateResult, this.renderRoot, { scopeName: this.localName, eventContext: this });
                    }
                    if (this._needsShimAdoptedStyleSheets) {
                        this._needsShimAdoptedStyleSheets = false;
                        this.constructor._styles.forEach((s) => {
                            const style = document.createElement('style');
                            style.textContent = s.cssText;
                            this.renderRoot.appendChild(style);
                        });
                    }
                }
                render() {
                    return renderNotImplemented;
                }
            };
            exports_17("LitElement", LitElement);
            LitElement['finalized'] = true;
            LitElement.render = shady_render_js_1.render;
        }
    };
});

const __exp = __instantiate("lit-element/lit-element", false);
export const html = __exp["html"];
export const svg = __exp["svg"];
export const TemplateResult = __exp["TemplateResult"];
export const SVGTemplateResult = __exp["SVGTemplateResult"];
export const LitElement = __exp["LitElement"];
export const defaultConverter = __exp["defaultConverter"];
export const notEqual = __exp["notEqual"];
export const UpdatingElement = __exp["UpdatingElement"];
export const property = __exp["property"];
export const internalProperty = __exp["internalProperty"];
export const query = __exp["query"];
export const queryAsync = __exp["queryAsync"];
export const queryAll = __exp["queryAll"];
export const eventOptions = __exp["eventOptions"];
export const queryAssignedNodes = __exp["queryAssignedNodes"];
export const customElement = __exp["customElement"];
export const supportsAdoptingStyleSheets = __exp["supportsAdoptingStyleSheets"];
export const CSSResult = __exp["CSSResult"];
export const unsafeCSS = __exp["unsafeCSS"];
export const css = __exp["css"];
