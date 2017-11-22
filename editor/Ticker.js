include(function(oop) {

	return oop.defclass({
	
		ctor: function Ticker(interval, callback)
		{
			this.interval = interval;
			this.callback = callback;
			this.intervalId = null;
		},
		
		start: function()
		{
			if(this.intervalId === null) {
				this.intervalId = setInterval(this.callback, this.interval);
			}
			
			return this;
		},
		
		stop: function()
		{
			if(this.intervalId !== null) {
				clearInterval(this.intervalId);
				this.intervalId = null;
			}
			
			return this;
		},
		
		restart: function()
		{
			this.stop();
			this.start();
			
			return this;
		},
	
	});

});
