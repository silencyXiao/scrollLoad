;(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory(require('jquery'));
  } else {
    root.ScrollLoad = factory(root.jQuery);
  }
})(this ? this : window, function ($) {
  
  class ScrollLoad {
    constructor(elem, options = {}) {
      const s = this;
      const defaults = {
        isScrollUp: false, // 是否开启向上滚动
        scrollUpTexts: ['下拉更新数据', '松开更新数据', '正在获取最新数据...', '已经是最新的了！'], // 向上滚动文字配置 [默认，滑屏触发，释放加载，全部加载完]
        scrollDownTexts: ['上拉加载更多', '松开更新数据', '数据加载中...', '已经没有更多数据了！'], // 向下滚动文字配置 [默认，滑屏触发，释放加载，全部加载完]
        isLazyLoad: false, // 是否开启图片懒加载
        lazyLoadClass: '.lazyload', // 图片懒加载选择器，需开启isLazyLoad
        iScrollOptions: {
          scrollbars: true, // 是否显示滚动条
          probeType: 1, // 滚动频率最大值为 3
          shrinkScrollbars: 'scale', // 收缩滚动条，clip、scale，参数作用可查看 http://wiki.jikexueyuan.com/project/iscroll-5/scrollers.html
          click: true, // 是否禁用点击事件
          taps: true // 是否禁用tap事件
        },
        /**
         * 向下滚动结束后回调
         * @param  {[object]} controller [控制器] controller.loading() 继续加载，controller.end() 结束加载
         * @param  {[number]} curPage [当前分页]
         */
        onScrollDownEnd: function(controller, curPage) {
          
        },
        /**
         * 向上滚动结束后回调
         * @param  {[object]} controller [控制器] controller.loading() 继续加载，controller.end() 结束加载
         * @param  {[number]} curPage [当前分页]
         */
        onScrollUpEnd: function (controller, curPage) {
          
        }
      };
      
      s.elem = elem;
      s.curUpPage = 1; // 上翻当前页
      s.curDownPage = 1; // 下翻当前页
      s.options = options;
      s.prevUpdataTime = new Date().getTime(); // 上一次更新时间

      // 如果参数没有设置，则使用默认值
      for (let i in defaults) {
        if (typeof s.options[i] === 'undefined') {
          s.options[i] = defaults[i];
        } else if (typeof s.options[i] === 'object') {
          for (let j in defaults[i]) {
            if (typeof s.options[i][j] === 'undefined') {
              s.options[i][j] = defaults[i][j];
            } else if (typeof s.options[i][j] === 'object') {
              for (let k in defaults[i][j]) {
                if (typeof s.options[i][j][k] === 'undefined') {
                  s.options[i][j][k] = defaults[i][j][k];
                }
              }
            }
          }
        }
      }
      // 阻止touchmove默认事件
      $(document).on('touchmove', function (e) {
        e.preventDefault();
      });

      let $wrapper = $(s.elem).children('.scroller');
      s.$header = $wrapper.children('.scroll-header');
      s.$footer = $wrapper.children('.scroll-footer');
      s.$list = $wrapper.children('ul');

      // 文档加载完成之后初始化
      window.addEventListener('load', function () {
        setTimeout(() => {
          s.ms = new IScroll(s.elem, s.options.iScrollOptions);
          s.init();
        }, 200);
      });
      
    }
    /**
     * get当前时间与上次更新时间间隔
     * @param  {[number]} prevTime [上一次更新时间(毫秒)]
     * @return {[string]}          [当前时间与上次更新时间的间隔]
     */
    getTimeDifference(prevTime) {

      const nowTime = new Date().getTime();
      let diff = (nowTime - prevTime) / 1000;

      if(diff >= 0 && diff < 60) return '刚刚更新';
      else if(diff >= 60 && diff < 3600) return parseInt(diff / 60) + '分钟前';
      else if(diff >= 3600 && diff < 86400) return parseInt(diff / 3600) + '小时前';
      else if(diff >= 86400 && diff < 345600) return parseInt(diff / 86400) + '天前';
      else return new Date(prevTime).toLocaleString().replace(/:\d{1,2}$/, ' ');
    }

    /**
   * [在固定时间内函数多次触发，只执行一次]
   * @param  {[function]} func  [要执行的方法]
   * @param  {[number]} wait    [等待时间]
   * @param  {[object]} options [控制器]
   * @return {[function]}       [返回值]
   */
    throttle(func, wait, options = {}) {
      let context, args, result;
      let timeout = null;
      let previous = 0;

      // 延时执行函数
      const later = function () {
        // 如果及时调用被关闭，则设置previous为0
        previous = options.leading === false ? 0 : new Date().getTime();
        timeout = null;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      };
      return function () {
        const now = new Date().getTime();
        if (!previous && options.leading === false) previous = now;
        let remaining = wait - (now - previous);

        context = this;
        args = arguments;
        if (remaining <= 0 || remaining > wait) {
          if (timeout) {
            clearTimeout(timeout);
            timeout = null;
          }
          previous = now;
          result = func.apply(context, args);

          if (!timeout) context = args = null;
        } else if (!timeout && options.trailing !== false) {
          timeout = setTimeout(later, remaining);
        }
        return result;
      };
    }
    /**
     * 创建交叉观察器，判断图片是否进入视窗
     * @param {string} cls class类名
     * @param {callback} callback 触发后回调
     */
    createObserver(cls, callback) {
      
      const io = new IntersectionObserver((entries) => {
        entries.forEach((curVal) => {
          if (typeof callback === 'function') {
            callback(curVal);
          }
        });
      }, {
          root: document.querySelector(this.elem),
          threshold: [0, 1]
        });

      document.querySelectorAll(cls).forEach((curVal) => {
        io.observe(curVal);
      });
    }
    // 添加图片懒加载
    lazyload(scrollTop) {
      
      if (!this.options.isLazyLoad) return false;
      let cls = this.options.lazyLoadClass;

      if (typeof window.IntersectionObserver === 'function') {
        this.createObserver(cls, (entry) => {
          if (entry.intersectionRatio > 0) {
            let url = entry.target.getAttribute('data-src');
            entry.target.src = url;
          }
        });
      } else {
        $(cls).each(function () {
          let offsetTop = Math.round($(this).position().top);

          if (Math.abs(scrollTop) + $(window).height() >= offsetTop) {
            let url = $(this).attr('data-src');
            $(this).prop('src', url);
          }
        });
      }
      
    }
    // 初始化
    init() {

      let op = this.options;
      let headHeight = op.isScrollUp ? Math.round(this.$header.innerHeight()) : 0;
      let footHeight = Math.round(this.$footer.innerHeight());
      let diff = footHeight + headHeight; // 头部和底部的高度
   
      this.lazyload(this.ms.y);

      // 如果列表的高度大于可视内容区域高度则显示头部和底部
      if (this.ms.scroller.clientHeight > this.ms.wrapperHeight) {

        if (!op.isScrollUp) {
          this.$header.hide();
          this.ms.scrollTo(0, 0);
          const timeout = setTimeout(() => {
            this.ms.refresh();
            if (timeout) clearTimeout(timeout);
          }, 0);
          
        } else {
          this.ms.scrollTo(0, -headHeight);
          const timeout = setTimeout(() => {
            this.ms.refresh();
            if (timeout) clearTimeout(timeout);
          }, 0);
          this.$header.show();
          this.scrollUp();        
        }

        this.$footer.show();
        this.scrollDown();

      } else {
        this.$header.hide();
        this.$footer.hide();
        this.ms.scrollTo(0, 0);
        const timeout = setTimeout(() => {
          this.ms.refresh();
          if (timeout) clearTimeout(timeout);
        }, 0);
      }
    }   
    // 向上滚动触发，包括开始滚动、正在滚动、滚动结束三个步骤
    scrollUp() {
      this.ms.on('scrollStart', () => {
        this.scrollUpStart();
      });
      this.ms.on('scroll', this.throttle(() => {
        this.scrollingUp();
        this.lazyload(this.ms.y);
      }, 300, {
        leading: false
      }));
      this.ms.on('scrollEnd', this.throttle(() => {
        this.scrollUpEnd();
      }, 500, {
        leading: false
      }));
    }
    // 开始向上滚动时触发
    scrollUpStart() {
      let $headLoadText = this.$header.children('.load-text');
      let $headLoadState = this.$header.children('.load-time').children('.state');
      let stateText = this.getTimeDifference(this.prevUpdataTime);

      $headLoadState.text(stateText);
      $headLoadText.prop('class', 'load-text');
      $headLoadText.children('.text').text(this.options.scrollUpTexts[0]);
    }
    // 正在拖拽向上滚动未释放时触发
    scrollingUp() {
      let offsetTop = this.ms.y;
      let $headLoadText = this.$header.children('.load-text');

      if (offsetTop > 0) {
        $headLoadText.addClass('ready');
        $headLoadText.children('.text').text(this.options.scrollUpTexts[1]);
      }
    }
    // 向上滚动结束后触发
    scrollUpEnd() {
      let $headLoadText = this.$header.children('.load-text');
      let headHeight = this.$header.innerHeight();
      let offsetTop = this.ms.y;
      let op = this.options;
      let s = this;
      // 初始化控制器
      const controller = {
        // 加载至尾页时，结束当前加载列表数据
        end: function() {
          const timeout = setTimeout(() => {
            $headLoadText.removeClass('ready').addClass('finish');
            $headLoadText.children('.text').text(op.scrollUpTexts[3]);
            clearTimeout(timeout);
          }, 300);
        },
        // 未达到尾页，继续加载列表数据
        loading: function() {
          const timeout = setTimeout(() => {
            s.ms.refresh();
            s.lazyload(s.ms.y);
            clearTimeout(timeout);
          }, 0);
        }
      };

      if (offsetTop === 0) {
        $headLoadText.removeClass('ready').addClass('loading');
        $headLoadText.children('.text').text(op.scrollUpTexts[2]);
        this.curUpPage++;
      
        // 加载中
        const timeout1 = setTimeout(() => {
          $headLoadText.removeClass('loading');
          $headLoadText.children('.text').text(op.scrollUpTexts[0]);
          clearTimeout(timeout1);
        }, 300);
        // 加载完毕
        const timeout2 = setTimeout(() => {
          this.ms.scrollTo(0, -headHeight, 300, IScroll.utils.ease.quadratic);

          if (this.prevUpdataTime < new Date().getTime()) {
            this.prevUpdataTime = new Date().getTime(); // 重置更新时间
          }
          clearTimeout(timeout2);
        }, 500);

        // 加载完毕触发回调
        op.onScrollUpEnd(controller, this.curUpPage)
        
      }
    }
    // 向下滚动触发，包括正在滚动、滚动结束两个步骤
    scrollDown() {
      this.ms.on('scroll', this.throttle(() => {
        this.scrollingDown();
        this.lazyload(this.ms.y);
      }, 500, {
        leading: false
      }));
      this.ms.on('scrollEnd', this.throttle(() => {
        this.scrollDownEnd();
      }, 500, {
        leading: false
      }));
    }
    // 正在拖拽向下滚动未释放时触发
    scrollingDown() {
      let $footLoadText = this.$footer.children('.load-text');
      let op = this.options;

      if (typeof window.IntersectionObserver === 'function') {
        
        this.createObserver('.scroll-footer', (entry) => {
          if (entry.intersectionRatio > 0) {
            $footLoadText.prop('class', 'load-text');
            $footLoadText.children('.text').text(op.scrollDownTexts[0]);
          }
          if (entry.intersectionRatio >= 1) {
            $footLoadText.addClass('ready');
            $footLoadText.children('.text').text(op.scrollDownTexts[1]);
          }
        });
      } else {
        let offsetTop = this.$footer.offset().top;
        let footHeight = this.$footer.innerHeight();
        let scrollTop = Math.abs(this.ms.y);
        let winHeight = this.ms.wrapperHeight;
        
        if (scrollTop + winHeight >= offsetTop) {
          $footLoadText.prop('class', 'load-text');
          $footLoadText.children('.text').text(op.scrollDownTexts[0]);
        }

        if (scrollTop + winHeight >= offsetTop + footHeight) {
          const timer = setTimeout(() => {
            $footLoadText.addClass('ready');
            $footLoadText.children('.text').text(op.scrollDownTexts[1]);
            clearTimeout(timer);
          }, 0);
        }
      }
    }
    // 向下滚动结束后触发
    scrollDownEnd() {

      let $footLoadText = this.$footer.children('.load-text');
      let offsetTop = this.ms.y;
      let op = this.options;
      let s = this;

      // 初始化控制器
      const controller = {
        // 加载至尾页时，结束当前加载列表数据
        end: function() {
          const timeout = setTimeout(() => {
            $footLoadText.removeClass('ready').addClass('finish');
            $footLoadText.children('.text').text(op.scrollDownTexts[3]);
            s.scrollDown = null;
            clearTimeout(timeout);
          }, 300);
        },
        // 未达到尾页，继续加载列表数据
        loading: function() {
          const timeout = setTimeout(() => {
            s.ms.refresh();
            s.lazyload(s.ms.y);
            clearTimeout(timeout);
          }, 0);
        }
      };

      if (offsetTop <= this.ms.wrapperHeight - this.ms.scrollerHeight) {
        
        // 准备加载
        $footLoadText.removeClass('ready').addClass('loading');
        $footLoadText.children('.text').text(op.scrollDownTexts[2]);
        this.curDownPage++;

        // 加载中
        const timeout1 = setTimeout(() => {
          $footLoadText.removeClass('loading');
          $footLoadText.children('.text').text(op.scrollDownTexts[0]);
          clearTimeout(timeout1);
        }, 300);

        // 加载完毕后回调
        op.onScrollDownEnd(controller, this.curDownPage);
      }
      
    }
  }
  return ScrollLoad;
});