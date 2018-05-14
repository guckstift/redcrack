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
		this.buffer  = new Buffer();
		this.view    = new View(this.buffer, 4, JavaScriptTokenizer);
		this.display = new Display(this.view, document.body);
		this.clip    = new Clipboard(this.display);
		this.key     = new Keyboard(this.clip.textarea);
		this.mouse   = new Mouse(this.clip.textarea);
		this.cursor  = this.view.cursor;
		this.range   = this.view.range;
		
		this.key.register("ArrowLeft", this, "gotoLeft");
		this.key.register("ArrowRight", this, "gotoRight");
		this.key.register("ArrowUp", this, "gotoUp");
		this.key.register("ArrowDown", this, "gotoDown");
		this.key.register("C-ArrowLeft", this, () => this.gotoPrevToken(false));
		this.key.register("C-ArrowRight", this, () => this.gotoNextToken(false));
		this.key.register("S-ArrowLeft", this, () => this.selectDir("left"));
		this.key.register("S-ArrowRight", this, () => this.selectDir("right"));
		this.key.register("S-ArrowUp", this, () => this.selectDir("up"));
		this.key.register("S-ArrowDown", this, () => this.selectDir("down"));
		this.key.register("C-S-ArrowLeft", this, () => this.gotoPrevToken(true));
		this.key.register("C-S-ArrowRight", this, () => this.gotoNextToken(true));
		this.key.register("Home", this, () => this.gotoLineStart(false));
		this.key.register("End", this, () => this.gotoLineEnd(false));
		this.key.register("S-Home", this, () => this.gotoLineStart(true));
		this.key.register("S-End", this, () => this.gotoLineEnd(true));
		this.key.register("C-a", this, "selectAll");
		this.key.register("PageUp", this, () => this.pageMove("up", false));
		this.key.register("PageDown", this, () => this.pageMove("down", false));
		this.key.register("S-PageUp", this, () => this.pageMove("up", true));
		this.key.register("S-PageDown", this, () => this.pageMove("down", true));
		this.key.register("Char", this, e => this.replaceText(e.key));
		this.key.register("Enter", this, "breakLine");
		this.key.register("Backspace", this, "backspace");
		this.key.register("Delete", this, "del");
		this.key.register("Tab", this, "indent");
		
		this.mouse.register("mousedown", this, "onMouseDown");
		this.mouse.register("mousemove", this, "onMouseMove");
		this.mouse.register("dblclick", this, "onDblClick");
		this.mouse.register("wheelup", this, () => this.display.scroll("up"));
		this.mouse.register("wheeldown", this, () => this.display.scroll("down"));
		
		this.clip.register("copy", this, e => e.text = this.getText());
		this.clip.register("paste", this, e => this.replaceText(e.text));
		this.clip.register("cut", this, "onCut");
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
