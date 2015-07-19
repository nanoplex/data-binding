nanoplex data binding
---------------------


#expressions
bind variables, functions and objects to attributes and inside elements

usage
-----
attr="{{var}}"
<pre><el>{{var}}</el>
<el>{{func(var)}}</el>
<el>{{object.path.string}}</el>
</pre>

example
-------
<p data-test="{{var}}">{{function(var, var1)}}</p>
<p>{{object.string}}</p>


#events
bind a function to an event, works on every element

usage
-----
attribute event="function:event"

example
-------
<input type="text" event="validate:input" />


#template

repeat
------
bind array to template, the inside of template will get repeated, you can access the array through {{_item}} and {{_index}}. 

usage
repeat="array"

example
<template repeat="array">
	// tempalte
</template>

show
----

usage
show="{{boolean}}"

example
<template show="{{boolean}}">
	// template
</template>


#init