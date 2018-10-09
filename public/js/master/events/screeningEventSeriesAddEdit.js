$(function(){
    $('.btn-ok').on('click', function(){
        var signageDisplayName = $('#signageDisplayName').val();
        if (signageDisplayName == null || signageDisplayName == '') {
            var movieIdentifier = $('#movieIdentifier option:selected').val();
            if (movieIdentifier != '') {
                $('#signageDisplayName').val('');
                $('#signageDisplayName').val($('#movieIdentifier option:selected').text());
            }
        }
        $('form').submit();
    });
    $('body').on('change', '#movieIdentifier', function(){
        var identifier = $(this).val();
        if (identifier == undefined) {
            return false;
        } else {
            var movieName = $('#movieIdentifier option:selected').text();
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
                beforeSend: function(){
                    $('.loading').modal();
                }
            }).done(function(data) {
                $('#contentRating').val(data.results);
            });
        }
        
    });
    // datepickerセット
    $('.datepicker').datepicker({
        language: 'ja'
    })
});