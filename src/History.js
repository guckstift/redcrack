export default class History
{
	constructor(view)
	{
		this.view = view;
		this.buffer = this.view.buffer;
		this.cursor = this.view.cursor;
		this.range = this.view.range;
		this.moves = [];
		
		this.buffer.register("change", this ,"onBufferChange");
		this.cursor.register("change", this, "onCursorChange");
		this.range.register("change", this, "onRangeChange");
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
