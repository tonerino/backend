$(function () {
    var ticketTypeGroupId = $('input[name="id"]').val();

    $('body').on('change', '#price', function () {
        var price = $(this).val();
        var url = '/tickettypegroups/getTicketTypePriceList';
        // 対象券種名の処理
        var ticketTypeArray = [];
        $('#sortable2 > li').each(function () {
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
                price: Number(price)
            },
            beforeSend: function () {
                $('#price').prop('disabled', true);
            }
        }).done(function (data) {
            var ticketType = data.results;
            if (data.success) {
                var i;
                // すでに選択済の券種を除外
                ticketType = ticketType.filter(function (t) {
                    return ticketTypeArray.indexOf(t.id) < 0;
                });
                for (i in ticketType) {
                    $('#sortable1').append(
                        '<li class="ui-state-default" uid=' + ticketType[i].id + '>' +
                        ticketType[i].name.ja + '(' + ticketType[i].priceSpecification.price + ')' + '</li>'
                    );
                }
                $('#sortable1').show();
                $('#sortable2').show();
                $('#price').prop('disabled', false);
            }
        }).fail(function (jqxhr, textStatus, error) {
            alert('fail');
            $('#price').prop('disabled', false);
        });
    });

    $("#sortable1, #sortable2").sortable({
        connectWith: ".connectedSortable"
    }).disableSelection();

    // show or hide 対象券種名
    var priceList = $('#sortable2 > li').length;
    if (priceList == 0) {
        // $('#sortable1').hide();
        // $('#sortable2').hide();
    }

    // form submit
    $('.btn-ok').on('click', function () {
        // 券種リストに含まれるムビチケ券種区分リスト
        var appliesToMovieTicketTypes = [];

        // 対象券種名の処理
        $('#sortable2 > li').each(function () {
            var uid = $(this).attr('uid');
            var appliesToMovieTicketType = $(this).attr('appliesToMovieTicketType');
            if (appliesToMovieTicketType !== '') {
                appliesToMovieTicketTypes.push(appliesToMovieTicketType);
            }
            $('<input />').attr('type', 'hidden')
                .attr('name', 'ticketTypes')
                .attr('value', uid)
                .appendTo('#ticketTypeGroupsForm');
        });

        // ムビチケ券種区分の重複を確認
        var uniqueAppliesToMovieTicketTypes = appliesToMovieTicketTypes.filter(function (value, index, self) {
            return self.indexOf(value) === index;
        });
        if (appliesToMovieTicketTypes.length !== uniqueAppliesToMovieTicketTypes.length) {
            alert('ムビチケ券種区分が重複しています');

            return false;
        }

        $('form').submit();
    });

    // 削除ボタン
    $('.btn-delete').on('click', function () {
        if (window.confirm('元には戻せません。本当に削除しますか？')) {
            $.ajax({
                dataType: 'json',
                url: '/tickettypegroups/' + ticketTypeGroupId,
                type: 'DELETE'
            }).done(function () {
                alert('削除しました');
                location.href = '/ticketTypeGroups';
            }).fail(function (jqxhr, textStatus, error) {
                var message = '削除できませんでした';
                if (jqxhr.responseJSON != undefined && jqxhr.responseJSON.error != undefined) {
                    message += ': ' + jqxhr.responseJSON.error.message;
                }
                alert(message);
            }).always(function () {
            });
        } else {
        }
    });
});