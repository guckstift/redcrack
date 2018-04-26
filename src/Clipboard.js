import dom from "./utils/dom.js";
import Emitter from "./Emitter.js";

export default class Clipboard extends Emitter
{	
	constructor(display)
	{
		super();
		
		this.display = display;
		this.textarea = this.display.textarea;
		
		this.textarea.addEventListener("paste", e => this.onPaste(e));
		this.textarea.addEventListener("copy", e => this.onCopy(e));
		this.textarea.addEventListener("cut", e => this.onCut(e));
	}
	
	onPaste(e)
	{
		this.trigger("paste", { text: e.clipboardData.getData("text") });
		e.preventDefault();
	}
	
	onCopy(e)
	{
		var eventData = { text: "" };
		
		this.trigger("copy", eventData);
		e.clipboardData.setData("text", eventData.text);
		e.preventDefault();
	}
	
	onCut(e)
	{
		var eventData = { text: "" };
		
		this.trigger("cut", eventData);
		e.clipboardData.setData("text", eventData.text);
		e.preventDefault();
	}
}
