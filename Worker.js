import Ticker from "./Ticker.js";

export default class Worker extends Ticker
{
	constructor()
	{
		super(10, () => this.step());
		
		this.jobQueue = [];
	}
	
	step()
	{
		var job = this.jobQueue.shift();
		
		job();
		
		if(this.jobQueue.length === 0) {
			this.stop();
		}
	}
	
	push(job)
	{
		this.jobQueue.push(job);
		this.start();
	}
}
