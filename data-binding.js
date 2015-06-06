var Model;

(function () {
    "use strict";

    Model = function(object) {
        var bind = {
                init: {
                    elements: function(elements, uses) {
                        var refrences = {}, a, b;

                        console.log(elements);

                        for (a = 0; a < elements.length; a++) {

                            var result = bind.init.text(elements, refrences, a);
                            refrences = result[0];
                            elements = result[1];


                            for (b = 0; b < elements[a].attributes.length; b++) {
                                result = bind.init.attr(elements, refrences, a, b);
                                refrences = result[0];
                                elements = result[1];
                            }
                        }

                        if (uses) {
                            for (a = 0; a < uses.length; a++) {
                                uses[a].innerHTML = "";
                                for (b = 0; b < elements.length; b++) {
                                    uses[a].appendChild(elements[b]);
                                }
                            }
                        }

                        console.log(refrences);

                        return [refrences, elements];
                    },
                    text: function (elements, refrences, i) {
                        var textMatch = bind.match(elements[i].innerHTML);

                        if (textMatch) {
                            textMatch = textMatch[0];

                            bind.element.text(elements[i], textMatch);

                            (!refrences[textMatch])
                                ? refrences[textMatch] = { pos: [i] }
                                : refrences[textMatch].pos.push(i)

                            // move to func
                            if (textMatch.split("|").length > 1) {
                                var func = textMatch.replace(/[{}\s]/g, "").split("|");
                                func[1].split(",").forEach(function (param) {

                                    param = "{{" + param + "}}";

                                    (refrences[param])
                                        ? (!refrences[param].funcs)
                                            ? refrences[param].funcs = [func[0]]
                                            : refrences[param].funcs.push(func[0])

                                        : refrences[param] = { funcs: [func[0]] }
                                });
                            }
                        }

                        return [refrences, elements];
                    },
                    attr: function (elements, refrences, a, b) {
                        var attr = elements[a].attributes[b],
                            attrMatch = bind.match(attr.value);

                        if (attrMatch) {
                            attrMatch = attrMatch[0];

                            elements = bind.element.attribute(elements, attrMatch, [a, attr.name]);

                            if (!refrences[attrMatch]) {
                                refrences[attrMatch] = { pos: [[a, attr.name]] };
                            } else {
                                refrences[attrMatch].pos.push([a, attr.name]);
                            }

                            if (attr.name === "if") {
                                refrences[attrMatch].if = true;
                            }

                            if (attrMatch.split("|").length > 1) {
                                var func = attrMatch.replace(/[{}\s]/g, "").split("|");
                                func[1].split(",").forEach(function (param) {

                                    param = "{{" + param + "}}";

                                    (refrences[param])
                                        ? (!refrences[param].funcs)
                                            ? refrences[param].funcs = [func[0]]
                                            : refrences[param].funcs.push(func[0])
                                        : refrences[param] = { funcs: [func[0]] }

                                });
                            }
                        }

                        return [refrences, elements];
                    }
                },
                element: {
                    text: function (element, binder) {
                        element.innerHTML = values.get(binder);
                    },
                    attribute: function (elements, name, pos) {
                        var el = elements[pos[0]],
                            attr = el.attributes[pos[1]];

                        console.log("attr name", attr.name);

                        if (attr.name.match(/^on-\w+/) !== null) {
                            bind.element.event(el, attr, name);
                        }
                        else {
                            var value = values.get(name);

                            if (typeof value === "object") {
                                value = JSON.stringify(value);
                            }

                            attr.value = value;

                            if (attr.name == "if") {
                                elements = bind.template.if(elements, name, pos);
                            }
                        }

                        return elements;
                    },
                    event: function (element, attr, binder) {
                        element.addEventListener(attr.name.replace(/^on-/, ""), function (event) {
                            object[binder.replace(/[{}\s]/g, "")](event);
                        });
                    }
                },
                template: {
                    if: function (elements, name, pos) {
                        var value = values.get(name),
                            element = elements[pos[0]],
                            i;

                        console.log("el", element);

                        if (element.nodeName === "TEMPLATE") {
                            var template = document.createElement("div"),
                                children = element.content.querySelectorAll("*");

                            for (i = 0; i < children.length; i++) {
                                template.appendChild(children[i]);
                            }

                            if (value) {
                                template.setAttribute("hidden", "");
                            }

                            for (i = 0; i < element.attributes.length; i++) {
                                var attr = element.attributes[i];

                                template.setAttribute(attr.name, attr.value);
                            }

                            elements[pos[0]] = template;

                            console.log("1", template, value);
                        } else {
                            if (value) {
                                element.setAttribute("hidden", "");
                            } else {
                                element.removeAttribute("hidden");
                            }
                        }

                        if (value) {
                            element = elements[pos[0]];

                            bind.init.elements(element.childNodes);
                        }

                        return elements;
                    },
                    repeat: function () {

                    }
                },
                property: function (elements, refrences, name) {
                    refrences[name].pos.forEach(function (pos) {
                        if (!Array.isArray(pos)) {
                            bind.element.text(elements[pos], name);
                        } else {
                            elements = bind.element.attribute(elements, name, pos);
                        }
                    });

                    if (refrences[name].funcs) {
                        refrences[name].funcs.forEach(function (func) {
                            for (var name in refrences) {

                                if (name.match(new RegExp(func))) {
                                    elements = bind.property(elements, refrences, name);
                                }
                            }
                        });
                    }

                    return elements;
                },
                match: function (text) {
                    return text.match(/^\s*{{\s*[\w.]+(\s*\|[\w.,\s]+)?\s*}}\s*$/);
                }
            },
            values = {
                get: function (property) {
                    property = property.replace(/[{}\s]/g, "");

                    var value = object.properties[property.match(/^\w+/)[0]];

                    if (property.split("|").length > 1) {
                        var func = values.function(property);

                        return object[func[0]].apply(undefined, func[1]);
                    }

                    return (typeof value === "object")
                        ? values.object(property, value)
                        : value
                },
                object: function (property, obj) {
                    property = property.replace(/[{}\s]/g, "");

                    var path = property.split(".");
                    path.splice(0, 1);

                    while (path.length > 0) {
                        obj = obj[path[0]];
                        path.splice(0, 1);
                    }

                    return obj;
                },
                function: function (property) {
                    property = property.replace(/[{}\s]/g, "");

                    var func = property.split("|"),
                        params;

                    if (func.length > 1) {
                        params = func[1].split(",");

                        params.forEach(function (param, i) {
                            params[i] = values.get(param);
                        });

                        func[1] = params;

                        return func;
                    }
                }
            },
            importQs = function (s) {
                var links = document.querySelectorAll("link[rel=import]"),
                    results = [],
                    selected,
                    a;

                for (a = 0; a < links.length; a++) {
                    selected = links[a].import.querySelectorAll(s);
                    for (var b = 0; b < selected.length; b++) {
                        results.push(selected[b]);
                    }
                }

                selected = document.querySelectorAll(s);

                for (a = 0; a < selected.length; a++) {
                    results.push(selected[a]);
                }

                return results;
            },
            observe = function (elements, obj, refrences, root) {
                Object.observe(obj, function (changes) {
                    changes.forEach(function (change) {
                        var name = "{{" + ((root) ? root : "") + change.name + "}}";

                        if (refrences[name]) {
                            elements = bind.property(elements, refrences, name);
                        }
                    });
                });
                for (var prop in obj) {
                    if (typeof obj[prop] === "object") {
                        elements = observe(elements, obj[prop], refrences, ((root) ? root : "") + prop + ".");
                    }
                }

                return elements;
            },
            init = function () {
                var template = importQs("template[id=" + object.name + "]")[0],
                    uses = importQs("*[el=" + object.name + "]"),
                    elements = Array.prototype.slice.call(template.content.querySelectorAll("*")),
                    result = bind.init.elements(elements, uses),
                    refrences = result[0];

                elements = result[1];

                elements = observe(elements, object.properties, refrences);

                object.constructor();
            };

        init();
    };
})();
