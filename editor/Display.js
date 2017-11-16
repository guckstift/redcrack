include(function(utils_oop, utils_dom, utils_string, Emitter) {

	var oop = utils_oop;
	var dom = utils_dom;
	var string = utils_string;
	
	return oop.defclass({
	
		base: Emitter,
	
		ctor: function Display(view, parentElm)
		{
			oop.bindmethods(
				this,
				[
					"updateCaret", "updateSelection", "onBufferChange", "blinkCaret",
				]
			);
			
			Emitter.call(this);
			
			this.view = view;
			this.buffer = this.view.buffer;
			this.range = this.view.range;
			this.cursor = this.range.head;
			this.parent = parentElm;
			this.measureCount = 256;
			this.tabWidth = 4;
			
			this.initDomElements();
			this.updateCellSize();
			this.updateCaret();
			
			this.cursor.register("change", this.updateCaret);
			this.range.register("change", this.updateSelection);
			this.buffer.register("change", this.onBufferChange);
			
			this.startBlinkCaret();
		},
		
		screenYToRow: function(y)
		{
			return Math.floor(y / this.cellHeight);
		},
		
		screenXToCol: function(x)
		{
			return x / this.cellWidth;
		},
		
		initDomElements: function()
		{
			this.root = dom.create(
				"div", this.parent, {
					width: "100%", height: "256px", backgroundColor: "#ccc",
					fontFamily: "monospace", position: "relative", outline: "none", cursor: "text"
				}
			);
		
			this.selectionFirst = dom.create(
				"div", this.root, {
					position: "absolute", left: "0px", top: "0px", backgroundColor: "#9cf",
				}
			);
		
			this.selectionLast = dom.create(
				"div", this.root, {
					position: "absolute", left: "0px", top: "0px", backgroundColor: "#9cf",
				}
			);
		
			this.selectionMiddle = dom.create(
				"div", this.root, {
					position: "absolute", left: "0px", top: "0px", backgroundColor: "#9cf",
				}
			);
		
			this.caret = dom.create(
				"div", this.root, {
					display: "block",
					width: "1px", height: "1px", position: "absolute", left: "0px", top: "0px",
					backgroundColor: "#000"
				}
			);
		
			this.content = dom.create(
				"div", this.root, {
					whiteSpace: "pre", tabSize: "4", position: "relative"
				}, {}, "<div></div>"
			);
		
			this.measureBox = dom.create(
				"div", this.root, {
					fontFamily: "monospace", visibility: "hidden", display: "none"
				}
			);
		
			this.baseMeasureChar = dom.create("span", this.measureBox);
		
			this.refMeasureChar = dom.create("span", this.measureBox, {}, {}, "A");
		},

		updateCellSize: function()
		{
			this.measureBox.style.display = "block";
		
			this.baseMeasureChar.innerHTML = string.repeat("A", this.measureCount);
			this.cellWidth = this.refMeasureChar.offsetLeft - this.baseMeasureChar.offsetLeft;
			this.cellWidth /= this.measureCount;
		
			this.baseMeasureChar.innerHTML = string.repeat("A<br>", this.measureCount);
			this.cellHeight = this.refMeasureChar.offsetTop - this.baseMeasureChar.offsetTop;
			this.cellHeight /= this.measureCount;
		
			this.measureBox.style.display = "none";
		},
	
		updateCaret: function()
		{
			this.caret.style.height = this.cellHeight + "px";
			this.caret.style.left = (this.cursor.getCol() * this.cellWidth) + "px";
			this.caret.style.top = (this.cursor.row * this.cellHeight) + "px";
			this.startBlinkCaret();
		},
	
		updateSelection: function()
		{
			var start = this.range.getStart();
			var end = this.range.getEnd();
			var startCol = start.getCol();
			var endCol = end.getCol();
			var rows = this.range.getRows();
		
			this.selectionMiddle.style.display = "none";
			this.selectionFirst.style.display = "none";
			this.selectionLast.style.display = "none";
		
			if(rows >= 3) {
				this.selectionMiddle.style.display = "block";
				this.selectionMiddle.style.left = "0";
				this.selectionMiddle.style.top = (start.row + 1) * this.cellHeight + "px";
				this.selectionMiddle.style.right = "0";
				this.selectionMiddle.style.height = (rows - 2) * this.cellHeight + "px";
			}
		
			if(rows >= 2) {
				this.selectionLast.style.display = "block";
				this.selectionLast.style.left = "0";
				this.selectionLast.style.top = end.row * this.cellHeight + "px";
				this.selectionLast.style.width = endCol * this.cellWidth + "px";
				this.selectionLast.style.height = this.cellHeight + "px";
				this.selectionFirst.style.right = "0";
				this.selectionFirst.style.width = "";
			}
		
			if(rows >= 1) {
				this.selectionFirst.style.display = "block";
				this.selectionFirst.style.left = startCol * this.cellWidth + "px";
				this.selectionFirst.style.top = start.row * this.cellHeight + "px";
				this.selectionFirst.style.height = this.cellHeight + "px";
			}
		
			if(rows === 1) {
				this.selectionFirst.style.right = "";
				this.selectionFirst.style.width = (
					(endCol - startCol) * this.cellWidth + "px"
				);
			}
		},
	
		updateLine: function(row)
		{
			var line = this.buffer.getLine(row);
			var html = "";
			var col = 0;
			
			for(var i=0; i<line.length; i++) {
				var ch = line[i];
				
				if(ch === "<") {
					html += "&lt;";
					col++;
				}
				else if(ch === ">") {
					html += "&gt;";
					col++;
				}
				else if(ch === "\t") {
					var tabcols = this.view.nextTabCol(col) - col;
					
					html += string.repeat("&nbsp;", tabcols);
					col += tabcols;
				}
				else {
					html += ch;
					col++;
				}
			}
			
			this.content.children[row].innerHTML = html + "&nbsp;";
		},
	
		updateLines: function(firstRow, delRows, newRows)
		{
			for(var i=0; i<delRows; i++) {
				this.content.children[firstRow].remove();
			}
		
			for(var i=0; i<newRows; i++) {
				var newElm = document.createElement("div");
				this.content.insertBefore(newElm, this.content.children[firstRow]);
			}
		
			for(var i=0; i<newRows; i++) {
				this.updateLine(firstRow + i);
			}
		},
		
		startBlinkCaret: function()
		{
			clearTimeout(this.blinkTimeoutId);
			this.caret.style.display = "block";
			this.blinkTimeoutId = setTimeout(this.blinkCaret, 500);
		},
		
		stopBlinkCaret: function()
		{
			clearTimeout(this.blinkTimeoutId);
			this.caret.style.display = "block";
		},
		
		blinkCaret: function()
		{
			if(this.caret.style.display === "block") {
				this.caret.style.display = "none";
			}
			else {
				this.caret.style.display = "block";
			}
			
			this.blinkTimeoutId = setTimeout(this.blinkCaret, 500);
		},
		
		onBufferChange: function(e)
		{
			this.updateLines(e.firstRow, e.delRows, e.newRows);
		},
	
	});

});
