include(function(utils_oop, utils_dom, Emitter) {

	var oop = utils_oop;
	var dom = utils_dom;
	
	return oop.defclass({
	
		base: Emitter,
	
		ctor: function Clipboard(view, parentElm)
		{
			oop.bindmethods(this, ["onPaste", "onCopy", "onCut"]);
			
			Emitter.call(this);
			
			this.parent = parentElm;
			
			this.textarea = dom.create(
				"textarea", this.parent, {
					position: "absolute", top: "0", left: "0", right: "0", bottom: "0",
					width: "100%", opacity: "0", backgroundColor: "red", padding: "0",
					margin: "0", outline: "0", border: "none", height: "100%", color: "blue"
				}
			);
			
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
