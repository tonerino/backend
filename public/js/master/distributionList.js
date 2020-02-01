$(function () {
    var ITEMS_ON_PAGE = Number($('input[name="limit"]').val());

    //Enter押下で検索
    $('form').on('keydown', function () {
        if (window.event.keyCode == 13) {
            if ($('#editModal').hasClass('in')) {
                $('#editModal .update-button').click();
            } else {
                $('.btn-ok').click();
            }
        }
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
        conditions = $.fn.getDataFromForm('form.search');
        // 検索API呼び出し
        search(1);
    });

    // 編集ボタンイベント
    $(document).on('click', 'a.edit', function () {
        edit(this);
    });

    // 編集ボタンイベント
    $(document).on('click', 'button.update-button', function () {
        update();
    });

    // 検索条件クリア
    $(document).on('click', '.reset-condition', function () {
        $.fn.clearFormValue('form.search');
    });
    //--------------------------------
    // 検索API呼び出し
    //--------------------------------
    function search(pageNumber) {
        conditions['page'] = pageNumber;
        var url = '/distributions/getlist';
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
            alert("エラー発生しました。再度試してください！");
        }).always(function (data) {
            $('.loading').modal('hide');
        });
    }

    function edit(target) {
        var id = $('td[name="id"]', $(target).closest('tr')).html();
        var codeValue = $('td[name="codeValue"]', $(target).closest('tr')).html();
        var name = $('td[name="name"]', $(target).closest('tr')).html();
        var modal = $('#editModal');
        modal.find('input[name=id]').val(id);
        modal.find('input[name=codeValue]').val(codeValue);
        modal.find('input[name=name]').val(name);
        modal.modal();
    }

    function update() {
        var modal = $('#editModal');
        var id = modal.find('input[name=id]').val();
        var name = modal.find('input[name=name]').val();
        if (id.length === 0 || name.length === 0) {
            alert('名称を入力してください！');
            return;
        }

        $.ajax({
            dataType: 'json',
            url: '/distributions/' + id + '/update',
            type: 'POST',
            data: {
                name: name
            }
        }).done(function (data, textStatus) {
            if (textStatus === 'nocontent') {
                modal.modal('hide');
                $('table tbody tr[identifier=' + id + ']').find('td[name=name]').html(name);
                return;
            } else {
                console.error(data.results);
            }
            alert('更新に失敗しました');
        }).fail(function (jqxhr, textStatus, error) {
            console.error(jqxhr, textStatus, error);
            alert('更新に失敗しました');
        });
    }
});

