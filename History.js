export default class History
{
	constructor(view)
	{
		this.view = view;
		this.buffer = this.view.buffer;
		this.cursor = this.view.cursor;
		this.range = this.view.range;
		this.moves = [];
		
		this.buffer.on("change", e => this.onBufferChange(e));
		this.cursor.on("change", e => this.onCursorChange(e));
		this.range.on("change", e => this.onRangeChange(e));
	}
	
	onBufferChange(e)
	{
		this.moves.push({type: "buffer", data: e});
	}
	
	onCursorChange(e)
	{
		this.moves.push({type: "cursor", data: e});
	}
	
	onRangeChange(e)
	{
		this.moves.push({type: "range", data: e});
	}
}
