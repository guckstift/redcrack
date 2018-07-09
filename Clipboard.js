import dom from "../dom/dom.js";
import Emitter from "../emitter/Emitter.js";

export default class Clipboard extends Emitter
{	
	constructor(display)
	{
		super();
		
		this.display = display;
		this.textarea = this.display.textarea;
		
		dom.on(this.textarea, "paste", e => this.onPaste(e));
		dom.on(this.textarea, "copy", e => this.onCopy(e));
		dom.on(this.textarea, "cut", e => this.onCut(e));
	}
	
	onPaste(e)
	{
		this.emit("paste", { text: e.clipboardData.getData("text") });
		e.preventDefault();
	}
	
	onCopy(e)
	{
		var eventData = { text: "" };
		
		this.emit("copy", eventData);
		e.clipboardData.setData("text", eventData.text);
		e.preventDefault();
	}
	
	onCut(e)
	{
		var eventData = { text: "" };
		
		this.emit("cut", eventData);
		e.clipboardData.setData("text", eventData.text);
		e.preventDefault();
	}
}
