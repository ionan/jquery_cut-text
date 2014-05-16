(function($) {	
	$.cutText = {
		version: '0.2',
		defaults: {
			words : 50,
			activationThreshold : 60,
			readMore : '[+]',
			readLess : '[-]',
			transitionTime : 600,
			smoothTransition : true,
			bounceEffect : false,
			lineDependantTransition : true,
			detailsTransitionTime : 600,
			detailsSmoothTransition : true,
			widthDependantTransition : true,
			transitionWidthChunkWidth : 300,
			readMoreSpacing : '&nbsp;...&nbsp;',
			readLessSpacing : '&nbsp;',
			readMoreClass : '',
			readLessClass : '',
			summaryClass : '',
			detailsClass : '',
			subscribeTo : []
		}
	};
    $.fn.cutText = function(options){
		var opts = $.extend({}, $.cutText.defaults, options);
		opts.subscriberCallbacks = [];
		opts.subscriberCallbacksCount = [];
		opts.suscriberFuncs = [];
		for (var idx in opts.subscribeTo){
			if (typeof $.fn[opts.subscribeTo[idx]] !== 'undefined'){
				//http://stackoverflow.com/questions/1225102/jquery-event-to-trigger-action-when-a-div-is-made-visible
				opts.suscriberFuncs[idx] = $.fn[opts.subscribeTo[idx]];
				$.fn[opts.subscribeTo[idx]] = function(speed, oldCallback) {
			    	return $(this).each(function() {
			    		var obj = $(this),
			    			newCallback = function() {
			    				if ($.isFunction(oldCallback)) {
			    					oldCallback.apply(obj);
			    				}
			    				obj.trigger('after' + opts.subscribeTo[idx]);
			    			};
			    		opts.suscriberFuncs[idx].apply(obj, [speed, newCallback]);
			    	});
			    };
			    opts.subscriberCallbacks.push('after' + opts.subscribeTo[idx]);
			}
		};
		var methods = {
			init: function() {
				var rmore = '<span class="cuttext-menu cuttext-more ' + opts.readMoreClass + '">' + opts.readMoreSpacing + opts.readMore + '</span>';
				var rless = '<span class="cuttext-menu cuttext-less ' + opts.readLessClass + '">' + opts.readLessSpacing + opts.readLess + '</span>';
				this.each(function() {
					var $this = $(this);
					$.data($this,'shownOnce',false);
					$.data($this,'hideOnce',false);
					var divHeight;
					var transTime = opts.transitionTime;
					var detTransTime = opts.detailsTransitionTime;
					
					/*
					 * Cut text at nth word and create html structure
					 */
					var wrapNthWord = function(text){
						var wc = 50;
						var at = 60;
						try {
							wc = Number(opts.words);
						} catch(Except){
							wc = 50;
						}
						try {
							at = Number(opts.activationThreshold);
						} catch(Except){
							at = 60;
						}
						var reAt = new RegExp('(([^\\s]+\\s+){' + (at) + '})([^\\s]+\\s+)','');
						if (reAt.test(text)) {
							var re = new RegExp('(([^\\s]+\\s+){' + (wc-1) + '})([^\\s]+\\s+)','');
							if (re.test(text)) {
								text = text.replace(re,"$1</span>" + rmore + "<span class='cuttext-text cuttext-details " + opts.detailsClass + "'>$3");
								text = '<span class="cuttext-text cuttext-summary ' + opts.summaryClass + '">' + text + '</span>';
								text = text + rless;
							}
						}
						return text;
					};
					var t = wrapNthWord($(this).html());
					$(this).html(t);
					
					/*
					 * Get both totalHeight (div's height when whole text is shown)
					 * and divHeight (div's height when part of the text is shown)
					 */
					var totalHeight = $(this).height();
					$(this).addClass('cuttext-closed');
					if ($(this).find('span').length > 0) {
						divHeight = Number($(this).find('.cuttext-more').offset().top - $(this).offset().top);
						try {
							var lineHeight = Number($(this).css('line-height').replace('px',''));
							if (Number($(this).find('.cuttext-more').height()) > lineHeight){
								divHeight = Number(divHeight) + Number(lineHeight);
								$.data($this,'divHeight',divHeight);
								$this.animate({height : divHeight},transTime);
							} 
						} catch(Except){
						} finally {
							hideOnce = true;
						}
						$(this).css('height',divHeight+'px');
						try {
							if (!opts.smoothTransition){
								transTime = 0;
							}
							else if (opts.lineDependantTransition){
								transTime = transTime * (totalHeight / lineHeight);
							}
						} catch(Except){
							transTime = opts.transitionTime;
						}
						try {
							if (!opts.detailsSmoothTransition){
								detTransTime = 0;
							}
							else if (opts.widthDependantTransition){
								var chunkSize = Number(transitionWidthChunkWidth);
								var rightSpace = Number($(window).width() - $(this).find('.cuttext-more').offset().left)
								detTransTime = detTransTime * (totalHeight / chunkSize);
							}
						} catch(Except){
							detTransTime = opts.detailsTransitionTime;
						}
					}
					else {
						$(this).removeClass('cuttext-closed');
					}
					$this.find('.cuttext-details').hide();
					
					/*
					 * Function that will be fired when whole text
					 * needs to be shown
					 */
					var showText = function(event){
						$this.find('.cuttext-more').hide(detTransTime);
						$this.find('.cuttext-details').show(detTransTime);
//						$this.animate({height : $.data($this,'totalHeight')},transTime, function(){
//								$this.find('.cuttext-less').show(detTransTime);
//								if (!$.data($this,'shownOnce')){
//									calculateMaxHeight($this.find('.cuttext-less'));
//								}
//							});
							$this.find('.cuttext-less').show(detTransTime);
//							if (!$.data($this,'shownOnce')){
								calculateMaxHeight($this.find('.cuttext-less'));
//							}
					};
					
					/*
					 * Function that will be fired when part of the text
					 * needs to be shown
					 */
					var hideText = function(event){
						$this.find('.cuttext-less').hide(detTransTime);
//						$this.animate({height : $.data($this,'divHeight')},transTime, function(){
//								if (!$.data($this,'hideOnce')){
									calculateMinHeight($this.find('.cuttext-more'));
//								} else {
//									$this.find('.cuttext-details').hide(detTransTime);
//									$this.find('.cuttext-more').show(detTransTime);
//								}
//							});
					};
					
					/*
					 * Function to calculate max height (for proper
					 * visualization when window resizes)
					 */
					var calculateMaxHeight = function(callee){
						try {
							var lineHeight = Number(callee.parent().css('line-height').replace('px',''));
							var _oldTH = $.data($this,'totalHeight');
							totalHeight = Number(callee.offset().top) - Number(callee.parent().offset().top);
							if (Number(callee.height()) > lineHeight)
								totalHeight = Number(totalHeight) + Number(lineHeight);
							$.data($this,'totalHeight',totalHeight);
							$.data($this,'shownOnce',true);
									callee.parent().animate({height : totalHeight},transTime);
								callee.parent().animate({height : totalHeight},transTime);
						} catch(Except){
						} finally {
							shownOnce = true;
						}
					};
					
					/*
					 * Function to calculate min height (for proper
					 * visualization when window resizes)
					 */
					var calculateMinHeight = function(callee){
						try {
							var wasVisible = callee.parent().find('.cuttext-more').is(':visible');
							callee.parent().find('.cuttext-more').show(detTransTime);
							var lineHeight = Number(callee.parent().css('line-height').replace('px',''));
							var th = $.data($this,'totalHeight');
							divHeight = Number(callee.offset().top) - Number(callee.parent().offset().top);
							if (Number(callee.height()) > lineHeight)
								divHeight = Number(divHeight) + Number(lineHeight);
							if (!wasVisible)
								callee.parent().find('.cuttext-more').hide();
							$.data($this,'divHeight',divHeight);
							$.data($this,'hideOnce',true);
							if (!opts.bounceEffect && Math.abs(th - $.data($this,'divHeight',divHeight)) < Number(lineHeight)/2) {
								$.data($this,'divHeight',th);
								callee.parent().find('.cuttext-details').hide(detTransTime);
								callee.parent().find('.cuttext-more').show(detTransTime);
							} else {
								callee.parent().animate({height : divHeight},transTime,function(){
									callee.parent().find('.cuttext-details').hide(detTransTime);
									callee.parent().find('.cuttext-more').show(detTransTime);
								});
							}
						} catch(Except){
						} finally {
							hideOnce = true;
						}
					};
					
					/*
					 * Function to add listeners to provided events on every element
					 */
					var addListeners = function(){
						for (var idx in opts.subscriberCallbacks){
							var id;
							$this.parents().bind(opts.subscriberCallbacks[idx],function(){
								clearTimeout(id);
								var customFunc = function(){
									$.data($this,'hideOnce',false);
									$.data($this,'shownOnce',false);
									if ($this.find('.cuttext-more').is(':visible')){
										callee = $this.find('.cuttext-more');
										calculateMinHeight(callee);
									} else if ($this.find('.cuttext-less').is(':visible')) {
										callee = $this.find('.cuttext-less');
										calculateMaxHeight(callee);
									}
								};
							    id = setTimeout(customFunc, 200);
							});
						}
					};
					
					/*
					 * Bind click events
					 */
					$(this).find('.cuttext-more').click(showText);
					$(this).find('.cuttext-less').click(hideText);
					
					/*
					 * Bind window's resize event
					 */
					var id;
					$(window).resize(function() {
						clearTimeout(id);
						var sanityCheck;
						var doneResizing = function(){
							clearTimeout(sanityCheck);
							addListeners();
							if ($this.find('.cuttext-more').is(':visible')){
								callee = $this.find('.cuttext-more');
								calculateMinHeight(callee);
							} else if ($this.find('.cuttext-less').is(':visible')) {
								callee = $this.find('.cuttext-less');
								calculateMaxHeight(callee);
							}
							sanityCheck = setTimeout(function(){
								$('.cuttext-more:visible, .cuttext-less:visible').each(function(){
									if (Number($(this).offset().top) - Number($(this).parent().offset().top > Number($(this).parent().height())))
									{
										divHeight = Number($(this).offset().top) - Number($(this).parent().offset().top);
										$(this).parent().animate({height : divHeight},opts.transitionTime);
									}
								});
							}, 3000);
						};
					    id = setTimeout(doneResizing, 200);
					});
				});
			}
		};
		methods['init'].call(this);
	};
})(jQuery);
