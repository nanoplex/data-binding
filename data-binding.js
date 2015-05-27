var Model;

(function () {
    "use strict";

    Model = function (vm, scope) {
        var that = this;
        this.bind = {
            types: {
                text: function (property, binder) {
                    binder.innerHTML = that.getValue(property);
                },
                value: function (property, binder) {
                    if (binder.nodeName === "INPUT") {
                        var event = "input";

                        if (binder.type === "checkbox")
                            event = "change";

                        binder.value = that.getValue(property);
                        binder.addEventListener(event, function () {
                            that.setValue(property, this.value);
                        });
                    } else {
                        console.error("element bound with value type must be input");
                    }
                },
                event: function (property, binder, type) {
                    var event = type
                        .match(/\(.+?\)/)[0]
                        .replace(/\(/, "")
                        .replace(/\)/, "");

                    binder.addEventListener(event, function(e) {
                        vm[property](e);
                    });
                },
                attr: function (property, binder, type) {
                    var attr = type
                        .match(/\(.+?\)/)[0]
                        .replace(/\(/, "")
                        .replace(/\)/, "");

                    binder.setAttribute(attr, that.getValue(property));
                },
                repeat: function (property, binder) {

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

                    that.bind.types[type.match(/^\w+/)](property, binder, type);
                });
            }
        };
        this.getObject = function (property) {
            var path = property.split("."),
                value = vm[path[0]];

            path.splice(0, 1);

            while (path.length !== 0) {
                value = value[path[0]];
                path.splice(0, 1);
            }

            return value;
        },
        this.getFunction = function (property, root) {
            var params = that.getParams(property),
                values = [];

            params.forEach(function (param) {
                values.push(that.getValue(param));
            });

            return vm[root].apply(undefined, values);
        },
        this.getValue = function (property) {
            var root = property.match(/^[\w.]+/)[0];

            if (!vm[root])
                return that.getObject(property);
            else if (typeof vm[root] === "function")
                return that.getFunction(property, root);
            else
                return vm[root];
        };
        this.setValue = function (property, value) {
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
        };
        this.getParams = function (value) {
            var params = value.match(/\(.+?\)/);

            if (params) {
                params = params[0]
                    .replace(/\(/, "")
                    .replace(/\)/, "")
                    .replace(/\s/g, "")
                    .split(",");

                return params;
            }
        };
        this.getUses = function (binders) {
            var uses = {};

            for (var i = 0; i < binders.length; i++) {
                var value = binders[i].getAttribute("bind").split("=>")[0];

                if (uses[value]) {
                    uses[value].pos.push(i);
                } else if (value.match(/$item/) === null) {
                    uses[value] = {
                        pos: [i]
                    };

                    var params = that.getParams(value);

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
                });
            });
            for (var prop in obj) {
                if (typeof obj[prop] === "object")
                    that.observe(obj[prop], uses, binders, ((root) ? root : "") + prop + ".");
            }
        };
        this.init = function () {
            var binders,
                uses;

            if (!scope)
                scope = document.body;

            binders = scope.querySelectorAll("*[bind]");

            uses = that.getUses(binders);
            console.log("uses", uses);

            that.observe(vm, uses, binders);

            for (var i = 0; i < binders.length; i++) {
                that.bind.element(binders[i]);
            }
        };

        this.init();
    };
})();
