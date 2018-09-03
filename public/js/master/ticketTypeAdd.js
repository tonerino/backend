$(function(){
    $("input#indicatorColor").ColorPickerSliders({
        placement: 'bottom',
        color: '#333333',
        swatches: ['#333333', '#7F7F7F', '#7C1C20', '#DA413C', '#EF8641', '#FFEC32', '#5BA94A', '#3FA4E5', '#3458CA', '#9559A4',
                   '#FFFFFF', '#C3C3C3', '#B07C5C', '#F3B5CB', '#F9C736', '#EFE2B3', '#C4DE2D', '#A6D8E8', '#7594BC', '#C5C3E6'],
        customswatches: false,
        order: {},
        onchange: function(container, color) {
            $("#hiddenColor").text(color.tiny.toHexString());
            //$("#hiddenColor").text(color.tiny.toRgbString());
        }
    });
});