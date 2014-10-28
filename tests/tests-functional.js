(function(window, $) {
	var relurls = {};
	var absurls = {};

	$.each(['350x150', '700x300', '1400x600', '2100x900', '2800x1200'], function(i, name){
		var img = document.createElement('img');
		img.src = 'resources/more-imgs/'+ name +'.gif';
		relurls[name] = 'more-imgs/'+ name +'.gif';
		absurls[name] = img.src;
	});
	var startTests = function() {

		var $iframe = $('#functional-content');
		var frameWindow = $iframe.prop('contentWindow');
		var f$ = frameWindow.$;
		var $content = f$('#content');
		var respimage = frameWindow.respimage;
		var ri = respimage._;
		var saveCache = {};


		var afterImgLoad = function(cb){
			var timer;
			var run = function(){
				clearTimeout(timer);
				timer = setTimeout(cb, 222);
			};
			$content
				.find('img')
				.filter(function(){
					return !this.complete;
				})
				.on('load error', run)
			;
			run();
		};
		var createPicture = function(srces){
			var picture = frameWindow.document.createElement('picture');
			$.each(srces, function(i, attrs){
				var src;
				if(i >= srces.length -1){
					src = 'img';
				} else {
					src = 'source';
				}
				src = frameWindow.document.createElement(src);
				picture.appendChild(src);
				$(src).attr(attrs);
			});
			return picture;
		};
		var runViewportTests = function($picture, viewports, cb){
			var $image;
			var results = {};
			var viewport = viewports.shift();
			var run = function(){
				results[viewport] = {
					currentSrc: $image.prop('currentSrc'),
					offsetWidth: $image.prop('offsetWidth')
				};
				viewport = viewports.shift();
				if(viewport){
					$iframe.css('width', viewport);
					afterImgLoad(run);
				} else if(cb) {
					cb(results);
					cb = false;
				}
			};
			$picture = $($picture);
			if($picture.is('picture')){
				$image = $picture.find('img');
			} else {
				$image = $picture;
			}
			$iframe.css('width', viewport);
			$picture.appendTo($content);
			afterImgLoad(run);
			return results;
		};

		// reset stubbing

		module( "method", {
			setup: function() {
				var prop;
				$iframe.css('width', 1024);
				$content.empty();

				for ( prop in ri ) {
					if ( ri.hasOwnProperty( prop ) ) {
						if($.isPlainObject(ri[ prop ])){
							saveCache[ prop ] = $.extend(true, {}, ri[ prop ]);
						} else {
							saveCache[ prop ] = ri[ prop ];
						}
					}
				}
				if(!ri.mutationSupport){
					setTimeout(respimage);
				}
			},

			teardown: function() {
				var prop;
				for ( prop in saveCache ) {
					if ( ri.hasOwnProperty(prop) && (prop in saveCache) && saveCache[prop] != ri[ prop ] ) {
						if($.isPlainObject(ri[ prop ]) && $.isPlainObject(saveCache[prop])){
							$.extend(true, ri[prop], saveCache[prop]);
						} else {
							ri[prop] = saveCache[prop];
						}
					}
				}
			}
		});

		asyncTest( "simple x image without 1x in srcset", function() {
			var $ximage = f$('<img />').attr({
				src: relurls['350x150'],
				srcset: relurls['700x300'] +' 2x'
			});
			$ximage.appendTo($content);

			afterImgLoad(function(){
				var curSrc = ri.DPR > 1.2 ? absurls['700x300'] : absurls['350x150'];
				if(!ri.supSrcset || window.HTMLPictureElement){
					equal($ximage.prop('currentSrc'), curSrc);
				}
				equal($ximage.prop('offsetWidth'), 350);
				equal($ximage.attr('src'), relurls['350x150']);
				start();
			});
		});

		asyncTest( "picture", function() {

			var viewports = [320, 620, 800];//
			var picture = createPicture([
				{
					srcset: relurls['350x150'],
					media: '(max-width: 480px)'
				},
				{
					srcset: relurls['1400x600'],
					media: '(min-width: 800px)'
				},
				{
					srcset: relurls['700x300'],
					width: 200
				}
			]);


			runViewportTests(picture, viewports, function(results){

				equal(results['320'].currentSrc, absurls['350x150']);
				equal(results['620'].currentSrc, absurls['700x300']);
				equal(results['800'].currentSrc, absurls['1400x600']);

				start();
			});

		});
	};

	$(window).load(startTests);

})( window, jQuery );