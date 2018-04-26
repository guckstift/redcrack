import Comparable from "./utils/Comparable.js";
import Emitter from "./Emitter.js";

export default class Range extends Comparable(Emitter)
{
	constructor(head)
	{
		super();
		
		this.head = head;
		this.buffer = head.buffer;
		this.anchor = this.head;
		this.head.register("change", e => this.onHeadChange(e));
	}

	compare(other)
	{
		if(this.buffer !== other.buffer) {
			throw "can not compare ranges of different buffers";
		}
	
		return this.head.compare(other.head) || this.anchor.compare(other.anchor);
	}
	
	touches(other)
	{
		if(this.buffer !== other.buffer) {
			throw "can not compare ranges of different buffers";
		}
		
		var thisStart = this.getStart();
		var thisEnd = this.getEnd();
		var otherStart = other.getStart();
		var otherEnd = other.getEnd();
		
		return !( thisEnd.isLower(otherStart) || thisStart.isGreater(otherEnd) );
	}
	
	isSelecting()
	{
		return this.anchor !== this.head;
	}

	isEmpty()
	{
		return this.head.isEqual(this.anchor);
	}

	getStart()
	{
		return this.head.min(this.anchor);
	}

	getEnd()
	{
		return this.head.max(this.anchor);
	}
	
	getRows()
	{
		return this.getEnd().row - this.getStart().row + 1;
	}

	startSelecting()
	{
		if(!this.isSelecting()) {
			this.anchor = this.head.copy();
		}
	}

	stopSelecting()
	{
		if(this.isSelecting()) {
			var oldAnchor = this.anchor.copy();
		
			this.anchor = this.head;
		
			if(!this.anchor.isEqual(oldAnchor)) {
				this.trigger("change");
			}
		}
	}

	restartSelecting()
	{
		this.stopSelecting();
		this.startSelecting();
	}
	
	onHeadChange()
	{
		if(this.isSelecting()) {
			this.trigger("change");
		}
	}
}
