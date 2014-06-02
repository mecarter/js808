$(function() {
  
  var $window = $(window);
  
  var Tempo = Backbone.Model.extend({
    initialize: function() {      
      this.on('change:playing', this.togglePlay);
      this.on('change:tempo', this.changeTempo);
    },
    togglePlay: function() {
      var _this = this;
      var tempoCounter = function() {
        setTimeout(function() {
          $window.trigger('beat', _this.beat || 0);
          _this.beat++
          if (_this.beat === 16) _this.beat = 0;
          if (_this.get('playing')) tempoCounter();
        }, _this.get('bpm'))
      };

      if (this.get('playing')) {
        this.beat = 0;
        tempoCounter();
      }
    },
    changeTempo: function() {
      this.set('bpm', 60000 / this.get('tempo') / 4); // this.get('bpm') = bpm in ms
    }
  });
  
  var DrumModel = Backbone.Model.extend({
    initialize: function() {
      this.set('beats', []);
      this.$audio = $('<audio />');
      
      this.on('change:knob1 change:knob2 change:useAlt', this.setFile);
      this.on('change:vol', this.setVol);
      this.on('change:beat', this.changeBeat);
      
      $window.on('beat', _.bind(this.onBeat, this));
    },
    setFile: function() {
      var processVal = function(val) {
        var processedVal;
        switch(val) {
          case 0:
            processedVal = '00';
            break;
          case 1:
            processedVal = '25';
            break;
            case 2:
              processedVal = '50';
              break;
            case 3:
              processedVal = '75';
              break;
            case 4:
              processedVal = '10';
              break;
            default:
              processedVal = '';
        }
        return processedVal;
      };

      var knob1 = processVal(this.get('knob1'));
      var knob2 = processVal(this.get('knob2'));
      var knobsVal = '' + knob1 + knob2;
      var whichId = this.get('useAlt') ? 'drumAltId' : 'drumId';
      var fileName = 'samples/' + this.get(whichId) + knobsVal + '.mp3';
      
      this.$audio.attr('src', fileName);
    },
    changeBeat: function(beat) {
      var oldBeats = this.get('beats')
      if ($.inArray(beat, oldBeats) >= 0) {
        this.set('beats', _.without(oldBeats, beat));
      }
      else {
        this.set('beats', oldBeats.concat(beat));
      }
    },
    setVol: function() {
      this.$audio[0].volume = this.get('vol') / 10;
    },
    onBeat: function(e, beat) {
      if ($.inArray(beat, this.get('beats')) >= 0) {
        if (this.$audio[0].readyState)
          this.$audio[0].currentTime = 0;
        this.$audio[0].play();
      }
    }
  });
  
  var Drums = Backbone.Collection.extend({
    model: DrumModel
  });
  
  var Drum = Backbone.View.extend({
    events: {
      'change .knob1': 'changeKnob',
      'change .knob2': 'changeKnob',
      'change .vol': 'changeKnob',
      'click .drum-toggle': 'changeDrum'
    },
    initialize: function() {
      this.$el = $('#' + this.model.get('id'));
      this.$knob1 = this.$('.knob1');
      this.$knob2 = this.$('.knob2');
      
      this.model.set('knob1', +this.$knob1.val());
      this.model.set('knob2', +this.$knob2.val());
      
      this.listenTo(this.model, 'change:active', this.toggleActive);
    },
    changeDrum: function() {
      this.$el.toggleClass('use-alt');
      this.model.set('useAlt', !this.model.get('useAlt'));
    },
    changeKnob: function(e) {
      var $knob = $(e.target);
      this.model.set($knob.attr('class'), +$knob.val());
    },
    toggleActive: function(drumId) {
      this.$el.toggleClass('active');
    },
  });
  
  var DrumMachine = Backbone.View.extend({
    el: $('#drum-machine'),
    events: {
      'click #play': 'togglePlay',
      'change #tempo': 'changeTempo',
      'click .drum': 'changeActive',
      'click #sequencer button': 'sequencerToggle'
    },
    initialize: function() {
      this.tempo = new Tempo();
      this.drums = new Drums();
      this.$tempo = this.$('#tempo');
      
      this.listenTo(this.drums, 'add', this.addDrum);
      
      this.tempo.set('tempo', +this.$tempo.val());
      this.$('.drum').each(_.bind(this.createDrum, this));
    },
    togglePlay: function(e) {
      $(e.target).closest('#play').toggleClass('playing');
      this.tempo.set('playing', !this.tempo.get('playing'));
    },
    changeTempo: function(e) {
      this.tempo.set('tempo', +$(e.target).val());
    },
    addDrum: function(drum) {
      var view = new Drum({ model: drum });
    },
    createDrum: function(k, drum) {
      var fullId = $(drum).attr('id');
      var splitId = fullId.split('_');
      var drumId = splitId[0];
      var drumAltId = splitId[1];
      
      this.drums.add([{
        id: fullId,
        drumId: drumId,
        drumAltId: drumAltId
      }]);
    },
    changeActive: function(e) {
      var drumId = $(e.target).closest('.drum').attr('id');
      var oldActiveDrum = this.drums.findWhere({ active: true });
      var newActiveDrum = this.drums.get(drumId);
      
      if (oldActiveDrum)
        oldActiveDrum.set('active', false);
        
      newActiveDrum.set('active', true);
      
      this.$('#sequencer button').each(_.bind(function(i, e) {
        var beatIsActive = $.inArray(i, newActiveDrum.get('beats')) >= 0;
        $(e).toggleClass('active', beatIsActive);
      }, this));
    },
    sequencerToggle: function(e) {
      var $toggle = $(e.target);
      var activeDrum = this.drums.findWhere({ active: true });
      
      if (activeDrum) {
        $toggle.toggleClass('active');
        activeDrum.trigger('change:beat', $toggle.index());
      }
    }
  });
  
  var drumMachine = new DrumMachine();
  
});