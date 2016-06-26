(function() {
	"use strict";
	
	var activeForm = true,
		loginBox   = $('#login'),
		signupBox  = $('#signup'),
		switcher   = $('#switcher');
	//true  = Login
	//false = Signup
	//SWITCHING BETWEEN FORMS ANIMATOR
	$('#switcher').on('click', function (e) {
		"use strict";
		e.preventDefault();
		if (activeForm) {
			loginBox.animate({ left: '-1500px' }, 400, function () {
				loginBox.css('display', 'none');
				signupBox.css('display', 'block')
						.animate({ left: 0 }, 500);
				activeForm = !activeForm;
				switcher.text("Already a member? Login");
			});
		} else {
			signupBox.animate({ left: '1500px' }, 400, function () {
				signupBox.css('display', 'none');
				loginBox.css('display', 'block')
						.animate({ left: 0 }, 500);
				activeForm = !activeForm;
				switcher.text("No account? Create one");
			});
		}
		return false;
	});

	//VALIDATION
	var errorMessages =  {
		length: "Must be 3 characters at least.",
		pLength: "Must be 6 characters at least.",
		unExists: "Username already exists, Choose another one.",
		error: "There is an error in your username, password combination.",
		connectError: "Couldn't connect to the server."
	};
	var loginFieldsValidLengthes = [
			[loginBox.find('#lUsername'), 3, errorMessages.length],
			[loginBox.find('#lPassword'), 6, errorMessages.pLength]
		],
		signupFieldsValidLengthes = [
			[signupBox.find('#name'), 3, errorMessages.length],
			[signupBox.find('#username'), 3, errorMessages.length],
			[signupBox.find('#password'), 6, errorMessages.pLength]
		];
	//LOGIN BOX VALIDATION START
	loginBox.on('submit', function (evt) {
		"use strict";
		evt.preventDefault();
		var $this = $(this),
			submitButton = $this.find('#loginSubmit'),
			noError = fieldErrorAdder(loginFieldsValidLengthes);
		if (noError) {
			submitDisabler(submitButton, true);
			$.ajax({
				url: "/login",
				type: "POST",
				dataType: "json",
				data: $this.serialize(),
				success: function (data) {
					noError = toast(data.error, errorMessages.error);
					if (noError) {
						window.location.href = "/dashboard";
					}
					submitDisabler(submitButton, false);
				},
				error: function (err) {
					toast(true, errorMessages.connectError);
					submitDisabler(submitButton, false);
				}
			});
		}
		return false;
	});
	//LOGIN BOX VALIDATION END

	//SIGNUP BOX VALIDATION START
	signupBox.on('submit', function (evt) {
		"use strict";
		evt.preventDefault();
		var $this = $(this),
			submitButton = $this.find('#signupSubmit'),
			noError = fieldErrorAdder(signupFieldsValidLengthes);
		if (noError) {
			submitDisabler(submitButton, true);
			$.ajax({
				url: "/signup",
				type: "POST",
				dataType: "json",
				data: $this.serialize(),
				success: function (data) {
					console.log(data);
					noError = toast(data.error, errorMessages.unExists);
					if (noError) {
						window.location.href = "/dashboard";
					}
					submitDisabler(submitButton, false);
				},
				error: function (err) {
					toast(true, errorMessages.connectError);
					submitDisabler(submitButton, false);
				}
			});
		}
		return false;
	});
	fieldsErrorRemover(loginFieldsValidLengthes);
	fieldsErrorRemover(signupFieldsValidLengthes);
}());