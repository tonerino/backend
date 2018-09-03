// moment.tz.add([
//     'Asia/Tokyo',
//     'America/New_York|EST EDT|50 40|0101|1Lz50 1zb0 Op0'
// ]);

/**
 * 1時間の高さ
 * @const HOUR_HEIGHT
 */
var HOUR_HEIGHT = 60;

/**
 * スクリーンの幅
 * @const SCREEN_WIDTH
 */
var SCREEN_WIDTH = 100;

$(function () {
    // 検索
    $(document).on('click', '.search-button', function (event) {
        event.preventDefault();
        var theater = $('.search select[name=theater]').val();
        var day = $('.search select[name=day]').val();
        search(theater, day);
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

    // 作品検索
    $(document).on('click', '.film-search-button', function (event) {
        event.preventDefault();
        filmSearch();
    });

    // 作品選択
    $(document).on('click', '.film-select-button', function (event) {
        event.preventDefault();
        filmSelect();
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
});

/**
 * 新規登録（確定）
 * @function register
 * @returns {void}
 */
function regist() {
    var modal = $('#newModal');
    var theater = modal.find('input[name=theater]').val();
    var screen = modal.find('select[name=screen]').val();
    var day = modal.find('input[name=day]').val();
    var screeningEventId = modal.find('input[name=screeningEventId]').val();
    var doorTime = modal.find('select[name=doorTimeHour]').val() + modal.find('select[name=doorTimeMinutes]').val();
    var startTime = modal.find('select[name=startTimeHour]').val() + modal.find('select[name=startTimeMinutes]').val();
    var endTime = modal.find('select[name=endTimeHour]').val() + modal.find('select[name=endTimeMinutes]').val();
    var ticketTypeGroup = modal.find('select[name=ticketTypeGroup]').val();
    if (theater === ''
        || screen === ''
        || day === ''
        || screeningEventId === ''
        || doorTime === ''
        || startTime === ''
        || endTime === ''
        || ticketTypeGroup === ''
    ) {
        alert('情報が足りません');
        return;
    }
    $.ajax({
        dataType: 'json',
        url: '/events/screeningEvent/regist',
        type: 'POST',
        data: {
            theater: theater,
            screen: screen,
            day: day,
            screeningEventId: screeningEventId,
            doorTime: doorTime,
            startTime: startTime,
            endTime: endTime,
            ticketTypeGroup: ticketTypeGroup
        }
    }).done(function (data) {
        if (!data.error) {
            modal.modal('hide');
            search(theater, day);
            return;
        }
        alert('登録に失敗しました');
    }).fail(function (jqxhr, textStatus, error) {
        console.error(jqxhr, textStatus, error);
        alert('登録に失敗しました');
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
    if (performance === ''
        || screen === ''
        || doorTime === ''
        || startTime === ''
        || endTime === ''
        || ticketTypeGroup === '') {
        alert('情報が足りません');
        return;
    }
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
            ticketTypeGroup: ticketTypeGroup
        }
    }).done(function (data) {
        if (!data.error) {
            modal.modal('hide');
            search(theater, day);
            return;
        }
        alert('更新に失敗しました');
    }).fail(function (jqxhr, textStatus, error) {
        console.error(jqxhr, textStatus, error);
        alert('更新に失敗しました');
    });
}

/**
 * 検索
 * @function search
 * @param {theater}
 * @param {day}
 * @returns {void}
 */
function search(theater, day) {
    if (!theater || !day) {
        alert('劇場、上映日を選択してください');
        return;
    }
    $.ajax({
        dataType: 'json',
        url: '/events/screeningEvent/search',
        type: 'GET',
        data: {
            theater: theater,
            day: day
        }
    }).done(function (data) {
        if (data) {
            create(data.screens, data.performances);
            modalInit(theater, day, data.screens, data.ticketGroups);
            // スケジューラーのスクロール位置を変更
            var scheduler = $('.scheduler');
            var top;
            scheduler.find('.performance').each(function (index, elem) {
                var radix = 10;
                var tmp = parseInt($(elem).css('top'), radix);
                if (top === undefined) top = tmp;
                if (top > tmp) top = tmp;
            });
            scheduler.scrollTop(top);
        }
    }).fail(function (jqxhr, textStatus, error) {
        console.error(jqxhr, textStatus, error);
    });
}

/**
 * モーダル初期化
 */
function modalInit(theater, day, screens, ticketGroups) {
    var screenDom = [];
    screenDom.push('<option value="">選択してください</option>');
    for (var i = 0; i < screens.length; i++) {
        var screen = screens[i];
        screenDom.push('<option value="' + screen.branchCode + '">' + screen.name.ja + '</option>')
    }

    var ticketGroupDom = [];
    ticketGroupDom.push('<option value="">選択してください</option>');
    for (var i = 0; i < ticketGroups.length; i++) {
        var ticketGroup = ticketGroups[i];
        ticketGroupDom.push('<option value="' + ticketGroup._id + '">' + ticketGroup.name.ja + '</option>')
    }

    var newModal = $('#newModal');
    newModal.find('.theater span').text($('select[name=theater] option[value=' + theater + ']').text());
    newModal.find('.day span').text(moment(day).format('YYYY年MM月DD日(ddd)'));
    newModal.find('input[name=theater]').val(theater);
    newModal.find('input[name=day]').val(day);
    newModal.find('select[name=screen]').html(screenDom.join('\n'));
    newModal.find('select[name=ticketTypeGroup]').html(ticketGroupDom.join('\n'));

    var editModal = $('#editModal');
    editModal.find('.theater span').text($('select[name=theater] option[value=' + theater + ']').text());
    editModal.find('.day span').text(moment(day).format('YYYY年MM月DD日(ddd)'));
    editModal.find('select[name=screen]').html(screenDom.join('\n'));
    editModal.find('select[name=ticketTypeGroup]').html(ticketGroupDom.join('\n'));
}

/**
 * 作品検索
 * @function filmSearch
 * @returns {void}
 */
function filmSearch() {
    var modal = $('#newModal');
    var identifier = modal.find('input[name=screeningEventIdentifier]').val();

    $.ajax({
        dataType: 'json',
        url: '/events/screeningEvent/searchScreeningEventSeries',
        type: 'GET',
        data: {
            identifier: identifier,
            movieTheaterBranchCode: modal.find('input[name=theater]').val()
        }
    }).done(function (data) {
        if (data) {
            var screeningEventSeries = data.screeningEventSeries;
            if (screeningEventSeries.length === 0) {
                alert('イベントシリーズが見つかりません');
                return;
            }
            var options = screeningEventSeries.map(function (e) {
                return '<option value="' + e.id + '">' + e.name.ja + '</option>';
            });
            modal.find('select[name="screeningEventSeriesId"]').html(options);
        }
    }).fail(function (jqxhr, textStatus, error) {
        console.error(jqxhr, textStatus, error);
    });

}

/**
 * 作品選択
 * @function filmSelect
 * @returns {void}
 */
function filmSelect() {
    var modal = $('#newModal');
    var screeningEventId = modal.find('select[name="screeningEventSeriesId"]').val();
    if (screeningEventId === '') {
        alert('作品が指定されていません');
        return;
    }
    modal.find('input[name=screeningEventId]').val(screeningEventId);
}

/**
 * 新規作成
 * @function add
 * @returns {void}
 */
function add() {
    var theater = $('select[name=theater]').val();
    var day = $('select[name=day]').val();
    if (!theater || !day) {
        alert('劇場、上映日を選択してください');
        return;
    }
    var modal = $('#newModal');
    modal.find('.film-name').attr('data-screeningEventId', '');
    modal.find('input[name=screeningEventIdentifier]').val('');
    modal.find('select[name="screeningEventSeriesId"]').html('');
    modal.find('select[name=doorTimeHour]').val('00');
    modal.find('select[name=doorTimeMinutes]').val('00');
    modal.find('select[name=startTimeHour]').val('00');
    modal.find('select[name=startTimeMinutes]').val('00');
    modal.find('select[name=endTimeHour]').val('00');
    modal.find('select[name=endTimeMinutes]').val('00');
    modal.find('select[name=screen]').val('');
    modal.find('select[name=ticketTypeGroup]').val('');
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
    var filmName = target.text();
    var ticketTypeGroup = target.attr('data-ticketTypeGroup');
    var modal = $('#editModal');
    modal.find('input[name=performance]').val(performance);
    modal.find('input[name=theater]').val(theater);
    modal.find('input[name=day]').val(day);
    modal.find('input[name=screeningEventId]').val(film);

    modal.find('select[name=doorTimeHour]').val(doorTime.slice(0, 2));
    modal.find('select[name=doorTimeMinutes]').val(doorTime.slice(2, 4));
    modal.find('select[name=startTimeHour]').val(startTime.slice(0, 2));
    modal.find('select[name=startTimeMinutes]').val(startTime.slice(2, 4));
    modal.find('select[name=endTimeHour]').val(endTime.slice(0, 2));
    modal.find('select[name=endTimeMinutes]').val(endTime.slice(2, 4));
    modal.find('select[name=screen]').val(screen);
    modal.find('select[name=ticketTypeGroup]').val(ticketTypeGroup);

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
function create(screens, performances) {
    var scheduler = $('.scheduler');
    scheduler.html('');
    var dom = $('<table></table>');
    dom.append(createHeader(screens));
    dom.append(createBody(screens, performances));
    scheduler.append(dom);
}

/**
 * ヘッダー作成
 * @function createHeader
 * @param {*} screens 
 * @returns {JQuery} 
 */
function createHeader(screens) {
    var dom = $('<thead class="header"></thead>');
    dom.append('<td style="width: ' + HOUR_HEIGHT + 'px;">時間</td>');
    for (var i = 0; i < screens.length; i++) {
        var screen = screens[i];
        dom.append('<td style="min-width: ' + SCREEN_WIDTH + 'px;">' + screen.name.ja + '</td>');
    }
    return dom;
}

/**
 * 中身作成
 * @function createBody
 * @param {*} screens 
 * @param {*} performances 
 * @returns {JQuery} 
 */
function createBody(screens, performances) {
    var dom = $('<tbody><tr></tr></tbody>');
    dom.find('tr').append(createTime());
    for (var i = 0; i < screens.length; i++) {
        var screen = screens[i];
        var target = performances.filter(function (performance) {
            return (performance.location.branchCode === screen.branchCode);
        });
        dom.find('tr').append(createScreen(target));
    }
    return dom;
}

/**
 * 時間作成
 * @function createTime
 * @returns {JQuery} 
 */
function createTime() {
    var dom = $('<td class="times"></td>');
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
function createScreen(performances) {
    var dom = $('<td class="screen"></td>');
    for (var i = 0; i < performances.length; i++) {
        var performance = performances[i];
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
            'data-ticketTypeGroup="' + performance.ticketTypeGroup + '" ' +
            'role="button" class="inner">' + performance.name.ja + '</div>' +
            '</div>');
        performanceDom.css(style);
        dom.append(performanceDom);
    }
    return dom;
}