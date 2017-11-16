include(function() {

	return {

		replace: function(array, start, count, insert)
		{
			Array.prototype.splice.apply(array, [start, count].concat(insert));
		},
		
		repeat: function(times, value)
		{
			return Array(times).fill(value);
		},
	
	};

});
