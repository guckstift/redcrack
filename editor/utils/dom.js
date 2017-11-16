include(function() {

	return {

		create: function(tag, parent, styles, attributes, innerHtml)
		{
			styles = styles || { };
			attributes = attributes || { };
			innerHtml = innerHtml || "";
	
			var elm = document.createElement(tag);
	
			for(var prop in styles) {
				if(styles.hasOwnProperty(prop)) {
					elm.style[prop] = styles[prop];
				}
			}
	
			for(var prop in attributes) {
				if(attributes.hasOwnProperty(prop)) {
					elm.setAttribute(prop, attributes[prop]);
				}
			}
	
			elm.innerHTML = innerHtml;
			parent.appendChild(elm);
	
			return elm;
		},
	
	};

});
