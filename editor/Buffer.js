include(function(utils_utils, utils_oop, Emitter) {

	var utils = utils_utils;
	var oop = utils_oop;
	
	return oop.defclass({
	
		base: Emitter,
	
		ctor: function Buffer()
		{
			Emitter.call(this);
		
			this.lines = [""];
			this.lineDelim = "\n";
		},
	
		getRows: function()
		{
			return this.lines.length;
		},
	
		getClampedRow: function(row)
		{
			return utils.clamp(0, this.getRows() - 1, row);
		},
	
		getLine: function(row)
		{
			return this.lines[this.getClampedRow(row)];
		},
	
		getLineLength: function(row)
		{
			return this.getLine(row).length;
		},
	
		getLastLineLength: function()
		{
			return this.getLine(this.getRows() - 1).length;
		},
	
		getClampedOffs: function(row, offs)
		{
			return utils.clamp(0, this.getLineLength(row), offs);
		},
		
		getLines: function(first, count)
		{
			return this.lines.slice(first, first + count);
		},
		
		getText: function()
		{
			return this.lines.join(this.lineDelim);
		},
		
		getRangeLines: function(range)
		{
			var start = range.getStart();
			var end = range.getEnd();
			var rows = range.getRows();
			
			return this.getLines(start.row, rows);
		},
		
		getRangeText: function(range)
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
		},
		
		splitText: function(text)
		{
			return text.split(/\r\n|\r|\n/);
		},
		
		replaceRangeText: function(range, text)
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
		},
	
	});

});
