var TOAST_TIMEOUT = 4000;

var toastMessage = $('#toastMessage'),
	toastTimer = 0,
	undo = toastMessage.find('div.undo'),
	undoHandler;

function toast(condition, error, but, butHandler) {
	var noError = true;
	if (condition) {
		clearTimeout(toastTimer);
		if (toastMessage.hasClass('active')) {
			toastMessage.removeClass('active');
			setTimeout(function () {
				(but ? undo.show() : undo.hide());
				toastMessage.addClass('active').find('div.text').html(error);
			}, 300);
		} else {
			(but ? undo.show() : undo.hide());
			toastMessage.addClass('active').find('div.text').html(error);
		}
		toastTimer = setTimeout(function () {
			toastMessage.removeClass('active');
		}, TOAST_TIMEOUT);
		noError = false;
		undoHandler = butHandler;
	}
	return noError;
}
function submitDisabler(button, val) {
	button.attr('disabled', val);
	button.css('cursor', val ? 'default' : 'pointer');
}
function emptyError(input) {
	input.parent().removeClass('activeError').find('.inputError').text('');
}
function fillError(input, error) {
	input.parent().addClass('activeError').find('.inputError').text(error);
}

function fieldsErrorRemover(fields) {
	fields.forEach(function (item) {
		item[0].on('keyup', function () {
			if ($(this).val().trim().length + 1 >= item[1]) {
				emptyError($(this));
			}
		});
	});
}
function fieldErrorAdder(fields) {
	var noError = true;
	fields.forEach(function (item) {
		if (item[0].val().trim().length < item[1]) {
			fillError(item[0], item[2]);
			noError = false;
		}
	});
	return noError;
}
(function () {
	//ANIMATING INPUT BOXES
	$('form div .field, form div .bigField').on('focus', function () {
		$(this).parent().addClass('active');
	}).on('blur', function () {
		var $this = $(this);
		if ($this.val().trim() === "") {
			$this.parent().removeClass('active');
		}
	});
	undo.on('click', function () {
		toastMessage.removeClass('active');
		undoHandler();
	});
	$('.submitButton').ripple();
}());