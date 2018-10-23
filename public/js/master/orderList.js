$(function () {
    var ITEMS_ON_PAGE = Number($('input[name="limit"]').val());

    // datepickerセット
    $('.datepicker').datepicker({
        language: 'ja'
    })

    // 検索条件クリア
    $(document).on('click', '.reset-condition', function () {
        $.fn.clearFormValue('form');
    });

    // 共通一覧表示初期セット・ページャセット
    $.CommonMasterList.init('#templateRow', '#searchedCount');
    $.CommonMasterList.pager('#pager', ITEMS_ON_PAGE, function (pageNumber) {
        search(pageNumber);
    });

    // 検索ボタンイベント
    var conditions = {};
    var startDateHourFrom = $('[name=startDateHourFrom]');
    var startDateMinuteFrom = $('[name=startDateMinuteFrom]');
    var startDateHourThrough = $('[name=startDateHourThrough]');
    var startDateMinuteThrough = $('[name=startDateMinuteThrough]');

    $(document).on('click', '.btn-ok', function () {
        // エラー消す
        $.fn.clearFormError('form');
        // 必要なカラムを確認
        if ($.fn.checkRequired('form') === false) {
            //上映時刻に自動提案
            setStartDateHourMinute();
            // 検索条件取得
            conditions = $.fn.getDataFromForm('form');
            // 検索API呼び出し
            search(1);
        }
    });

    $(document).on('click', '.cancelButton a.btn.btn-danger', function() {
        var self = this;
        var orderNumber = $(this).closest('tr').find('[name=orderNumber]').val();
        if (!confirm('キャンセル処理を実行してよろしいですか?\n\nオータ番号: ' + orderNumber)) return false;

        var url = '/orders/cancel';

        $.ajax({
            dataType: 'json',
            url: url,
            cache: false,
            type: 'GET',
            data: {orderNumber: orderNumber},
            beforeSend: function () {
                $('.loading').modal();
            }
        }).done(function (data) {
            if (data.success) {
                $(self).hide();
                $(self).closest('td').find('.btn-disabled').show();
            }
        }).fail(function (jqxhr, textStatus, error) {
            alert("fail");
        }).always(function (data) {
            $('.loading').modal('hide');
        });
    });

    //--------------------------------
    // 検索API呼び出し
    //--------------------------------
    function search(pageNumber) {
        conditions['page'] = pageNumber;
        var url = '/orders/search';

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
                    showTicket(data.results);
                    showCancelButton(data.results, data.orderCancellings);
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
     * デフォルトをセットする
     */
    function setStartDateHourMinute () {
        if (!startDateHourFrom.val()) startDateHourFrom.val('00');
        if (!startDateMinuteFrom.val()) startDateMinuteFrom.val('00');
        if (!startDateHourThrough.val()) startDateHourThrough.val('23');
        if (!startDateMinuteThrough.val()) startDateMinuteThrough.val('55');
    }

    /**
     * キャンセルボタンの表示処理
     * @param {*} rows 
     */
    function showCancelButton(rows, orderCancellings) {
        $('#list tbody tr').each(function() {
            var trId = $(this).attr('_id');
            var cancelBtn = $(this).find('.cancelButton a.btn-cancel');
            var cancelling = $(this).find('.cancelButton p.btn-disabled');
            for (var x in rows) {
                if (rows[x]._id === trId) {
                    if (rows[x].orderStatus === 'OrderReturned') continue;
                    if ($.inArray(rows[x].orderNumber, orderCancellings) > -1) {
                        cancelling.show();
                        break;
                    } else if (rows[x].dateReturned === undefined) {
                        cancelBtn.show();
                        break;
                    }
                }
            }
        });
    }

    function showTicket(rows) {
        $('#list tbody tr').each(function() {
            var trId = $(this).attr('_id');
            var showTd = $(this).find('[name=ticketInfo]');
            var content = [[], [], []];
            for(var x in rows) {
                if (rows[x]._id === trId) {
                    if (!$.isArray(rows[x].acceptedOffers)) break;
                    for(var y in rows[x].acceptedOffers) {
                        content[0].push(rows[x].acceptedOffers[y].itemOffered.reservedTicket.ticketedSeat.seatNumber);
                        content[1].push(rows[x].acceptedOffers[y].itemOffered.additionalTicketText);
                        content[2].push(rows[x].acceptedOffers[y].itemOffered.price + ' ' + rows[x].acceptedOffers[y].itemOffered.priceCurrency);
                    }
                    break;
                }
            }
            showTd.html(content[0].join(' / ') + '<br>');
            showTd.append(content[1].join(' / ') + '<br>');
            showTd.append(content[2].join(' / '));
        });
    }

    //劇場、上映日の変更時に上映作品リスト値が更新
    $(document).on('change', '[name=locationBranchCode],[name=startDate]', function () {
        $('.datepicker.datepicker-dropdown').remove();
        conditions = $.fn.getDataFromForm('form');
        if (conditions.locationBranchCode === '') {
            return false;
        }

        var url = '/events/screeningEventSeries/getlist';
        $.ajax({
            dataType: 'json',
            url: url,
            cache: false,
            type: 'GET',
            data: {
                locationBranchCode: conditions.locationBranchCode,
                startDate: conditions.startDate
            },
            beforeSend: function () {
                //$('.loading').modal();
            }
        }).done(function (data) {
            if (data.success) {
                var dataCount = (data.count) ? (data.count) : 0;
                if (dataCount > 0) {
                    initScreeningEventSeriesId(data.results);
                }
            }
        }).fail(function (jqxhr, textStatus, error) {
            alert("fail");
        }).always(function (data) {
            //$('.loading').modal('hide');
        });
    });

    //上映作品初期化
    function initScreeningEventSeriesId(datas) {
        if (!$.isArray(datas))
            return false;

        var screeningEventSeriesDom = $('[name=screeningEventSeriesId]');
        screeningEventSeriesDom.html('<option value="" selected="">---</option>');
        for (var x in datas) {
            screeningEventSeriesDom.append('<option value="'+ datas[x].id +'" filmNameEn="'+ datas[x].filmNameEn +'">'+ datas[x].filmNameJa +'</option>');
        }
    }
});