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
		
		this.key.on("ArrowLeft", () => this.gotoLeft());
		this.key.on("ArrowRight", () => this.gotoRight());
		this.key.on("ArrowUp", () => this.gotoUp());
		this.key.on("ArrowDown", () => this.gotoDown());
		this.key.on("C-ArrowLeft", () => this.gotoPrevToken(false));
		this.key.on("C-ArrowRight", () => this.gotoNextToken(false));
		this.key.on("S-ArrowLeft", () => this.selectDir("left"));
		this.key.on("S-ArrowRight", () => this.selectDir("right"));
		this.key.on("S-ArrowUp", () => this.selectDir("up"));
		this.key.on("S-ArrowDown", () => this.selectDir("down"));
		this.key.on("C-S-ArrowLeft", () => this.gotoPrevToken(true));
		this.key.on("C-S-ArrowRight", () => this.gotoNextToken(true));
		this.key.on("Home", () => this.gotoLineStart(false));
		this.key.on("End", () => this.gotoLineEnd(false));
		this.key.on("S-Home", () => this.gotoLineStart(true));
		this.key.on("S-End", () => this.gotoLineEnd(true));
		this.key.on("C-a", () => this.selectAll());
		this.key.on("PageUp", () => this.pageMove("up", false));
		this.key.on("PageDown", () => this.pageMove("down", false));
		this.key.on("S-PageUp", () => this.pageMove("up", true));
		this.key.on("S-PageDown", () => this.pageMove("down", true));
		this.key.on("Char", e => this.replaceText(e.key));
		this.key.on("Enter", () => this.breakLine());
		this.key.on("Backspace", () => this.backspace());
		this.key.on("Delete", () => this.del());
		this.key.on("Tab", () => this.indent());
		
		this.mouse.on("mousedown", e => this.onMouseDown(e));
		this.mouse.on("mousemove", e => this.onMouseMove(e));
		this.mouse.on("dblclick", e => this.onDblClick(e));
		this.mouse.on("wheelup", () => this.display.scroll("up"));
		this.mouse.on("wheeldown", () => this.display.scroll("down"));
		
		this.clip.on("copy", e => e.text = this.getText());
		this.clip.on("paste", e => this.replaceText(e.text));
		this.clip.on("cut", e => this.onCut(e));
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
