include(function(utils_oop, utils_Comparable, Emitter) {

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

});
