/**
 * @fileOverview Popover base class which provides the basic functionality for
 * popovers (e.g. showing, hiding, etc)
 */

var $ = require('jquery');
var Container = require('streamhub-ui/container');
var domUtil = require('streamhub-ui/util/dom');
var inherits = require('inherits');

/**
 * Popover base class.
 * @constructor
 * @extends {Container}
 * @param {Object} opts Config options.
 */
function Popover(opts) {
    Container.call(this, opts);

    /**
     * The active position of the popover. This is set when the popover is
     * positioned. This only differs from this._position when it's set to auto.
     * @type {?string}
     * @private
     */
    this._activePosition = null;

    /** @override */
    this._hideTimeMS = 300;

    /**
     * Whether the client is mobile or not.
     * Requires the instantiator to tell this class whether it's mobile or not
     * so that we don't force mobile popovers onto other modules/apps that
     * can't support it.
     * @type {boolean}
     * @private
     */
    this._isMobile = !!opts.isMobile;

    /** @override */
    this._showTimeMS = 300;
}
inherits(Popover, Container);

/** @enum {string} */
Popover.CLASSES = {
    ARROW: 'lf-popover-arrow',
    BASE: 'lf-popover',
    CONTENT: 'lf-popover-content',
    LF: 'lf',
    MOBILE: 'lf-popover-mobile',
    POSITION_PREFIX: 'lf-pos-'
};

/**
 * Clear all absolutely positions for an element.
 * @type {Object}
 */
Popover.CLEAR_CSS_POSITIONS = {
    bottom: '',
    left: '',
    right: '',
    top: ''
};

/** @enum {string} */
Popover.POSITIONS = {
    SMART: 'smart',
    BOTTOM: 'bottom',
    LEFT: 'left',
    RIGHT: 'right',
    TOP: 'top',
    SMART_TOP: 'smart_top'
};

/** @enum {function()} */
Popover.POSITION_FN_MAP = {
    'bottom': '_getBottomPosition',
    'left': '_getLeftPosition',
    'right': '_getRightPosition',
    'smart': '_getSmartPosition',
    'top': '_getTopPosition',
    'smart_top': '_getSmartTopPosition'
};

/** @override */
Popover.prototype.elClass = Popover.CLASSES.BASE;

/** @override */
Popover.prototype.template = require('hgn!streamhub-ui/templates/popover');

/**
 * Get the bottom position of the element where this popover should be positioned.
 * @param {Element} elem The element to position next to.
 * @return {Object} Top and left positioning for the popover.
 * @private
 */
Popover.prototype._getBottomPosition = function (elem) {
    this._activePosition = Popover.POSITIONS.BOTTOM;
    var boundingRect = domUtil.getBoundingClientRect(elem);

    var top;
    if (this._parentEl === document.body) {
        top = boundingRect.bottom + domUtil.getScrollY();
    } else {
        top = boundingRect.height;
    }
    top += 10;

    var left;
    var availableWidth = boundingRect.right - boundingRect.left;
    var width = this.opts.maxWidth || availableWidth;

    if (this._parentEl === document.body) {
        left = (availableWidth - width) / 2;
        left += boundingRect.left + domUtil.getScrollX();
        left = Math.max(0, left);
    } else {
        var parentPosition = $(this._parentEl).css('position');
        var halfWidthOffset = (-1 * $(elem).outerWidth() / 2);
        if (parentPosition === 'relative') {
            left = halfWidthOffset; 
        } else {
            left = $(elem).offset().left + halfWidthOffset;
        }
    }

    return {
        top: top,
        left: left,
        width: width
    };
};

/**
 * Get the left position of the element where this popover should be positioned.
 * @param {Element} elem The element to position next to.
 * @return {Object} Top and left positioning for the popover.
 * @private
 */
Popover.prototype._getLeftPosition = function (elem) {
    this._activePosition = Popover.POSITIONS.LEFT;
    var boundingRect = domUtil.getBoundingClientRect(elem);
    var top = boundingRect.top + domUtil.getScrollY();
    var right = $('body').width() - boundingRect.left + this.opts.leftPadding;
    var width = boundingRect.left - this.opts.leftPadding;
    return {top: top, right: right, width: width};
};

/**
 * Get the width of the popover.
 * @param {number} width The width of the area where the popover will be.
 * @return {number} The width the popover should be.
 * @private
 */
Popover.prototype._getPopoverWidth = function (width) {
    if (width < this.opts.minWidth) return this.opts.minWidth;
    if (width > this.opts.maxWidth) return this.opts.maxWidth;
    width -= (this.opts.sidePadding || 0) * (this._activePosition === Popover.POSITIONS.BOTTOM ? 2 : 1);
    return width;
};

/**
 * Get the right position of the element where this popover should be positioned.
 * @param {Element} elem The element to position next to.
 * @return {Object} Top and left positioning for the popover.
 * @private
 */
Popover.prototype._getRightPosition = function (elem) {
    this._activePosition = Popover.POSITIONS.RIGHT;
    var boundingRect = domUtil.getBoundingClientRect(elem);
    var top = boundingRect.top + domUtil.getScrollY();
    var left = boundingRect.right + domUtil.getScrollX() + 10;
    var width = document.body.clientWidth - left;
    return {top: top, left: left, width: width};
};

/**
 * Position the popover on top of an element.
 * @param {Element} elem The element to position next to.
 * @return {Object} The bottom, left, width positioning for the popover.
 * @private
 */
Popover.prototype._getTopPosition = function (elem) {
    this._activePosition = Popover.POSITIONS.TOP;
    var boundingRect = domUtil.getBoundingClientRect(elem);

    var bottom = $(window).height() - (boundingRect.top + domUtil.getScrollY()) + 10;
    var boundingRect = domUtil.getBoundingClientRect(elem.parentElement);
    var left = boundingRect.left + domUtil.getScrollX() - 5;
    var width = document.body.clientWidth - left;
    return {bottom: bottom, left: left, width: width};
};

/**
 * Automatically pick the best position for the popover.
 * @param {Element} elem The element to position next to.
 * @return {Object} Top and left positioning for the popover.
 * @private
 */
Popover.prototype._getSmartPosition = function (elem) {
    var position = this._getRightPosition(elem);
    if (position.width < this.opts.minWidth) {
        return this._getBottomPosition(elem);
    }
    return position;
};

/**
 * Automatically pick the best position for the popover.
 * @param {Element} elem The element to position next to.
 * @return {Object} Top and left positioning for the popover.
 * @private
 */
Popover.prototype._getSmartTopPosition = function (elem) {
    this._activePosition = Popover.POSITIONS.SMART_TOP;
    var top;
    var left;
    var width;
    var boundingRect;

    //Position Top
    boundingRect = domUtil.getBoundingClientRect(elem.parentElement);
    if (boundingRect.top > boundingRect.height) {
        return this._getTopPosition(elem);
    }
    
    //Position Right
    if (($(window).width() - boundingRect.left - boundingRect.width) > (boundingRect.width + 10)) {
        this._activePosition = Popover.POSITIONS.RIGHT;
        boundingRect = domUtil.getBoundingClientRect(elem);

        var offset = $(elem).css('marginTop').replace(/[^-\d\.]/g, '');
        top = boundingRect.top + domUtil.getScrollY() - offset;
        left = boundingRect.right + domUtil.getScrollX() + 10;
        width = domUtil.getBoundingClientRect(elem.parentElement).width + 10;
        return {top: top, left: left, width: width};
    }

    //Bosition Bottom
    else {
        boundingRect = domUtil.getBoundingClientRect(elem);
        top = boundingRect.bottom + domUtil.getScrollY() + 10;
        boundingRect = domUtil.getBoundingClientRect(elem.parentElement);
        left = boundingRect.left + domUtil.getScrollX() - 5;

        width = document.body.clientWidth - left;
        return {top: top, left: left, width: width};
    } 
};

/**
 * Scroll the popover into position. The works on the top and bottom. If it's on
 * the top, it scrolls down so that the top of the popover is 20 pixels below
 * the top fold. If it's on the bottom, it scrolls up so that 200 pixels of the
 * popover are visible. Don't scroll in addition to another scroll, however,
 * which could be the case when there is a permalink being scrolled to.
 * @param {number} top The top position of the popover.
 */
Popover.prototype._scrollIntoPosition = function (top) {
    var scrollElem = $('body,html');
    if (scrollElem.is(':animated')) {
        return;
    }

    var scrollY = domUtil.getScrollY();
    var bottomViewport = scrollY + $(window).height();
    var isAboveBottomFold = top + (this.opts.minPopoverInView || 0) <= bottomViewport;
    var isBelowTopFold = top > scrollY + (this.opts.topSpacing || 0);

    // If it's satisfactorily in view, don't shift the top position.
    if (isAboveBottomFold && isBelowTopFold) {
        return;
    }

    var scrollTop;
    if (!isAboveBottomFold) {
        scrollTop = scrollY + ((this.opts.minPopoverInView || 0) + top - bottomViewport);
    } else if (!isBelowTopFold) {
        scrollTop = top - (this.opts.topSpacing || 0);
    }
    scrollElem.animate({scrollTop: scrollTop}, this.opts.scrollDuration);
};

/** @override */
Popover.prototype.render = function () {
    Container.prototype.render.call(this);
    this.$_contentNode = this.$('.' + Popover.CLASSES.CONTENT);
};

/**
 * Positions the arrow of a product popover.
 * @param  {Element} The element that the arrow is positioned in relation to.
 * 
 */
Popover.prototype.positionArrowSmart = function (elem) {
    var arrowEl = this.$el.find('.'+ Popover.CLASSES.ARROW);
    var offset = parseInt($(elem).outerWidth(true))/2;
    var left = $(elem.parentElement).width() - offset;
    arrowEl.css('left', left+'px');
    var position = this._activePosition;
    if (position === 'right') {
        arrowEl.css('left', '-5px');
        offset = parseInt($(elem).outerHeight(true)) - (parseInt($(elem).innerHeight()));
        arrowEl.css('top', offset+'px');
    }
};

/**
 * Resets the width of the popover, so that it updates every time the popover is hovered over.
 * @param  {Element} The element the popover is positioned in relation to.
 * 
 */
Popover.prototype.setProductPopoverWidth = function (elem) {
    var position = this[Popover.POSITION_FN_MAP[this._position]].call(this, elem);
    var POSITION_PREFIX = Popover.CLASSES.POSITION_PREFIX;
    position.width = domUtil.getBoundingClientRect(elem.parentElement).width;
    this.$el.css('width', position.width + 10 + 'px');
};

/** @override */
Popover.prototype.resizeAndReposition = function (elem) {
    // Mobile popovers should not do any repositioning, since they will be the
    // full screen.
    if (this._isMobile) {
        this.$el.addClass(Popover.CLASSES.MOBILE);
        return;
    }

    // Position popover
    var position = this[Popover.POSITION_FN_MAP[this._position]].call(this, elem);
    var POSITION_PREFIX = Popover.CLASSES.POSITION_PREFIX;
    position.width = this._getPopoverWidth(position.width);
    this.$el.css(Popover.CLEAR_CSS_POSITIONS).css(position).removeClass(function () {
        var classes = [];
        for (var pos in Popover.POSITIONS) {
            if (Popover.POSITIONS.hasOwnProperty(pos)) {
                classes.push(POSITION_PREFIX + Popover.POSITIONS[pos]);
            }
        }
        return classes.join(' ');
    }).addClass(POSITION_PREFIX + this._activePosition);

    var boundingClientRect = this.el.getBoundingClientRect();
    if (boundingClientRect.left < 0) {
        this.$el.css('left', position.left - boundingClientRect.left+'px');
    }

    // Position popover arrow
    var arrowEl = this.$el.find('.'+Popover.CLASSES.ARROW);
    var popoverParentEl = $(this._parentEl)
    var translateX = arrowEl.offset().left - popoverParentEl.offset().left - (popoverParentEl.outerWidth()/2) ;
    var arrowLeft = parseInt(arrowEl.css('left'), 10);
    arrowEl.css(Popover.CLEAR_CSS_POSITIONS).css('left', (arrowLeft-translateX) + 'px');
};

/**
 * @param {Element} el The root element of the content
 */
Popover.prototype.setContentNode = function (el) {
    this.$_contentNode.empty();
    this.$_contentNode.append(el);
};

module.exports = Popover;
