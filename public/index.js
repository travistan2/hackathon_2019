// index.js

var phrases_cached;

function AddDropDown(raw) {
    return raw.toString().replace(/\[[^\]]*?\]/g, 'zzzz');
}

$(document).ready(function() {

    $('.announce_voice').addClass('disabled');

	$.getJSON('/db/announcements', {
		format: 'json'
	})
	.done(function(data) {

        //data = AddDropDown(data);

		$.each(data, function(idx, item) {
            var $row = $('<tr id="' + item.ID + '">' +
                '<td>' + item.ID + '</td>' +
                '<td>' + item.type + '</td>' +
                '<td>' + item.text + '</td>' +
                '</tr>');
			$('.announcements tbody').append($row);
		});
	});

	$.getJSON('/db/phrases', {
		format: 'json'
	})
	.done(function(data) {
        phrases_cached = data;
	});

    $('.back_screen').on('click', function() {
        $('.announce_voice').addClass('disabled');
        $('.announcements tbody tr')
            .show('fast')
            .css('cursor', 'pointer');
    });

    $('.announce_voice').on('click', function() {
        if (! $('announce_voice').hasClass('disabled')) {
            var completetext = $('.announcements tbody tr:visible')
                .find('td:nth-child(3)')
                .text();

            // Eng Seng stuff
            alert(completetext);
            // End Eng Seng stuff
        }
    });

    $(document).on('click', '.announcements tbody tr', function() {
        var id = $(this).attr('id');
        $('.announcements tbody tr[id!=' + id + ']').hide('fast');
        $('.announcements tbody tr').css('cursor', 'auto');
        $('.announce_voice').removeClass('disabled');
    });
});
