var IE = (!!window.ActiveXObject && +(/msie\s(\d+)/i.exec(navigator.userAgent)[1])) || NaN;
if (IE < 9) {
	document.documentElement.className += ' lt-ie9' + ' ie' + IE;
}
if (IE < 8) {
	alert('Your browser needs to be updated to view this website');
}

// polyfill for Array.indexOf (unsupported by IE8)
// https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Array/indexOf
if (!Array.prototype.indexOf) {
	Array.prototype.indexOf = function(searchElement, fromIndex) {
		if (this == null)
			throw new TypeError('"this" is null or not defined');
		var O = Object(this);
		var len = O.length >>> 0;
		if (len === 0)
			return -1;
		var n = +fromIndex || 0;
		if (Math.abs(n) === Infinity)
			n = 0;
		if (n >= len)
			return -1;
		var k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);
		while (k < len) {
			if ( k in O && O[k] === searchElement)
				return k;
			k++;
		}
		return -1;
	};
}

$(function() {

	FastClick.attach(document.body);

	var $body = $('body'), $grid = $('.grid'), $header = $('.sub-header'), $about = $('.about'), $activeTile, loading, activeFilter = 0, isMobile = isMobile();

	$(document).ready(loadTiles);
	$(window).scroll(infiniteScroll);

	var $fixedHeader = $header.clone(true), isFixedHeaderActive = false;

	$fixedHeader.addClass('fixed');
	$fixedHeader.find('.about').removeClass('extended');
	$fixedHeader.insertAfter($header);

	$(window).scroll(function() {
		var scrollTop = $(window).scrollTop();

		if (scrollTop > 320 && !isFixedHeaderActive) {
			isFixedHeaderActive = true;
			$fixedHeader.addClass('active');
		}

		if (scrollTop <= 320 && isFixedHeaderActive) {
			isFixedHeaderActive = false;
			$fixedHeader.removeClass('active');
		}
	});

	$('.about .title .animated span').typed({
		strings : [' excitement.', ' stories.', ' fun.', ' than the score.'],
		typeSpeed : 20,
		startDelay : 200,
		backDelay : 1000,
		loop : true,
		showCursor : false
	});

	$body.on('click', function(e) {
		if (e.target === this && $activeTile) {
			hideContent($activeTile);
		}
	});

	// desktop filters
	$('.filters li').on('click', function() {
		activeFilter = parseInt($(this).data('tag'));
		filterTiles(activeFilter);
	});

	// mobile filters
	$('.filters-dropdown').on('change', function() {
		activeFilter = parseInt($(this).val()) || 0;
		filterTiles(activeFilter);
	});

	function showContent($tile) {
		var data = $tile.data('data');

		$tile.addClass('active');
		$activeTile = $tile;

		createContent(data).appendTo($tile);
		if (!isMobile) {
			scrollToContent();
		}
	}

	function hideContent($tile) {
		$tile.removeClass('active');
		$tile.find('.content').remove();
		$activeTile = undefined;
	}

	function scrollToContent() {
		var $content = $activeTile.find('.content'), windowHeight = $(window).height(), headerHeight = 166;
		contentHeight = $content.height(), contentOffset = $content.offset().top, scrollTop = contentOffset - (windowHeight - contentHeight + headerHeight) / 2;

		$('body,html').animate({
			scrollTop : scrollTop
		}, 350);
	}

	function loadTiles() {
		loading = true;
		
		var d = new Date();
		var t = d.getTime();

		$.ajax("manifest.json?" + t).always(function(build) {
			
			getPage(build.responseText, 1);
		});
	}

	function getPage(build, idx) {

		var url = 'assets/builds/' + build + '/page_' + idx + '.json';

		$.ajax(url).always(function(data) {

			/*var data = "";

			try {

				data = JSON.parse(output);

			} catch(e) {

				console.log('Parse Error:');
				console.log(url);
				console.log(output);
			}*/

			//data.tiles = _.shuffle(data.tiles);

			$.each(data.tiles, function(i, tile) {
				var $tile = createTile(tile);
				if (tile.tags.indexOf(activeFilter) != -1) {
					$tile.hide();
				}
				$tile.appendTo($grid);
			});

			if (data.last_page) {

				loading = false;
			} else {

				idx = idx + 1;
				getPage(build, idx);
			}

		});

	}

	/*
	 function loadTiles() {
	 loading = true;
	 $.get('manifest.json', function(data) {

	 data.tiles = _.shuffle(data.tiles);

	 $.each(data.tiles, function(i, tile) {
	 var $tile = createTile(tile);
	 if (tile.tags.indexOf(activeFilter) != -1) {
	 $tile.hide();
	 }
	 $tile.appendTo($grid);
	 });
	 loading = false;
	 });
	 }
	 */

	function createTile(data) {
		var $tile = $('<li>'), $preview = $('<div class="preview">').appendTo($tile);

		if (data.type == 'image' || data.type == 'video' || IE == 8) {
			var $previewImage = $('<img>').attr('src', 'assets/preview_image/' + data.preview_image);
			// preload image
			$preview.hide();
			$previewImage.on('load', function() {
				$preview.show();
			});
			$previewImage.appendTo($preview);
		}


		if (data.type == 'insight' && IE != 8) {
		
			if (isMobile) {
				var PREVIEW_SIZE = screen.width - 20;
			} else {
				var PREVIEW_SIZE = 250;
			}
			$(INSIGHTS.preview(data.content, PREVIEW_SIZE)).appendTo($preview);
		}

		// play button
		if (data.type == 'video' || data.type == 'insight') {
			$('<div class="play">').appendTo($preview);
		}

		// share button
		$('<div class="share">').appendTo($preview);

		// keep data attached for later use
		$tile.data('data', data);

		// bind events
		$tile.on('click', '.preview', tileClicked);

		return $tile;
	}

	function tileClicked(event) {
		var $this = $(this).parent(), sameTile = $this.is($activeTile);

		if (!isMobile) {
			// hide current content
			if ($activeTile) {
				hideContent($activeTile);
			}
			// show content if not the same tile
			if (!sameTile) {
				showContent($this);
			}
		} else {
			// on mobile only the share button opens the overlay
			if ($(event.target).hasClass('share')) {
				showContent($this);
			} else {
				var data = $this.data('data');

				if (data.type == 'video') {
					prefix = 'https://www.youtube.com/watch?v=';
					window.open(prefix + data.content.id, '_blank');
				}

				if (data.type == 'insight') {
					INSIGHTS.play(data.content, $this.find('canvas')[0]);
				}
			}
		}
	}

	function createContent(data) {
	
		var $content = $('<div class="content">'), $close = $('<div class="close">').appendTo($content);

		createShareButtons(data).appendTo($content);
		createSponsorLogos().appendTo($content);

		$close.on('click', function() {
			hideContent($activeTile);
		});

		if (!isMobile && data.type === 'image') {
			$('<img>').attr('src', 'assets/media/' + data.content.image).appendTo($content);
		}

		if (!isMobile && data.type === 'video') {
			$('<iframe width="380" height="380">').attr('src', 'https://www.youtube.com/embed/' + data.content.id + '?rel=0&controls=0&showinfo=0&autoplay=1').attr('frameborder', 0).attr('allowfullscreen', true).appendTo($content);
		}

		if (!isMobile && data.type === 'insight') {
			var canvas = INSIGHTS.play(data.content);
			$(canvas).appendTo($content);
		}

		return $content;
	}

	function createShareButtons(data) {
		
		var $share = $('<div class="share-buttons"></div>');
		
		var facebook_url = encodeURIComponent(data.facebook_url);
		var twitter_url = encodeURIComponent(data.twitter_url);
		var linkedin_url = encodeURIComponent(data.linkedin_url);
		var google_url = encodeURIComponent(data.google_url);

		$('<a class="share-facebook" />').attr('href', 'https://www.facebook.com/sharer/sharer.php?u=' + facebook_url).on('click', popupwindow).appendTo($share);

		$('<a class="share-twitter" />').attr('href', 'https://twitter.com/home?status=' + twitter_url).on('click', popupwindow).appendTo($share);

		$('<a class="share-google" />').attr('href', 'https://plus.google.com/share?url=' + google_url).on('click', popupwindow).appendTo($share);

		$('<a class="share-linkedin" />').attr('href', 'https://www.linkedin.com/shareArticle?mini=true&url=' + linkedin_url).on('click', popupwindow).appendTo($share);

		return $share;
	}

	function popupwindow(e) {
		e.preventDefault();
		console.log(e);

		var url = e.target.href, w = 500, h = 300, left = screen.width / 2 - w / 2, top = screen.height / 2 - h / 2;

		return window.open(url, null, 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=' + w + ', height=' + h + ', top=' + top + ', left=' + left);
	}

	function createSponsorLogos(data) {
		var $logos = $('<div class="sponsor-logos"></div>');

		$('<a href="#" class="logo-us-open" />').appendTo($logos);
		$('<a href="http://www.ibm.com/" target="_blank" class="logo-ibm" />').appendTo($logos);

		return $logos;
	}

	function infiniteScroll() {
		var scrollTop = $(window).scrollTop(), docHeight = $(document).height(), winHeight = $(window).height(), threshold = 50;

		if (scrollTop >= (docHeight - winHeight - threshold)) {
			// stop if another request is in progress
			if (loading)
				return false;
			// need to send last tile id in order to
			// skip the tiles that are already loaded
			//loadTiles();
		}
	}

	function filterTiles(tag) {
		// sync desktop and mobile filters
		$('.filters li').siblings().removeClass('active');
		$('.filters li[data-tag=' + activeFilter + ']').addClass('active');
		$('.filters-dropdown').val(activeFilter);
		// hide current content
		if ($activeTile) {
			hideContent($activeTile);
		}
		$grid.find('li').show();
		if (tag != 0) {
			$grid.find('li').each(function() {
				var $this = $(this), data = $this.data('data');
				if (data && data.tags.indexOf(tag) === -1) {
					$this.hide();
				}
			});
		}
		$body.animate({
			scrollTop : 0
		}, 350);
	}

	function isMobile() {
		return screen.width < 700;
	}

});

