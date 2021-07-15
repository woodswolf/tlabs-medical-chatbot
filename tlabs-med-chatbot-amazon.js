"use strict";
// slave script ot tlabs-med-chatbot.js
var done_processing = false;

function initACMRequest(text) {
	AWS.config.update({accessKeyId: "AKIARBA7CBBP3NH3RMFY", secretAccessKey: "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", region: "us-east-2"});
	var CM = new AWS.ComprehendMedical({region: "us-east-2"});
	var params = new Object();
	params.Text = text;
	
	console.log("sending");
	var det = CM.detectEntities({Text: text}, function(err, data) {
		if (err) {
			// an error occurred
			console.log(err, err.stack);
		} else {
			// successful response
			var new_text = "";
			for (var i = 0; i < data.Entities.length; i++) {
				stack_process_messages.push(data.Entities[i].Text);
			}
			done_processing = true;
			initializeStack(new_text);
		}
	});
}