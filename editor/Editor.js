include(function(utils_oop, Buffer, Gui, Tokenizer) {

	var oop = utils_oop;
	
	return oop.defclass({
	
		ctor: function Editor()
		{
			this.buffer = new Buffer();
			this.gui = new Gui(this.buffer, document.body);
			
			var alnumRule = { re: /^\w+/, type: "alnum", next: "" };
			var whiteRule = { re: /^\s+/, type: "white", next: "" };
			
			this.tokenizer = new Tokenizer(
				this.buffer,
				"open",
				{
					open: [
						{ re: /^\/\*/, type: "comment", next: "mlcomment" },
						alnumRule,
						whiteRule,
					],
					mlcomment: [
						{ re: /^\*\//, type: "comment", next: "open" },
						alnumRule,
						whiteRule,
					],
				},
			);
		},
	});

});
