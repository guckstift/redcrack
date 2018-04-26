export default
{
	replace(array, start, count, insert)
	{
		Array.prototype.splice.apply(array, [start, count].concat(insert));
	},
	
	repeat(times, value)
	{
		return Array(times).fill(value);
	},
}
