var containsString;

containsString = function(arr, val) {
    var i, index, _i, _ref;
    index = -1;
    //weird coffeescript converstion, should fix.
    for (i = _i = 0, _ref = arr.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        if (arr[i].toString() === val.toString()) {
            index = i;
            break;
        }
    }
    return index;
};

exports.containsString = containsString;
