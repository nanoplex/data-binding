data binding library
====================

// TO-DO // intro

// TO-DO // model creation

SYNTAX
------

<\* bind="value=>type"></*>

types
-----

text
html
value
event(eventType)
attr(attrName)
repeat
if

#text

takes a string, number, object or a function, and the result of the function, or the value will be bound to the elements inner text

Examples:

prop=>text

func(prop, prop)=>text

object.prop=>text


#html

takes a string, number, object or a function, and the result of the function, or the value will be bound to the elements inner html

Examples:

prop=>html

func(prop, prop)=>html

object.prop=>html


#value

value can only be used on input elements, and takes a string, number, or an object, and the value will be bound to the inputs value

Examples:

prop=>value

object.prop=>value

#event

a function can be bound to an event on the object, any perameters passed to the function will be inserted after the event object, witch is passed to the function every time. specefy the events name in brackets after the type name.

Examples:

func=>event(click)

// view model //

"func": function (event) {

},

// ---------- //

func(prop)=>event(click)

// view model //

"func": function (event, prop) {

},

// ---------- //

#attr

takes a string, number, object or a function, and the result of the function, or the value will be bound to the specefyed attribute.

Examples:

prop=>attr(data-test)

func(prop, prop)=>attr(data-test)

object.prop=>attr(data-test)

#repeat

takes an array and goes through each item in the array and binds it the the html inside the element. the array item and index can be accessed through $item and $index

Example:

<div bind="array=>repeat">

<p bind="$item=>text|$index=>attr(data-i)"></p>

</div>

#if

takes a boolean and hides the element if false and shows the element if true

Examlpe:

boolean=>if

multiple
--------

you can bind multiple things to one element, seperate the commands with | 

Example:

value=>type|value=>type


#Object.observe polyfill by MaxArt2501

https://github.com/MaxArt2501/object-observe

