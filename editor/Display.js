include(function(utils_oop, utils_dom, utils_string, utils, Ticker) {

	var cssLoaded = false;
	var oop = utils_oop;
	var dom = utils_dom;
	var string = utils_string;
	
	addEventListener("load", function()
	{
		var editorCssFound = false;
		
		for(var i=0; i<document.styleSheets.length; i++) {
			var sheet = document.styleSheets[i];
		
			if(sheet.cssRules !== null) {
				for(var j=0; j<sheet.cssRules.length; j++) {
					var rule = sheet.cssRules[j];
				
					if(rule.selectorText === ".editor-css-loaded") {
						editorCssFound = true;
						break;
					}
				}
			}
		
			if(editorCssFound) {
				break;
			}
		}
	
		if(!editorCssFound) {
			document.head.appendChild(dom.elm({
				tag: "link",
				attribs: {
					rel: "stylesheet",
					href: "./editor/editor.css",
				},
			}));
		}
	});
	
	return oop.defclass({
	
		ctor: function Display(view, parentElm)
		{
			oop.bindmethods(
				this,
				[
					"updateCaret", "updateSelection", "onBufferChange", "blinkCaret",
					"onTokenizerChange"
				]
			);
			
			this.view = view;
			this.buffer = this.view.buffer;
			this.range = this.view.range;
			this.tokenizer = this.view.tokenizer;
			this.cursor = this.range.head;
			this.parent = parentElm;
			this.measureCount = 256;
			this.scrollPos = {x: 0, y: 0};
			this.caretTicker = new Ticker(500, this.blinkCaret.bind(this));
			this.cssPollTicker = new Ticker(100, this.pollCss.bind(this));
			
			this.initDomElements();
			this.updateCellSize();
			this.cssPollTicker.restart();
			
			this.cursor.register("change", this.updateCaret);
			this.range.register("change", this.updateSelection);
			this.buffer.register("change", this.onBufferChange);
			this.tokenizer.register("change", this.onTokenizerChange);
		},
		
		screenYToRow: function(y)
		{
			return Math.floor((y + this.scrollPos.y) / this.cellHeight);
		},
		
		screenXToCol: function(x)
		{
			return (x + this.scrollPos.x) / this.cellWidth;
		},
		
		initDomElements: function()
		{
			this.root = this.parent.appendChild(dom.div({
				classes: ["editor"],
			}));
				this.editarea = this.root.appendChild(dom.div({
					classes: ["editor-editarea"],
				}));
					this.scrollarea = this.editarea.appendChild(dom.div({
						classes: ["editor-scrollarea"],
					}));
						this.selectionFirst = this.scrollarea.appendChild(dom.div({
							classes: ["editor-selection"],
						}));
						this.selectionLast = this.scrollarea.appendChild(dom.div({
							classes: ["editor-selection"],
						}));
						this.selectionMiddle = this.scrollarea.appendChild(dom.div({
							classes: ["editor-selection"],
						}));
						this.caret = this.scrollarea.appendChild(dom.div({
							classes: ["editor-caret"],
						}));
						this.content = this.scrollarea.appendChild(dom.div({
							classes: ["editor-content"],
							content: "<div></div>",
						}));
						this.measureBox = this.scrollarea.appendChild(dom.div({
							classes: ["editor-measurebox"],
						}));
							this.baseMeasureChar = this.measureBox.appendChild(dom.span());
							this.refMeasureChar = this.measureBox.appendChild(dom.span({
								content: "A",
							}));
				this.lineGutter = this.root.appendChild(dom.div({
					classes: ["editor-linegutter"],
					content: "<div>1</div>",
				}));
				this.inputarea = this.root.appendChild(dom.div({
					classes: ["editor-inputarea"],
				}));
					this.textarea = this.inputarea.appendChild(dom.textarea({
						classes: ["editor-textarea"],
					}));
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
			
			this.updateCaret();
			this.updateSelection();
			this.updateLineGutter();
		},
	
		updateCaret: function()
		{
			this.caret.style.height = this.cellHeight + "px";
			this.caret.style.left = (this.cursor.getCol() * this.cellWidth) + "px";
			this.caret.style.top = (this.cursor.row * this.cellHeight) + "px";
			this.restartBlinkCaret();
			
			var editareaRect = this.editarea.getBoundingClientRect();
			var caretRect = this.caret.getBoundingClientRect();
			var offsX = caretRect.x - editareaRect.x;
			var offsY = caretRect.y - editareaRect.y;
			var editW = editareaRect.width;
			var editH = editareaRect.height;
			var caretW = caretRect.width;
			var caretH = caretRect.height;
			
			if(offsY + caretH > editH) {
				this.setScrollPos(this.scrollPos.x, this.scrollPos.y + (offsY + caretH - editH) + 2);
			}
			
			if(offsY < 0) {
				this.setScrollPos(this.scrollPos.x, this.scrollPos.y + offsY - 2);
			}
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
			var curClass = "";
			
			for(var i=0; i<line.length; i++) {
				var ch = line[i];
				var newClass = this.tokenizer.classifyAt(row, i);
				
				if(newClass !== curClass) {
					if(curClass !== "") {
						html += "</span>";
					}
					
					html += "<span class=\"editor-tok-" + newClass + "\">";
					curClass = newClass;
				}
				
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
			
			html += "</span>";
			
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
		
		updateLineGutter: function(rowCountChange)
		{
			while(rowCountChange < 0) {
				this.lineGutter.removeChild(this.lineGutter.lastChild);
				rowCountChange++;
			}
			
			while(rowCountChange > 0) {
				var nextNumber = this.lineGutter.children.length + 1;
				var newChild = document.createElement("div");
				newChild.innerHTML = nextNumber;
				this.lineGutter.appendChild(newChild);
				rowCountChange--;
			}
			
			var lineGutterWidth = this.lineGutter.getBoundingClientRect().width;
			
			this.editarea.style.left = lineGutterWidth + "px";
			this.inputarea.style.left = lineGutterWidth + "px";
		},
		
		updateScrollPos: function()
		{
			this.scrollarea.style.left = -this.scrollPos.x + "px";
			this.scrollarea.style.top = -this.scrollPos.y + "px";
			this.lineGutter.style.top = -this.scrollPos.y + "px";
		},
		
		blinkCaret: function()
		{
			if(this.caret.style.visibility === "visible") {
				this.caret.style.visibility = "hidden";
			}
			else {
				this.caret.style.visibility = "visible";
			}
		},
		
		restartBlinkCaret: function()
		{
			this.caret.style.visibility = "visible";
			this.caretTicker.restart();
		},
		
		pollCss: function()
		{
			var editorCssFound = false;
	
			for(var i=0; i<document.styleSheets.length; i++) {
				var sheet = document.styleSheets[i];
		
				if(sheet.cssRules !== null) {
					for(var j=0; j<sheet.cssRules.length; j++) {
						var rule = sheet.cssRules[j];
				
						if(rule.selectorText === ".editor-css-loaded") {
							editorCssFound = true;
							break;
						}
					}
				}
		
				if(editorCssFound) {
					break;
				}
			}
			
			if(editorCssFound) {
				this.cssPollTicker.stop();
				this.updateCellSize();
			}
		},
		
		setScrollPos: function(x, y)
		{
			var contentRect = this.content.getBoundingClientRect();
			var editareaRect = this.editarea.getBoundingClientRect();
			
			this.scrollPos = {
				x: x,
				y: utils.clamp(0, contentRect.height - editareaRect.height, y),
			};
			this.updateScrollPos();
		},
		
		scroll: function(dir)
		{
			if(dir === "down") {
				this.setScrollPos(this.scrollPos.x, this.scrollPos.y + this.cellHeight * 5);
			}
			else if(dir === "up") {
				this.setScrollPos(this.scrollPos.x, this.scrollPos.y - this.cellHeight * 5);
			}
		},
		
		onBufferChange: function(e)
		{
			this.updateLines(e.firstRow, e.delRows, e.newRows);
			this.updateLineGutter(e.newRows - e.delRows);
		},
		
		onTokenizerChange: function(e)
		{
			this.updateLine(e.row);
		},
	
	});

});
