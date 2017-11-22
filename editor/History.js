include(function(oop) {

	return oop.defclass({
	
		ctor: function History(view)
		{
			this.view = view;
			this.buffer = this.view.buffer;
			this.cursor = this.view.cursor;
			this.range = this.view.range;
			this.history = [];
			
			this.buffer.register("change", this.onBufferChange.bind(this));
			this.cursor.register("change", this.onCursorChange.bind(this));
			this.range.register("change", this.onRangeChange.bind(this));
		},
		
		onBufferChange: function(e)
		{
			this.history.push({type: "buffer", data: e});
		},
		
		onCursorChange: function(e)
		{
			this.history.push({type: "cursor", data: e});
		},
		
		onRangeChange: function(e)
		{
			this.history.push({type: "range", data: e});
		},
	
	});

});
