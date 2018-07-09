import Emitter from "../emitter/Emitter.js";

export default class Keyboard extends Emitter
{
	constructor(eventTarget)
	{
		super();
		
		this.eventTarget = eventTarget;
		this.eventTarget.setAttribute("tabindex", "-1");
		this.eventTarget.addEventListener("keydown", e => this.onKeyDown(e));
	}
	
	onKeyDown(e)
	{
		var id = "";

		if(e.ctrlKey && e.key !== "Control") {
			id += "C-";
		}

		if(e.altKey && e.key !== "Alt") {
			id += "A-";
		}

		if(e.shiftKey && e.key !== "Shift" && e.key.length > 1) {
			id += "S-";
		}

		if(e.metaKey && e.key !== "Meta") {
			id += "M-";
		}

		if(e.key.length === 1 && id.length === 0) {
			id += "Char";
		}
		else if(e.key === " ") {
			id += "Space";
		}
		else {
			id += e.key;
		}
		
		if(this.subject(id).callbacks.length) {
			this.emit(
				id, {
					key: e.key,
					ctrl: e.ctrlKey,
					alt: e.altKey,
					shift: e.shiftKey,
					meta: e.metaKey
				}
			);
			
			e.preventDefault();
		}
	}
}
