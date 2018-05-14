export default class Subject
{
	constructor()
	{
		this.clear();
	}
	
	hasObservers()
	{
		return this.observers.length > 0;
	}
	
	register(owner, method = "update")
	{
		if(typeof method === "string") {
			this.observers.push({owner, handler: owner[method].bind(owner)});
		}
		else if(typeof method === "function") {
			this.observers.push({owner, handler: method});
		}
	}
	
	unregister(_owner)
	{
		this.handlers = this.handlers.filter(({owner}) => owner !== _owner);
	}
	
	clear()
	{
		this.observers = [];
	}
	
	trigger(...data)
	{
		this.observers.forEach(({handler}) => handler(...data, this));
	}
}
