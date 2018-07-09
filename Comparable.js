export default base => class extends base
{
	compare(other)
	{
		throw "compare() is not implemented";
	}

	isEqual(other)
	{
		return this === other || this.compare(other) === 0;
	}

	isLower(other)
	{
		return this.compare(other) < 0;
	}

	isGreater(other)
	{
		return this.compare(other) > 0;
	}

	min(other)
	{
		return this.isLower(other) ? this : other;
	}

	max(other)
	{
		return this.isGreater(other) ? this : other;
	}
}
