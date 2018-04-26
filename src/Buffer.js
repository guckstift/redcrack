import Emitter from "./Emitter.js";
import utils from "./utils/utils.js";

export default class Buffer extends Emitter
{
	constructor()
	{
		super();
	
		this.lines = [""];
		this.lineDelim = "\n";
	}

	getRows()
	{
		return this.lines.length;
	}

	getClampedRow(row)
	{
		return utils.clamp(0, this.getRows() - 1, row);
	}

	getLine(row)
	{
		return this.lines[this.getClampedRow(row)];
	}

	getLineLength(row)
	{
		return this.getLine(row).length;
	}

	getLastLineLength()
	{
		return this.getLine(this.getRows() - 1).length;
	}

	getClampedOffs(row, offs)
	{
		return utils.clamp(0, this.getLineLength(row), offs);
	}
	
	getLines(first, count)
	{
		return this.lines.slice(first, first + count);
	}
	
	getText()
	{
		return this.lines.join(this.lineDelim);
	}
	
	getRangeLines(range)
	{
		var start = range.getStart();
		var end = range.getEnd();
		var rows = range.getRows();
		
		return this.getLines(start.row, rows);
	}
	
	getRangeText(range)
	{
		if(range.buffer !== this) {
			throw "the range does not belong to this buffer";
		}
		
		var start = range.getStart();
		var end = range.getEnd();
		var rows = range.getRows();
		var lines = this.getLines(start.row, rows);
		var lastLine = this.getLine(end.row);
		var joinedLines = lines.join(this.lineDelim);
		var result = joinedLines.slice(start.offs, -(lastLine.length - end.offs) || undefined);
		
		return result;
	}
	
	splitText(text)
	{
		return text.split(/\r\n|\r|\n/);
	}
	
	replaceRangeText(range, text)
	{
		var start = range.getStart();
		var end = range.getEnd();
		var rows = range.getRows();
		var newLines = this.splitText(text);
		
		var changeEventData = {
			firstRow: start.row,
			delRows: end.row - start.row + 1,
			newRows: newLines.length,
			delLines: this.getRangeLines(range),
		}
	
		newLines[0] = this.lines[start.row].slice(0, start.offs) + newLines[0];
	
		var newRow = start.row + newLines.length - 1;
		var newOffs = newLines[newLines.length - 1].length;
	
		newLines[newLines.length - 1] += this.lines[end.row].slice(end.offs);
		utils.arrayReplace(this.lines, start.row, rows, newLines);
	
		this.trigger("change", changeEventData);
	
		range.stopSelecting();
		range.head.set(newRow, newOffs);
	}
}
