/* Linked Sliders 1.0.0 for jQuery UI Slider 1.8.6.
   Written by Keith Wood (kbwood{at}iinet.com.au) January 2011.
   Dual licensed under the GPL (http://dev.jquery.com/browser/trunk/jquery/GPL-LICENSE.txt) and 
   MIT (http://dev.jquery.com/browser/trunk/jquery/MIT-LICENSE.txt) licenses. 
   Please attribute the authors if you use it. */

(function($) { // Hide the namespace

var PROP_NAME = 'linkedSliders';

/* Linked Sliders manager. */
function LinkedSliders() {
	this._defaults = {
		total: 100,  // The total for all the linked sliders
		policy: 'next' // Adjustment policy: 'next', 'prev', 'first', 'last', 'all'
	};
}

$.extend(LinkedSliders.prototype, {
	/* Class name added to elements to indicate already configured with linked sliders. */
	markerClassName: 'hasLinkedSliders',

	/* Override the default settings for all linked sliders instances.
	   @param  settings  object - the new settings to use as defaults
	   @return  (SimpleBar) this manager */
	setDefaults: function(settings) {
		extendRemove(this._defaults, settings || {});
		return this;
	},

	/* Attach the linked sliders functionality to an element.
	   @param  target    (element) the slider to be linked
	   @param  settings  (object) the new settings for this slider
	   @param  linked    (jQuery) the set of linked sliders */
	_attachLinkedSliders: function(target, settings, linked) {
		target = $(target);
		if (!target.hasClass('ui-slider')) {
			throw 'Please add slider functionality first';
		}
		if (target.hasClass(this.markerClassName)) {
			return;
		}
		target.addClass(this.markerClassName);
		this._updateLinkedSliders(target, settings, linked);
	},

	/* Reconfigure the settings for a linked sliders element.
	   @param  target    (element) the linked sliders container
	   @param  settings  (object) the new settings for this container or
	                     (string) a single setting name
	   @param  value     (any) the single setting's value */
	_changeLinkedSliders: function(target, settings, value) {
		target = $(target);
		if (!target.hasClass(this.markerClassName)) {
			return;
		}
		if (typeof settings == 'string') {
			var name = settings;
			settings = {};
			settings[name] = value;
		}
		this._updateLinkedSliders(target, settings);
	},

	/* Construct the requested linked sliders.
	   @param  target    (element) the slider element
	   @param  settings  (object) the new settings
	   @param  linked    (jQuery) the set of linked sliders */
	_updateLinkedSliders: function(target, settings, linked) {
		var oldSettings = $.data(target[0], PROP_NAME) || $.extend({}, this._defaults);
		settings = extendRemove(oldSettings, $.extend(settings || {}, linked ? {linked: linked} : {}));
		$.data(target[0], PROP_NAME, settings);
		target.unbind('.linkedSlider').
			bind('slidechange.linkedSlider,slide.linkedSlider', function(event, ui) {
				if (!$.linkedSliders._linking) {
					$.linkedSliders._linking = true; // Prevent recursion
					$.linkedSliders._linkSliders(target, event, ui);
					$.linkedSliders._linking = false;
				}
			});
		$.linkedSliders._linkSliders(target, null, {handle: target}); // Initial synch
	},

	/* Remove the linked sliders functionality from a div.
	   @param  target  (element) the slider element */
	_destroyLinkedSliders: function(target) {
		target = $(target);
		if (!target.hasClass(this.markerClassName)) {
			return;
		}
		target.removeClass(this.markerClassName).unbind('.linkedSlider');
		$.removeData(target[0], PROP_NAME);
	},

	/* Update the set of linked sliders.
	   @param  target  (element) the slider element being changed
	   @param  event   (Event) the change event
	   @param  ui      (object) the current UI settings */
	_linkSliders: function(target, event, ui) {
		var settings = $.data(target[0], PROP_NAME);
		var curIndex = settings.linked.index($(ui.handle).closest('.ui-slider'));
		var remTotal = settings.total;
		settings.linked.each(function(i) {
			remTotal -= $(this).slider('value');
		});
		var dir = ($.inArray(settings.policy, ['prev', 'last']) > -1 ? -1 : +1);
		var index = (settings.policy == 'first' ? 0 :
			(settings.policy == 'last' ? settings.linked.length - 1 : curIndex));
		for (var i = 0; i < 2 * settings.linked.length; i++) {
			if (index != curIndex) {
				var slider = settings.linked.eq(index);
				var val = slider.slider('value');
				var min = slider.slider('option', 'min');
				var max = slider.slider('option', 'max');
				var newVal = 0;
				if (settings.policy == 'all') {
					newVal = (i == settings.linked.length - 1 ? remTotal :
						Math.floor(remTotal / Math.max(1, settings.linked.length - i)));
					newVal = Math.min(Math.max(val + newVal, min), max);
				}
				else {
					newVal = Math.min(Math.max(val + remTotal, min), max);
				}
				slider.slider('value', newVal);
				remTotal -= (newVal - val);
				if (remTotal == 0) {
					break;
				}
			}
			index = (settings.linked.length + index + dir) % settings.linked.length;
		}
	}
});

/* jQuery extend now ignores nulls! */
function extendRemove(target, props) {
	$.extend(target, props);
	for (var name in props) {
		if (props[name] == null) {
			target[name] = null;
		}
	}
	return target;
}

/* Attach the linked sliders functionality to a jQuery selection.
   @param  command  string - the command to run (optional, default 'attach')
   @param  options  object - the new settings to use for these slider instances
   @return  jQuery object - for chaining further calls */
$.fn.linkedSliders = function(options) {
	var otherArgs = Array.prototype.slice.call(arguments, 1);
	var these = this;
	return this.each(function() {
		if (typeof options == 'string') {
			$.linkedSliders['_' + options + 'LinkedSliders'].
				apply($.linkedSliders, [this].concat(otherArgs));
		}
		else {
			$.linkedSliders._attachLinkedSliders(this, options || {}, these);
		}
	});
};

/* Initialise the linked sliders functionality. */
$.linkedSliders = new LinkedSliders(); // singleton instance

})(jQuery);
