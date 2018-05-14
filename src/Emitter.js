import Subject from "./Subject.js";

export default class Emitter
{
	constructor()
	{
		this.subjects = {};
	}
	
	subject(event)
	{
		return this.subjects[event] = this.subjects[event] || new Subject();
	}
	
	hasListeners(event)
	{
		return this.subject(event).hasObservers();
	}

	register(event, owner, method)
	{
		this.subject(event).register(owner, method);
	}

	unregister(event, owner)
	{
		this.subject(event).unregister(owner);
	}

	unregisterListener(owner)
	{
		Object.values(this.subjects).forEach(subject => subject.unregister(owner));
	}
	
	clear(event)
	{
		this.subject(event).clear();
	}
	
	clearAll()
	{
		Object.values(this.subjects).forEach(subject => subject.clear());
	}

	trigger(event, ...data)
	{
		this.subject(event).trigger(...data, this);
	}
}
