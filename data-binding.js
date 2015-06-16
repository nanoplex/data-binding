var Expression = (function () {
    function Expression() {
        this.match = function (text) { return (text.replace(/\s/g, "").match(/^\s*{{\s*[\w._]+((.+?))?(:\w+)?\s*}}\s*$/) !== null); };
        this.name = function (text) { return text.replace(/\s/g, "").match(/^{{[\w._]+(\(.+?\))?(:\w+)?/)[0].replace(/^{{/, ""); };
        this.params = function (text) { return text.replace(/\s/g, "").match(/\(.+?\)/)[0].replace(/[()]/g, "").split(","); };
    }
    return Expression;
})();
var Events = (function () {
    function Events(object, scope) {
        var eventElements = scope.querySelectorAll("*[event]");
        for (var i = 0; i < eventElements.length; ++i) {
            this.bindEvent(object, eventElements[i]);
        }
    }
    Events.prototype.bindEvent = function (object, element) {
        var attr = element.attributes["event"].value.split(":"), event = attr[1];
        element.addEventListener(event, function (event) {
            var func = attr[0];
            func = object[func];
            if (!func) {
                var path = func.split(".");
                func = object[path[0]];
                path.splice(0, 1);
                while (path.length > 0) {
                    func = func[path[0]];
                    path.splice(0, 1);
                }
            }
            func.apply(undefined, [event]);
        });
    };
    return Events;
})();
var Template = (function () {
    function Template(object, scope) {
        if (!scope)
            return;
        var templateElements = scope.querySelectorAll("template");
        for (var i = 0, length = templateElements.length; i < length; i++) {
            var template = templateElements[i];
            if (template.getAttribute("repeat"))
                this.repeat(object, template);
            if (template.getAttribute("show") === "true")
                this.show(object, template);
            if (template.getAttribute("hide") === "false")
                this.hide(object, template);
        }
    }
    Template.prototype.copyElements = function (elements, div) {
        var newElements = [];
        for (var b = 0; b < elements.length; b++) {
            var el = elements[b], newNode = el.cloneNode();
            newNode.innerHTML = el.innerHTML;
            newElements.push(newNode);
            div.appendChild(newNode);
        }
        return newElements;
    };
    Template.prototype.deletePrev = function (element, attr) {
        var prevSibling = element.previousElementSibling;
        if (prevSibling) {
            if (prevSibling.attributes[attr] === true) {
                prevSibling.parentNode.removeChild(prevSibling);
            }
        }
    };
    Template.prototype.repeat = function (object, element) {
        var elements = element.content.querySelectorAll("*"), array = new Bind().getValue(object, element.attributes["repeat"].value), div = document.createElement("div");
        console.log(element);
        div.attributes["repeat"] = true;
        for (var a = 0; a < array.length; a++) {
            var item = array[a], refrences, functions;
            object._item = item;
            object._index = a;
            _a = new Refrences(this.copyElements(elements, div)).find(object), refrences = _a[0], functions = _a[1];
            new Bind(object, refrences);
        }
        object._item = undefined;
        object._index = undefined;
        new Events(object, div);
        new Template(object, div);
        this.deletePrev(element, "repeat");
        element.parentNode.insertBefore(div, element);
        var _a;
    };
    Template.prototype.show = function (object, element) {
        if (element.attributes["show"].value === "true") {
            this.stampTemplate(object, element, "show");
        }
        else {
            this.deletePrev(element, "show");
        }
    };
    Template.prototype.hide = function (object, element) {
        if (element.attributes["hide"].value === "false") {
            this.stampTemplate(object, element, "hide");
        }
        else {
            this.deletePrev(element, "hide");
        }
    };
    Template.prototype.stampTemplate = function (object, element, attr) {
        var div = document.createElement("div"), elements = element.content.querySelectorAll("*"), bind = new Bind(), refrences, functions;
        div.attributes[attr] = true;
        _a = new Refrences(this.copyElements(elements, div)).find(object), refrences = _a[0], functions = _a[1];
        new Bind(object, refrences);
        new Events(object, div);
        new Template(object, div);
        this.deletePrev(element, attr);
        element.parentNode.insertBefore(div, element);
        var _a;
    };
    return Template;
})();
var Refrences = (function () {
    function Refrences(Elements) {
        this.Elements = Elements;
    }
    Refrences.prototype.find = function (object) {
        var exp = new Expression(), refrences = {}, functions = {};
        function addRefrence(ref) {
            var name = (ref.innerHTML) ? exp.name(ref.innerHTML) : exp.name(ref.value);
            try {
                var params = exp.params(ref.innerHTML);
                params.forEach(function (param) {
                    if (functions[param]) {
                        functions[param].push(ref.innerHTML);
                    }
                    else {
                        functions[param] = [ref.innerHTML];
                    }
                });
            }
            catch (ex) { }
            var split = name.split(":");
            if (split.length > 1) {
                ref.ownerElement.addEventListener(split[1], function () {
                    new Bind().setValue(object, split[0], this.value);
                });
            }
            name = split[0];
            if (refrences[name]) {
                refrences[name].push(ref);
            }
            else {
                refrences[name] = [ref];
            }
        }
        for (var a = 0, lenA = this.Elements.length; a < lenA; a++) {
            var element = this.Elements[a];
            if (exp.match(element.innerHTML)) {
                addRefrence(element);
            }
            for (var b = 0, lenB = element.attributes.length; b < lenB; b++) {
                var attr = element.attributes[b];
                if (attr.name === "repeat") {
                    if (refrences[attr.value]) {
                        refrences[attr.value].push(element);
                    }
                    else {
                        refrences[attr.value] = [element];
                    }
                }
                if (exp.match(attr.value)) {
                    addRefrence(attr);
                }
            }
        }
        return [refrences, functions];
    };
    return Refrences;
})();
var Bind = (function () {
    function Bind(object, refrences) {
        if (object && refrences) {
            for (var property in refrences) {
                var elements = refrences[property];
                for (var i = 0, len = elements.length; i < len; i++) {
                    var element = elements[i];
                    if (element.tagName !== "TEMPLATE") {
                        this.element(this.getValue(object, property), element);
                    }
                }
            }
        }
    }
    Bind.prototype.setValue = function (object, name, value) {
        if (object[name] === undefined) {
            var path = name.split(".");
            object = object[path[0]];
            path.splice(0, 1);
            while (path.length > 1) {
                object = object[path[0]];
                path.splice(0, 1);
            }
            name = path[0];
        }
        object[name] = value;
    };
    Bind.prototype.getValue = function (object, property) {
        var value = object[property], that = this;
        if (property.match(/\(.+?\)/) !== null && value === undefined) {
            var exp = new Expression(), name = exp.name("{{" + property).match(/^[\w._]+/)[0], params = exp.params(property);
            params.forEach(function (param, p) {
                params[p] = that.getValue(object, param);
            });
            value = that.getValue(object, name).apply(undefined, params);
        }
        else if (value === undefined) {
            var path = property.split(".");
            value = object[path[0]];
            path.splice(0, 1);
            while (path.length > 0) {
                value = value[path[0]];
                path.splice(0, 1);
            }
        }
        return value;
    };
    Bind.prototype.element = function (value, element) {
        if (element.innerHTML !== undefined)
            element.innerHTML = value;
        else
            element.value = value;
    };
    Bind.prototype.change = function (object, change, refrences, functions, root) {
        var name = ((root) ? root : "") + change.name, value = change.object[change.name], template = new Template(), that = this, ref, func;
        name = name.replace(/\.\d+$/, "");
        ref = refrences[name],
            func = functions[name];
        if (change.name !== "length") {
            if (ref) {
                for (var i = 0, len = ref.length; i < len; ++i) {
                    var element = ref[i];
                    if (element.tagName === "TEMPLATE") {
                        template.repeat(object, element);
                    }
                    else {
                        that.element(value, element);
                        if (element.name === "show") {
                            template.show(object, element.ownerElement);
                        }
                        else if (element.name === "hide") {
                            template.hide(object, element.ownerElement);
                        }
                    }
                }
            }
            if (func) {
                for (var i = 0, len = func.length; i < len; ++i) {
                    var fName = f.replace(/[{}\s]/g, ""), refName = refrences[fName];
                    for (var j = 0, Len = refName.length; j < Len; ++j) {
                        that.element(that.getValue(object, fName), refName[j]);
                    }
                }
            }
        }
    };
    return Bind;
})();
var Model = (function () {
    function Model(object, scope) {
        var that = this;
        this.Object = object;
        scope = scope || document.body;
        this.Scope = scope;
        if (typeof this.Object !== "object")
            throw "a view model object must be defined";
        return new Promise(function (resolve, reject) {
            _a = new Refrences(scope.querySelectorAll("*")).find(that.Object), that.Refrences = _a[0], that.Functions = _a[1];
            that.observe(that.Object);
            new Bind(that.Object, that.Refrences);
            new Events(that.Object, scope);
            new Template(that.Object, scope);
            resolve();
            var _a;
        });
    }
    Model.prototype.observe = function (obj, root) {
        var that = this, bind = new Bind();
        Object.observe(obj, function (changes) {
            for (var i = 0, len = changes.length; i < len; ++i) {
                bind.change(that.Object, changes[i], that.Refrences, that.Functions, root);
            }
        });
        for (var prop in obj) {
            if (typeof obj[prop] === "object") {
                that.observe(obj[prop], ((root) ? root : "") + prop + ".");
            }
        }
    };
    return Model;
})();
//# sourceMappingURL=data-binding.js.map