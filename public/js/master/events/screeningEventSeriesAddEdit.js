$(function () {
    var eventId = $('input[name="id"]').val();

    $('.btn-ok').on('click', function () {
        // 新規追加の場合スケジュール存在確認なし
        if (eventId === undefined) {
            submit();

            return;
        }

        // 登録済スケジュールの存在を確認
        $.ajax({
            dataType: 'json',
            url: '/events/screeningEventSeries/' + eventId + '/screeningEvents',
            cache: false,
            type: 'GET',
            data: {
                // 件数を確認したいだけなので1件で十分
                limit: 1
            }
        }).done(function (data) {
            var confirmed = false;
            if (data.totalCount > 0) {
                if (window.confirm('登録済スケジュールが' + data.totalCount + '件存在します。本当に変更しますか？')) {
                    confirmed = true;
                }
            } else {
                confirmed = true;
            }

            if (confirmed) {
                submit();
            }
        }).fail(function (jqxhr, textStatus, error) {
            alert('スケジュールを検索できませんでした');
        }).always(function () {
        });
    });

    /**
     * フォームをsubmitする
     */
    function submit() {
        // サイネージ表示名自動保管
        var signageDisplayName = $('#signageDisplayName').val();
        if (signageDisplayName == null || signageDisplayName == '') {
            var movieIdentifier = $('#movieIdentifier option:selected').val();
            var movieName = $('#movieIdentifier option:selected').attr('data-name');
            if (movieIdentifier !== '') {
                $('#signageDisplayName').val(movieName);
            }
        }

        $('form').submit();
    }

    $('body').on('change', '#movieIdentifier', function () {
        var identifier = $(this).val();
        if (identifier == undefined) {
            return false;
        } else {
            var movieName = $('#movieIdentifier option:selected').attr('data-name');
            // 上映作品名
            $('#nameJa').val('');
            $('#nameJa').val(movieName);
            var url = '/events/screeningEventSeries/getrating';
            $.ajax({
                dataType: 'json',
                url: url,
                cache: false,
                data: {
                    identifier: identifier
                },
                type: 'GET',
                beforeSend: function () {
                    $('.loading').modal();
                }
            }).done(function (data) {
                $('#contentRating').val(data.results);
            });
        }

    });
    // datepickerセット
    $('.datepicker').datepicker({
        language: 'ja'
    })
});