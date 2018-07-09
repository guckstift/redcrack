import Comparable from "./Comparable.js";
import Emitter from "../emitter/Emitter.js";

export default class Pos extends Comparable(Emitter)
{
	constructor(view)
	{
		super();
		this.view = view;
		this.buffer = this.view.buffer;
		this.tokenizer = this.view.tokenizer;
		this.row = 0;
		this.offs = 0;
	}
	
	compare(other)
	{
		if(this.buffer !== other.buffer) {
			throw "can not compare positions of different buffers";
		}
	
		return this.row - other.row || this.offs - other.offs;
	}
	
	getCol()
	{
		return this.view.offsToCol(this.row, this.offs);
	}
	
	getCurLineLength()
	{
		return this.buffer.getLineLength(this.row);
	}
	
	isAtLineStart()
	{
		return this.offs === 0;
	}
	
	isAtLineEnd()
	{
		return this.offs === this.getCurLineLength();
	}

	set(row, offs)
	{
		if(this.subject("change").callbacks.length) {
			var old = this.copy();
		}
				
		this.row = this.buffer.getClampedRow(row);
		this.offs = this.buffer.getClampedOffs(row, offs);
	
		if(this.subject("change").callbacks.length && !this.isEqual(old)) {
			this.emit(
				"change",
				{ oldRow: old.row, oldOffs: old.offs, newRow: this.row, newOffs: this.offs }
			);
		}
	
		return this;
	}
	
	gotoRowCol(row, col)
	{
		this.set(row, this.view.colToOffs(row, col));
	}
	
	gotoStart()
	{
		this.set(0, 0);
	}
	
	gotoEnd()
	{
		this.set(this.buffer.getRows() - 1, this.buffer.getLastLineLength());
	}
	
	gotoLineStart()
	{
		this.set(this.row, 0);
	}
	
	gotoLineEnd()
	{
		this.set(this.row, this.buffer.getLineLength(this.row));
	}
	
	gotoTokenStart()
	{
		var tok = this.tokenizer.getTokenAt(this.row, this.offs);
		this.set(this.row, tok.offs);
	}
	
	gotoTokenEnd()
	{
		var tok = this.tokenizer.getTokenAt(this.row, this.offs);
		this.set(this.row, tok.offs + tok.length);
	}
	
	left()
	{
		if(this.offs === 0) {
			if(this.row > 0) {
				this.set(this.row - 1, this.buffer.getLineLength(this.row - 1));
			}
		}
		else {
			this.set(this.row, this.offs - 1);
		}
	}

	right()
	{
		if(this.offs === this.buffer.getLineLength(this.row)) {
			if(this.row < this.buffer.getRows() - 1) {
				this.set(this.row + 1, 0);
			}
		}
		else {
			this.set(this.row, this.offs + 1);
		}
	}
	
	up()
	{
		if(this.row === 0) {
			this.set(this.row, 0);
		}
		else {
			this.gotoRowCol(this.row - 1, this.getCol());
		}
	}

	down()
	{
		if(this.row === this.buffer.getRows() - 1) {
			this.set(this.row, this.buffer.getLineLength(this.row));
		}
		else {
			this.gotoRowCol(this.row + 1, this.getCol());
		}
	}
	
	pageUp()
	{
		this.set(this.row - 50, this.getCol());
	}
	
	pageDown()
	{
		this.set(this.row + 50, this.getCol());
	}
	
	copy()
	{
		var copied = new Pos(this.view);
		
		copied.row = this.row;
		copied.offs = this.offs;
		
		return copied;
	}
}
