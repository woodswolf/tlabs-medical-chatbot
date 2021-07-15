"use strict";
// slave script to tlabs-med-chatbot.js
var body_parts = ["finger", "thumb", "hand", "palm", "wrist", "arm", "elbow", "shoulder", "chest", "torso", "stomach", "tummy", "back", "neck", "head", "face", "eye", "nose", "mouth", "ear", "forehead", "chin", "cheek", "hip", "butt", "genital", "thigh", "leg", "knee", "calf", "calves", "ankle", "foot", "feet", "heel", "sole", "toe"];
var temp_data_array;
var rash_data_array;
var cough_data_array;

function initializeDataArrays() {
	temp_data_array = [];
	rash_data_array = [];
	cough_data_array = [];
}

function pronouns(text) {
	var myself = new RegExp("(me)|(my(?=self))");
	
	if (text.search(myself) != -1) {
		basic_stack_answers[0] = ["you", "yourself", "your"];
	} else {
		basic_stack_answers[0] = ["they", "them", "their"];
	}
	
	sendBotMessage("Good to know. What is " + basic_stack_answers[0][2] + " assigned gender? (Optional)");
	stack_pointer += 1;
}

function gender(text) {
	var male = new RegExp("(\bamab\b)|(\bm\b)|(\bmale\b)|(\bman\b)|(\bboy)|(\bguy\b)|((?<=(grand-*)|(\b))father)|((?<=(grand-*)|(\b))dad(dy)*)|((?<=(grand-*)|(\b))son\b)|((?<=(grand-*)|(\b))nephew\b)");
	var female = new RegExp ("(\bafab\b)|(\bf\b)|(\bfemale\b)|(\bwoman\b)|(\bgirl)|((?<=(grand-*)|(\b))mother)|((?<=(grand-*)|(\b))(mom(m[ay])*|(ma(ma)*)))|((?<=(grand-*)|(\b))daughter\b)|((?<=(grand-*)|(\b))niece\b)");
	
	var malesearch = text.search(male);
	var femalesearch = text.search(female);
	
	if (malesearch != -1 && femalesearch == -1) {
		basic_stack_answers[1] = "Male";
	} else if (femalesearch != -1 && malesearch == -1) {
		basic_stack_answers[1] = "Female";
	} else {
		basic_stack_answers[1] = "Unknown";
	}
	
	sendBotMessage("Okay. What is " + basic_stack_answers[0][2] + " age in years? (Optional)");
	stack_pointer += 1;
}

function age(text) {
	var num = new RegExp("\b\d+(\.\d+)*\b","g");
	var match = text.match(num);
	if (match != null && match.length == 1) {
		basic_stack_answers[2] = match[0];
	}
	
	
	sendBotMessage("Thank you. Now, what symptoms are " + basic_stack_answers[0][0] + " experiencing?");
	stack_pointer += 1;
	clearTimeout(typing_timer);
}

function temp(text) {
	if (text == null) {
		// question 0
		sendBotMessage("You mentioned " + basic_stack_answers[0][0] + " have an abnormal body temperature. If you've measured it with a thermometer, what did it read?");
		sub_pointer += 1;
	} else {
		switch (sub_pointer) {
			case 0:
				var numsearch = /\b\d+(\.\d+)*/g;
				var num = text.match(numsearch);
				if (num == null) {
					sendBotMessage("Please enter the temperature using numerical digits (e.g. 101.6).");
				} else if (num.length > 1) {
					sendBotMessage("Sorry, you mentioned more than one number! Which one is the measured temperature?");
				} else {
					var is_celsius_temp = (30 <= num[0] && num[0] <= 45);
					var is_farenheit_temp = (86 <= num[0] && num[0] <= 113);
					if (!(is_celsius_temp) && !(is_farenheit_temp)) {
						sendBotMessage("I don't think that's a valid temperature. Please re-enter it - did you make a typo?");
					} else {
						temp_data_array.push(num); // index 0
						var is_dangerous_high_temp;
						var is_dangerous_low_temp;
						
						if (is_farenheit_temp) {
							is_dangerous_high_temp = (num >= 104);
							is_dangerous_low_temp = (num <= 95);
							temp_data_array.push("Farenheit"); // index 1
						} else if (is_celsius_temp) {
							is_dangerous_high_temp = (num >= 40);
							is_dangerous_low_temp = (num <= 35);
							temp_data_array.push("Celsius"); // index 1
						}
						
						if (is_dangerous_high_temp) {
							temp_data_array.push("Dangerously High"); // index 2
							sendBotMessage("You've indicated " + basic_stack_answers[0][0] + " have a dangerously high body temperature. <b>Call " + basic_stack_answers[0][2] + " doctor, local hospital, or emergency services number immediately.</b> Keep " + basic_stack_answers[0][1] + " cool and make sure " + basic_stack_answers[0][0] + " drink plenty of fluids.", true);
						} else if (is_dangerous_low_temp) {
							temp_data_array.push("Dangerously Low"); // index 2
							sendBotMessage("You've indicated " + basic_stack_answers[0][0] + " have a dangerously low body temperature. <b>Call " + basic_stack_answers[0][2] + " doctor, local hospital, or emergency services number immediately.</b> Keep " + basic_stack_answers[0][1] + " warm and dry.", true);
						} else {
							temp_data_array.push("Within Safe Limits"); // index 2
						}
						
						
						stack_answers.push(temp_data_array);
						processNextSymptom();
					}
				}
				break;
			
			default: // should never be reached
				console.log("Something went really wrong in the temperature function.");
		}
	}
}

function cough(text) {
	if (text == null) {
		// question 0
		sendBotMessage("You mentioned " + basic_stack_answers[0][0] + " have a cough. How would " + basic_stack_answers[0][0] + " describe it?");
		sub_pointer += 1;
	} else {
		switch (sub_pointer) {
			case 0:
				var adjs = ["dry", "hack", "wheeze", "wheezing", "forceful", "nonproductive", "non-productive", "wet", "blood", "mucus", "fluid", "phlegm", "swallow", "chronic", "repeat"];
				var adjs_list = []
				for (var i = 0; i < adjs.length; i++) {
					if (text.indexOf(adjs[i]) != -1) {
						adjs_list.push(adjs[i]);
					}
				}
				cough_data_array.push(adjs_list); // index 0
				
				
				stack_answers.push(cough_data_array);
				processNextSymptom();
				break;
			default: // should never be reached
				console.log("Something went really wrong in the cough function.");
		}
	}
}

function dizzy(text) {
	// no substantial follow-up questions to ask here, at least that I can think of; pass through to next symptom
	stack_answers.push("Dizziness/Vertigo/etc."); // filler answer so that the array can process correctly
	processNextSymptom();
}

function rash(text) {
	if (text == null) {
		// question 0
		sendBotMessage("You mentioned " + basic_stack_answers[0][0] + " have a rash. Where is it?");
		sub_pointer += 1;
	} else {
		switch (sub_pointer) {
			case 0:
				var locations = [];
				for (var i = 0; i < body_parts.length; i++) {
					if (text.indexOf(body_parts[i]) != -1) {
						locations.push(body_parts[i]);
					}
				}
				if (locations.length == 0) {
					sendBotMessage("Sorry, I couldn't understand your answer. Please try again, and try to mention more specific areas (hands, chest, calves, etc.).");
				} else {
					rash_data_array.push(locations); // index 0
					sendBotMessage("What does the rash look or feel like?");
					sub_pointer += 1;
				}
				break;
			case 1:
				var rash_descriptors = ["red", "rough", "scaly", "bullseye", "bulls eye", "bulls-eye", "yellow", "blister", "flaky", "raised", "irritated", "itch", "bump", "pain", "hard", "pus"];
				var chosen_descriptors = [];
				
				for (var i = 0; i < rash_descriptors.length; i++) {
					if (text.indexOf(rash_descriptors[i]) != -1) {
						chosen_descriptors.push(rash_descriptors[i]);
					}
				}
				rash_data_array.push(chosen_descriptors); // index 1
				
				stack_answers.push(rash_data_array);
				processNextSymptom();
				break;
			default: // should never be reached
				console.log("Something went really wrong in the rash function.");
		}
	}
}