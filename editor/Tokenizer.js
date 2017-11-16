include(function(utils_oop, utils_array) {

	var oop = utils_oop;
	var array = utils_array;
	
	return oop.defclass({
		
		ctor: function Tokenizer(buffer, start, states)
		{
			oop.bindmethods(this, ["onBufferChange"]);
			
			this.buffer = buffer;
			this.start = start;
			this.states = states;
			this.tokenLines = [ { before: this.start, after: this.start, tokens: [] } ];
			
			this.buffer.register("change", this.onBufferChange);
		},
		
		getTokenAt: function(row, offs)
		{
			row = this.buffer.getClampedRow(row);
			offs = this.buffer.getClampedOffs(row, offs);
			
			var line = this.tokenLines[row];
			
			if(line.tokens.length > 0) {
				if(offs === 0) {
					return line.tokens[0];
				}
				else if(offs === this.buffer.getLineLength(row)) {
					return line.tokens.splice(-1)[0];
				}
				
				var first = 0;
				var last = line.tokens.length - 1;
			
				while(first <= last) {
					var pivot = Math.floor((first + last) / 2);
					var token = line.tokens[pivot];
				
					if(offs >= token.offs && offs < token.offs + token.length) {
						return token;
					}
					else if(offs < token.offs) {
						last = pivot - 1;
					}
					else if(offs >= token.offs + token.length) {
						first = pivot + 1;
					}
				}
			}
			
			return null;
		},
		
		onBufferChange: function(e)
		{
			this.tokenizeLines(e.firstRow, e.delRows, e.newRows);
		},
		
		tokenizeLines: function(firstRow, delRows, newRows)
		{
			this.tokenLines.splice(firstRow, delRows);
		
			for(var i = 0; i < newRows; i++) {
				this.tokenLines.splice(firstRow + i, 0, this.createOtherToken(""));
				this.tokenizeLine(firstRow + i);
			}
			
			for(var i = firstRow + newRows; i < this.tokenLines.length; i++) {
				var line = this.tokenLines[i];
				var prevLine = this.tokenLines[i - 1];
			
				if(prevLine.after === line.before) {
					break;
				}
				
				this.tokenizeLine(i);
			}
		},
		
		tokenizeLine: function(row)
		{
			var before = this.getLastRowState(row);
			var state = before;
			var tokens = [];
			var line = this.buffer.getLine(row);
			var offs = 0;
			var lastoffs = 0;
			
			while(offs < line.length) {
				var rules = this.states[state];
				var input = line.slice(offs);
				var token = this.getNextToken(rules, line, offs, input, state);
				
				if(token !== null) {
					if(lastoffs < offs) {
						tokens.push(this.createOtherToken(line, offs, lastoffs, state));
					}
					
					state = token.after;
					offs += token.text.length;
					lastoffs = offs;
					tokens.push(token);
				}
				else {
					offs++;
				}
			}
			
			if(lastoffs < offs) {
				tokens.push(this.createOtherToken(line, offs, lastoffs, state));
			}
			
			this.tokenLines[row] = {
				before: before,
				after: state,
				tokens: tokens,
			};
		},
		
		getNextToken: function(rules, line, offs, input, state)
		{
			for(var i=0; i<rules.length; i++) {
				var rule = rules[i];
				var matches = input.match(rule.re);
			
				if(matches !== null) {
					var text = matches[0];
				
					return {
						text: text,
						length: text.length,
						type: rule.type,
						before: state,
						after: rule.next === '' ? state : rule.next,
						offs: offs,
					}
				}
			}
			
			return null;
		},
		
		createOtherToken: function(line, offs, lastoffs, state)
		{
			var text = line.slice(lastoffs, offs);
			return {
				text: text,
				length: text.length,
				type: "<other>",
				before: state,
				after: state,
				offs: lastoffs || 0,
			};
		},
		
		getLastRowState: function(curRow)
		{
			if(curRow === 0) {
				return this.start;
			}
			else {
				return this.tokenLines[curRow - 1].after;
			}
		},
		
	});

});
