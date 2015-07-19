nanoplex data binding
---------------------


#expressions
bind variables, functions and objects to attributes and inside elements

usage
-----
<pre>
	attr="{{var}}"
	<el>{{var}}</el>
	<el>{{func(var)}}</el>
	<el>{{object.path.string}}</el>
</pre>

example
-------
<pre>
	<p data-test="{{var}}">{{function(var, var1)}}</p>
	<p>{{object.string}}</p>
</pre>


#events
bind a function to an event, works on every element

usage
-----
attribute event="function:event"

example
-------
<pre>
	<input type="text" event="validate:input" />
</pre>


#template

repeat
------
bind array to template, the inside of template will get repeated, you can access the array through {{_item}} and {{_index}}. 

usage
repeat="array"

example
<pre>
	<template repeat="array">
		// tempalte
	</template>
</pre>

show
----

usage
show="{{boolean}}"

example
<pre>
	<template show="array">
		// tempalte
	</template>
</pre>



#init