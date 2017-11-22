include(function(utils_oop, utils_Comparable, Emitter) {

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
			this.tokenizer = this.view.tokenizer;
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
		
		getCurLineLength: function()
		{
			return this.buffer.getLineLength(this.row);
		},
		
		isAtLineStart: function()
		{
			return this.offs === 0;
		},
		
		isAtLineEnd: function()
		{
			return this.offs === this.getCurLineLength();
		},
	
		set: function(row, offs)
		{
			if(this.hasListeners("change")) {
				var old = this.copy();
			}
					
			this.row = this.buffer.getClampedRow(row);
			this.offs = this.buffer.getClampedOffs(row, offs);
		
			if(this.hasListeners("change") && !this.isEqual(old)) {
				this.trigger(
					"change",
					{ oldRow: old.row, oldOffs: old.offs, newRow: this.row, newOffs: this.offs }
				);
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
		
		gotoTokenStart: function()
		{
			var tok = this.tokenizer.getTokenAt(this.row, this.offs);
			this.set(this.row, tok.offs);
		},
		
		gotoTokenEnd: function()
		{
			var tok = this.tokenizer.getTokenAt(this.row, this.offs);
			this.set(this.row, tok.offs + tok.length);
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
		
		pageUp: function()
		{
			this.set(this.row - 50, this.getCol());
		},
		
		pageDown: function()
		{
			this.set(this.row + 50, this.getCol());
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

});
