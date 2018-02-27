var ScrollLoad = function (element, options) {

  var s = this;
  s.element = element;
  s.options = options || {};

  var $wrapper = $(s.element);

  $wrapper.find('.scroll-header').show();
  s.$headLoadText = $wrapper.find('.scroll-header').find('.load-text');
  s.$headLoadTime = $wrapper.find('.scroll-header').find('.load-time');
  s.$scrollList = $wrapper.find('ul');
  s.$footLoadText = $wrapper.find('.scroll-footer').find('.load-text');

  s.headHeight = $wrapper.find('.scroll-header').innerHeight();
  s.prevUpdataTime = new Date().getTime();
  s.loadedCount = s.$scrollList.find('li').length;

  s.myScroll;

  // 参数默认值
  var defaults = {
    isScrollUp: true,
    scrollUpText: '下拉更新数据',
    scrollUpReadyText: '松开更新数据',
    scrollUpLoadText: '正在获取最新数据...',
    isScrollDown: true,
    scrollDownText: '上拉加载更多',
    scrollDownReadyText: '松开更新数据',
    scrollDownLoadText: '数据加载中...',
    scrollDownFinishText: '已经没有更多数据了！',
    iScrollOptions: {
      scrollbars: false,
      startY: -s.headHeight,
      probeType: 3,
      shrinkScrollbars: 'scale'
    },
    getItemHtml: function (data) {

      var _html = '';
      var len = data.rows.length;
      var total = data.total;
      if (s.loadedCount >= data.total) {

        s.loadedCount = 100000;

        s.$footLoadText.addClass('finish').removeClass('loading');
        if (s.$footLoadText.find('.text').text() !== s.options.scrollDownFinishText) {

          s.$footLoadText.find('.text').text(s.options.scrollDownFinishText);
        }
        return '';
      }
      for (var i = 0; i < len; i++) {
        _html += '<li>' + data.rows[i].lineTitle + '</li>';
      }
      s.loadedCount += len;
      console.log(s.myScroll);
      return _html;
    }
  };

  // 如果参数没有设置，则使用默认值
  for (let i in defaults) {
    if (typeof s.options[i] === 'undefined') {
      s.options[i] = defaults[i];
    } else if (typeof s.options[i] === 'object') {
      for (let j in s.options[i]) {
        if (typeof s.options[i][j] === 'undefined') {
          s.options[i][j] = defaults[i][j];
        }
      }
    }
  }



  window.onload = s.loaded();
};

ScrollLoad.prototype = {
  loaded: function () {

    var s = this;

    s.myScroll = new IScroll(s.element, s.options.iScrollOptions);

    $(document).on('touchmove', function (e) {
      e.preventDefault();
    });
    s.pullUpAction();
    s.pullDownAction();

    console.log(s.myScroll.scrollerHeight);
  },
  pullUpAction: function () {

    var s = this;
    s.myScroll.on('scrollStart', function () {
      s.scrollUpStart();
    });
    s.myScroll.on('scroll', function () {
      s.scrollingUp(this);
    });
    s.myScroll.on('scrollEnd', function () {
      if (this.y > this.options.startY && this.y < 0) {
        s.myScroll.scrollTo(0, this.options.startY, 300, IScroll.utils.ease.quadratic);
      }
    });
    s.myScroll.on('scrollEnd', function () {
      s.throttle(s.scrollUpEnd(this), 300, {
        trailing: false
      })();
    });
  },
  pullDownAction: function () {

    var s = this;
    s.myScroll.on('scroll', function () {
      s.scrollingDown(this);
    });
    s.myScroll.on('scrollEnd', function () {
      s.throttle(s.scrollDownEnd(this), 300, {
        trailing: false
      })();
    });
  },
  scrollUpStart: function () {

    var s = this;
    console.log(s);
    var _html = s.getTimeDifference(s.prevUpdataTime);
    s.$headLoadTime.find('.state').html(_html);

  },
  scrollingUp: function (obj) {

    var s = this;
    if (obj.y >= 0) {

      s.$headLoadText.addClass('ready');
      if (s.$headLoadText.find('.text').text() !== s.options.scrollUpReadyText) {
        s.$headLoadText.find('.text').text(s.options.scrollUpReadyText);
      }
    }
  },
  scrollUpEnd: function (obj) {

    var s = this;
    return function () {
      if (obj.y >= 0) {

        s.$headLoadText.removeClass('ready').addClass('loading');
        s.$headLoadText.find('i').prop('class', 'icon-loading');
        s.$headLoadText.find('.text').text(s.options.scrollUpLoadText);
        s.getItemData('js/data.json', { currentPage: 1 }, 'up', function (data) {
          return s.options.getItemHtml(data);
        });
      }
    }
  },
  scrollingDown: function (obj) {

    var s = this;
    if (obj.y <= obj.wrapperHeight - obj.scrollerHeight && s.loadedCount < 100000) {
      s.$footLoadText.addClass('ready');
      if (s.$footLoadText.find('.text').text() !== s.options.scrollDownReadyText) {
        s.$footLoadText.find('.text').text(s.options.scrollDownReadyText);
      }
    }
  },
  scrollDownEnd: function (obj) {

    var s = this;
    return function () {
      if (obj.y <= obj.wrapperHeight - obj.scrollerHeight) {
        if (s.loadedCount < 100000) {
          s.$footLoadText.removeClass('ready').addClass('loading');
          s.$footLoadText.find('i').prop('class', 'icon-loading');
          s.$footLoadText.find('.text').text(s.options.scrollDownLoadText);
        }
        s.getItemData('js/data.json', { currentPage: 1 }, 'down', function (data) {
          return s.options.getItemHtml(data);
        });
      }
    }
  },
  getItemData: function (url, reqParams, directionY, callback) {

    var s = this;
    $.ajax({
      type: 'get',
      url: url + '?' + Math.floor(Math.random() * 1000000),
      data: reqParams,
      contentType: 'application/x-www-form-urlencoded',
      dataType: 'json',
      success: function (data) {
        if (directionY === 'up') {

          s.$scrollList.prepend(callback(data));

          var timeout1 = setTimeout(function () {

            s.myScroll.refresh();
            clearTimeout(timeout1);
          }, 0);


          var timeout2 = setTimeout(function () {
            s.myScroll.scrollTo(0, s.myScroll.options.startY, 300, IScroll.utils.ease.quadratic);
            clearTimeout(timeout2);
          }, 500);

          var timeout3 = setTimeout(function () {

            s.$headLoadText.removeClass('loading').removeClass('ready');
            s.$headLoadText.find('i').prop('class', 'icon-arrow');
            s.$headLoadText.find('.text').text(s.options.scrollUpText);

            if (s.prevUpdataTime < new Date().getTime()) {
              s.prevUpdataTime = new Date().getTime();
            }
            clearTimeout(timeout3);
          }, 600);

        } else if (directionY === 'down') {

          s.$scrollList.append(callback(data));



          var timerout1 = setTimeout(function () {
            if (s.loadedCount <= data.total) {
              s.myScroll.refresh();
              s.$footLoadText.prop('class', 'load-text');
              s.$footLoadText.find('i').prop('class', 'icon-arrow');
              s.$footLoadText.find('.text').text(s.options.scrollDownReadyText);
            }
            clearTimeout(timerout1);

          }, 0);
        }

      }
    });
  },
  /**
 * get当前时间与上次更新时间间隔
 * @param  {[number]} prevTime [上一次更新时间(毫秒)]
 * @return {[string]}          [当前时间与上次更新时间的间隔]
 */
  getTimeDifference: function (prevTime) {

    var nowTime = new Date().getTime();
    var diff = (nowTime - prevTime) / 1000;

    if (diff >= 0 && diff < 60) return '刚刚更新';
    else if (diff >= 60 && diff < 3600) return parseInt(diff / 60) + '分钟前';
    else if (diff >= 3600 && diff < 86400) return parseInt(diff / 3600) + '小时前';
    else if (diff >= 86400 && diff < 345600) return parseInt(diff / 86400) + '天前';
    else return new Date(prevTime).toLocaleString().replace(/:\d{1,2}$/, ' ');
  },
  /**
   * [在固定时间内函数多次触发，只执行一次]
   * @param  {[function]} func  [要执行的方法]
   * @param  {[number]} wait    [等待时间]
   * @param  {[object]} options [控制器]
   * @return {[function]}       [返回值]
   */
  throttle: function (func, wait, options) {
    // 上下文，函数参数，函数返回值
    var context, args, result;
    // 延时器
    var timeout = null;
    // 上一次执行的func的时间点
    var previous = 0;
    if (!options) options = {};
    // 延时执行函数
    var later = function () {
      // 如果及时调用被关闭，则设置previous为0
      previous = options.leading === false ? 0 : new Date().getTime();
      timeout = null;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    };
    return function () {
      var now = new Date().getTime();
      if (!previous && options.leading === false) previous = now;
      // remaining容易理解，表示还剩多少时间可以再次执行func
      var remaining = wait - (now - previous);
      // 保存上下文
      context = this;
      // 获取函数参数
      args = arguments;
      // 及时模式
      // remaining小于等于0是跳出wait的限制，可以执行了
      // remaining大于wait的情况，只有在客户机修改了系统时间的时候才会出现
      // 这两种情况都可以立刻对func做调用
      if (remaining <= 0 || remaining > wait) {
        // 清除定时器
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        previous = now;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      } else if (!timeout && options.trailing !== false) {// 延时模式
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  }
};

window.ScrollLoad = ScrollLoad;