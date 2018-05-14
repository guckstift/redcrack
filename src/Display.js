import dom from "./utils/dom.js";
import utils from "./utils/utils.js";
import Ticker from "./Ticker.js";

var cssLoaded = false;

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
				href: "./src/editor.css",
			},
		}));
	}
});

export default class Display
{
	constructor(view, parentElm)
	{
		this.view = view;
		this.buffer = this.view.buffer;
		this.range = this.view.range;
		this.tokenizer = this.view.tokenizer;
		this.cursor = this.range.head;
		this.parent = parentElm;
		this.measureCount = 256;
		this.scrollPos     = {x: 0, y: 0};
		this.caretTicker   = new Ticker(500, () => this.blinkCaret());
		this.cssPollTicker = new Ticker(100, () => this.pollCss());
		
		this.initDomElements();
		this.updateCellSize();
		this.cssPollTicker.restart();
		
		this.cursor.register("change", this, "updateCaret");
		this.range.register("change", this, "updateSelection");
		this.buffer.register("change", this, "onBufferChange");
		this.tokenizer.register("change", this, "onTokenizerChange");
	}
	
	screenYToRow(y)
	{
		return Math.floor((y + this.scrollPos.y) / this.cellHeight);
	}
	
	screenXToCol(x)
	{
		return (x + this.scrollPos.x) / this.cellWidth;
	}
	
	initDomElements()
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
	}

	updateCellSize()
	{
		this.measureBox.style.display = "block";
	
		this.baseMeasureChar.innerHTML = "A".repeat(this.measureCount);
		this.cellWidth = this.refMeasureChar.offsetLeft - this.baseMeasureChar.offsetLeft;
		this.cellWidth /= this.measureCount;
	
		this.baseMeasureChar.innerHTML = "A<br>".repeat(this.measureCount);
		this.cellHeight = this.refMeasureChar.offsetTop - this.baseMeasureChar.offsetTop;
		this.cellHeight /= this.measureCount;
	
		this.measureBox.style.display = "none";
		
		this.updateCaret();
		this.updateSelection();
		this.updateLineGutter();
	}

	updateCaret()
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
	}

	updateSelection()
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
	}

	updateLine(row)
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
				
				html += "&nbsp;".repeat(tabcols);
				col += tabcols;
			}
			else {
				html += ch;
				col++;
			}
		}
		
		html += "</span>";
		
		this.content.children[row].innerHTML = html + "&nbsp;";
	}

	updateLines(firstRow, delRows, newRows)
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
	}
	
	updateLineGutter(rowCountChange)
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
	}
	
	updateScrollPos()
	{
		this.scrollarea.style.left = -this.scrollPos.x + "px";
		this.scrollarea.style.top = -this.scrollPos.y + "px";
		this.lineGutter.style.top = -this.scrollPos.y + "px";
	}
	
	blinkCaret()
	{
		if(this.caret.style.visibility === "visible") {
			this.caret.style.visibility = "hidden";
		}
		else {
			this.caret.style.visibility = "visible";
		}
	}
	
	restartBlinkCaret()
	{
		this.caret.style.visibility = "visible";
		this.caretTicker.restart();
	}
	
	pollCss()
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
	}
	
	setScrollPos(x, y)
	{
		var contentRect = this.content.getBoundingClientRect();
		var editareaRect = this.editarea.getBoundingClientRect();
		
		this.scrollPos = {
			x: x,
			y: utils.clamp(0, contentRect.height - editareaRect.height, y),
		};
		this.updateScrollPos();
	}
	
	scroll(dir)
	{
		if(dir === "down") {
			this.setScrollPos(this.scrollPos.x, this.scrollPos.y + this.cellHeight * 5);
		}
		else if(dir === "up") {
			this.setScrollPos(this.scrollPos.x, this.scrollPos.y - this.cellHeight * 5);
		}
	}
	
	onBufferChange(e)
	{
		this.updateLines(e.firstRow, e.delRows, e.newRows);
		this.updateLineGutter(e.newRows - e.delRows);
	}
	
	onTokenizerChange(e)
	{
		this.updateLine(e.row);
	}
}
