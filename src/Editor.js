import Buffer from "./Buffer.js";
import View from "./View.js";
import Display from "./Display.js";
import Clipboard from "./Clipboard.js";
import Keyboard from "./Keyboard.js";
import Mouse from "./Mouse.js";
import JavaScriptTokenizer from "./JavaScriptTokenizer.js";

export default class Editor
{
	constructor()
	{
		this.buffer = new Buffer();
		this.view = new View(this.buffer, 4, JavaScriptTokenizer);
		this.display = new Display(this.view, document.body);
		this.clip = new Clipboard(this.display);
		this.key = new Keyboard(this.clip.textarea);
		this.mouse = new Mouse(this.clip.textarea);
		this.cursor = this.view.cursor;
		this.range = this.view.range;
		
		this.key.register("ArrowLeft", () => this.gotoLeft());
		this.key.register("ArrowRight", () => this.gotoRight());
		this.key.register("ArrowUp", () => this.gotoUp());
		this.key.register("ArrowDown", () => this.gotoDown());
		this.key.register("C-ArrowLeft", this.gotoPrevToken.bind(this, false));
		this.key.register("C-ArrowRight", this.gotoNextToken.bind(this, false));
		this.key.register("S-ArrowLeft", this.selectDir.bind(this, "left"));
		this.key.register("S-ArrowRight", this.selectDir.bind(this, "right"));
		this.key.register("S-ArrowUp", this.selectDir.bind(this, "up"));
		this.key.register("S-ArrowDown", this.selectDir.bind(this, "down"));
		this.key.register("C-S-ArrowLeft", this.gotoPrevToken.bind(this, true));
		this.key.register("C-S-ArrowRight", this.gotoNextToken.bind(this, true));
		this.key.register("Home", this.gotoLineStart.bind(this, false));
		this.key.register("End", this.gotoLineEnd.bind(this, false));
		this.key.register("S-Home", this.gotoLineStart.bind(this, true));
		this.key.register("S-End", this.gotoLineEnd.bind(this, true));
		this.key.register("C-a", this.selectAll.bind(this));
		this.key.register("PageUp", this.pageMove.bind(this, "up", false));
		this.key.register("PageDown", this.pageMove.bind(this, "down", false));
		this.key.register("S-PageUp", this.pageMove.bind(this, "up", true));
		this.key.register("S-PageDown", this.pageMove.bind(this, "down", true));
		this.key.register("Char", function(e) { this.replaceText(e.key); }.bind(this));
		this.key.register("Enter", this.breakLine.bind(this));
		this.key.register("Backspace", this.backspace.bind(this));
		this.key.register("Delete", this.del.bind(this));
		this.key.register("Tab", this.indent.bind(this));
		
		this.mouse.register("mousedown", this.onMouseDown.bind(this));
		this.mouse.register("mousemove", this.onMouseMove.bind(this));
		this.mouse.register("dblclick", this.onDblClick.bind(this));
		this.mouse.register("wheelup", this.display.scroll.bind(this.display, "up"));
		this.mouse.register("wheeldown", this.display.scroll.bind(this.display, "down"));
		
		this.clip.register("copy", function(e) { e.text = this.getText(); }.bind(this));
		this.clip.register("paste", function(e) { this.replaceText(e.text); }.bind(this));
		this.clip.register("cut", this.onCut.bind(this));
	}
	
	replaceText(text)
	{
		this.view.replaceRangeText(text);
	}
	
	getText()
	{
		return this.view.getRangeText();
	}
	
	gotoDir(dir)
	{
		if(dir === "up" || dir === "down" || this.range.isEmpty()) {
			this.cursor[dir]();
		}
		else {
			if(dir === "left") {
				var newPos = this.range.getStart();
			}
			else {
				var newPos = this.range.getEnd();
			}
			
			this.cursor.set(newPos.row, newPos.offs);
		}
		
		this.range.stopSelecting();
	}
	
	selectDir(dir)
	{
		this.range.startSelecting();
		this.cursor[dir]();
	}
	
	pageMove(dir, selecting)
	{
		if(selecting) {
			this.range.startSelecting();
		}
		
		if(dir === "up") {
			this.cursor.pageUp();
		}
		else if(dir === "down") {
			this.cursor.pageDown();
		}

		if(!selecting) {
			this.range.stopSelecting();
		}
	}
	
	gotoLeft()
	{
		this.gotoDir("left");
	}
	
	gotoRight()
	{
		this.gotoDir("right");
	}
	
	gotoUp()
	{
		this.gotoDir("up");
	}
	
	gotoDown()
	{
		this.gotoDir("down");
	}
	
	gotoLineStart(selecting)
	{
		if(selecting) {
			this.range.startSelecting();
		}
		
		this.cursor.gotoLineStart();

		if(!selecting) {
			this.range.stopSelecting();
		}
	}
	
	gotoLineEnd(selecting)
	{
		if(selecting) {
			this.range.startSelecting();
		}
		
		this.cursor.gotoLineEnd();

		if(!selecting) {
			this.range.stopSelecting();
		}
	}
	
	gotoPrevToken(selecting)
	{
		if(selecting) {
			this.range.startSelecting();
		}
		
		if(this.cursor.isAtLineStart()) {
			this.cursor.left();
		}
		else {
			this.cursor.left();
			this.cursor.gotoTokenStart();
		}

		if(!selecting) {
			this.range.stopSelecting();
		}
	}
	
	gotoNextToken(selecting)
	{
		if(selecting) {
			this.range.startSelecting();
		}
		
		if(this.cursor.isAtLineEnd()) {
			this.cursor.right();
		}
		else {
			this.cursor.gotoTokenEnd();
		}
		
		if(!selecting) {
			this.range.stopSelecting();
		}
	}
	
	selectLeft()
	{
		this.selectDir("left");
	}
	
	selectRight()
	{
		this.selectDir("right");
	}
	
	selectUp()
	{
		this.selectDir("up");
	}
	
	selectDown()
	{
		this.selectDir("down");
	}
	
	selectAll()
	{
		this.cursor.gotoStart();
		this.range.restartSelecting();
		this.cursor.gotoEnd();
	}
	
	breakLine()
	{
		this.replaceText("\n");
	}
	
	backspace()
	{
		if(this.range.isEmpty()) {
			this.cursor.left();
			this.range.startSelecting();
			this.cursor.right();
		}

		this.replaceText("");
	}
	
	del()
	{
		if(this.range.isEmpty()) {
			this.range.startSelecting();
			this.cursor.right();
		}

		this.replaceText("");
	}
	
	indent()
	{
		this.replaceText("\t");
	}
	
	onCut(e)
	{
		e.text = this.getText();
		this.replaceText("");
	}
	
	onMouseDown(e)
	{
		if(e.primaryButton) {
			if(!e.shift) {
				this.range.stopSelecting();
			}
			
			this.cursor.gotoRowCol(
				this.display.screenYToRow(e.y),
				this.display.screenXToCol(e.x),
			);
		}
	}
	
	onMouseMove(e)
	{
		if(e.primaryButton) {
			this.range.startSelecting();
			this.cursor.gotoRowCol(
				this.display.screenYToRow(e.y),
				this.display.screenXToCol(e.x),
			);
		}
	}
	
	onDblClick(e)
	{
		this.cursor.gotoTokenStart();
		this.range.restartSelecting();
		this.cursor.gotoTokenEnd();
	}
}
