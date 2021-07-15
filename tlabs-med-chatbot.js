"use strict"; // usually enabled by default in browsers but it doesn't hurt to have here too
// declare global variables for stack pointer and subpointer (for inside stackframes)
var bot_messages = [];
var stack;
var stack_pointer;
var sub_pointer;
var basic_stack_answers;
var stack_answers;
var stack_process_messages;
var typing_timer;

var use_amazon = false;
var konami = [38,38,40,40,37,39,37,39]
var konami_index = 0;

// start automatic bot message queue
var bot_message_queue_run = setInterval(botMessageQueue, 100);

// executes when the page is loaded to set up the session
$().ready( function() {
	// attach event listeners to the chat box
	$("#chat-box").on("submit", getMessage);
	$("#text-box").on("keydown", submitOnEnter);
	$(document).on("keyup", setTypingTimerAndCheckCode);
	
	initializeProgram();
})

// initiate session
function initializeProgram() {
	// initialize variables
	stack = ["pronouns", "gender", "age"];
	stack_pointer = 0;
	sub_pointer = -1;
	basic_stack_answers = [undefined, undefined, undefined];
	stack_answers = [];
	stack_process_messages = [];
	typing_timer;
	
	initializeDataArrays();
	
	// send introductory message
	sendBotMessage("Hello! I am a chatbot that can help you determine proper treatment for medical symptoms.", true);
	sendBotMessage("Before we begin, are you filling out this form for yourself, or someone else?");
}

// submits the form when the user presses enter so they don't have to keep jumping back and forth between keyboard and mouse to submit
function submitOnEnter(e) {
	if (stack_pointer == stack.length && stack_pointer == 3) {
		clearTimeout(typing_timer);
	}
	if (e.which === 13 && !e.shiftKey) { // only executes if shift key isn't pressed
		$("#chat-box").trigger("submit"); // lets event listeners see the event
		e.preventDefault(); // prevents enter from being pressed so no Weird Stuff happens
	}
}

// sets a timer to go off when user hasn't typed for five seconds
function setTypingTimerAndCheckCode(e) {
	if (e.which === konami[konami_index]) {
		konami_index += 1;
		if (konami_index == 8) {
			$("#chat-container p").remove();
			konami_index = 0;
			
			if (use_amazon == false) {
				use_amazon = true;
				sendBotMessage("Restarting in Amazon Comprehend Medical enabled mode...", true, 0);
			} else {
				use_amazon = false;
				sendBotMessage("Restarting in Amazon Comprehend Medical disabled mode...", true, 0);
			}
			
			initializeProgram();
		}
	} else {
		konami_index = 0;
	}
	
	if (stack_pointer == stack.length) {
		clearTimeout(typing_timer);
		typing_timer = setTimeout(initializeStack, 1000);
	}
}

// gets input text and sends it to the screen and execution loop
function getMessage(e) {
	// prevent form submission
	e.preventDefault();
	
	// get text from the form
	var text = $("#chat-box").serializeArray()[0].value.trim(); // converts to serialized array, gets text value, and trims whitespace
	if (text == "") { return; } // only continues the function if textarea isn't empty
	sendHumanMessage(text); // send the input message
	
	processMessage(text);
}

// sends a message to the screen (bot or human)
function sendHumanMessage(text) {
	$("#chat-container").append("<p class=\"human-chat-bubble\">" + text + "</p>"); // sends message
	$("#chat-container").scrollTop($("#chat-container")[0].scrollHeight); // scrolls to the bottom of the container after sending message
	$("#chat-box")[0].reset();
}

function sendBotMessage(text, delayOverride = false, delayTime = 1000) {
	if (!delayOverride) { delayTime += (10 * text.length); } // normal delay scales with the length of the text
	bot_messages.push([text, delayTime]);
}

function botMessageQueue() {
	if (bot_messages.length > 0) {
		clearInterval(bot_message_queue_run);
		var messageDetails = bot_messages.shift();
		var text = messageDetails[0];
		var delayTime = messageDetails[1];
		setTimeout(function() {
			$("#chat-container").append("<p class=\"bot-chat-bubble\">" + text + "</p>"); // sends message
			$("#chat-container").scrollTop($("#chat-container")[0].scrollHeight); // scrolls to the bottom of the container after sending message
			var bot_message_queue_run = setInterval(botMessageQueue, 100);
		}, delayTime); // either 1000 if it's a low delay bot message, or proportional to the text length
	}
}

// processes input text
function processMessage(text) {
	console.log(stack_pointer);
	if (stack_pointer == stack.length) {
		stack_process_messages.push(text);
	} else {
	// globally retrieves the appropriate function based on the name string in the stack at the position of the current stack pointer
	window[stack[stack_pointer]](text.toLowerCase());
	}
}

// initializes stack to include only symptoms indicated
function initializeStack(text) {
	if (stack_process_messages.length == 0) { return; }
	
	// join the stored messages and clear memory
	var text = stack_process_messages.join("\n");
	stack_process_messages = [];
	
	// if script is using amazon and has not finished processing the text previously (as initACMRequest calls initializeStack as a callback)
	if (use_amazon && !(done_processing)) {
		initACMRequest(text);
		return;
	} else {
		var old_stack_length = stack.length;
		var keys = Object.keys(synonyms);
		for (var i = 0; i < keys.length; i++) {
			for (var j = 0; j < synonyms[keys[i]].length; j++) {
				if (text.indexOf(synonyms[keys[i]][j]) != -1 && !(stack.includes(keys[i]))) {
					stack.push(keys[i]);
				}
			}
		}
		
		if (stack.length > old_stack_length) {
			processNextSymptom(true);
		} else {
			conclusion();
		}
	}
}

// checks if next symptom exists and then routes execution there; otherwise 
function processNextSymptom(from_initializeStack = false) {
	// if this was called by an actual symptom function rather than the initializeStack function, move stack pointer forward
	// if it's from initializeStack, the stack pointer is already at what had been the position after the end of the stack,
	// so it doesn't have to move the stack pointer forward
	if (!from_initializeStack) {
		stack_pointer += 1;
	}
	// sub pointer is always reset to -1
	sub_pointer = -1;
	
	if (stack_pointer < stack.length) {
		window[stack[stack_pointer]](null);
	} else {
		sendBotMessage("Is there anything else you want to mention?");
		clearTimeout(typing_timer);
	}
}

function conclusion() {
	// this is where any neural network implementation code would go once data exists
	// for now it just shows what it successfully detected
	var idstring;
	var data_array = ["<b>Here's what data I collected:</b><br>"]
	
	idstring = "Is the user the patient? ";
	if (basic_stack_answers[0][0] = "you") {
		idstring += "Yes";
	} else {
		idstring += "No";
	}
	data_array.push(idstring);
	console.log(stack_answers);
	
	idstring = "Patient's gender: " + basic_stack_answers[1];
	data_array.push(idstring);
	
	idstring = "Patient's age: " + basic_stack_answers[2];
	data_array.push(idstring);
	
	if (stack.indexOf("temp") != -1) {
		data_array.push("<br>Patient has an abnormal body temperature.");
		
		idstring = "Patient's temperature: " + stack_answers[stack.indexOf("temp")-3][0] + " degrees " + stack_answers[stack.indexOf("temp")-3][1] + " (" + stack_answers[stack.indexOf("temp")-3][2] + ")";
		data_array.push(idstring);
	} else {
		data_array.push("<br>Patient does not have an abnormal body temperature.");
	}
	
	if (stack.indexOf("cough") != -1) {
		data_array.push("<br>Patient has a cough.");
		
		idstring = "Cough attributes: " + stack_answers[stack.indexOf("cough")-3][0].join(", ");
		data_array.push(idstring);
	} else {
		data_array.push("<br>Patient does not have a cough.");
	}
	
	if (stack.indexOf("dizzy") != -1) {
		data_array.push("<br>Patient is experiencing dizziness.");
	} else {
		data_array.push("<br>Patient is not experiencing dizziness.");
	}
	
	if (stack.indexOf("rash") != -1) {
		data_array.push("<br>Patient has a rash.");
		
		idstring = "The rash is on the patient's: " + stack_answers[stack.indexOf("rash")-3][0].join(', ');
		data_array.push(idstring);
		
		idstring = "Rash attributes: " + stack_answers[stack.indexOf("rash")-3][1].join(', ');
		data_array.push(idstring);
	} else {
		data_array.push("<br>Patient does not have a rash.");
	}
	
	idstring = data_array.join("<br>");
	sendBotMessage(idstring, true);
}