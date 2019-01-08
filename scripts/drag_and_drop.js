
/**
 * VHL Drag & Drop Library
 *
 * Instantiate DragAndDrop once per discrete group
 * of items that interact with each other
 * (i.e., if you have a view that contains two unrelated
 * components that have drag & drop interactions,
 * they should have separate DragAndDrop instances.)
 *
 * Usage:
 *
 * new VHL.Music.V1.DragAndDrop(draggableSelector, targetSelector, checkMatch, context);
*/

VHL.Music.V1.DragAndDrop = (function() {
  'use strict';

  /** Constants for HTML classnames representing UI states. */
  const ui = Object.freeze({
    state: {
      // draggables:
      IS_MOVING: 'is-moving',
      HAS_MOVED: 'has-moved',
      // targets:
      IS_AVAILABLE_TARGET: 'is-available-target',
      IS_HOVERED: 'is-hovered',
      // either:
      IS_SELECTED: 'is-selected'
    }
  });

  /**
   * Drag & Drop

   * @constructor
   *
   * @param {String} draggableSelector - Query selector for draggable elements.
   * @param {String} targetSelector    - Query selector for drag target elements.
   * @param {Function} checkMatch - Callback function to evaluate matches and take further action.
   * @param {String} contextSelector - Query selector for parent element to limit scope of
   *                                   selectors. If multiple results, will use first one.
   */
  function DragAndDrop(draggableSelector, targetSelector, checkMatch, contextSelector = 'body') {
    this.$context = $(contextSelector).eq(0);
    this.$draggables = this.$context.find(draggableSelector);
    this.$targets = this.$context.find(targetSelector);
    this.checkMatch = checkMatch;
    this.init();
  }

  /**
   * Private static helpers:
   *
   * These functions get used as event handlers and are bound to `this` (the DnD instance)
   */

   // Events on Draggables:

  /**
   * Handle the 'dragstart' event.
   * @param  {Event} evt The dragstart event
   * @private
   */
  function _handleDragStart(evt) {
    // Reference to the instance, passed in with evt.data:
    let self = evt.data.self;
    // Grab a reference to the dragged element:
    self.$dragElement = $(evt.currentTarget);
    // Add state class for styling:
    self.$dragElement.addClass(ui.state.IS_MOVING);
    // All targets can advertise their presence via this class:
    self.$targets.addClass(ui.state.IS_AVAILABLE_TARGET);
    self.$targets.attr('aria-dropeffect', 'move');
    // Using 'originalEvent' b/c 'dataTransfer' exists only in native Event model, not jQuery's:
    evt.originalEvent.dataTransfer.effectAllowed = "move";
    // We don't use this, but Firefox seems to not work if it isn't set:
    evt.originalEvent.dataTransfer.setData('text/plain', 'foo');
    // A11Y - Add Aria Label to indicate Drag Start
    self.$dragElement.attr('aria-grabbed', 'true');
  }

  /**
   * Handle the 'dragend' event.
   * @private
   * @param  {Event} evt The dragend event
   */
  function _handleDragEnd(evt) {
    // Reference to the instance, passed in with evt.data:
    let self = evt.data.self;
    self.$dragElement.removeClass(ui.state.IS_MOVING);
    self.$targets.removeClass(ui.state.IS_AVAILABLE_TARGET);
    evt.originalEvent.dataTransfer.dropEffect = 'move';
    // A11Y - Add Aria Label to indicate Drag End
    self.$dragElement.attr('aria-grabbed', 'false');
  }


  // Events on Targets:

  /**
   * Handle the 'dragenter' event.
   * @private
   * @param  {Event} evt The dragenter event
   */
  function _handleDragEnter(evt) {
    // Reference to the instance, passed in with evt.data:
    let self = evt.data.self;
    // The target we are hovering above while dragging:
    let $theTarget = $(evt.currentTarget);
    evt.stopPropagation(); // prevent redirect
    // Sets the cursor and other visual feedback during drag:
    evt.originalEvent.dataTransfer.effectAllowed = "move";
    // Class for styling/scripting that target:
    $theTarget.addClass(ui.state.IS_HOVERED);
  }

  /**
   * Handle the 'dragleave' event.
   * @private
   * @param  {Object} evt The event object.
   */
  function _handleDragLeave(evt) {
    // Reference to the instance, passed in with evt.data:
    let self = evt.data.self;
    let $theTarget = $(evt.currentTarget);
    evt.stopPropagation(); // prevent redirect
    $theTarget.removeClass(ui.state.IS_HOVERED);
  }

  /**
   * Handle the 'dragover' event.
   *
   * @private
   * @param  {Object} evt The event object.
   */
  function _handleDragOver(evt) {
    // Reference to the instance, passed in with evt.data:
    let self = evt.data.self;
    let $theTarget = $(evt.currentTarget);
    evt.preventDefault(); // Drop won't work without this!
    $theTarget.addClass(ui.state.IS_HOVERED);
    // Workaround for dragleave being called for child nodes in some browsers:
    $theTarget.addClass(ui.state.IS_HOVERED);
  }

  /**
   * Handle the 'drop' event.
   *
   * @private
   * @param  {Object} evt The event object.
   */
  function _handleDrop(evt) {
    // Reference to the instance, passed in with evt.data:
    let self = evt.data.self;
    let $theDraggable = self.$dragElement;
    let $theTarget = $(evt.currentTarget);
    evt.stopPropagation(); // prevent redirect
    evt.preventDefault();  // prevent default behavior
    $theTarget.removeClass(ui.state.IS_HOVERED);
    // Run the callback to check the match and perform any side effects needed:
    self.checkMatch($theDraggable, $theTarget);
  }

  /**
   * Dispatch various drag- & drop-related event types to their handlers.
   * Some events are relevant to the draggable elements, some to the targets.
   *
   * @private
   * @param  {Object} self Reference to the prototype.
   */
  function _addDragEventHandlers(self) {
    // Set handlers per event type. pass in 'self' in evt.data b/c event handlers
    // will have 'this' redefined.
    self.$draggables.on({
      'dragstart': _handleDragStart,
      'dragend': _handleDragEnd
    }, {self: self});
    self.$targets.on({
      'dragenter': _handleDragEnter,
      'dragleave': _handleDragLeave,
      'dragover': _handleDragOver,
      'drop': _handleDrop
    }, {self: self});
  }

  /**
   * Remove the drag- & drop-related event handlers.
   *
   * @private
   * @param  {Object} $draggables List of the draggable elements on which Drag events need to be removed.
   * @param  {Object} $targets List of the dropable elements on which Drag events need to be removed.
   */
  function _removeDragEventHandlers($draggables, $targets) {
    $draggables.off({
      'dragstart': _handleDragStart,
      'dragend': _handleDragEnd
    });
    $targets.off({
      'dragenter': _handleDragEnter,
      'dragleave': _handleDragLeave,
      'dragover': _handleDragOver,
      'drop': _handleDrop
    });
  }

  /**
   * Add listeners for enter key & click on draggables and targets.
   *
   * Provides two alternatives to mouse drag & drop:
   * A. Select the elements via clicking;
   * B. Select them via keyboard (tab to element then press enter key).
   *
   * @private
   * @param  {Object} self Reference to the prototype.
   */
  function _addKeyboardEventHandlers(self) {
    const keyCodes = {
      ENTER_KEY: 13,
      SPACE_BAR: 32,
      ESCAPE: 27
    };

    self.$draggables.on('click keypress', function(evt) {
      if (evt.type === 'click'
           || evt.which === keyCodes.ENTER_KEY
           || evt.which === keyCodes.SPACE_BAR) {
        _keyboardSelect(self, $(evt.currentTarget));
        evt.preventDefault();
      }
    });
    self.$targets.on('click keypress', function(evt) {
      if (evt.type === 'click'
           || evt.which === keyCodes.ENTER_KEY
           || evt.which === keyCodes.SPACE_BAR) {
        _keyboardSelect(self, $(evt.currentTarget));
        evt.preventDefault();
      }
    });
    // A11Y - Allow user to cancel drag and drop when escape is pressed
    self.$context.on('keydown', function(evt) {
      if (evt.which === keyCodes.ESCAPE) {
        var $selectedElement = _selectedDraggable(self);
        // Deselect the selected draggable element
        _keyboardSelect(self, $selectedElement);
        $selectedElement.focus();
        evt.preventDefault();
      }
    });
  }

  /**
   * Remove all keyboard events.
   *
   * @private
   * @param  {Object} $draggables List of the draggable elements on which keyboard event need to be removed.
   * @param  {Object} $targets List of the dropable elements on which keyboard event need to be removed.
   */
  function _removeKeyboardEventHandlers($draggables, $targets) {
    $draggables.off('click');
    $targets.off('click');
  }

  function _selectedDraggable(self) {
    return self.$draggables.filter('.' + ui.state.IS_SELECTED);
  }

  function _selectedTarget(self) {
    return self.$targets.filter('.' + ui.state.IS_SELECTED);
  }

  /**
   * Executed when the student has used an alternative to drag & drop.
   * @see  the _addKeyboardHandlers method.
   * @private
   * @param  {Object} self Reference to the DragAndDrop instance.
   * @param  {jQuery} $el element to select/deselect
   */
  function _keyboardSelect(self, $el) {
    var $theDraggable, $theTarget;
    // Determine the element's new "is-selected" state:
    var newState = !$el.hasClass(ui.state.IS_SELECTED);
    // Unselect all elements of the same type (draggable or target):
    if ($el.attr('draggable')) {
      self.$draggables.removeClass(ui.state.IS_SELECTED);
    } else {
      self.$targets.removeClass(ui.state.IS_SELECTED);
    }
    // Set the new state on the element:
    $el.toggleClass(ui.state.IS_SELECTED, newState);
    // If there is a draggable AND a target selected, check them for a match:
    $theDraggable = _selectedDraggable(self);
    $theTarget = _selectedTarget(self);
    if ($theDraggable.length && $theTarget.length) {
      // Run the callback function to test the match and perform side effects:
      self.checkMatch($theDraggable, $theTarget);
    }
  }

  DragAndDrop.prototype = {
    /**
     * Set up the drag & drop interactions.
     */
    init: function() {
      // Make all the elements focusable:
      this.$draggables.attr('tabindex', '0');
      this.$targets.attr('tabindex', '0');
      // Make the draggables draggable:
      this.$draggables.attr('draggable', 'true');

      // AllY - For all cards ('c-draggable-card'), 'aria-grabbed' is to be set to 'false' to indicate to screen readers that these elements are available for dragging
      this.$draggables.attr('aria-grabbed', 'false');
      this.$targets.attr('aria-dropeffect', 'move');
      // A11Y - For NVDA support, role='application' needs to be applied on the D&D context element (parent) Reference - http://pauljadam.com/demos/draggable.html
      this.$context.attr('role','application');

      // Attach event listeners:
      _addDragEventHandlers(this);
      _addKeyboardEventHandlers(this);
    },

    /**
     * Remove all event handlers, and otherwise
     * put everything back the way we found it.
     *
     * TODO: Store and restore these attrs instead of
     * assuming they were empty at the start?
     */
    cleanup: function() {
      this.$draggables.removeAttr('draggable');
      this.$draggables.removeAttr('tabindex');
      this.$targets.removeAttr('tabindex');
      _removeDragEventHandlers(this.$draggables, this.$targets);
      _removeKeyboardEventHandlers(this.$draggables, this.$targets);
    },

    /**
     * Disable Dragging and Dropping ability from a draggable and droppable Element
     * This will be requiried after successful matching of a pair
     * @param  {$draggable} jQuery element referring to the Draggable element
     * @param  {$target} jQuery element referring to the Droppable target element
     */
    disableMatching: function($draggable, $target) {

      if($draggable && $target){
        // Remove 'draggable' attribute and do not allow focus on this element as an individual entity
        $draggable.removeAttr('draggable');
        $draggable.removeAttr('aria-grabbed');
        $draggable.removeAttr('tabindex');

        // Remove 'dropeffect' for Screen Reader to stop announcing this element as available from dropping
        $target.removeAttr('aria-dropeffect');

        // Remoeve Drag and Keyboard Event Handlers
        _removeDragEventHandlers($draggable, $target);
        _removeKeyboardEventHandlers($draggable, $target);
      }
    }
  };

  return DragAndDrop;
})();
