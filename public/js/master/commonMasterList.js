$(function () {
    $.CommonMasterList = $.CommonMasterList || {};
    $.CommonMasterList = {
        _templateRowSelector: "#templateRow",
        _searchedCountAreaSelector: "#searchedCount",
        _searchedCountText: null,
        _startTag: '',
        _endTag: '',
        _pagerSelector: '',
        _itemsOnPage: 10,
        _listNames: [],
        _listCols: {},
        onPageChanging: function (pageNumber) { },
        getTemplateRow: function () {
            return ($(this._templateRowSelector))
        },
        getSearchedCountArea: function () {
            return ($(this._searchedCountAreaSelector))
        },
        getPager: function () {
            return ($(this._pagerSelector))
        },
        //----------------------
        // init: 初期化
        //----------------------
        init: function (templateRowSelector, searchedCountAreaSelector) {
            this._templateRowSelector = templateRowSelector;
            this._searchedCountAreaSelector = searchedCountAreaSelector;
            this._searchedCountText = this.getSearchedCountArea().text();
            var templateRow = this.getTemplateRow();
            this._startTag = templateRow.startTag();
            this._endTag = templateRow.endTag();
            // templateRowより各セルのnameをセット
            templateRow.find("td").each(
                function (index, td) {
                    $.CommonMasterList._listNames[index] = $(td).attr("name");
                }
            );
            // [name:各セルのhtml文字列]のリストをセット
            $.each(this._listNames, function (index, name) {
                $.CommonMasterList._listCols[name] = templateRow.find('[name="' + name + '"]').prop('outerHTML');
            });
        },
        //----------------------
        // pager: ページャセット
        //----------------------
        pager: function (pagerSelector, itemsOnPage, onPageChanging) {
            this._pagerSelector = pagerSelector;
            this._itemsOnPage = itemsOnPage;
            var pager = this.getPager().hide();
            pager.pagination({
                items: 100,
                itemsOnPage: itemsOnPage,
                cssStyle: 'light-theme',
                displayedPages: 10,
                onPageClick: function (pageNumber) {
                    onPageChanging(pageNumber);
                }
            })
            pager.hide();
        },
        //----------------------
        // bind: データ分の表示行作成
        //----------------------
        bind: function (datas, countData, pageNumber) {
            // pager取得
            var pager = this.getPager().hide();
            // 件数表示
            var searchedCountArea = this.getSearchedCountArea();
            searchedCountArea.text(this._searchedCountText.replace("\$searched_count\$", countData));
            searchedCountArea.show();
            if (!countData) { return; }
            if (countData <= 0) { return; }

            var startTag = this._startTag;
            var endTag = this._endTag;
            var listCols = this._listCols;
            var cntRow = 0;
            var htmlRow = [];
            // データ数分row作成
            $.each(datas, function (indexData, data) {
                if (cntRow > this._itemsOnPage) {
                    return false;
                }
                var startTagTemp = startTag.replace("\$id\$", $.fn.getStringValue(data, "id", ""));
                //alert(JSON.stringify(data));
                var tempRow = [];
                var cntCol = 0;
                // 1行分のcell作成
                $.each(listCols, function (key, outerHtml) {
                    var fieldIds = key.split("__");
                    var temp = outerHtml;
                    $.each(fieldIds, function (index, fieldId) {
                        var value = $.fn.getStringValue(data, fieldId, "?" + fieldId + "?");
                        temp = temp.replace("\$" + fieldId + "\$", value);
                        if (fieldId === 'edit') {
                            var id = $.fn.getStringValue(data, "id", "");
                            temp = temp.replace("\$id\$", id);
                        }
                    });
                    tempRow[cntCol++] = temp;
                });
                htmlRow[cntRow] = startTagTemp + tempRow.join("") + endTag;
                cntRow++;
            });
            this.getTemplateRow().closest("tbody").html(htmlRow.join(""));
            // ページャアイテム数・現在ぺージ再セット
            pager.pagination('updateItems', countData);
            pager.pagination('drawPage', pageNumber);
            pager.show();
            return true;
        },
        dummy: function () {
            alert("dummy");
        }
    }
});
