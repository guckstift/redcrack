(function() {
var mods = {};
mods['mod2'] = (function () {

	return {
	
		isfunc: function(x)
		{
			return typeof x === "function";
		},
		
		isarray: function(x)
		{
			return Array.isArray(x);
		},
	
		defclass: function(proto)
		{
			var ctor = proto.ctor || function() {};
			var base = proto.base;
			var mixins = proto.mixins;
			var newProto = this.isfunc(base) ? this.create(base.prototype) : {};
			
			if(this.isarray(mixins)) {
				for(var i=0; i<mixins.length; i++) {
					this.mixin(newProto, mixins[i].prototype);
				}
			}
			
			ctor.prototype = this.mixin(newProto, proto);
			
			return ctor;
		},
		
		create: function(proto)
		{
			return Object.create(proto);
		},
		
		mixin: function(target, source)
		{
			for(var key in source) {
				if(source.hasOwnProperty(key)) {
					target[key] = source[key];
				}
			}
		
			return target;
		},

		bindmethods: function(self, methods)
		{
			for(var i=0; i<methods.length; i++) {
				self[methods[i]] = self[methods[i]].bind(self);
			}
		},
	
	};

})();

mods['mod6'] = (function () {

	return {
	
		repeatString: function(s, n)
		{
			return new Array(n + 1).join(s);
		},

		clamp: function(minval, maxval, val)
		{
			return Math.max(minval, Math.min(maxval, val));
		},

		arrayReplace: function(array, start, count, insert)
		{
			Array.prototype.splice.apply(array, [start, count].concat(insert));
		},
	
	};

})();

mods['mod7'] = (function (utils_oop) {

	var oop = utils_oop;
	
	return oop.defclass({
	
		ctor: function Emitter()
		{
			this.events = {};
		},
		
		hasListeners: function(event)
		{
			if(event !== undefined) {
				var listeners = this.events[event] = this.events[event] || [];
				
				return listeners.length > 0;
			}
			else {
				for(var event in this.events) {
					if(this.events.hasOwnProperty(event) && this.events[event].length > 0) {
						return true;
					}
					
					return false;
				}
			}
		},

		register: function(event, listener)
		{
			var listeners = this.events[event] = this.events[event] || [];
			var index = listeners.indexOf(listener);
		
			if(index === -1) {
				listeners.push(listener);
			}
		
			return this;
		},

		unregister: function(event, listener)
		{
			if(event !== undefined) {
				if(listener !== undefined) {
					var listeners = this.events[event] = this.events[event] || [];
					var index = listeners.indexOf(listener);
		
					if(index !== -1) {
						listeners.splice(index, 1);
					}
		
					return this;
				}
				else {
					this.events[event] = [];
				}
			}
			else {
				this.events = { };
			}
		
			return this;
		},

		trigger: function(event, data)
		{
			var listeners = this.events[event] = this.events[event] || [];
			var data = data || [];
		
			for(var i=0; i<listeners.length; i++) {
				listeners[i](data, this);
			}
		
			return this;
		},
		
	});

})(mods['mod2'],);

mods['mod3'] = (function (utils_utils, utils_oop, Emitter) {

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
			}
		
			newLines[0] = this.lines[start.row].slice(0, start.offs) + newLines[0];
		
			var newRow = start.row + newLines.length - 1;
			var newOffs = newLines[newLines.length - 1].length;
		
			newLines[newLines.length - 1] += this.lines[end.row].slice(end.offs);
			utils.arrayReplace(this.lines, start.row, rows, newLines);
		
			range.stopSelecting();
			range.head.set(newRow, newOffs);
		
			this.trigger("change", changeEventData);
		},
	
	});

})(mods['mod6'],mods['mod2'],mods['mod7'],);

mods['mod10'] = (function (utils_oop, Emitter) {

	var oop = utils_oop;
	
	return oop.defclass({
	
		base: Emitter,
		
		ctor: function Keyboard(eventTarget)
		{
			oop.bindmethods(this, ["onKeyDown"]);
			
			Emitter.call(this);
			
			this.eventTarget = eventTarget;
		
			this.eventTarget.setAttribute("tabindex", "-1");
			this.eventTarget.addEventListener("keydown", this.onKeyDown);
		},
		
		onKeyDown: function(e)
		{
			var id = "";
	
			if(e.ctrlKey && e.key !== "Control") {
				id += "C-";
			}
	
			if(e.altKey && e.key !== "Alt") {
				id += "A-";
			}
	
			if(e.shiftKey && e.key !== "Shift" && e.key.length > 1) {
				id += "S-";
			}
	
			if(e.metaKey && e.key !== "Meta") {
				id += "M-";
			}
	
			if(e.key.length === 1 && id.length === 0) {
				id += "Char";
			}
			else if(e.key === " ") {
				id += "Space";
			}
			else {
				id += e.key;
			}
			
			if(this.hasListeners(id)) {
				this.trigger(
					id, {
						key: e.key,
						ctrl: e.ctrlKey,
						alt: e.altKey,
						shift: e.shiftKey,
						meta: e.metaKey
					}
				);
				
				e.preventDefault();
			}
		},
	
	});

})(mods['mod2'],mods['mod7'],);

mods['mod11'] = (function (utils_oop, Emitter) {

	var oop = utils_oop;
	
	return oop.defclass({
	
		base: Emitter,
	
		ctor: function Mouse(eventTarget)
		{
			oop.bindmethods(this, ["onMouseEvent"]);
			
			Emitter.call(this);
			
			this.eventTarget = eventTarget;
			this.eventTarget.addEventListener("mousedown", this.onMouseEvent);
			this.eventTarget.addEventListener("mouseup", this.onMouseEvent);
			this.eventTarget.addEventListener("mousemove", this.onMouseEvent);
		},
		
		onMouseEvent: function(e)
		{
			var id = e.type;
			
			if(this.hasListeners(id)) {
				var clientRect = this.eventTarget.getBoundingClientRect();
				var eventData = {
					x: e.clientX - clientRect.left,
					y: e.clientY - clientRect.top,
					primaryButton: e.buttons & 1 > 0,
					secondaryButton: e.buttons & 2 > 0,
					auxilaryButton: e.buttons & 4 > 0,
					ctrl: e.ctrlKey,
					alt: e.altKey,
					shift: e.shiftKey,
					meta: e.metaKey
				}
			
				this.trigger(id, eventData);
				
				e.preventDefault();
				
				if(eventData.primaryButton) {
					this.eventTarget.focus();
				}
			}
		},
	
	});

})(mods['mod2'],mods['mod7'],);

mods['mod13'] = (function () {

	return {

		replace: function(array, start, count, insert)
		{
			Array.prototype.splice.apply(array, [start, count].concat(insert));
		},
		
		repeat: function(times, value)
		{
			return Array(times).fill(value);
		},
	
	};

})();

mods['mod5'] = (function (utils_oop, utils_array) {

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

})(mods['mod2'],mods['mod13'],);

mods['mod17'] = (function () {

	return {
	
		repeat: function(s, n)
		{
			return new Array(n + 1).join(s);
		},
	
	};

})();

mods['mod16'] = (function () {

	return {
	
		elm: function(opts)
		{
			var tag = opts.tag || "div";
			var attribs = opts.attribs || {};
			var classes = opts.classes || [];
			var styles = opts.styles || {};
			var content = opts.content || "";
			var elm = document.createElement(tag);
	
			for(var i=0; i<classes.length; i++) {
				elm.classList.add(classes[i]);
			}
	
			for(var attrib in attribs) {
				if(attribs.hasOwnProperty(attrib)) {
					elm.setAttribute(attrib, attribs[attrib]);
				}
			}
	
			for(var style in styles) {
				if(styles.hasOwnProperty(style)) {
					elm.style[style] = styles[style];
				}
			}
	
			elm.innerHTML = content;
			
			return elm;
		},
		
		div: function(opts)
		{
			opts = opts || {};
			opts.tag = "div";
			return this.elm(opts);
		},
		
		span: function(opts)
		{
			opts = opts || {};
			opts.tag = "span";
			return this.elm(opts);
		},
		
		textarea: function(opts)
		{
			opts = opts || {};
			opts.tag = "textarea";
			return this.elm(opts);
		},
	
	};

})();

mods['mod9'] = (function (utils_oop, utils_dom, utils_string) {

	var oop = utils_oop;
	var dom = utils_dom;
	var string = utils_string;
	
	return oop.defclass({
	
		ctor: function Display(view, parentElm)
		{
			oop.bindmethods(
				this,
				[
					"updateCaret", "updateSelection", "onBufferChange", "blinkCaret",
				]
			);
			
			this.view = view;
			this.buffer = this.view.buffer;
			this.range = this.view.range;
			this.cursor = this.range.head;
			this.parent = parentElm;
			this.measureCount = 256;
			this.tabWidth = 4;
			
			this.initDomElements();
			this.updateCellSize();
			this.updateCaret();
			
			this.cursor.register("change", this.updateCaret);
			this.range.register("change", this.updateSelection);
			this.buffer.register("change", this.onBufferChange);
			
			this.startBlinkCaret();
		},
		
		screenYToRow: function(y)
		{
			return Math.floor(y / this.cellHeight);
		},
		
		screenXToCol: function(x)
		{
			return x / this.cellWidth;
		},
		
		initDomElements: function()
		{
			this.root = this.parent.appendChild(dom.div({
				classes: ["editor"],
			}));
			
			this.lineGutter = this.root.appendChild(dom.div({
				classes: ["editor-linegutter"],
			}));
			
			this.selectionFirst = this.root.appendChild(dom.div({
				classes: ["editor-selection"],
			}));
			
			this.selectionLast = this.root.appendChild(dom.div({
				classes: ["editor-selection"],
			}));
			
			this.selectionMiddle = this.root.appendChild(dom.div({
				classes: ["editor-selection"],
			}));
			
			this.caret = this.root.appendChild(dom.div({
				classes: ["editor-caret"],
			}));
			
			this.content = this.root.appendChild(dom.div({
				classes: ["editor-content"],
				content: "<div></div>",
			}));
			
			this.measureBox = this.root.appendChild(dom.div({
				classes: ["editor-measurebox"],
			}));
			
			this.baseMeasureChar = this.measureBox.appendChild(dom.span());
			
			this.refMeasureChar = this.measureBox.appendChild(dom.span({
				content: "A",
			}));
		},

		updateCellSize: function()
		{
			this.measureBox.style.display = "block";
		
			this.baseMeasureChar.innerHTML = string.repeat("A", this.measureCount);
			this.cellWidth = this.refMeasureChar.offsetLeft - this.baseMeasureChar.offsetLeft;
			this.cellWidth /= this.measureCount;
		
			this.baseMeasureChar.innerHTML = string.repeat("A<br>", this.measureCount);
			this.cellHeight = this.refMeasureChar.offsetTop - this.baseMeasureChar.offsetTop;
			this.cellHeight /= this.measureCount;
		
			this.measureBox.style.display = "none";
		},
	
		updateCaret: function()
		{
			this.caret.style.height = this.cellHeight + "px";
			this.caret.style.left = (this.cursor.getCol() * this.cellWidth) + "px";
			this.caret.style.top = (this.cursor.row * this.cellHeight) + "px";
			this.startBlinkCaret();
		},
	
		updateSelection: function()
		{
			var start = this.range.getStart();
			var end = this.range.getEnd();
			var startCol = start.getCol();
			var endCol = end.getCol();
			var rows = this.range.getRows();
		
			this.selectionMiddle.style.display = "none";
			this.selectionFirst.style.display = "none";
			this.selectionLast.style.display = "none";
		
			if(rows >= 3) {
				this.selectionMiddle.style.display = "block";
				this.selectionMiddle.style.left = "0";
				this.selectionMiddle.style.top = (start.row + 1) * this.cellHeight + "px";
				this.selectionMiddle.style.right = "0";
				this.selectionMiddle.style.height = (rows - 2) * this.cellHeight + "px";
			}
		
			if(rows >= 2) {
				this.selectionLast.style.display = "block";
				this.selectionLast.style.left = "0";
				this.selectionLast.style.top = end.row * this.cellHeight + "px";
				this.selectionLast.style.width = endCol * this.cellWidth + "px";
				this.selectionLast.style.height = this.cellHeight + "px";
				this.selectionFirst.style.right = "0";
				this.selectionFirst.style.width = "";
			}
		
			if(rows >= 1) {
				this.selectionFirst.style.display = "block";
				this.selectionFirst.style.left = startCol * this.cellWidth + "px";
				this.selectionFirst.style.top = start.row * this.cellHeight + "px";
				this.selectionFirst.style.height = this.cellHeight + "px";
			}
		
			if(rows === 1) {
				this.selectionFirst.style.right = "";
				this.selectionFirst.style.width = (
					(endCol - startCol) * this.cellWidth + "px"
				);
			}
		},
	
		updateLine: function(row)
		{
			var line = this.buffer.getLine(row);
			var html = "";
			var col = 0;
			
			for(var i=0; i<line.length; i++) {
				var ch = line[i];
				
				if(ch === "<") {
					html += "&lt;";
					col++;
				}
				else if(ch === ">") {
					html += "&gt;";
					col++;
				}
				else if(ch === "\t") {
					var tabcols = this.view.nextTabCol(col) - col;
					
					html += string.repeat("&nbsp;", tabcols);
					col += tabcols;
				}
				else {
					html += ch;
					col++;
				}
			}
			
			this.content.children[row].innerHTML = html + "&nbsp;";
		},
	
		updateLines: function(firstRow, delRows, newRows)
		{
			for(var i=0; i<delRows; i++) {
				this.content.children[firstRow].remove();
			}
		
			for(var i=0; i<newRows; i++) {
				var newElm = document.createElement("div");
				this.content.insertBefore(newElm, this.content.children[firstRow]);
			}
		
			for(var i=0; i<newRows; i++) {
				this.updateLine(firstRow + i);
			}
		},
		
		startBlinkCaret: function()
		{
			clearTimeout(this.blinkTimeoutId);
			this.caret.style.display = "block";
			this.blinkTimeoutId = setTimeout(this.blinkCaret, 500);
		},
		
		stopBlinkCaret: function()
		{
			clearTimeout(this.blinkTimeoutId);
			this.caret.style.display = "block";
		},
		
		blinkCaret: function()
		{
			if(this.caret.style.display === "block") {
				this.caret.style.display = "none";
			}
			else {
				this.caret.style.display = "block";
			}
			
			this.blinkTimeoutId = setTimeout(this.blinkCaret, 500);
		},
		
		onBufferChange: function(e)
		{
			this.updateLines(e.firstRow, e.delRows, e.newRows);
		},
	
	});

})(mods['mod2'],mods['mod16'],mods['mod17'],);

mods['mod12'] = (function (utils_oop, utils_dom, Emitter) {

	var oop = utils_oop;
	var dom = utils_dom;
	
	return oop.defclass({
	
		base: Emitter,
	
		ctor: function Clipboard(view, parentElm)
		{
			oop.bindmethods(this, ["onPaste", "onCopy", "onCut"]);
			
			Emitter.call(this);
			
			this.parent = parentElm;
			
			this.textarea = this.parent.appendChild(dom.textarea({
				classes: ["editor-textarea"],
			}));
			
			this.textarea.addEventListener("paste", this.onPaste);
			this.textarea.addEventListener("copy", this.onCopy);
			this.textarea.addEventListener("cut", this.onCut);
		},
		
		onPaste: function(e)
		{
			this.trigger("paste", { text: e.clipboardData.getData("text") });
			e.preventDefault();
		},
		
		onCopy: function(e)
		{
			var eventData = { text: "" };
			
			this.trigger("copy", eventData);
			e.clipboardData.setData("text", eventData.text);
			e.preventDefault();
		},
		
		onCut: function(e)
		{
			var eventData = { text: "" };
			
			this.trigger("cut", eventData);
			e.clipboardData.setData("text", eventData.text);
			e.preventDefault();
		},
		
	});
	
})(mods['mod2'],mods['mod16'],mods['mod7'],);

mods['mod18'] = (function (oop) {

	return oop.defclass({
	
		ctor: function Comparable() {},
	
		compare: function(other)
		{
			throw "compare() is not implemented";
		},

		isEqual: function(other)
		{
			return this === other || this.compare(other) === 0;
		},

		isLower: function(other)
		{
			return this.compare(other) < 0;
		},

		isGreater: function(other)
		{
			return this.compare(other) > 0;
		},

		min: function(other)
		{
			return this.isLower(other) ? this : other;
		},

		max: function(other)
		{
			return this.isGreater(other) ? this : other;
		},
	
	});

})(mods['mod2'],);

mods['mod15'] = (function (utils_oop, utils_Comparable, Emitter) {

	var oop = utils_oop;
	
	return oop.defclass({
	
		base: Emitter,
		
		mixins: [utils_Comparable],
		
		ctor: function Range(head)
		{
			Emitter.call(this);
			
			oop.bindmethods(this, ["onHeadChange"]);
		
			this.head = head;
			this.buffer = head.buffer;
			this.anchor = this.head;
		
			this.head.register("change", this.onHeadChange);
		},
	
		compare: function(other)
		{
			if(this.buffer !== other.buffer) {
				throw "can not compare ranges of different buffers";
			}
		
			return this.head.compare(other.head) || this.anchor.compare(other.anchor);
		},
		
		touches: function(other)
		{
			if(this.buffer !== other.buffer) {
				throw "can not compare ranges of different buffers";
			}
			
			var thisStart = this.getStart();
			var thisEnd = this.getEnd();
			var otherStart = other.getStart();
			var otherEnd = other.getEnd();
			
			return !( thisEnd.isLower(otherStart) || thisStart.isGreater(otherEnd) );
		},
	
		isSelecting: function()
		{
			return this.anchor !== this.head;
		},
	
		isEmpty: function()
		{
			return this.head.isEqual(this.anchor);
		},
	
		getStart: function()
		{
			return this.head.min(this.anchor);
		},
	
		getEnd: function()
		{
			return this.head.max(this.anchor);
		},
		
		getRows: function()
		{
			return this.getEnd().row - this.getStart().row + 1;
		},
	
		startSelecting: function()
		{
			if(!this.isSelecting()) {
				this.anchor = this.head.copy();
			}
		},

		stopSelecting: function()
		{
			if(this.isSelecting()) {
				var oldAnchor = this.anchor.copy();
			
				this.anchor = this.head;
			
				if(!this.anchor.isEqual(oldAnchor)) {
					this.trigger("change");
				}
			}
		},
	
		restartSelecting: function()
		{
			this.stopSelecting();
			this.startSelecting();
		},
		
		onHeadChange: function()
		{
			if(this.isSelecting()) {
				this.trigger("change");
			}
		},
	
	});

})(mods['mod2'],mods['mod18'],mods['mod7'],);

mods['mod14'] = (function (utils_oop, utils_Comparable, Emitter) {

	var oop = utils_oop;
	
	var Pos = oop.defclass({
	
		base: Emitter,
		
		mixins: [utils_Comparable],
		
		ctor: function Pos(view)
		{
			oop.bindmethods(this, ["left", "right", "up", "down"]);
			
			Emitter.call(this);
			
			this.view = view;
			this.buffer = this.view.buffer;
			this.row = 0;
			this.offs = 0;
		},
		
		compare: function(other)
		{
			if(this.buffer !== other.buffer) {
				throw "can not compare positions of different buffers";
			}
		
			return this.row - other.row || this.offs - other.offs;
		},
		
		getCol: function()
		{
			return this.view.offsToCol(this.row, this.offs);
		},
	
		set: function(row, offs)
		{
			if(this.hasListeners("change")) {
				var old = this.copy();
			}
					
			this.row = this.buffer.getClampedRow(row);
			this.offs = this.buffer.getClampedOffs(row, offs);
		
			if(this.hasListeners("change") && !this.isEqual(old)) {
				this.trigger("change");
			}
		
			return this;
		},
		
		gotoRowCol: function(row, col)
		{
			this.set(row, this.view.colToOffs(row, col));
		},
		
		gotoStart: function()
		{
			this.set(0, 0);
		},
		
		gotoEnd: function()
		{
			this.set(this.buffer.getRows() - 1, this.buffer.getLastLineLength());
		},
		
		gotoLineStart: function()
		{
			this.set(this.row, 0);
		},
		
		gotoLineEnd: function()
		{
			this.set(this.row, this.buffer.getLineLength(this.row));
		},
		
		left: function()
		{
			if(this.offs === 0) {
				if(this.row > 0) {
					this.set(this.row - 1, this.buffer.getLineLength(this.row - 1));
				}
			}
			else {
				this.set(this.row, this.offs - 1);
			}
		},
	
		right: function()
		{
			if(this.offs === this.buffer.getLineLength(this.row)) {
				if(this.row < this.buffer.getRows() - 1) {
					this.set(this.row + 1, 0);
				}
			}
			else {
				this.set(this.row, this.offs + 1);
			}
		},
		
		up: function()
		{
			if(this.row === 0) {
				this.set(this.row, 0);
			}
			else {
				this.gotoRowCol(this.row - 1, this.getCol());
			}
		},
	
		down: function()
		{
			if(this.row === this.buffer.getRows() - 1) {
				this.set(this.row, this.buffer.getLineLength(this.row));
			}
			else {
				this.gotoRowCol(this.row + 1, this.getCol());
			}
		},
		
		copy: function()
		{
			var copied = new Pos(this.view);
			
			copied.row = this.row;
			copied.offs = this.offs;
			
			return copied;
		},
	
	});
	
	return Pos;

})(mods['mod2'],mods['mod18'],mods['mod7'],);

mods['mod8'] = (function (utils_oop, Pos, Range) {

	var oop = utils_oop;
	
	return oop.defclass({
	
		ctor: function View(buffer, tabWidth)
		{
			this.buffer = buffer;
			this.cursor = new Pos(this);
			this.range = new Range(this.cursor);
			this.tabWidth = tabWidth;
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

})(mods['mod2'],mods['mod14'],mods['mod15'],);

mods['mod4'] = (function (utils_oop, View, Display, Keyboard, Mouse, Clipboard) {

	var oop = utils_oop;
	
	return oop.defclass({
	
		ctor: function Gui(buffer, parentElm)
		{
			oop.bindmethods(
				this,
				[
					"onChar", "onEnter", "onBackspace", "onDelete", "onTab", "onHome", "onEnd",
					"onCtrlA", "onMouseDown", "onMouseMove",
					"onPaste", "onCopy", "onCut",
				]
			);
			
			this.buffer = buffer;
			this.view = new View(this.buffer, 4);
			this.display = new Display(this.view, parentElm);
			this.clip = new Clipboard(this.view, this.display.root);
			this.key = new Keyboard(this.clip.textarea);
			this.mouse = new Mouse(this.clip.textarea);
	
			this.key.register("ArrowLeft", this.onArrow.bind(this, "left"));
			this.key.register("ArrowRight", this.onArrow.bind(this, "right"));
			this.key.register("ArrowUp", this.onArrow.bind(this, "up"));
			this.key.register("ArrowDown", this.onArrow.bind(this, "down"));
			this.key.register("S-ArrowLeft", this.onShiftArrow.bind(this, "left"));
			this.key.register("S-ArrowRight", this.onShiftArrow.bind(this, "right"));
			this.key.register("S-ArrowUp", this.onShiftArrow.bind(this, "up"));
			this.key.register("S-ArrowDown", this.onShiftArrow.bind(this, "down"));
			this.key.register("Char", this.onChar);
			this.key.register("Enter", this.onEnter);
			this.key.register("Backspace", this.onBackspace);
			this.key.register("Delete", this.onDelete);
			this.key.register("Tab", this.onTab);
			this.key.register("Home", this.onHome);
			this.key.register("End", this.onEnd);
			this.key.register("S-Home", this.onHome);
			this.key.register("S-End", this.onEnd);
			this.key.register("C-a", this.onCtrlA);
			
			this.mouse.register("mousedown", this.onMouseDown);
			this.mouse.register("mousemove", this.onMouseMove);
			
			this.clip.register("copy", this.onCopy);
			this.clip.register("paste", this.onPaste);
			this.clip.register("cut", this.onCut);
		},
		
		onArrow: function(dir)
		{
			if(dir === "up" || dir === "down" || this.view.range.isEmpty()) {
				this.view.cursor[dir]();
			}
			else {
				if(dir === "left") {
					var newPos = this.view.range.getStart();
				}
				else {
					var newPos = this.view.range.getEnd();
				}
				
				this.view.cursor.set(newPos.row, newPos.offs);
			}
			
			this.view.range.stopSelecting();
		},
		
		onShiftArrow: function(dir)
		{
			this.view.range.startSelecting();
			this.view.cursor[dir]();
		},
		
		onChar: function(e)
		{
			this.view.replaceRangeText(e.key);
		},
		
		onEnter: function(e)
		{
			this.view.replaceRangeText("\n");
		},
		
		onBackspace: function(e)
		{
			if(this.view.range.isEmpty()) {
				this.view.cursor.left();
				this.view.range.startSelecting();
				this.view.cursor.right();
			}

			this.view.replaceRangeText("");
		},
		
		onDelete: function(e)
		{
			if(this.view.range.isEmpty()) {
				this.view.range.startSelecting();
				this.view.cursor.right();
			}

			this.view.replaceRangeText("");
		},
		
		onTab: function(e)
		{
			this.view.replaceRangeText("\t");
		},
		
		onHome: function(e)
		{
			if(e.shift) {
				this.view.range.startSelecting();
			}
			
			this.view.cursor.gotoLineStart();

			if(!e.shift) {
				this.view.range.stopSelecting();
			}
		},
		
		onEnd: function(e)
		{
			if(e.shift) {
				this.view.range.startSelecting();
			}
			
			this.view.cursor.gotoLineEnd();

			if(!e.shift) {
				this.view.range.stopSelecting();
			}
		},
		
		onCtrlA: function(e)
		{
			this.view.cursor.gotoStart();
			this.view.range.restartSelecting();
			this.view.cursor.gotoEnd();
		},
		
		onMouseDown: function(e)
		{
			if(e.primaryButton) {
				if(!e.shift) {
					this.view.range.stopSelecting();
				}
				
				this.view.cursor.gotoRowCol(
					this.display.screenYToRow(e.y),
					this.display.screenXToCol(e.x),
				);
			}
		},
		
		onMouseMove: function(e)
		{
			if(e.primaryButton) {
				this.view.range.startSelecting();
				this.view.cursor.gotoRowCol(
					this.display.screenYToRow(e.y),
					this.display.screenXToCol(e.x),
				);
			}
		},
		
		onPaste: function(e)
		{
			this.view.replaceRangeText(e.text);
		},
		
		onCopy: function(e)
		{
			e.text = this.view.getRangeText();
		},
		
		onCut: function(e)
		{
			e.text = this.view.getRangeText();
			this.view.replaceRangeText("");
		},
	});

})(mods['mod2'],mods['mod8'],mods['mod9'],mods['mod10'],mods['mod11'],mods['mod12'],);

mods['mod1'] = (function (utils_oop, Buffer, Gui, Tokenizer) {

	var oop = utils_oop;
	
	return oop.defclass({
	
		ctor: function Editor()
		{
			this.buffer = new Buffer();
			this.gui = new Gui(this.buffer, document.body);
			
			var alnumRule = { re: /^\w+/, type: "alnum", next: "" };
			var whiteRule = { re: /^\s+/, type: "white", next: "" };
			
			this.tokenizer = new Tokenizer(
				this.buffer,
				"open",
				{
					open: [
						{ re: /^\/\*/, type: "comment", next: "mlcomment" },
						alnumRule,
						whiteRule,
					],
					mlcomment: [
						{ re: /^\*\//, type: "comment", next: "open" },
						alnumRule,
						whiteRule,
					],
				},
			);
		},
	});

})(mods['mod2'],mods['mod3'],mods['mod4'],mods['mod5'],);

mods['mod0'] = (function (editor_Editor) {

	addEventListener("load", function() {
		editor = new editor_Editor();
		editor.gui.view.replaceRangeText("/* Hello World! ** this is, x = '9' */");
	});

})(mods['mod1'],);


})();
