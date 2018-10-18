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

    $('select[name=theater], input[name=startDateFrom], input[name=startDateThrough]').on('change', function() {
        var theater = $('select[name=theater]').val();
        var startDateFrom = $('input[name=startFrom]').val();
        var startDateThrough = $('input[name=startThrough]').val();
        getScreeningEventSeries(theater, startDateFrom, startDateThrough);
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
        var startDateFrom = $('input[name=startFrom]').val();
        var startDateThrough = $('input[name=startThrough]').val();
        if ($('select[name=theater]').val() === null) {
            alert('劇場を選択してください！');
            return;
        }
        if (startDateFrom === '' || startDateThrough === '') {
            alert('上映日を入力してください！');
            return;
        }
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
        var url = '/timeMeter/search';
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


    /**
     * イベントシリーズ取得
     * @function getScreeningEventSeries
     * @param {string} theater
     * @param {string} fromDate
     * @param {string} toDate
     * @returns {void}
     */
    function getScreeningEventSeries(theater, fromDate, toDate) {
        if (!fromDate || !theater || !toDate) {
            return;
        }
        var screeningEventSeriesSelector = $('select[name=screeningEventSeries]');
        screeningEventSeriesSelector
            .html('<option>-----<option>')
            .attr('disabled', true);
        $.ajax({
            dataType: 'json',
            url: '/events/screeningEventSeries/search',
            type: 'GET',
            data: {
                fromDate: fromDate,
                toDate: toDate,
                branchCode: theater
            }
        }).done(function (data) {
            if (data && data.success) {
                // console.log(data);
                var screeningEventSeries = data.results;
                var options = screeningEventSeries.map(function (e) {
                    return '<option value="' + e.id + '">' + e.filmNameJa + '</option>';
                });
                options.unshift('<option value="" selected>-----</option>')
                screeningEventSeriesSelector.html(options);
            }
        }).fail(function (jqxhr, textStatus, error) {
            console.error(jqxhr, textStatus, error);
        }).always(function() { screeningEventSeriesSelector.removeAttr('disabled'); });
    }
});

$(function () {
    //上映日
    $('input[name="startFrom"], input[name="startThrough"]')
        .val(moment().tz('Asia/Tokyo').format('YYYY/MM/DD'));
});