export default class History
{
	constructor(view)
	{
		this.view = view;
		this.buffer = this.view.buffer;
		this.cursor = this.view.cursor;
		this.range = this.view.range;
		this.history = [];
		
		this.buffer.register("change", e => this.onBufferChange(e));
		this.cursor.register("change", e => this.onCursorChange(e));
		this.range.register("change", e => this.onRangeChange(e));
	}
	
	onBufferChange(e)
	{
		this.history.push({type: "buffer", data: e});
	}
	
	onCursorChange(e)
	{
		this.history.push({type: "cursor", data: e});
	}
	
	onRangeChange(e)
	{
		this.history.push({type: "range", data: e});
	}
}
