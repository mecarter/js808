// JS808
$(function() {
  var $window = $(window)
  
  var Tempo = Backbone.Model.extend({
    initialize: function() {
      this.playing = 0;
      
      this.on('change:playing', _.bind(this.togglePlay, this));
      this.on('change:tempo', _.bind(this.changeTempo, this));

      this.changeTempo(120);
    },
    togglePlay: function() {
      var that = this;
      var tempoCounter = function() { 
        setTimeout(function() {
          $window.trigger('beat', that.beat || 0);
          that.beat++
          if (that.beat === 16) that.beat = 0;
          if (that.playing) tempoCounter();
        }, that.get('bpm'))
      };

      this.playing = !this.playing;

      if (this.playing) {
        this.beat = 0;
        tempoCounter();
      }
    },
    changeTempo: function(bpm) {
      this.set('bpm', 60000 / bpm / 4); // this.get('bpm') = bpm in ms
    }
  });
  
  var Drum = Backbone.Model.extend({
    initialize: function(data) {
      this.el = data.el;
      this.beats = [];
      this.$audio = $('<audio />');
      
      this.set('active', this.el.hasClass('active'));

      this.on('change:knob1 change:knob2', this.setFile);
      this.on('change:vol', this.setVol);
      this.on('change:isactive', this.onActiveToggle);
      this.on('change:step', this.onStepChange);

      $window.on('beat', _.bind(this.onBeat, this));
      
      this.setFile();
      this.setVol();
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

      this.$audio.attr('src', 'samples/' + this.id + knobsVal + '.mp3');
    },
    setVol: function() {
      this.$audio[0].volume = this.get('vol') / 10;
    },
    onBeat: function(e, beat) {
      if ($.inArray(beat, this.beats) >= 0) {
        if (this.$audio[0].readyState)
          this.$audio[0].currentTime = 0;
        this.$audio[0].play();
      }
    },
    onActiveToggle: function(drumId) {
      var isActive = this.get('active');

      if (isActive || drumId === this.id) {
        this.el.toggleClass('active', !isActive);
        this.set('active', !isActive);
      }

      if (drumId === this.id)
        this.setupBeats();
    },
    onStepChange: function(step) {
      if ($.inArray(step, this.beats) >= 0) {
        this.beats = _.without(this.beats, step);
      }
      else {
        this.beats.push(step);
      }
    },
    setupBeats: function() {
      $('#sequencer button').each(_.bind(function(i, e) {
        var beatIsActive = $.inArray(i, this.beats) >= 0
        $(e).toggleClass('active', beatIsActive);
      }, this));
    }
  });
  
  var Drums = Backbone.Collection.extend({
    model: Drum
  });
  
  var DrumMachine = Backbone.View.extend({
    el: $('#drum-machine'),
    events: {
      'change #tempo': 'changeTempo',
      'click .drum': 'drumActiveToggle',
      'click #controls button': 'togglePlay',
      'click #sequencer button': 'sequencerToggle',
      'change input[type=range]': 'moveKnob'
    },
    initialize: function() {
      this.tempo = new Tempo();
      this.drums = new Drums();
      this.$el.find('.drum').each(_.bind(this.createDrum, this));
    },
    changeTempo: function() {
      var newBpm = +this.$el.find('#tempo').val();
      this.tempo.trigger('change:tempo', newBpm);
    },
    createDrum: function(i, el) {
      var $drum = $(el);
      var $vol = $drum.find('.vol');
      var $knob1 = $drum.find('.knob1');
      var $knob2 = $drum.find('.knob2');

      this.drums.push([{
        el: $drum,
        id: $drum.attr('id'),
        vol: +$vol.val(),
        knob1: +$knob1.val(),
        knob2: +$knob2.val()
      }]);
    },
    togglePlay: function() {
      this.tempo.trigger('change:playing');
    },
    drumActiveToggle: function(e) {
      e.preventDefault()

      var $drum = $(e.target).closest ('.drum');
      if ($drum.hasClass('active')) return;
      
      var drumId = $drum.attr('id');

      this.drums.each(function(drum) {
        drum.trigger('change:isactive', drumId);
      });
    },
    sequencerToggle: function(e) {
      e.preventDefault();
      
      var $toggle = $(e.target);
      var step = $toggle.index();
      var isActive = $toggle.hasClass('active');
      var activeDrum = this.drums.where({ active: true })[0];

      if (activeDrum) {
        $toggle.toggleClass('active', !isActive);
        activeDrum.trigger('change:step', step);
      }
    },
    moveKnob: function(e) {
      e.preventDefault();
      
      var $knob = $(e.target);
      var activeDrum = this.drums.where({ active: true })[0];

      if (activeDrum) {
        activeDrum.set($knob.attr('name'), +$knob.val());
      }
    }
  });
  
  var drumMachine = new DrumMachine()
  
});
