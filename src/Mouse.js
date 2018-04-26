import Emitter from "./Emitter.js";

export default class Mouse extends Emitter
{
	constructor(eventTarget)
	{
		super();
		
		this.eventTarget = eventTarget;
		this.eventTarget.addEventListener("mousedown", e => this.onMouseEvent(e));
		this.eventTarget.addEventListener("mouseup", e => this.onMouseEvent(e));
		this.eventTarget.addEventListener("mousemove", e => this.onMouseEvent(e));
		this.eventTarget.addEventListener("dblclick", e => this.onMouseEvent(e));
		this.eventTarget.addEventListener("wheel", e => this.onWheelEvent(e));
	}
	
	onMouseEvent(e)
	{
		var id = e.type;
		
		if(this.hasListeners(id)) {
			var clientRect = this.eventTarget.getBoundingClientRect();
			var eventData = {
				x: e.clientX - clientRect.left,
				y: e.clientY - clientRect.top,
				primaryButton: e.buttons & 1 > 0,
				secondaryButton: e.buttons & 2 > 0,
				auxilaryButton: e.buttons & 4 > 0,
				ctrl: e.ctrlKey,
				alt: e.altKey,
				shift: e.shiftKey,
				meta: e.metaKey
			}
		
			this.trigger(id, eventData);
			
			e.preventDefault();
			
			if(eventData.primaryButton) {
				this.eventTarget.focus();
			}
		}
	}
	
	onWheelEvent(e)
	{
		if(e.deltaY > 0) {
			this.trigger("wheeldown");
		}
		else if(e.deltaY < 0) {
			this.trigger("wheelup");
		}
	}
}
