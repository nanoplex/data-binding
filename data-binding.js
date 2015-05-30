var Model;

(function () {
    "use strict";

    Model = function (vm, scope) {
        var that = this;

        this.bind = {
            types: {
                html: function (property, binder) {
                    binder.innerHTML = that.value.get(property);
                },
                text: function (property, binder) {
                    binder.innerText = that.value.get(property);
                },
                value: function (property, binder) {
                    if (binder.nodeName === "INPUT") {
                        var event = "input";

                        if (binder.type === "checkbox")
                            event = "change";

                        binder.value = that.value.get(property);
                        binder.addEventListener(event, function () {
                            that.value.set(property, this.value);
                        });
                    } else
                        console.error("syntax error:", "element bound with value type must be input", binder);
                },
                event: function (property, binder, type) {
                    var event = type
                        .match(/\(.+?\)/)[0]
                        .replace(/\(/, "")
                        .replace(/\)/, ""),
                        func = vm[property];

                    if (typeof func === "function") {
                        binder.addEventListener(event, function(e) {
                            func(e);
                        });
                    } else
                        console.error("syntex error:", "value bound to event type must be function", binder);
                },
                attr: function (property, binder, type) {
                    var attr = type
                        .match(/\(.+?\)/)[0]
                        .replace(/\(/, "")
                        .replace(/\)/, ""),
                        value = that.value.get(property);

                    binder.setAttribute(attr, JSON.stringify(value));
                },
                repeat: function (property, binder) {
                    var array = vm[property],
                        template = document.createElement("div");

                    if (Array.isArray(array)) {
                        if (!binder._template) {
                            binder._template = binder.innerHTML;
                        }

                        template.innerHTML = binder._template;

                        binder.innerHTML = "";

                        array.forEach(function (item, index) {
                            var clone = template.cloneNode(),
                                binders,
                                i;

                            clone.innerHTML = template.innerHTML;

                            binders = clone.querySelectorAll("*[bind]");

                            vm.$item = item;
                            vm.$index = index;

                            for (i = 0; i < binders.length; i++) {
                                that.bind.element(binders[i]);
                            }

                            for (i = 0; i < clone.childNodes.length; i++) {
                                var node = clone.childNodes[i];
                                if (node.nodeName !== "#text")
                                    binder.appendChild(node);
                            }
                        });
                    } else
                        console.error("syntex error: value bound to repeat type must be array", binder);
                },
                if: function (property, binder) {
                    var not = false,
                        bool = that.value.get(property);

                    if (property.match(/^!/) !== null) {
                        not = true;
                        property = property.replace(/^!/, "");
                    }

                    if (typeof bool === "boolean") {

                        if (not) bool = !bool;

                        if (!bool)
                            binder.setAttribute("hidden", "");
                        else
                            binder.removeAttribute("hidden");
                    } else
                        console.error("syntax error: value bound to if type must be boolean", binder);
                }
            },
            element: function (binder) {
                var bindAttrs = binder.getAttribute("bind")
                    .replace(/\s/g, "")
                    .split("|");

                bindAttrs.forEach(function (bindAttr) {
                    bindAttr = bindAttr.split("=>");

                    var property = bindAttr[0],
                        type = bindAttr[1];

                    if (property, type)
                        that.bind.types[type.match(/^\w+/)](property, binder, type);
                    else
                        console.error("syntax error:", "property and type must be set", binder);
                });
            }
        };
        this.value = {
            object: function (property) {
                var path = property.split("."),
                    value = vm[path[0]];

                path.splice(0, 1);

                while (path.length !== 0) {
                    value = value[path[0]];
                    path.splice(0, 1);
                }

                return value;
            },
            function: function (property, root) {
                var params = that.value.params(property),
                    values = [];
                if (params) {
                    params.forEach(function (param) {
                        values.push(that.value.get(param));
                    });
                }

                return vm[root].apply(undefined, values);
            },
            params: function (value) {
                var params = value.match(/\(.+?\)/);

                if (params) {
                    params = params[0]
                        .replace(/\(/, "")
                        .replace(/\)/, "")
                        .replace(/\s/g, "")
                        .split(",");

                    return params;
                }
            },
            get: function (property) {
                var root = property.match(/^[$\w\.]+/)[0];

                if (!vm[root])
                    return that.value.object(property);
                else if (typeof vm[root] === "function")
                    return that.value.function(property, root);
                else
                    return vm[root];
            },
            set: function (property, value) {
                if (vm[property] === undefined) {
                    var path = property.split("."),
                        prop = vm[path[0]];

                    path.splice(0, 1);

                    while (path.length !== 1) {
                        prop = prop[path[0]];
                        path.splice(0, 1);
                    }

                    prop[path[0]] = value;
                } else {
                    vm[property] = value;
                }
            }
        };
        this.getUses = function (binders) {
            var uses = {};

            for (var i = 0; i < binders.length; i++) {
                var value = binders[i].getAttribute("bind").split("=>")[0].replace(/^!/, "");

                if (uses[value]) {
                    uses[value].pos.push(i);
                } else if (value.match(/$item/) === null) {
                    uses[value] = {
                        pos: [i]
                    };

                    var params = that.value.params(value);

                    if (params) {
                        params.forEach(function (param) {
                            if (uses[param]) {
                                if (uses[param].func)
                                    uses[param].func.push(value);
                                else
                                    uses[param].func = [value];
                            } else {
                                uses[param] = {
                                    func: [value]
                                };
                            }
                        });
                    }
                }
            }

            return uses;
        };
        this.observe = function (obj, uses, binders, root) {
            Object.observe(obj, function (changes) {
                changes.forEach(function (change) {
                    var name = ((root) ? root : "") + change.name;

                    name = name.replace(/\.\d+$/, "");

                    if (name.match(/\.length$/, "") === null) {
                        if (change.name !== "$item" && change.name !== "$index") {
                            if (uses[name].pos) {
                                uses[name].pos.forEach(function (pos) {
                                    that.bind.element(binders[pos]);
                                });
                            }
                            if (uses[name].func) {
                                uses[name].func.forEach(function (func) {
                                    uses[func].pos.forEach(function (pos) {
                                        that.bind.element(binders[pos]);
                                    });
                                });
                            }
                        }
                    }
                });
            });
            for (var prop in obj) {
                if (typeof obj[prop] === "object" && prop !== "$item" && prop !== "$index") {
                    that.observe(obj[prop], uses, binders, ((root) ? root : "") + prop + ".");
                }
            }
        };
        this.init = function () {
            if (!scope)
                scope = document.body;

            var binders = scope.querySelectorAll("*[bind]"),
                uses = that.getUses(binders);

            that.observe(vm, uses, binders);

            for (var i = 0; i < binders.length; i++) {
                if (binders[i].getAttribute("bind").match(/\$item/) === null)
                    that.bind.element(binders[i]);
            }
        };

        this.init();
    };
})();
