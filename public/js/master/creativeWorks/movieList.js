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

    // 編集ボタンイベント
    $(document).on('click', 'a.edit', function () {
        // イベント識別子取得&url編集
        console.log($('td[name="identifier"]', $(this).closest('tr')));
        var identifier = $('td[name="identifier"]', $(this).closest('tr')).html();
        var url = '/creativeWorks/movie/' + identifier + '/update';
        window.location.href = url;
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
        var url = '/creativeWorks/movie/getlist';
        //alert(JSON.stringify(conditions));
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
                //alert("success:" + data.count);
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
});

