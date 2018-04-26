export default
{
	repeatString(s, n)
	{
		return new Array(n + 1).join(s);
	},

	clamp(minval, maxval, val)
	{
		return Math.max(minval, Math.min(maxval, val));
	},

	arrayReplace(array, start, count, insert)
	{
		Array.prototype.splice.apply(array, [start, count].concat(insert));
	},
}
