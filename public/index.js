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
        event.stopImmediatePropagation();
        var selected = $(event.target).text();
        $(this).closest('.dropdown').replaceWith('<b>' + selected + '</b>');

        if ($row.find('.dropdown').length <= 0) {
            $('.announce_voice').removeClass('disabled');
            var whole = $row.find('td:nth-child(3)').html();
            var curr_station = $('.badge').parent().text();
            if (curr_station.length > 0) {
                $row.find('td:nth-child(3)').html('<i>' + curr_station + '</i>: ' + whole);
            }
        }
    });
	
	return ret;
}

function AddDropDown(str, regex, dd) {

	var res = str.match(regex);

    if (!res) return str; 

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
        platform_name: ['Darwin', 'Newton', 'Einstein', 'Uranus', 'Curie', 'Quentin'],
        cancel_time: ['18:00', '20:00'],
        operator: ['Ulysses', 'Leo'],
        destination: ['Hanoi', 'Bangkok'],
        cancellation_reason: ['door breakdown', 'delay of other cars', 'safety preventive action'],
        safety_type: ['terrorism activity', 'pedestrian safety'],
        amount_of_time: ['15 minutes', '30 minutes'],
        arrive_depart: ['Darwin Upstair', 'Darwin Downstair', 'Einstein Upstair', 'Einstein Downstair'],
        arrive_depart_time: ['12pm', '1pm', '2pm', '3pm'],
        intermediate_station: ['Uranus-Curie', 'Quentin-Darwin', 'Newton-Darwin'],
        number_of_coach: ['5', '6', '7', '8'],
        front_middle_rear: ['front', 'middle', 'rear'],
        altered_time: ['18:20', '20:25'],
        terminal_station: ['Hanoi North', 'New Bangkok'],
        station: ['Hanoi North', 'Pattaya Centre', 'Chiang Mai', 'New Bangkok'],
        next_station: ['Hanoi North', 'Pattaya Centre', 'Chiang Mai', 'New Bangkok'],
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

    /*
	$.getJSON('/db/phrases', {
		format: 'json'
	})
	.done(function(data) {
        phrases_cached = data;
	});
    */

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

            $('.announcements tbody tr').off();
        }
    });

    $('.announce_voice').on('click', function(res) {

        if (! $('announce_voice').hasClass('disabled')) {

            var announcement_text = $('.announcements tbody tr:visible')
                .find('td:nth-child(3)')
                .text();

            $('.announce_voice').addClass('disabled');

            $.ajax({
            url: '/audio',
            type: 'POST',
            data: { usertext: announcement_text },
            success: function(result) {
                    var prefix = 'data:audio/mpeg;base64,';
                    $('#synthesized_audio').attr('src', prefix + result.str_base64);
                    $('#synthesized_audio')[0].play();
                    $('.announce_voice').removeClass('disabled');
                }
            });
        }
    });

    $(document).on('click', '.announcements tbody tr', function() {
        if (selected_id == -1) {
            selected_id = $(this).attr('id');
            $('.announcements tbody tr[id!=' + selected_id + ']').hide('fast');
            $('.announcements tbody tr').css('cursor', 'auto');

            selected_text = $('.announcements tbody tr[id=' + selected_id + ']')
                           .find('td:nth-child(3)').text();

            var $row = $('.announcements tbody tr[id=' + selected_id + ']');

            $row.find('td:nth-child(3)')
                .html(AddDropDown(selected_text, regex, ddown_master));

            if ($row.find('.dropdown').length <= 0) {
                $('.announce_voice').removeClass('disabled');
                var whole = $row.find('td:nth-child(3)').text();
                var curr_station = $('.badge').parent().text();
                if (curr_station.length > 0) {
                    $row.find('td:nth-child(3)').html('<i>' + curr_station + '</i>: ' + whole);
                }
            }
        }
    });
    
    var map = L.map('map', {
        crs: L.CRS.Simple,
        minZoom: -1,
        maxZoom: 1
    });

    var bounds = [[0,0], [900,1300]];
    var image = L.imageOverlay('./map_components/TrackMap.png', bounds).addTo(map);
    map.fitBounds(bounds);
    map.setZoom(0);

    // Track Section 0
    L.rectangle([[810,150],[740,170]],{className:'stationRect'}).addTo(map).bindPopup("<span class='badge badge-success'>EW1</span> Pasir Ris");
    L.rectangle([[810,245],[740,265]],{className:'stationRect'}).addTo(map).bindPopup("<span class='badge badge-success'>EW2</span> Tampines");
    L.rectangle([[810,340],[740,360]],{className:'stationRect'}).addTo(map).bindPopup("<span class='badge badge-success'>EW3</span> Simei");
    L.rectangle([[810,435],[740,455]],{className:'stationRect'}).addTo(map).bindPopup("<span class='badge badge-success'>EW4</span> <span class='badge badge-success'>CG</span> Tanah Merah");
    L.rectangle([[810,530],[740,550]],{className:'stationRect'}).addTo(map).bindPopup("<span class='badge badge-success'>EW5</span> Bedok");
    L.rectangle([[810,625],[740,645]],{className:'stationRect'}).addTo(map).bindPopup("<span class='badge badge-success'>EW6</span> Kembangan");
    L.rectangle([[810,720],[740,740]],{className:'stationRect'}).addTo(map).bindPopup("<span class='badge badge-success'>EW7</span> Eunos");
    L.rectangle([[810,815],[740,835]],{className:'stationRect'}).addTo(map).bindPopup("<span class='badge badge-success'>EW8</span> <span class='badge badge-warning'>CC9</span> Paya Lebar");
    L.rectangle([[810,910],[740,930]],{className:'stationRect'}).addTo(map).bindPopup("<span class='badge badge-success'>EW9</span> Aljunied");
    L.rectangle([[810,1005],[740,1025]],{className:'stationRect'}).addTo(map).bindPopup("<span class='badge badge-success'>EW10</span> Kallang");
    L.rectangle([[810,1100],[740,1120]],{className:'stationRect'}).addTo(map).bindPopup("<span class='badge badge-success'>EW11</span> Lavender");

    // Track Section 1
    L.rectangle([[510,165],[440,185]],{className:'stationRect'}).addTo(map).bindPopup("<span class='badge badge-success'>EW12</span> <span class='badge badge-primary'>DT14</span> Bugis");
    L.rectangle([[510,260],[440,280]],{className:'stationRect'}).addTo(map).bindPopup("<span class='badge badge-success'>EW13</span> <span class='badge badge-danger'>NS25</span> City Hall");
    L.rectangle([[510,355],[440,375]],{className:'stationRect'}).addTo(map).bindPopup("<span class='badge badge-success'>EW14</span> <span class='badge badge-danger'>NS26</span> Raffles Place<p><img src='./map_components/EW14.png' width='300'></p>");
    L.rectangle([[510,450],[440,470]],{className:'stationRect'}).addTo(map).bindPopup("<span class='badge badge-success'>EW15</span> Tanjong Pagar");
    L.rectangle([[510,545],[440,565]],{className:'stationRect'}).addTo(map).bindPopup("<span class='badge badge-success'>EW16</span> <span class='badge badge-info'>NE3</span> Outram Park");
    L.rectangle([[510,640],[440,660]],{className:'stationRect'}).addTo(map).bindPopup("<span class='badge badge-success'>EW17</span> Tiong Bahru");
    L.rectangle([[510,735],[440,755]],{className:'stationRect'}).addTo(map).bindPopup("<span class='badge badge-success'>EW18</span> Redhill");
    L.rectangle([[510,830],[440,850]],{className:'stationRect'}).addTo(map).bindPopup("<span class='badge badge-success'>EW19</span> Queenstown");
    L.rectangle([[510,925],[440,945]],{className:'stationRect'}).addTo(map).bindPopup("<span class='badge badge-success'>EW20</span> Commonwealth");
    L.rectangle([[510,1020],[440,1040]],{className:'stationRect'}).addTo(map).bindPopup("<span class='badge badge-success'>EW21</span> <span class='badge badge-warning'>CC22</span> Buona Vista");
    L.rectangle([[510,1115],[440,1135]],{className:'stationRect'}).addTo(map).bindPopup("<span class='badge badge-success'>EW22</span> Dover");

    // Track Section 2
    L.rectangle([[210,180],[140,200]],{className:'stationRect'}).addTo(map).bindPopup("<span class='badge badge-success'>EW23</span> Clementi");
    L.rectangle([[210,275],[140,295]],{className:'stationRect'}).addTo(map).bindPopup("<span class='badge badge-success'>EW24</span> <span class='badge badge-danger'>NS1</span> Jurong East");
    L.rectangle([[210,370],[140,390]],{className:'stationRect'}).addTo(map).bindPopup("<span class='badge badge-success'>EW25</span> Chinese Garden");
    L.rectangle([[210,465],[140,485]],{className:'stationRect'}).addTo(map).bindPopup("<span class='badge badge-success'>EW26</span> Lakeside");
    L.rectangle([[210,560],[140,580]],{className:'stationRect'}).addTo(map).bindPopup("<span class='badge badge-success'>EW27</span> Boon Lay");
    L.rectangle([[210,655],[140,675]],{className:'stationRect'}).addTo(map).bindPopup("<span class='badge badge-success'>EW28</span> Pioneer");
    L.rectangle([[210,750],[140,770]],{className:'stationRect'}).addTo(map).bindPopup("<span class='badge badge-success'>EW29</span> Joo Koon");
    L.rectangle([[210,845],[140,865]],{className:'stationRect'}).addTo(map).bindPopup("<span class='badge badge-success'>EW30</span> Gul Circle");
    L.rectangle([[210,940],[140,960]],{className:'stationRect'}).addTo(map).bindPopup("<span class='badge badge-success'>EW31</span> Tuas Cresent");
    L.rectangle([[210,1035],[140,1055]],{className:'stationRect'}).addTo(map).bindPopup("<span class='badge badge-success'>EW32</span> Tuas West Road");
    L.rectangle([[210,1130],[140,1150]],{className:'stationRect'}).addTo(map).bindPopup("<span class='badge badge-success'>EW33</span> Tuas Link");

    Holder.addTheme('thumb', {
        bg: '#55595c',
        fg: '#eceeef',
        text: 'Thumbnail'
    });

});

