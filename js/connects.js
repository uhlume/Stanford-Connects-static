/*
 * Utility functions
 */

(function ($) {
    /*
     * Expand a block element vertically to fill the viewport/available space
     */
    $.fn.maximize = function (mode) {
        mode = typeof mode !== "undefined"?mode:"viewport";
        var windowHeight = $(window).height();
        return this.each(function() {
            
            var $this = $(this),
                borderBox = ($this.css("box-sizing") === "border-box"),
                contentTop = $this.offset().top;
            
            var contentHeight, offset, siblingsHeight = 0;
            
            if (borderBox) {
                offset = parseFloat($this.css("margin-top")) + parseFloat($this.css("margin-bottom"));
            }
            else {
                offset = $this.outerHeight(true) - parseInt($this.css("height"));
            }
            switch (mode) {
                case "viewport":
                    contentHeight = windowHeight - offset;
                    break;
                case "fill":
                    $this.siblings().each(function() {
                        var $sibling = $(this);
                        siblingsHeight += $sibling.outerHeight(true);
                    });
                    var $parent = $this.parent();
                    var parentPaddingTop = parseFloat($parent.css("padding-top")),
                        parentPaddingBottom = parseFloat($parent.css("padding-bottom")),
                        parentMarginTop = parseFloat($parent.css("margin-top")),
                        parentMarginBottom = parseFloat($parent.css("margin-bottom"));
                    contentHeight = windowHeight - siblingsHeight - parentPaddingTop - parentPaddingBottom - offset;                    
                    break;
                default:
                    return;
            }
            $this.css({
                "min-height": contentHeight + "px"
            });
        });
    };


    /*
     * Center an element vertically within its parent, honoring any existing padding on the parent
     */
    $.fn.vertCenter = function () {
        return this.each(function () {
            var $this = $(this),
                $parent = $this.parent();

            $this.css({
                "margin-top": "0",
                "margin-bottom": "0"
            });

            var parentHeight = $parent.outerHeight(),
                parentPaddingTop = parseFloat($parent.css("padding-top")),
                parentPaddingBottom = parseFloat($parent.css("padding-bottom")),
                absOffset = Math.max(Math.floor((parentHeight - $this.outerHeight()) / 2), Math.max(parentPaddingTop, parentPaddingBottom)),
                offsetTop = Math.max(absOffset - parentPaddingTop, 0),
                offsetBottom = Math.max(absOffset - parentPaddingBottom, 0);

            $this.css({
                "margin-top": offsetTop,
                "margin-bottom": offsetBottom
            });
        });
    }
})(jQuery);

/* ---------------------------------------------------------------------------------------------------------------------------------------------------------- */

/*
 * Stuff to be done on document load or resize
 */
function init() {

    // Useful page elements wrapped as jQuery objects
    var $window = $(window),
        $topnav = $("#topnav"),
        $first = $("#about");

    // Adjust size and positioning of elements
    $(".section").maximize();
    $(".fluid-height").maximize("fill");
    $(".vert-center").vertCenter();
    
    // Reset parallax backgrounds if resize left width below 1024px (min. size for parallax behavior)
    if ($window.width() <= 1024) {
        $(".background-parallax").css("background-position", "center 0");
    }

    // Initialize Bootstrap Scrollspy plugin
    $topnav.scrollspy({
        offset: $first.offset().top
    });
    $('[data-spy="scroll"]').each(function () {
        var $spy = $(this).scrollspy('refresh');
    });
    
}

/*
 * Stuff to be done while scrolling the document
 */
function scrollHandler() {

    // Useful page elements wrapped as jQuery objects
    var $window = $(window),
        $topnav = $("#topnav"),
        $banner = $("#banner");

    /*
     * Background parallax effect
     */
    var winHeight = $window.height(),
        winWidth = $window.width();

    if (winWidth > 1024) { // Disable parallax on tablet and mobile
        $(".background-parallax").each(function () {
            var $this = $(this);

            var motionScale = 0.33; // Motion scaling factor (can be negative)

            var divHeight = $this.outerHeight(),
                divTop = $this.offset().top,
                docPosition = $window.scrollTop();

            if (docPosition > divTop - winHeight && docPosition < divTop + divHeight) {
                var divPosition = docPosition - divTop;
                $this.css("background-position", "center " + (Math.min(divPosition, divHeight) * -motionScale) + "px");
            }
        });
    }

    /*
     * Hide nav in initial screen (but only at desktop resolutions)
     */
    if ($window.scrollTop() < $banner.offset().top + $banner.height()) {
        if ($topnav.is(":visible") && $window.width() > 979) {
            $topnav.fadeOut(500);
        }
    }
    else {
        if ($topnav.is(':hidden')) $topnav.fadeIn(500);
    }

}


$(document).ready(function () {
    
    // Useful page elements wrapped as jQuery objects
    var $window = $(window),
        $topnav = $("#topnav"),
        $banner = $("#banner");
        
    $window.on("scroll", scrollHandler);
    

    // Bind page-initialization function to resize event and initialize for the first time
    $window.on("throttledresize", function(){
        init();
    });
    init();
    

    // Ensure nav is visible on page load
    if ($window.scrollTop() > $banner.offset().top + $banner.height()) $topnav.css({
        "display": "block"
    });
        
    // Clear any disabled form elements (necessary in browsers that save form state on reload)
    $("[disabled]").prop("disabled", false)

    
    
    // Stuff that should be deferred until after page has finished loading and rendering
    $window.load(function(){
        
        // re-run init() in case anything changed during page load
        init();
        
        // Activate banner carousel
        $("#banner").carousel({
            interval: 6000
        });
        
    });
    

    /*
     * Animate scrollTo on nav links
     */
    
   
    $("#topnav .nav a, #topnav a.brand, #comp a, #intro a, .btn-cta").on("click", function (e) {
        var targetElement = $(e.delegateTarget).attr('href'),
            targetElementOffset = $(targetElement).offset(),
            targetHeight = targetElementOffset.top,
            windowOffsetTop = $window.scrollTop(),
            scrollDuration = Math.abs(windowOffsetTop - targetHeight) / 2;
        e.preventDefault();
        $('html,body').stop().animate({
            scrollTop: targetHeight
        },
        scrollDuration,
            "swing",

        function () {
            window.location.hash = targetElement;
        });

    });
    
    /*
     * XHR form submission, remote validation, and feedback
     */
    
    $("#opt-in").submit(function(e) {
        var $this = $(this),
            post_url = $this.attr("action"),
            post_data = $this.serialize();
        
        e.preventDefault();
        
        $("#opt-in button[type=submit]")
            .html('<i class="icon-envelope icon-white"></i> CONNECTING');        
        
        $.ajax({
            type: "POST",
            url: post_url,
            data: post_data,
            dataType: "html",
            success: function(response) {
                var $response = $(response),
                    result = $response.find("h1").html(),
                    errorList = $response.find("li");
                                        
                $(".control-group").removeClass("error success muted");
                $("#opt-in button[type=reset]")
                    .click(function(){
                        $("#opt-in .control-group")
                            .removeClass("error success muted");
                        $("#opt-in input, #opt-in button[type='submit']")
                            .prop("disabled", false);
                        $("#opt-in button[type=submit]")
                            .removeClass("btn-success")
                            .addClass("btn-inverse")
                            .html('<i class="icon-envelope icon-white"></i> CONNECT ME');
                    });
                
                $("#opt-in input")
                    .keydown(function(){
                        $(this)
                            .parents(".control-group")
                                .removeClass("error success muted");
                    })
                    .change(function(){
                        $(this)
                            .parents(".control-group")
                                .removeClass("error success muted");
                    });
                
                if(result === "error") {
                    errorList.each(function(){
                        controlGroup = $(this).html();
                        $("#"+controlGroup)
                            .addClass("error");
                        return;
                    });
                        $("#opt-in button[type=submit]")
                            .html('<i class="icon-envelope icon-white"></i> CONNECT ME');
                    
                } else {
                    
                    // Successful submission
                    // Log virtual page view to Google Analytics
                    if (typeof _gaq != undefined) {
                        _gaq.push(['_trackPageview', '/in-page/form_submission']);
                    }
                    
                    
                    $("#opt-in input, #opt-in button[type=submit]")
                        .prop("disabled", true);
                    $("#opt-in .control-group")
                        .addClass("success");
                    $("#opt-in button[type=submit]")
                        .removeClass("btn-inverse")
                        .addClass("btn-success")
                        .html('<i class="icon-envelope icon-white"></i> CONNECTED');

                    window.setTimeout(function(){
                        $("#opt-in .control-group")
                            .removeClass("success")
                            .addClass("muted");
                    }, 4000);
                    
                    $("#opt-in button[type=submit]")
                        .popover({
                            html: true,
                            placement: "top",
                            trigger: "manual",
                            title: "Success!",
                            content: "Thanks for connecting, " + $("#form-firstname input").val() + ". We'll be in touch soon."
                        });
                                            
                    $("#opt-in button[type=submit]")
                        .popover("show");
                        
                    window.setTimeout(function(){
                        $("html")
                            .on("click.successMessageDismiss", function(){
                                $("#opt-in button[type=submit]")
                                    .popover("destroy");
                                $("html")
                                    .off("click.successMessageDismiss");
                            });
                    }, 1000);

                }
            }
        });
        
    });    
    
});

/*
* jQuery Mobile Framework v1.2.0
* http://jquerymobile.com
*
* Copyright 2012 jQuery Foundation and other contributors
* Released under the MIT license.
* http://jquery.org/license
*
*/

(function ( root, doc, factory ) {
	if ( typeof define === "function" && define.amd ) {
		// AMD. Register as an anonymous module.
		define( [ "jquery" ], function ( $ ) {
			factory( $, root, doc );
			return $.mobile;
		});
	} else {
		// Browser globals
		factory( root.jQuery, root, doc );
	}
}( this, document, function ( jQuery, window, document, undefined ) {

	// throttled resize event
	(function( $ ) {
		$.event.special.throttledresize = {
			setup: function() {
				$( this ).bind( "resize", handler );
			},
			teardown: function() {
				$( this ).unbind( "resize", handler );
			}
		};

		var throttle = 250,
			handler = function() {
				curr = ( new Date() ).getTime();
				diff = curr - lastCall;

				if ( diff >= throttle ) {

					lastCall = curr;
					$( this ).trigger( "throttledresize" );

				} else {

					if ( heldCall ) {
						clearTimeout( heldCall );
					}

					// Promise a held call will still execute
					heldCall = setTimeout( handler, throttle - diff );
				}
			},
			lastCall = 0,
			heldCall,
			curr,
			diff;
	})( jQuery );
}));


/*
 * jQuery hashchange event - v1.3 - 7/21/2010
 * http://benalman.com/projects/jquery-hashchange-plugin/
 * 
 * Copyright (c) 2010 "Cowboy" Ben Alman
 * Dual licensed under the MIT and GPL licenses.
 * http://benalman.com/about/license/
 */
(function($,e,b){var c="hashchange",h=document,f,g=$.event.special,i=h.documentMode,d="on"+c in e&&(i===b||i>7);function a(j){j=j||location.href;return"#"+j.replace(/^[^#]*#?(.*)$/,"$1")}$.fn[c]=function(j){return j?this.bind(c,j):this.trigger(c)};$.fn[c].delay=50;g[c]=$.extend(g[c],{setup:function(){if(d){return false}$(f.start)},teardown:function(){if(d){return false}$(f.stop)}});f=(function(){var j={},p,m=a(),k=function(q){return q},l=k,o=k;j.start=function(){p||n()};j.stop=function(){p&&clearTimeout(p);p=b};function n(){var r=a(),q=o(m);if(r!==m){l(m=r,q);$(e).trigger(c)}else{if(q!==m){location.href=location.href.replace(/#.*/,"")+q}}p=setTimeout(n,$.fn[c].delay)}$.browser.msie&&!d&&(function(){var q,r;j.start=function(){if(!q){r=$.fn[c].src;r=r&&r+a();q=$('<iframe tabindex="-1" title="empty"/>').hide().one("load",function(){r||l(a());n()}).attr("src",r||"javascript:0").insertAfter("body")[0].contentWindow;h.onpropertychange=function(){try{if(event.propertyName==="title"){q.document.title=h.title}}catch(s){}}}};j.stop=k;o=function(){return a(q.location.href)};l=function(v,s){var u=q.document,t=$.fn[c].domain;if(v!==s){u.title=h.title;u.open();t&&u.write('<script>document.domain="'+t+'"<\/script>');u.close();q.location.hash=v}}})();return j})()})(jQuery,this);
