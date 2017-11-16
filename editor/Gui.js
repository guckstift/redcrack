include(function(utils_oop, View, Display, Keyboard, Mouse, Clipboard) {

	var oop = utils_oop;
	
	return oop.defclass({
	
		ctor: function Gui(buffer, parentElm)
		{
			oop.bindmethods(
				this,
				[
					"onChar", "onEnter", "onBackspace", "onDelete", "onTab", "onHome", "onEnd",
					"onCtrlA", "onMouseDown", "onMouseMove",
					"onPaste", "onCopy", "onCut",
				]
			);
			
			this.buffer = buffer;
			this.view = new View(this.buffer);
			this.display = new Display(this.view, parentElm);
			this.clip = new Clipboard(this.view, this.display.root);
			this.key = new Keyboard(this.clip.textarea);
			this.mouse = new Mouse(this.clip.textarea);
	
			this.key.register("ArrowLeft", this.onArrow.bind(this, "left"));
			this.key.register("ArrowRight", this.onArrow.bind(this, "right"));
			this.key.register("ArrowUp", this.onArrow.bind(this, "up"));
			this.key.register("ArrowDown", this.onArrow.bind(this, "down"));
			this.key.register("S-ArrowLeft", this.onShiftArrow.bind(this, "left"));
			this.key.register("S-ArrowRight", this.onShiftArrow.bind(this, "right"));
			this.key.register("S-ArrowUp", this.onShiftArrow.bind(this, "up"));
			this.key.register("S-ArrowDown", this.onShiftArrow.bind(this, "down"));
			this.key.register("Char", this.onChar);
			this.key.register("Enter", this.onEnter);
			this.key.register("Backspace", this.onBackspace);
			this.key.register("Delete", this.onDelete);
			this.key.register("Tab", this.onTab);
			this.key.register("Home", this.onHome);
			this.key.register("End", this.onEnd);
			this.key.register("S-Home", this.onHome);
			this.key.register("S-End", this.onEnd);
			this.key.register("C-a", this.onCtrlA);
			
			this.mouse.register("mousedown", this.onMouseDown);
			this.mouse.register("mousemove", this.onMouseMove);
			
			this.clip.register("copy", this.onCopy);
			this.clip.register("paste", this.onPaste);
			this.clip.register("cut", this.onCut);
		},
		
		onArrow: function(dir)
		{
			if(dir === "up" || dir === "down" || this.view.range.isEmpty()) {
				this.view.cursor[dir]();
			}
			else {
				if(dir === "left") {
					var newPos = this.view.range.getStart();
				}
				else {
					var newPos = this.view.range.getEnd();
				}
				
				this.view.cursor.set(newPos.row, newPos.offs);
			}
			
			this.view.range.stopSelecting();
		},
		
		onShiftArrow: function(dir)
		{
			this.view.range.startSelecting();
			this.view.cursor[dir]();
		},
		
		onChar: function(e)
		{
			this.view.replaceRangeText(e.key);
		},
		
		onEnter: function(e)
		{
			this.view.replaceRangeText("\n");
		},
		
		onBackspace: function(e)
		{
			if(this.view.range.isEmpty()) {
				this.view.cursor.left();
				this.view.range.startSelecting();
				this.view.cursor.right();
			}

			this.view.replaceRangeText("");
		},
		
		onDelete: function(e)
		{
			if(this.view.range.isEmpty()) {
				this.view.range.startSelecting();
				this.view.cursor.right();
			}

			this.view.replaceRangeText("");
		},
		
		onTab: function(e)
		{
			this.view.replaceRangeText("\t");
		},
		
		onHome: function(e)
		{
			if(e.shift) {
				this.view.range.startSelecting();
			}
			
			this.view.cursor.gotoLineStart();

			if(!e.shift) {
				this.view.range.stopSelecting();
			}
		},
		
		onEnd: function(e)
		{
			if(e.shift) {
				this.view.range.startSelecting();
			}
			
			this.view.cursor.gotoLineEnd();

			if(!e.shift) {
				this.view.range.stopSelecting();
			}
		},
		
		onCtrlA: function(e)
		{
			this.view.cursor.gotoStart();
			this.view.range.restartSelecting();
			this.view.cursor.gotoEnd();
		},
		
		onMouseDown: function(e)
		{
			if(e.primaryButton) {
				if(!e.shift) {
					this.view.range.stopSelecting();
				}
				
				this.view.cursor.gotoRowCol(
					this.display.screenYToRow(e.y),
					this.display.screenXToCol(e.x),
				);
			}
		},
		
		onMouseMove: function(e)
		{
			if(e.primaryButton) {
				this.view.range.startSelecting();
				this.view.cursor.gotoRowCol(
					this.display.screenYToRow(e.y),
					this.display.screenXToCol(e.x),
				);
			}
		},
		
		onPaste: function(e)
		{
			this.view.replaceRangeText(e.text);
		},
		
		onCopy: function(e)
		{
			e.text = this.view.getRangeText();
		},
		
		onCut: function(e)
		{
			e.text = this.view.getRangeText();
			this.view.replaceRangeText("");
		},
	});

});
