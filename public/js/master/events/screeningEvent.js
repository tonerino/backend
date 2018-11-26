// moment.tz.add([
//     'Asia/Tokyo',
//     'America/New_York|EST EDT|50 40|0101|1Lz50 1zb0 Op0'
// ]);

/**
 * 1時間の高さ
 * @const HOUR_HEIGHT
 */
var HOUR_HEIGHT = 64;

/**
 * スクリーンの幅
 * @const SCREEN_WIDTH
 */
var SCREEN_WIDTH = 107;

/**
 * スケジュール作成中かどうか
 */
var creatingSchedules = false;

$(function () {
    // 検索
    $(document).on('click', '.search-button', function (event) {
        event.preventDefault();
        var theater = $('.search select[name=theater]').val();
        var date = $('.search input[name=date]').val();
        var days = $('.search input[name=days]:checked').val();
        var screen = $('.search select[name=screen]').val();
        screen = screen === '' ? undefined : screen;
        search(theater, date, days, screen);
    });
    // 新規作成
    $(document).on('click', '.add-button', function (event) {
        event.preventDefault();
        add();
    });
    // 編集
    $(document).on('click', '.performance', function (event) {
        event.preventDefault();
        var target = $(this).find('.inner');
        edit(target);
    });

    // 新規登録（確定）
    $(document).on('click', '.regist-button', function (event) {
        event.preventDefault();
        regist();
    });

    // 更新（確定）
    $(document).on('click', '.update-button', function (event) {
        event.preventDefault();
        update();
    });

    // 削除ボタンの処理
    $(document).on('click', '.delete-button', function (event) {
        event.preventDefault();
        deletePerformance();
    });

    $(document).on('change', 'form.search select[name="theater"]', _.debounce(function () {
        var theater = $(this).val();
        var date = $('.search input[name=date]').val();
        getScreens(theater, 'none');
    }, 500));

    $(document).on('change', '#newModal select[name="screeningEventSeriesId"]', function () {
        var mvtkFlg = $(this).find('option:selected').attr('data-mvtk-flag');
        if (mvtkFlg != 1) {
            $('#newModal input[name=mvtkExcludeFlg]').removeAttr('checked');
            $('#newModal .mvtk').hide();
        } else {
            $('#newModal .mvtk').show();
        }
    });

    $(document).on('change', '#newModal select[name="theater"]', _.debounce(function () {
        var theater = $(this).val();
        getScreens(theater, 'add');
        getEventSeries(theater);
    }, 500));

    $(document).on('change', 'form.search input[name="date"]', _.debounce(function () {
        var theater = $('.search select[name=theater]').val();
        var date = $(this).val();
        getEventSeries(theater, date);
    }, 500));

    var target = [
        'select[name="doorTimeHour"]',
        'select[name="doorTimeMinute"]',
        'select[name="startTimeHour"]',
        'select[name="startTimeMinute"]',
        'select[name="endTimeHour"]',
        'select[name="endTimeMinute"]',
        'select[name="ticketTypeGroup"]'
    ];
    $(document).on(
        'change',
        target.join(', '),
        function () {
            $(this).parents('tr').attr('data-dirty', true);
        }
    );
});

/**
 * イベントシリーズ取得
 * @function getEventSeries
 * @param {date}
 * @returns {void}
 */
function getEventSeries(theater) {
    if (!theater) {
        return;
    }
    var screeningEventSeriesSelect = $('#newModal select[name="screeningEventSeriesId"]');
    screeningEventSeriesSelect.html('<option selected disabled>-----</option>')
    $.ajax({
        dataType: 'json',
        url: '/events/screeningEventSeries/search',
        type: 'GET',
        data: {
            branchCode: theater
        }
    }).done(function (data) {
        if (data && data.success) {
            // console.log(data);
            var screeningEventSeries = data.results;
            var options = screeningEventSeries.map(function (e) {
                return '<option value="' + e.id + '"'
                    + ' data-mvtk-flag="' + e.mvtkFlg + '"'
                    + ' data-startDate="' + e.startDate + '"'
                    + ' data-endDate="' + e.endDate + '"'
                    + '>' + e.filmNameJa + '</option>';
            });
            options.unshift('<option value="" disabled selected>選択してください</option>')
            screeningEventSeriesSelect.html(options);
        }
    }).fail(function (jqxhr, textStatus, error) {
        console.error(jqxhr, textStatus, error);
        alert('エラーが発生しました。');
    });
}

/**
 * スクリーン取得
 * @function getScreens
 * @param {theater}
 * @param {addModal}
 * @returns {void}
 */
function getScreens(theater, modal = 'none') {
    var selectScreen = $('select[name="screen"]');
    if (modal.indexOf('none') >= 0) {
        selectScreen = $('.search select[name="screen"]');
    }
    if (modal.indexOf('edit') >= 0) {
        selectScreen = $('#editModal select[name="screen"]');
    }
    if (modal.indexOf('add') >= 0) {
        selectScreen = $('#newModal select[name="screen"]');
    }
    function resetScreenList() {
        var o = $('<option></option>');
        o.html('劇場を選択してください');
        o.val('');
        selectScreen.html(o);
    }
    if (!theater) {
        resetScreenList();
        return;
    } else {
        selectScreen.html('<option selected disabled>-----</option>');
    }
    $.ajax({
        dataType: 'json',
        url: '/places/movieTheater/getScreenListByTheaterBranchCode',
        type: 'GET',
        data: {
            branchCode: theater
        }
    }).done(function (data) {
        if (data && data.success) {
            if (modal.indexOf('none') >= 0) {
                selectScreen.html('<option value="">-----</option>');
            } else {
                selectScreen.html('<option value="" disabled selected>選択してください</option>');
            }
            $.each(data.results, function (_, screen) {
                var o = $('<option></option>');
                o.html(screen.name);
                o.val(screen.branchCode);
                o.appendTo(selectScreen);
            });
        } else {
            resetScreenList();
        }
    }).fail(function (jqxhr, textStatus, error) {
        console.error(jqxhr, textStatus, error);
        alert('エラーが発生しました。');
    });
}

function getWeekDayData() {
    var weekDayData = $('#newModal input[name="weekDay"]:checked');
    if (weekDayData.length === 0) {
        return [];
    }
    var result = [];
    weekDayData.each(function () {
        result.push($(this).val());
    });
    return result;
}

/**
 * 時間情報を取得
 * @function getTableData
 * @returns {array}
 */
function getTableData() {
    var timeTableData = $('#newModal tr[data-dirty="true"]');
    if (timeTableData.length === 0) {
        // 何も入力していない=>NG
        return [];
    }
    var tempData = [];
    timeTableData.each(function (_, row) {
        const mvtkExcludeFlg = $(row).find('input[name="mvtkExcludeFlg"]:checked').val() === undefined ? 0 : 1;
        var o = {
            doorTimeHour: $(row).find('select[name="doorTimeHour"]').val(),
            doorTimeMinute: $(row).find('select[name="doorTimeMinute"]').val(),
            startTimeHour: $(row).find('select[name="startTimeHour"]').val(),
            startTimeMinute: $(row).find('select[name="startTimeMinute"]').val(),
            endTimeHour: $(row).find('select[name="endTimeHour"]').val(),
            endTimeMinute: $(row).find('select[name="endTimeMinute"]').val(),
            ticketTypeGroup: $(row).find('select[name="ticketTypeGroup"]').val(),
            mvtkExcludeFlg: mvtkExcludeFlg
        };
        // 入力していない情報がある=>NG
        if (
            o.doorTimeHour == null ||
            o.doorTimeMinute == null ||
            o.startTimeHour == null ||
            o.startTimeMinute == null ||
            o.endTimeHour == null ||
            o.endTimeMinute == null ||
            o.ticketTypeGroup == null
        ) {
            return [];
        }
        if (
            o.doorTimeHour + o.doorTimeMinute > o.startTimeHour + o.startTimeMinute ||
            o.startTimeHour + o.startTimeMinute > o.endTimeHour + o.endTimeMinute
        ) {
            return [];
        }
        tempData.push(o);
    });
    var timeData = tempData.map(function (data) {
        return {
            doorTime: data.doorTimeHour + data.doorTimeMinute,
            startTime: data.startTimeHour + data.startTimeMinute,
            endTime: data.endTimeHour + data.endTimeMinute
        }
    });
    var ticketData = tempData.map(function (data) {
        return data.ticketTypeGroup
    });
    var mvtkExcludeFlgData = tempData.map(function (data) {
        return data.mvtkExcludeFlg
    });
    return {
        ticketData: ticketData,
        timeData: timeData,
        mvtkExcludeFlgData: mvtkExcludeFlgData
    };
}

/**
 * 新規登録（確定）
 * @function register
 * @returns {void}
 */
function regist() {
    // 作成中なら何もしない
    if (creatingSchedules) {
        return;
    }
    creatingSchedules = true;

    var modal = $('#newModal');
    var theater = modal.find('select[name=theater]').val();
    var screen = modal.find('select[name=screen]').val();
    var startDate = modal.find('input[name=screeningDateStart]').val();
    var toDate = modal.find('input[name=screeningDateThrough]').val();
    var screeningEventId = modal.find('select[name=screeningEventSeriesId]').val();
    var onlineDisplayStartDate = modal.find('input[name=onlineDisplayStartDate]').val();
    var tableData = getTableData();
    var weekDayData = getWeekDayData();

    if (theater === ''
        || screen === null
        || startDate === ''
        || toDate === ''
        || screeningEventId === null
        || tableData.timeData.length === 0
        || tableData.ticketData.length === 0
        || weekDayData.length === 0
        || onlineDisplayStartDate === ''
    ) {
        creatingSchedules = false;
        alert('情報が足りません');
        return;
    }

    var selectedTheater = modal.find('select[name=theater] option:selected');
    var maxSeatNumber = selectedTheater.attr('data-max-seat-number');
    var saleStartDays = selectedTheater.attr('data-sale-start-days');
    var endSaleTimeAfterScreening = selectedTheater.attr('data-end-sale-time');

    if (moment(startDate + 'T00:00:00+09:00', 'YYYY/MM/DDTHH:mm:ssZ') >= moment(toDate + 'T00:00:00+09:00', 'YYYY/MM/DDTHH:mm:ssZ').add(1, 'day')) {
        creatingSchedules = false;
        alert('登録期間を正しく設定してください');
        return;
    }

    // 登録期間が興行期間に含まれているかどうか確認
    var eventSeriesStartDate = modal.find('select[name=screeningEventSeriesId]').find('option:selected').attr('data-startDate');
    var eventSeriesEndDate = modal.find('select[name=screeningEventSeriesId]').find('option:selected').attr('data-endDate');
    if (moment(startDate + 'T00:00:00+09:00', 'YYYY/MM/DDTHH:mm:ssZ') < moment(eventSeriesStartDate)
        || moment(toDate + 'T00:00:00+09:00', 'YYYY/MM/DDTHH:mm:ssZ').add(1, 'day') > moment(eventSeriesEndDate)) {
        creatingSchedules = false;
        alert('登録期間を興行期間内に設定してください');
        return;
    }

    if (
        maxSeatNumber === undefined
        || saleStartDays === undefined
        || endSaleTimeAfterScreening === undefined
    ) {
        creatingSchedules = false;
        alert('エラーが発生しました/nページをレフレッシュしてください！');
        return;
    }

    var originalButtonText = $('.regist-button').text();
    $.ajax({
        dataType: 'json',
        url: '/events/screeningEvent/regist',
        type: 'POST',
        data: {
            theater: theater,
            screen: screen,
            screeningEventId: screeningEventId,
            startDate: startDate,
            toDate: toDate,
            weekDayData: weekDayData,
            timeData: tableData.timeData,
            ticketData: tableData.ticketData,
            mvtkExcludeFlgData: tableData.mvtkExcludeFlgData,
            onlineDisplayStartDate: onlineDisplayStartDate,
            maxSeatNumber: maxSeatNumber,
            saleStartDays: saleStartDays,
            endSaleTimeAfterScreening: endSaleTimeAfterScreening
        },
        beforeSend: function () {
            $('.regist-button').prop('disabled', true);
            $('.regist-button').text('登録中...');
        }
    }).done(function (data) {
        if (!data.error) {
            modal.modal('hide');
            if ($('.search select[name=theater]').val() !== theater) {
                getScreens(theater, 'none');
                $('.search select[name=theater]').val(theater);
            }
            search(
                theater,
                $('.search input[name=date]').val(),
                $('.search input[name=days]:checked').val()
            );

            creatingSchedules = false;
            return;
        }

        alert('登録に失敗しました');

        creatingSchedules = false;
    }).fail(function (jqxhr, textStatus, error) {
        console.error(jqxhr, textStatus, error);
        if (jqxhr.responseJSON != undefined && jqxhr.responseJSON.error != undefined) {
            alert(jqxhr.responseJSON.error);
        } else {
            alert('登録に失敗しました');
        }

        creatingSchedules = false;
    }).always(function () {
        $('.regist-button').prop('disabled', false);
        $('.regist-button').text(originalButtonText);
    });
}

/**
 * 更新（確定）
 * @function update
 * @returns {void}
 */
function update() {
    var modal = $('#editModal');
    var theater = modal.find('input[name=theater]').val();
    var day = modal.find('input[name=day]').val();
    var screeningEventId = modal.find('input[name=screeningEventId]').val();
    var performance = modal.find('input[name=performance]').val();
    var screen = modal.find('select[name=screen]').val();
    var doorTime = modal.find('select[name=doorTimeHour]').val() + modal.find('select[name=doorTimeMinutes]').val();
    var startTime = modal.find('select[name=startTimeHour]').val() + modal.find('select[name=startTimeMinutes]').val();
    var endTime = modal.find('select[name=endTimeHour]').val() + modal.find('select[name=endTimeMinutes]').val();
    var ticketTypeGroup = modal.find('select[name=ticketTypeGroup]').val();
    var saleStartDate = modal.find('input[name=saleStartDate]').val();
    var saleStartTime = modal.find('select[name=saleStartDateHour]').val() + modal.find('select[name=saleStartDateMinutes]').val();
    // var saleStartDate = modal.find('input[name=saleStartDate]').val();
    var onlineDisplayStartDate = modal.find('input[name=onlineDisplayStartDate]').val();
    var maxSeatNumber = modal.find('input[name=maxSeatNumber]').val();
    var mvtkExcludeFlg = modal.find('input[name=mvtkExcludeFlg]:checked').val();

    if (performance === ''
        || screen === ''
        || doorTime === ''
        || startTime === ''
        || endTime === ''
        || ticketTypeGroup === '') {
        alert('情報が足りません');
        return;
    }

    // オンライン表示開始日 ≦ 当日を確認
    var performanceBefore = $('div[data-performance="' + performance + '"]');
    var onlineDisplayStartDateBefore = performanceBefore.attr('data-onlineDisplayStartDate');
    var now = moment();
    var confirmed = false;
    if (moment(onlineDisplayStartDateBefore + 'T00:00:00T09:00', 'YYYY/MM/DDTHH:mm:ssZ') <= now
        && moment(onlineDisplayStartDate + 'T00:00:00T09:00', 'YYYY/MM/DDTHH:mm:ssZ') > now) {
        if (window.confirm('オンライン表示中のスケジュールが非表示になります。本当に変更しますか？')) {
            confirmed = true;
        }
    } else {
        confirmed = true;
    }

    if (confirmed) {
        $.ajax({
            dataType: 'json',
            url: '/events/screeningEvent/' + performance + '/update',
            type: 'POST',
            data: {
                theater: theater,
                screen: screen,
                day: day,
                screeningEventId: screeningEventId,
                doorTime: doorTime,
                startTime: startTime,
                endTime: endTime,
                ticketTypeGroup: ticketTypeGroup,
                saleStartDate: saleStartDate,
                saleStartTime: saleStartTime,
                onlineDisplayStartDate: onlineDisplayStartDate,
                maxSeatNumber: maxSeatNumber,
                mvtkExcludeFlg: mvtkExcludeFlg
            }
        }).done(function (data) {
            if (!data.error) {
                modal.modal('hide');
                search(
                    theater,
                    $('.search input[name=date]').val(),
                    $('.search input[name=days]').val()
                );
                return;
            }
            alert('更新に失敗しました');
        }).fail(function (jqxhr, textStatus, error) {
            console.error(jqxhr, textStatus, error);
            alert('更新に失敗しました');
        });
    }
}

/**
 * 検索
 * @function search
 * @param {string} theater
 * @param {string} date
 * @param {number} date
 * @param {string} screen
 * @returns {void}
 */
function search(theater, date, days, screen) {
    if (!theater || !date) {
        alert('劇場、上映日を選択してください');
        return;
    }
    $('.loading').modal();
    var query = {
        theater: theater,
        date: date,
        days: days
    };
    if (screen !== undefined && screen !== null) {
        query.screen = screen;
    }
    getScreens(theater, 'edit');
    $.ajax({
        dataType: 'json',
        url: '/events/screeningEvent/search',
        type: 'GET',
        data: query
    }).done(function (data) {
        if (data) {
            var dates = [];
            for (var i = 0; i < days; i++) {
                dates.push(moment(date).add(i, 'days').format('MM/DD'));
            }
            create(data.screens, data.performances, dates, data.ticketGroups);
            modalInit(theater, date, data.screens, data.ticketGroups);
            // スケジューラーのスクロール位置を変更
            var scheduler = $('.scheduler');
            var top;
            scheduler.find('.performance').each(function (index, elem) {
                var radix = 10;
                var tmp = parseInt($(elem).css('top'), radix);
                if (top === undefined) top = tmp;
                if (top > tmp) top = tmp;
            });
            scheduler.show();
            scheduler.scrollTop(top);
        }
    }).fail(function (jqxhr, textStatus, error) {
        console.error(jqxhr, textStatus, error);
        alert('エラーが発生しました。');
    }).always(function () { $('.loading').modal('hide'); });
}

/**
 * 削除の処理
 * @function deletePerformance
 * @returns {void}
 */
function deletePerformance() {
    var modal = $('#editModal');
    var theater = $('form.search select[name="theater"]').val();
    var performance = modal.find('input[name=performance]').val();
    if (performance === '') {
        alert('情報が足りません');
        return;
    }
    $.ajax({
        dataType: 'json',
        url: '/events/screeningEvent/' + performance + '/cancel',
        type: 'PUT',
    }).done(function (data) {
        if (!data.error) {
            modal.modal('hide');
            search(
                theater,
                $('.search input[name=date]').val(),
                $('.search input[name=days]').val()
            );
            return;
        }
        alert('削除に失敗しました');
    }).fail(function (jqxhr, textStatus, error) {
        console.error(jqxhr, textStatus, error);
        alert('削除に失敗しました');
    });
}

/**
 * モーダル初期化
 */
function modalInit(theater, date, screens, ticketGroups) {
    var ticketGroupDom = [];
    ticketGroupDom.push('<option value="">選択してください</option>');
    for (var i = 0; i < ticketGroups.length; i++) {
        var ticketGroup = ticketGroups[i];
        ticketGroupDom.push('<option value="' + ticketGroup._id + '">' + ticketGroup.name.ja + '</option>')
    }

    var newModal = $('#newModal');
    newModal.find('.theater span').text($('select[name=theater] option[value=' + theater + ']').text());
    newModal.find('.day span').text(moment(date).format('YYYY年MM月DD日(ddd)'));
    newModal.find('input[name=theater]').val(theater);
    newModal.find('input[name=day]').val(date);
    newModal.find('select[name=ticketTypeGroup]').html(ticketGroupDom.join('\n'));

    var editModal = $('#editModal');
    editModal.find('.theater span').text($('select[name=theater] option[value=' + theater + ']').text());
    editModal.find('select[name=ticketTypeGroup]').html(ticketGroupDom.join('\n'));
}

/**
 * 新規作成
 * @function add
 * @returns {void}
 */
function add() {
    // var theater = $('select[name=theater]').val();
    // var date = $('input[name=date]').val();
    var modal = $('#newModal');
    modal.find('select[name=theater]').val('');
    modal.find('input[name=weekDay]').prop('checked', true);
    modal.find('select[name=screeningEventSeriesId]')
        .html('<option selected disabled>劇場を選択してください</option>');
    modal.find('select[name=screen]')
        .html('<option selected disabled>劇場を選択してください</option>');
    modal.find('select[name=doorTimeHour]').val('');
    modal.find('select[name=doorTimeMinute]').val('');
    modal.find('select[name=startTimeHour]').val('');
    modal.find('select[name=startTimeMinute]').val('');
    modal.find('input[name=mvtkExcludeFlg]').removeAttr('checked');
    modal.find('select[name=endTimeHour]').val('');
    modal.find('select[name=endTimeMinute]').val('');
    modal.find('select[name=ticketTypeGroup]').val('');
    modal.find('input[name=onlineDisplayStartDate]').datepicker('update', new Date());
    modal.find('input[name=screeningDateStart]').datepicker('update', new Date());
    modal.find('input[name=screeningDateThrough]').datepicker('update', new Date());
    // modal.find('input[name=saleStartDate]').val('');
    // modal.find('input[name=onlineDisplayStartDate]').val('');
    // modal.find('input[name=maxSeatNumber]').val('');

    $('#newModal').modal();
}

/**
 * 編集
 * @function edit
 * @param {JQuery} target 
 * @returns {void}
 */
function edit(target) {
    var performance = target.attr('data-performance');
    var theater = target.attr('data-theater');
    var day = target.attr('data-day');
    var doorTime = target.attr('data-doorTime');
    var startTime = target.attr('data-startTime');
    var endTime = target.attr('data-endTime');
    var screen = target.attr('data-screen');
    var film = target.attr('data-film');
    var mvtkExcludeFlg = target.attr('data-mvtkExcludeFlg');
    var filmName = target.text();
    var ticketTypeGroup = target.attr('data-ticketTypeGroup');
    var saleStartDate = target.attr('data-saleStartDate') ? target.attr('data-saleStartDate') : '';
    var saleStartTime = target.attr('data-saleStartTime') ? target.attr('data-saleStartTime') : '';
    // var saleStartDate = target.attr('data-saleStartDate') ? target.attr('data-saleStartDate') : '';
    var onlineDisplayStartDate = target.attr('data-onlineDisplayStartDate') ? target.attr('data-onlineDisplayStartDate') : '';
    var maxSeatNumber = target.attr('data-maxSeatNumber');
    var modal = $('#editModal');
    modal.find('.day span').text(moment(day).format('YYYY年MM月DD日(ddd)'));
    // チェックstartTime削除ボタン表示
    if (moment(day).isSameOrAfter(moment().tz('Asia/Tokyo'), 'day')) {
        modal.find('.delete-button').show();
    } else {
        modal.find('.delete-button').hide();
    }

    modal.find('input[name=performance]').val(performance);
    modal.find('input[name=theater]').val(theater);
    modal.find('input[name=day]').val(day);
    modal.find('input[name=screeningEventId]').val(film);
    modal.find('input[name=mvtkExcludeFlg]').prop('checked', (mvtkExcludeFlg === '1'));

    var fix = function (time) { return ('0' + (parseInt(time / 5) * 5)).slice(-2); };
    modal.find('select[name=doorTimeHour]').val(doorTime.slice(0, 2));
    modal.find('select[name=doorTimeMinutes]').val(fix(doorTime.slice(2, 4)));
    modal.find('select[name=startTimeHour]').val(startTime.slice(0, 2));
    modal.find('select[name=startTimeMinutes]').val(fix(startTime.slice(2, 4)));
    modal.find('select[name=endTimeHour]').val(endTime.slice(0, 2));
    modal.find('select[name=endTimeMinutes]').val(fix(endTime.slice(2, 4)));
    modal.find('select[name=screen]').val(screen);
    modal.find('select[name=ticketTypeGroup]').val(ticketTypeGroup);

    // 販売開始日
    if (saleStartDate) {
        modal.find('input[name=saleStartDate]').val(saleStartDate);
        modal.find('select[name=saleStartDateHour]').val(saleStartTime.slice(0, 2));
        modal.find('select[name=saleStartDateMinutes]').val(fix(saleStartTime.slice(2, 4)));
    } else {
        modal.find('input[name=saleStartDate]').val('');
        modal.find('select[name=saleStartDateHour]').val('');
        modal.find('select[name=saleStartDateMinutes]').val('');
    }
    // if (saleStartDate) {
    //     modal.find('input[name=saleStartDate]').datepicker('update', saleStartDate);
    // } else {
    //     modal.find('input[name=saleStartDate]').val('');
    // }
    if (onlineDisplayStartDate) {
        modal.find('input[name=onlineDisplayStartDate]').datepicker('update', onlineDisplayStartDate);
    } else {
        modal.find('input[name=onlineDisplayStartDate]').val('');
    }
    modal.find('input[name=maxSeatNumber]').val(maxSeatNumber);

    modal.find('.film span').text(filmName);
    modal.modal();
}

/**
 * 作成
 * @function create
 * @param {*} screens 
 * @param {*} performances
 * @returns {void} 
 */
function create(screens, performances, dates, ticketGroups) {
    var scheduler = $('.scheduler');
    scheduler.html('');
    var header = $('<div>').addClass('fixed-header').append(
        $('<table>').append(createHeader(screens, dates))
    );
    var body = $('<div>').addClass('scrollable-body').append(
        $('<table>').css({ borderTop: 0 }).append(createBody(screens, performances, dates, ticketGroups))
    );
    scheduler.append(header).append(body);
}

/**
 * ヘッダー作成
 * @function createHeader
 * @param {*} screens 
 * @param {*} dates 
 * @returns {JQuery} 
 */
function createHeader(screens, dates) {
    // スクリーンをコード順に
    var sortedScreens = screens.sort(function (a, b) {
        if (a.branchCode < b.branchCode) {
            return -1;
        }
        if (a.branchCode > b.branchCode) {
            return 1;
        }

        return 0;
    });
    console.log(sortedScreens);
    var dom = $('<thead class="header"></thead>');
    var tr1 = $('<tr></tr>');
    tr1.css({ borderBottom: '1px solid #ccc' })
    var tr2 = $('<tr></tr>');
    tr1.append('<td style="min-width: ' + HOUR_HEIGHT + 'px;" rowspan="2">時間</td>');
    for (var j = 0; j < dates.length; j++) {
        var td = $('<td></td>');
        td.html(dates[j]);
        td.attr('colspan', sortedScreens.length);
        tr1.append(td);
        for (var i = 0; i < sortedScreens.length; i++) {
            var screen = sortedScreens[i];
            tr2.append('<td style="min-width: ' + SCREEN_WIDTH + 'px;">' + screen.name.ja + '</td>');
        }
    }
    dom.append(tr1).append(tr2);
    return dom;
}

/**
 * 中身作成
 * @function createBody
 * @param {*} screens 
 * @param {*} performances 
 * @returns {JQuery} 
 */
function createBody(screens, performances, dates, ticketGroups) {
    var dom = $('<tbody><tr></tr></tbody>');
    dom.find('tr').append(createTime());
    for (var j = 0; j < dates.length; j++) {
        for (var i = 0; i < screens.length; i++) {
            var screen = screens[i];
            var target = performances.filter(function (performance) {
                return (
                    performance.location.branchCode === screen.branchCode &&
                    moment(performance.doorTime).tz('Asia/Tokyo').format('MM/DD') === dates[j]
                );
            });
            dom.find('tr').append(createScreen(target, ticketGroups));
        }
    }
    return dom;
}

/**
 * 時間作成
 * @function createTime
 * @returns {JQuery} 
 */
function createTime() {
    var dom = $('<td class="times"></td>').css({ minWidth: HOUR_HEIGHT + 'px' });
    for (var i = 0; i < 24; i++) {
        var time = ('00' + String(i)).slice(-2) + ':00';
        dom.append('<div class="time" style="height: ' + HOUR_HEIGHT + 'px">' + time + '</div>');
    }
    return dom;
}

/**
 * スクリーン作成
 * @function createScreen 
 * @param {*} performances 
 * @returns {JQuery} 
 */
function createScreen(performances, ticketGroups) {
    console.log(ticketGroups);
    var dom = $('<td class="screen"></td>').css({ minWidth: SCREEN_WIDTH });
    var sortedPerformance = performances.sort((p1, p2) => {
        if (p1.doorTime > p2.doorTime) return 1;
        if (p1.doorTime < p2.doorTime) return -1;
        return 0;
    })
    // オーバーラップをチェックするため
    var prevBtm = 0;
    for (var i = 0; i < sortedPerformance.length; i++) {
        var performance = sortedPerformance[i];
        var start = {
            hour: moment(performance.doorTime).tz('Asia/Tokyo').format('HH'),
            minutes: moment(performance.doorTime).tz('Asia/Tokyo').format('mm')
        };
        var end = {
            hour: moment(performance.endDate).tz('Asia/Tokyo').format('HH'),
            minutes: moment(performance.endDate).tz('Asia/Tokyo').format('mm')
        };
        var hour = 60;
        var top = (start.hour * HOUR_HEIGHT) + (start.minutes * HOUR_HEIGHT / hour);
        var left = 0;
        // 上映時間から判断するべき
        var height = ((end.hour - start.hour) * HOUR_HEIGHT) + ((end.minutes - start.minutes) * HOUR_HEIGHT / hour);
        var width = 100;
        var style = {
            top: top + 'px',
            left: left + 'px',
            height: height + 'px',
            width: width + '%'
        };
        // 販売開始日
        if (performance.offers) {
            var saleStartDate = moment(performance.offers.validFrom).tz('Asia/Tokyo').format('YYYY/MM/DD');
            var saleStartTime = moment(performance.offers.validFrom).tz('Asia/Tokyo').format('HHmm');
        } else {
            var saleStartDate = '';
            var saleStartTime = '';
        }
        var ticketTypeGroupName = '';
        for (var j = 0; j < ticketGroups.length; j++) {
            if (ticketGroups[j]['id'] == performance.ticketTypeGroup) {
                ticketTypeGroupName = ticketGroups[j]['name'].ja;
                boxOfficeTypeId = ticketGroups[j]['boxOfficeType'];
            }
        }
        var onlineDisplayStartDate = (performance.offers) ? moment(performance.offers.availabilityStarts).tz('Asia/Tokyo').format('YYYY/MM/DD') : '';
        var maxSeatNumber = (performance.offers) ? performance.offers.eligibleQuantity.maxValue : '';
        var mvtkExcludeFlg = '0';
        if (performance.offers !== undefined
            && Array.isArray(performance.offers.acceptedPaymentMethod)
            && performance.offers.acceptedPaymentMethod.indexOf('MovieTicket') < 0) {
            mvtkExcludeFlg = '1';
        }

        var ticketTypeGroup = performance.offers.id;

        var performanceDom = $('<div class="performance">' +
            '<div ' +
            'data-performance="' + performance._id + '" ' +
            'data-day="' + moment(performance.doorTime).tz('Asia/Tokyo').format('YYYYMMDD') + '" ' +
            'data-doorTime="' + moment(performance.doorTime).tz('Asia/Tokyo').format('HHmm') + '" ' +
            'data-startTime="' + moment(performance.startDate).tz('Asia/Tokyo').format('HHmm') + '" ' +
            'data-endTime="' + moment(performance.endDate).tz('Asia/Tokyo').format('HHmm') + '" ' +
            'data-screen="' + performance.location.branchCode + '" ' +
            'data-theater="' + performance.superEvent.location.branchCode + '" ' +
            'data-film="' + performance.superEvent.id + '" ' +
            'data-ticketTypeGroup="' + ticketTypeGroup + '" ' +
            'data-saleStartDate="' + saleStartDate + '" ' +
            'data-saleStartTime="' + saleStartTime + '" ' +
            'data-onlineDisplayStartDate="' + onlineDisplayStartDate + '" ' +
            'data-maxSeatNumber="' + maxSeatNumber + '" ' +
            'data-mvtkExcludeFlg="' + mvtkExcludeFlg + '" ' +
            'role="button" class="inner">' + performance.name.ja + '<br>' +
            performance.location.name.ja + '<br>' + ticketTypeGroupName + '</div>' +
            '</div>');
        if (top < prevBtm) performanceDom.addClass('overlap');
        prevBtm = top + height;
        if (i < sortedPerformance.length - 1) {
            var next = sortedPerformance[i + 1];
            var nextStart = {
                hour: moment(next.doorTime).tz('Asia/Tokyo').format('HH'),
                minutes: moment(next.doorTime).tz('Asia/Tokyo').format('mm')
            };
            var nextTop = (nextStart.hour * HOUR_HEIGHT) + (nextStart.minutes * HOUR_HEIGHT / hour);
            if (prevBtm > nextTop) performanceDom.addClass('overlap');
        }
        performanceDom.css(style);
        dom.append(performanceDom);
    }
    return dom;
}

$(function () {
    //上映日
    $('form.search input[name=date], #newModal input[name="screeningDateStart"], #newModal input[name="screeningDateThrough"]')
        .val(moment().tz('Asia/Tokyo').format('YYYY/MM/DD'));

    // datepickerセット
    $('.datepicker').datepicker({
        language: 'ja'
    });
});