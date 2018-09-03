$(function () {
    $('a[disabled=disabled]').on('click', function (event) {
        event.preventDefault();
    });
})