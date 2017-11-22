include(function() {

	return {
	
		elm: function(opts)
		{
			var tag = opts.tag || "div";
			var attribs = opts.attribs || {};
			var classes = opts.classes || [];
			var styles = opts.styles || {};
			var content = opts.content || "";
			var elm = document.createElement(tag);
	
			for(var i=0; i<classes.length; i++) {
				elm.classList.add(classes[i]);
			}
	
			for(var attrib in attribs) {
				if(attribs.hasOwnProperty(attrib)) {
					elm.setAttribute(attrib, attribs[attrib]);
				}
			}
	
			for(var style in styles) {
				if(styles.hasOwnProperty(style)) {
					elm.style[style] = styles[style];
				}
			}
	
			elm.innerHTML = content;
			
			return elm;
		},
		
		div: function(opts)
		{
			opts = opts || {};
			opts.tag = "div";
			return this.elm(opts);
		},
		
		span: function(opts)
		{
			opts = opts || {};
			opts.tag = "span";
			return this.elm(opts);
		},
		
		textarea: function(opts)
		{
			opts = opts || {};
			opts.tag = "textarea";
			return this.elm(opts);
		},
	
	};

});
