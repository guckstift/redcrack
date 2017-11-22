include(function(oop, Tokenizer) {

	var numRule = { re: /^(0x|0X|0b|0B|0o)?[0-9]+/, type: "num", next: "" };
	var alnumRule = { re: /^\w+/, type: "alnum", next: "" };
	var whiteRule = { re: /^\s+/, type: "white", next: "" };
	
	var keywords = [
		"if", "else", "while", "for", "function", "break", "continue", "return", "var", "this",
		"new", "delete", "null", "undefined", "throw", "typeof"
	];
	
	return oop.defclass({
	
		base: Tokenizer,
	
		ctor: function JavaScriptTokenizer(buffer)
		{
			Tokenizer.call(
				this,
				buffer,
				"open",
				{
					open: [
						{ re: /^\/\*/, type: "comment", next: "mlcomment" },
						{ re: /^\/\//, type: "comment", next: "slcomment" },
						{ re: /^"/, type: "string", next: "dqstring" },
						{ re: /^'/, type: "string", next: "sqstring" },
						{ re: /^(true|false)/, type: "num", next: "" },
						{ re: /^\//, type: "regex", next: "regex" },
						numRule,
						alnumRule,
						whiteRule,
					],
					slcomment: [
						{ re: /^$/, type: "comment", next: "open" },
						alnumRule,
						whiteRule,
					],
					mlcomment: [
						{ re: /^\*\//, type: "comment", next: "open" },
						alnumRule,
						whiteRule,
					],
					dqstring: [
						{ re: /^$/, type: "string", next: "open" },
						{ re: /^"/, type: "string", next: "open" },
						{ re: /^\\"/, type: "string", next: "" },
						alnumRule,
						whiteRule,
					],
					sqstring: [
						{ re: /^$/, type: "string", next: "open" },
						{ re: /^'/, type: "string", next: "open" },
						{ re: /^\\'/, type: "string", next: "" },
						alnumRule,
						whiteRule,
					],
					regex: [
						{ re: /^\\\//, type: "regex", next: "" },
						{ re: /^\//, type: "regex", next: "open" },
						{ re: /^$/, type: "regex", next: "open" },
					],
				},
			);
		},
		
		classify: function(type, before, after, text)
		{
			if(
				type === "comment" || before === "mlcomment" && after === "mlcomment" ||
				before === "slcomment" && after === "slcomment"
			) {
				return "comment";
			}
			else if(
				type === "string" || before === "dqstring" && after === "dqstring" ||
				before === "sqstring" && after === "sqstring"
			) {
				return "string";
			}
			else if(type === "alnum" && keywords.indexOf(text) > -1) {
				return "keyword";
			}
			else if(type === "num") {
				return "number";
			}
			else if(type === "regex" || before === "regex" && after === "regex") {
				return "string";
			}
			else {
				return "normal";
			}
		},
	
	});

});
