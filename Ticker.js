export default class Ticker
{
	constructor(interval, callback)
	{
		this.interval = interval;
		this.callback = callback;
		this.intervalId = null;
	}
	
	start()
	{
		if(this.intervalId === null) {
			this.intervalId = setInterval(this.callback, this.interval);
		}
		
		return this;
	}
	
	stop()
	{
		if(this.intervalId !== null) {
			clearInterval(this.intervalId);
			this.intervalId = null;
		}
		
		return this;
	}
	
	restart()
	{
		this.stop();
		this.start();
		
		return this;
	}
}
