$( function() {
    $('body').on('change', '#price', function(){
        var price = $(this).val();
        var url = '/tickettypegroups/getTicketTypePriceList';
        // 対象券種名の処理
        var ticketTypeArray = [];
        $('#sortable2 > li').each(function(){
            var uid = $(this).attr('uid');
            ticketTypeArray.push(uid);
        });
        $('#sortable1').empty();
        $.ajax({
            dataType: 'json',
            url: url,
            cache: false,
            type: 'GET',
            data: {
                price: price,
                ticketTypeChoose: ticketTypeArray
            },
            beforeSend: function () {
                $('#price').prop('disabled', true);
            }
        }).done(function (data) {
            var ticketType = data.results;
            if (data.success) {
                var i;
                for (i in ticketType) {
                    $('#sortable1').append(
                        '<li class="ui-state-default" uid=' + ticketType[i].id + '>' + 
                        ticketType[i].name.ja + '（' + ticketType[i].price + '）' + '</li>'
                    );
                }
                $('#sortable1').show();
                $('#sortable2').show();
                $('#price').prop('disabled', false);
            }
        }).fail(function (jqxhr, textStatus, error) {
            alert("fail");
            $('#price').prop('disabled', false);
        });
    });
    
    $( "#sortable1, #sortable2" ).sortable({
        connectWith: ".connectedSortable"
    }).disableSelection();

    // show or hide 対象券種名
    var priceList = $('#sortable2 > li').length;
    if (priceList == 0) {
        // $('#sortable1').hide();
        // $('#sortable2').hide();
    }

    // form submit
    $('.btn-ok').on('click', function(){
        // 対象券種名の処理
        $('#sortable2 > li').each(function(){
            var uid = $(this).attr('uid');
            $('<input />').attr('type', 'hidden')
                          .attr('name', 'ticketTypes')
                          .attr('value', uid)
                          .appendTo('#ticketTypeGroupsForm');
        });

        $('form').submit();
    });
} );