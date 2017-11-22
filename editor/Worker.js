include(function(oop, Ticker) {

	return oop.defclass({
	
		base: Ticker,
		
		ctor: function Worker()
		{
			Ticker.call(this, 10, this.step.bind(this));
			
			this.jobQueue = [];
		},
		
		step: function()
		{
			var job = this.jobQueue.shift();
			
			job();
			
			if(this.jobQueue.length === 0) {
				this.stop();
			}
		},
		
		push: function(job)
		{
			this.jobQueue.push(job);
			this.start();
		},
	
	});

});
