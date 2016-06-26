(function () {
	//SUBMITTING AND DELETING NOTES
	var noteList = $('#noteList'),
		createNoteForm = $('#createNote'),
		contentsTextarea = $('#contents'),
		submitButton = createNoteForm.find('.submitButton'),
		emptyErrorMessage = "Can't be empty.",
		fieldsCheck = [[$('#title'), 1, emptyErrorMessage], [$('#contents'), 1, emptyErrorMessage]],
		liStock = $('#notes li:first-child'),
		pendingForDeletion = "";
	window.onbeforeunload = function () {
		if (pendingForDeletion !== "") deleteNote(pendingForDeletion);
	}
	function createNote(evt) {
		"use strict";
		var $this = $(this),
			noError = fieldErrorAdder(fieldsCheck);
		if (noError) {
			submitDisabler(submitButton, true);
			$.ajax({
				url: "/createNote",
				type: "POST",
				data: $this.serialize(),
				dataType: "json",
				success: function (data) { 
					var title = $("#title").val();
					liStock.clone().find(".avatar").text(title.substr(0, 1)).end().find(".links").find("div").text(title).end().find("span").html(contentsTextarea.val().replace(/\r\n|\r|\n/g, "<br />")).end().end().find(".deleteNote").attr("data-id", data.insertId).end().prependTo(noteList).fadeIn(300);
					$this.find('div').removeClass('active').find('#title, #contents').blur().val("");
					toast(true, "Note created successfully.");
					submitDisabler(submitButton, false);
					contentsTextarea.attr('rows', 1);
				},
				error: function () {
					toast(true, "Error connecting to the server.");
					submitDisabler(submitButton, false);
				}
			});
		}
		return false;
	}
	function deleteNote(id) {
		$.ajax({
			url: "/deleteNote",
			type: "DELETE",
			data: "id=" + id
		});
	}
	createNoteForm.on('submit', createNote);
	$('#notes').on('click', 'div.deleteNote',  function () {
		"use strict";
		var $this = $(this),
			timeout = 0,
			li = $this.parent(),
			id = $this.data('id');
		li.fadeOut(300);
		if (pendingForDeletion !== "") {
			deleteNote(pendingForDeletion);
		}
		pendingForDeletion = id;
		timeout = setTimeout(function () {
				li.remove();
				deleteNote(id);
				pendingForDeletion = "";
			}, TOAST_TIMEOUT + 500);
		toast(true, "Note deleted successfully.", true, function () {
			clearTimeout(timeout);
			li.fadeIn(300);
			pendingForDeletion = "";
		});
	});

	var dialog = $('#dialogContainer');
	$('#notes').on('click', '.links, .avatar', function (evt) {
		"use strict";
		var title = $(this).parent().find('.links div').html(),
			content = $(this).parent().find('.links span').html();
		dialog.find('#dTitle').html(title);
		dialog.find('#dContents').html(content);
		dialog.show();
	});

	$('#dialog #closeButton').on('click', function () {
		dialog.hide();
	});

	//AUTO GROWING TEXTAREA
	contentsTextarea.on('keydown', function (evt) {
		"use strict";
		var $this = $(this),
			rows = $this.val().split('\n').length;
		if ($this.scrollTop() > 0 || evt.keyCode === 13) $this.attr('rows', rows + 1);
		if (evt.keyCode === 8) $this.attr('rows', rows);
	});
	contentsTextarea.on('keyup', function (evt) {
		var $this = $(this);
		if (evt.keyCode === 8) $this.attr('rows', $this.val().split('\n').length);
	});
	fieldsErrorRemover(fieldsCheck);
})();