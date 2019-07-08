// index.js

var phrases_cached;
var selected_id = -1;
var selected_text;

function indexOfMatch(str, match) {

  var ret = [];
  var curr = 0;
  var found = -1;
 
  for (var k=0; k<match.length; k++) {
      found = str.substring(curr,).indexOf(match[k]);
      if (found > -1) {
          ret.push([curr + found, curr + found + match[k].length]);
          curr += found + match[k].length;
          found = -1;
      }
  }
  
  return ret;
  
}

function arrayToUnorderedList(arr_name, arr) {

	var ret = '<div class="dropdown d-inline-block">';
	ret += '<button class="btn btn-primary dropdown-toggle m-2" type="button" id="dropdownMenu' + arr_name + '" data-toggle="dropdown" ' +
           'aria-haspopup="true" aria-expanded="false">' + arr_name + '</button>' +
           '<div class="dropdown-menu" aria-labelledby="dropdownMenu">';

	for (var i=0; i<arr.length; i++) {
		ret += '<button class="dropdown-item" type="button">' + arr[i] + '</button>';
	}
	ret += '</div></div>';

    var $row = $('.announcements tbody tr[id=' + selected_id + ']');

    $row.on('click', '.dropdown-item', function(event) {
        var selected = $(event.target).text();
        $(this).closest('.dropdown').replaceWith('<b>' + selected + '</b>');

        if ($row.find('.dropdown').length <= 0) {
            $('.announce_voice').removeClass('disabled');
        }
    });
	
	return ret;
}

function AddDropDown(str, regex, dd) {

	var res = str.match(regex);
    var indexes = indexOfMatch(str, res);
    var category = [];
    /* remove [ and ] */
    for (var i=0; i<res.length; i++) {
    	category.push(res[i].slice(1, -1));
    }
    
    var str2 = [];
    /* convert string ...[xx]... into ...<div><item1><item2></div>... */
    for (var k=0; k <= indexes.length; k++) {
        /* start chunk to first [ */
        if (k == 0) {
            str2.push( str.slice(0, indexes[k][0]) );
            str2.push( arrayToUnorderedList(category[k], dd[category[k]]) );
        }
        /* last chunk after last ] */
        else if (k == indexes.length) {
            str2.push( str.slice(indexes[k-1][1], ) );
        }
        /* previous ] to in middle [ */
        else {
            str2.push( str.slice(indexes[k-1][1], indexes[k][0]) );
            str2.push( arrayToUnorderedList(category[k], dd[category[k]]) );
        }
    }
    
    return str2.join(' ');
}

$(document).ready(function() {

    var regex = /\[.+?\]/gi;
    var ddown_master = {
        platform_number: ['1', '2', '3', '4', '5', '6'],
        cancel_time: ['18:00', '20:00'],
        operator: ['Ulysses', 'Leo'],
        destination: ['Hanoi', 'Bangkok'],
        cancellation_reason: ['door breakdown', 'delay of other cars', 'safety preventive action'],
    };

    $('.announce_voice').addClass('disabled');

	$.getJSON('/db/announcements', {
		format: 'json'
	})
	.done(function(data) {
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
        if (selected_id != -1) {
            $('.announce_voice').addClass('disabled');
            $('.announcements tbody tr')
                .show('fast')
                .css('cursor', 'pointer');

            $('.announcements tbody tr[id=' + selected_id + ']')
                .find('td:nth-child(3)')
                .html(selected_text);

            selected_text = "";
            selected_id = -1;
        }
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
        if (selected_id == -1) {
            selected_id = $(this).attr('id');
            $('.announcements tbody tr[id!=' + selected_id + ']').hide('fast');
            $('.announcements tbody tr').css('cursor', 'auto');

            selected_text = $('.announcements tbody tr[id=' + selected_id + ']')
                           .find('td:nth-child(3)').text();

            $('.announcements tbody tr[id=' + selected_id + ']')
                .find('td:nth-child(3)')
                .html(AddDropDown(selected_text, regex, ddown_master));
        }
    });
});
