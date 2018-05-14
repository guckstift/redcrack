import Emitter from "./Emitter.js";
import Worker from "./Worker.js";

export default class Tokenizer extends Emitter
{
	constructor(buffer, start, states)
	{
		super();

		this.buffer = buffer;
		this.start = start;
		this.states = states;
		this.tokenLines = [ { before: this.start, after: this.start, tokens: [] } ];
		this.worker = new Worker();
		
		this.buffer.register("change", this, "onBufferChange");
	}
	
	getTokenAt(row, offs)
	{
		row = this.buffer.getClampedRow(row);
		offs = this.buffer.getClampedOffs(row, offs);
		
		var line = this.tokenLines[row];
		
		if(line.tokens.length > 0) {
			if(offs === 0) {
				return line.tokens[0];
			}
			else if(offs === this.buffer.getLineLength(row)) {
				return line.tokens.slice(-1)[0];
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
	}
	
	classify(type, before, after, text)
	{
		return "normal";
	}
	
	classifyAt(row, offs)
	{
		var tok = this.getTokenAt(row, offs);
		
		return this.classify(tok.type, tok.before, tok.after, tok.text);
	}
	
	onBufferChange(e)
	{
		this.tokenizeLines(e.firstRow, e.delRows, e.newRows);
	}
	
	tokenizeLines(firstRow, delRows, newRows)
	{
		this.tokenLines.splice(firstRow, delRows);
	
		for(var i = 0; i < newRows; i++) {
			this.tokenLines.splice(firstRow + i, 0, this.createOtherToken(""));
			this.tokenizeLine(firstRow + i);
		}
		
		var i = firstRow + newRows;
		
		this.worker.push(function tokenizeJob()
		{
			if(i < this.tokenLines.length) {
				var line = this.tokenLines[i];
				var prevLine = this.tokenLines[i - 1];
		
				if(prevLine.after === line.before) {
					return;
				}
			
				this.tokenizeLine(i);
				this.trigger("change", {row: i});
				i++;
				this.worker.push(tokenizeJob.bind(this));
			}
		
		}.bind(this));
		
		/*for(var i = firstRow + newRows; i < this.tokenLines.length; i++) {
			var line = this.tokenLines[i];
			var prevLine = this.tokenLines[i - 1];
		
			if(prevLine.after === line.before) {
				break;
			}
			
			this.tokenizeLine(i);
			this.trigger("change", {row: i});
		}*/
	}
	
	tokenizeLine(row)
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
		
		var rules = this.states[state];
		var endToken = this.getNextToken(rules, line, offs, "", state);
		
		if(endToken !== null) {
			state = endToken.after;
		}
		
		this.tokenLines[row] = {
			before: before,
			after: state,
			tokens: tokens,
		};
	}
	
	getNextToken(rules, line, offs, input, state)
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
	}
	
	createOtherToken(line, offs, lastoffs, state)
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
	}
	
	getLastRowState(curRow)
	{
		if(curRow === 0) {
			return this.start;
		}
		else {
			return this.tokenLines[curRow - 1].after;
		}
	}
}
