include(function(utils_oop, utils_dom, Emitter) {

	var oop = utils_oop;
	var dom = utils_dom;
	
	return oop.defclass({
	
		base: Emitter,
	
		ctor: function Clipboard(display)
		{
			oop.bindmethods(this, ["onPaste", "onCopy", "onCut"]);
			
			Emitter.call(this);
			
			this.display = display;
			this.textarea = this.display.textarea;
			
			this.textarea.addEventListener("paste", this.onPaste);
			this.textarea.addEventListener("copy", this.onCopy);
			this.textarea.addEventListener("cut", this.onCut);
		},
		
		onPaste: function(e)
		{
			this.trigger("paste", { text: e.clipboardData.getData("text") });
			e.preventDefault();
		},
		
		onCopy: function(e)
		{
			var eventData = { text: "" };
			
			this.trigger("copy", eventData);
			e.clipboardData.setData("text", eventData.text);
			e.preventDefault();
		},
		
		onCut: function(e)
		{
			var eventData = { text: "" };
			
			this.trigger("cut", eventData);
			e.clipboardData.setData("text", eventData.text);
			e.preventDefault();
		},
		
	});
	
});
