var Model;

(function () {
    "use strict";

    Model = function (vm, scope) {
        var that = this;
        this.bind = {
            element: function (binder) {
                var bindAttrs = binder.getAttribute("bind")
                    .replace(/\s/g, "")
                    .split(",");

                bindAttrs.forEach(function (bindAttr) {
                    bindAttr = bindAttr.split("=>");

                    var property = bindAttr[0],
                        type = bindAttr[1];

                    if (type === "text")
                        binder.innerHTML = that.getValue(property);
                    else if (type === "value")
                        that.bind.value(property, binder);
                    else if (type.match(/^\w+/)[0] === "event")
                        that.bind.event(property, type, binder);
                    else if (type.match(/^\w+/)[0] === "attr")
                        that.bind.attr(property, type, binder);
                    else if (type === "repeat")
                        that.bind.repeat(property, binder);
                });
            },
            value: function (property, binder) {
                if (binder.nodeName === "INPUT") {
                    var event = "input";

                    if (binder.type === "checkbox") {
                        event = "change";
                    }

                    binder.value = that.getValue(property);

                    binder.addEventListener(event, function () {
                        that.setValue(property, this.value);
                    });
                } else {
                    console.error("element bound with value type must be input");
                }
            },
            event: function (property, type, binder) {
                var event = type
                    .match(/\(.+?\)/)[0]
                    .replace(/\(/, "")
                    .replace(/\)/, "");

                binder.addEventListener(event, function(e) {
                    vm[property](e);
                });
            },
            attr: function (property, type, binder) {
                var attr = type
                    .match(/\(.+?\)/)[0]
                    .replace(/\(/, "")
                    .replace(/\)/, "");

                binder.setAttribute(attr, that.getValue(property));
            },
            repeat: function (property, binder) {
            }
        };
        this.getValue = function (property) {
            if (!vm[property]) {
                var path = property.split("."),
                    value = vm[path[0]];

                path.splice(0, 1);

                while (path.length !== 0) {
                    value = value[path[0]];
                    path.splice(0, 1);
                }

                return value;
            } else
                return vm[property];
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
        this.getUses = function (binders) {
            var uses = {};

            for (var i = 0; i < binders.length; i++) {
                var value = binders[i].getAttribute("bind").split("=>")[0];

                if (uses[value]) {
                    uses[value].push(i);
                } else if (value !== "$item") {
                    uses[value] = [i];
                }
            }

            return uses;
        };
        this.observe = function (obj, uses, binders, root) {
            Object.observe(obj, function (changes) {
                changes.forEach(function (change) {
                    console.log(root, change.name);
                    uses[((root) ? root : "") + change.name].forEach(function (i) {
                        that.bind.element(binders[i]);
                    });
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
