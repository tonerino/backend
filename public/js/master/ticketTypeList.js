$(function () {
    var ITEMS_ON_PAGE = Number($('input[name="limit"]').val());

    // datepickerセット
    $('.datepicker').datepicker({
        language: 'ja'
    })

    //Enter押下で検索
    $('form').on('keydown', function () {
        if (window.event.keyCode == 13) $('.btn-ok').click();
    });

    // 共通一覧表示初期セット・ページャセット
    $.CommonMasterList.init('#templateRow', '#searchedCount');
    $.CommonMasterList.pager('#pager', ITEMS_ON_PAGE, function (pageNumber) {
        search(pageNumber);
    });

    // 検索ボタンイベント
    var conditions = {};
    $(document).on('click', '.btn-ok', function () {
        // 検索条件取得
        conditions = $.fn.getDataFromForm('form');
        // 検索API呼び出し
        search(1);
    });

    // 検索条件クリア
    $(document).on('click', '.reset-condition', function () {
        $.fn.clearFormValue('form');
    });
    //--------------------------------
    // 検索API呼び出し
    //--------------------------------
    function search(pageNumber) {
        conditions['page'] = pageNumber;
        var url = '/ticketTypes/getlist';
        // alert(JSON.stringify(conditions));
        $.ajax({
            dataType: 'json',
            url: url,
            cache: false,
            type: 'GET',
            data: conditions,
            beforeSend: function () {
                $('.loading').modal();
            }
        }).done(function (data) {
            if (data.success) {
                var dataCount = (data.count) ? (data.count) : 0;
                // 一覧表示
                if ($.CommonMasterList.bind(data.results, dataCount, pageNumber)) {
                    $('#list').show();
                } else {
                    $('#list').hide();
                }
                // 検索条件表示
                $.fn.setDataToForm('form', conditions);
            }
        }).fail(function (jqxhr, textStatus, error) {
            alert("fail");
        }).always(function (data) {
            $('.loading').modal('hide');
        });
    }

    // 関連券種グループ button
    $(document).on('click', '.popupListTicketTypeGroup', function (event) {
        event.preventDefault();
        var target = $(this).find('a:first').attr('href');
        list(target);
    });

    /**
     * 関連券種グループのpopupを表示
     */
    function list(url) {
        $.ajax({
            dataType: 'json',
            url: url,
            cache: false,
            type: 'GET',
            // data: conditions,
            beforeSend: function () {
                $('.loading').modal();
            }
        }).done(function (data) {
            if (data.success) {
                var modal = $('#listModal');
                var listTicketTypeGroup = modal.find('#listTicketTypeGroup');
                listTicketTypeGroup.empty();
                if (data.results.length > 0) {
                    for (let i = 0; i < data.results.length; i++) {
                        listTicketTypeGroup.append(`<tr><td>${data.results[i].name.ja}</td></tr>`);
                    }
                } else {
                    listTicketTypeGroup.append(`<tr><td>データがありません。</td></tr>`);
                }
                modal.modal();
            }
        }).fail(function (jqxhr, textStatus, error) {
            alert(error);
        }).always(function (data) {
            $('.loading').modal('hide');
        });
    }
});