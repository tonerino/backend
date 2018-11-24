$(function () {
    var eventId = $('input[name="id"]').val();

    $('.btn-ok').on('click', function () {
        // 新規追加の場合スケジュール存在確認なし
        if (eventId === undefined) {
            submit();

            return;
        }

        // 作品の興行終了予定日と上映終了日を比較
        var movieAvailabilityEnds = $('#workPerformed\\[identifier\\] option:selected').attr('data-availabilityEnds');
        var endDateValue = $('#endDate').val();
        if (movieAvailabilityEnds !== '' && endDate !== '') {
            var endDate = moment(`${endDateValue}T00:00:00+09:00`, 'YYYY/MM/DDTHH:mm:ssZ').add(1, 'day').toDate();
            if (endDate > moment(movieAvailabilityEnds).toDate()) {
                alert('上映終了日は作品の興行終了予定日以前としてください');

                return false;
            }
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
            var movieIdentifier = $('#workPerformed\\[identifier\\] option:selected').val();
            var movieName = $('#workPerformed\\[identifier\\] option:selected').attr('data-name');
            if (movieIdentifier !== '') {
                $('#signageDisplayName').val(movieName);
            }
        }

        $('form').submit();
    }

    $('body').on('change', '#workPerformed\\[identifier\\]', function () {
        var identifier = $(this).val();
        if (identifier == undefined) {
            return false;
        } else {
            // 作品情報を自動補完
            var movieName = $('#workPerformed\\[identifier\\] option:selected').attr('data-name');
            var movieHeadline = $('#workPerformed\\[identifier\\] option:selected').attr('data-headline');
            $('#nameJa').val(movieName);
            $('#headline\\[ja\\]').val(movieHeadline);

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