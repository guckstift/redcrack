include(function(utils_oop, Pos, Range, History) {

	var oop = utils_oop;
	
	return oop.defclass({
	
		ctor: function View(buffer, tabWidth, tokenizerClass)
		{
			this.buffer = buffer;
			this.tabWidth = tabWidth;
			this.tokenizerClass = tokenizerClass;
			this.tokenizer = new this.tokenizerClass(this.buffer);
			this.cursor = new Pos(this);
			this.range = new Range(this.cursor);
			this.history = new History(this);
		},
		
		getRangeText: function()
		{
			return this.buffer.getRangeText(this.range);
		},
		
		nextTabCol: function(col)
		{
			return (Math.floor(col / this.tabWidth) + 1) * this.tabWidth;
		},
		
		roundTabCol: function(col)
		{
			return Math.round(col / this.tabWidth) * this.tabWidth;
		},
		
		offsToCol: function(row, offs)
		{
			var line = this.buffer.getLine(row);
			
			for(var o=0, c=0; o<offs && o<line.length; o++) {
				c = line[o] === "\t" ? this.nextTabCol(c) : c + 1;
			}
	
			return c;
		},
		
		colToOffs: function(row, col)
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
		},
		
		replaceRangeText: function(text)
		{
			return this.buffer.replaceRangeText(this.range, text);
		},
	
	});

});
