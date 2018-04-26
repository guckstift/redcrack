export default
{
	isfunc(x)
	{
		return typeof x === "function";
	},
	
	isarray(x)
	{
		return Array.isArray(x);
	},
	
	create(proto)
	{
		return Object.create(proto);
	},
}
