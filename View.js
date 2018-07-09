import Pos from "./Pos.js";
import Range from "./Range.js";
import History from "./History.js";

export default class View
{
	constructor(buffer, tabWidth, tokenizerClass)
	{
		this.buffer = buffer;
		this.tabWidth = tabWidth;
		this.tokenizerClass = tokenizerClass;
		this.tokenizer = new this.tokenizerClass(this.buffer);
		this.cursor = new Pos(this);
		this.range = new Range(this.cursor);
		this.history = new History(this);
	}
	
	getRangeText()
	{
		return this.buffer.getRangeText(this.range);
	}
	
	nextTabCol(col)
	{
		return (Math.floor(col / this.tabWidth) + 1) * this.tabWidth;
	}
	
	roundTabCol(col)
	{
		return Math.round(col / this.tabWidth) * this.tabWidth;
	}
	
	offsToCol(row, offs)
	{
		var line = this.buffer.getLine(row);
		
		for(var o=0, c=0; o<offs && o<line.length; o++) {
			c = line[o] === "\t" ? this.nextTabCol(c) : c + 1;
		}

		return c;
	}
	
	colToOffs(row, col)
	{
		var line = this.buffer.getLine(row);
		var lastc = 0;

		for(var o=0, c=0; c<col && o<line.length; o++) {
			lastc = c;
			c = line[o] === "\t" ? this.nextTabCol(c) : c + 1;
		}
		
		if(c > col) {
			var overflow = c - col;
			var charWidth = c - lastc;
			o -= 1 - Math.round(1 - overflow / charWidth);
		}

		return o;
	}
	
	replaceRangeText(text)
	{
		return this.buffer.replaceRangeText(this.range, text);
	}
}
