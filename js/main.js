$(function() {

  FastClick.attach(document.body);

  var $body = $('body'),
      $grid = $('.grid'),
      $header = $('.header'),
      $about = $('.about'),
      $activeTile,
      aboutExtended = true,
      loading,
      activeFilter = 0,
      isMobile = isMobile();

  $(document).ready(loadTiles);
  $(window).scroll(infiniteScroll);

  $('.about .title span').typed({
    strings: [
      'More excitement.',
      'More stories.',
      'More fun.',
      'More than the score.'
    ],
    typeSpeed: 20,
    startDelay: 200,
    backDelay: 1000,
    loop: true,
    showCursor: false
  });

  if (!isMobile) {
    $(window).scroll(function() {
      var scrollTop = $(window).scrollTop();

      if (scrollTop > 0 && aboutExtended) {
        $about.removeClass('extended');
        $grid.css('margin-top', 177);
        aboutExtended = false;
      }

      if (scrollTop <= 0 && !aboutExtended) {
        $about.addClass('extended');
        $grid.css('margin-top', 298);
        aboutExtended = true;
      }
    });
  }

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
    if (!isMobile) { scrollToContent(); }
  }

  function hideContent($tile) {
    $tile.removeClass('active');
    $tile.find('.content').remove();
    $activeTile = undefined;
  }

  function scrollToContent() {
    var $content = $activeTile.find('.content'),
        windowHeight = $(window).height(),
        headerHeight = $header.height();
        contentHeight = $content.height(),
        contentOffset = $content.offset().top,
        scrollTop = contentOffset - (windowHeight - contentHeight + headerHeight) / 2;

    $body.animate({ scrollTop : scrollTop }, 350);
  }

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

  function createTile(data) {
    var $tile = $('<li>'),
        $preview = $('<div class="preview">').appendTo($tile);

    if (data.type == 'image' || data.type == 'video') {
      var $previewImage = $('<img>').attr('src', data.preview);
      // preload image
      $preview.hide();
      $previewImage.on('load', function() {
        $preview.show();
      });
      $previewImage.appendTo($preview);
    }

    if (data.type == 'insight') {
      var PREVIEW_SIZE = 250;
      $(INSIGHTS.preview(data.content, PREVIEW_SIZE))
        .appendTo($preview);
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
    var $this = $(this).parent(),
        sameTile = $this.is($activeTile);

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
      if ($(event.target).hasClass('play')) {
        var data = $this.data('data');

        if (data.type == 'video') {
          prefix = 'https://www.youtube.com/watch?v=';
          window.open(prefix + data.content.id, '_blank');
        }

        if (data.type == 'insight') {
          INSIGHTS.play(data.content, $this.find('canvas')[0]);
        }
      }
      // on mobile only the share button opens the overlay
      if ($(event.target).hasClass('share')) {
        showContent($this);
      }
    }
  }

  function createContent(data) {
    var $content = $('<div class="content">'),
        $close = $('<div class="close">').appendTo($content);

    createShareButtons(data).appendTo($content);
    createSponsorLogos().appendTo($content);

    $close.on('click', function() {
      hideContent($activeTile);
    });

    if (!isMobile && data.type === 'image') {
      $('<img>')
        .attr('src', data.content.image)
        .appendTo($content);
    }

    if (!isMobile && data.type === 'video') {
      $('<iframe width="380" height="380">')
        .attr('src', 'https://www.youtube.com/embed/' + data.content.id + '?rel=0&controls=0&showinfo=0&autoplay=1')
        .attr('frameborder', 0)
        .attr('allowfullscreen', true)
        .appendTo($content);
    }

    if (!isMobile && data.type === 'insight') {
      var canvas = INSIGHTS.play(data.content);
      $(canvas).appendTo($content);
    }

    return $content;
  }

  function createShareButtons(data) {
    var $share = $('<div class="share-buttons"></div>');

    $('<a href="#" class="share-facebook">' ).appendTo($share);
    $('<a href="#" class="share-twitter">' ).appendTo($share);
    $('<a href="#" class="share-google">' ).appendTo($share);
    $('<a href="#" class="share-linkedin">' ).appendTo($share);

    return $share;
  }

  function createSponsorLogos(data) {
    var $logos = $('<div class="sponsor-logos"></div>');

    $('<a href="#" class="logo-us-open">' ).appendTo($logos);
    $('<a href="#" class="logo-ibm">' ).appendTo($logos);

    return $logos;
  }

  function infiniteScroll() {
    var scrollTop = $(window).scrollTop(),
        docHeight = $(document).height(),
        winHeight = $(window).height(),
        threshold = 50;

    if (scrollTop >= (docHeight - winHeight - threshold)) {
      // stop if another request is in progress
      if (loading) return false;
      // need to send last tile id in order to
      // skip the tiles that are already loaded
      //loadTiles();
    }
  }

  function filterTiles(tag) {
    // sync desktop and mobile filters
    $('.filters li').siblings().removeClass('active');
    $('.filters li[data-tag='+activeFilter+']').addClass('active');
    $('.filters-dropdown').val(activeFilter);
    // hide current content
    if ($activeTile) {
      hideContent($activeTile);
    }
    $grid.find('li').show();
    if (tag != 0) {
      $grid.find('li').each(function() {
        var $this = $(this),
            data = $this.data('data');
        if (data && data.tags.indexOf(tag) === -1) {
          $this.hide();
        }
      });
    }
    $body.animate({ scrollTop : 0 }, 350);
  }

  function isMobile() {
    return screen.width < 700;
  }

});
